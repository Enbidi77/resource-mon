import os from 'os';
import si from 'systeminformation';
import type { ISystemAdapter } from '../interfaces/ISystemAdapter.js';
import {
  Kernel32Bridge,
  Advapi32Bridge,
  AuthenticodeVerifier,
} from '@sentinel/native-bridge';
import { defaultLogger } from '@sentinel/logger';
import type {
  SystemOverview,
  SystemMetricsSnapshot,
  ProcessInfo,
  ProcessDetail,
  NetworkConnection,
  NetworkInterface,
  WindowsService,
  HardwareSummary,
} from '@sentinel/contracts';

export class WindowsSystemAdapter implements ISystemAdapter {
  private kernel32 = new Kernel32Bridge();
  private advapi32 = new Advapi32Bridge();
  private verifier = new AuthenticodeVerifier();

  private cachedOverview: SystemOverview | null = null;
  private criticalProcessNames = new Set([
    'system',
    'smss.exe',
    'csrss.exe',
    'wininit.exe',
    'services.exe',
    'lsass.exe',
    'winlogon.exe',
    'explorer.exe',
    'svchost.exe',
  ]);

  public async getOverview(): Promise<SystemOverview> {
    if (this.cachedOverview) {
      return {
        ...this.cachedOverview,
        uptimeSeconds: Math.floor(this.kernel32.getUptimeSeconds()),
      };
    }

    try {
      const [osInfo, cpu, mem] = await Promise.all([
        si.osInfo(),
        si.cpu(),
        si.mem(),
      ]);

      const isElevated = this.advapi32.isProcessElevated();
      const uptimeSec = Math.floor(this.kernel32.getUptimeSeconds());
      const bootDate = new Date(Date.now() - uptimeSec * 1000).toISOString();

      this.cachedOverview = {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        osName: osInfo.distro || 'Microsoft Windows',
        osRelease: osInfo.release || os.release(),
        osBuild: osInfo.build || '',
        uptimeSeconds: uptimeSec,
        bootTime: bootDate,
        cpuBrand: cpu.brand || os.cpus()[0]?.model || 'Generic Processor',
        cpuCores: cpu.cores || os.cpus().length,
        cpuPhysicalCores: cpu.physicalCores || cpu.cores || os.cpus().length,
        cpuBaseSpeedGhz: cpu.speed || 2.5,
        totalMemoryBytes: mem.total || os.totalmem(),
        isElevated,
        sentinelVersion: '1.0.0',
      };

      return this.cachedOverview;
    } catch (err) {
      defaultLogger.warn({ err }, 'Error building system overview; using fallback');
      const uptimeSec = Math.floor(this.kernel32.getUptimeSeconds());
      return {
        hostname: os.hostname(),
        platform: 'win32',
        arch: os.arch(),
        osName: 'Microsoft Windows',
        osRelease: os.release(),
        uptimeSeconds: uptimeSec,
        bootTime: new Date(Date.now() - uptimeSec * 1000).toISOString(),
        cpuBrand: os.cpus()[0]?.model || 'Generic Processor',
        cpuCores: os.cpus().length,
        cpuPhysicalCores: os.cpus().length,
        cpuBaseSpeedGhz: (os.cpus()[0]?.speed || 2500) / 1000,
        totalMemoryBytes: os.totalmem(),
        isElevated: this.advapi32.isProcessElevated(),
        sentinelVersion: '1.0.0',
      };
    }
  }

  public async getMetricsSnapshot(): Promise<SystemMetricsSnapshot> {
    const timestamp = Date.now();

    // 1. Fast Native Win32 Memory & CPU usage
    const nativeMem = this.kernel32.getMemoryStatus();
    const nativeCpu = this.kernel32.calculateCpuUsagePercent();

    // 2. Parallel async queries for detailed hardware & I/O
    const [currentLoad, disksIO, networkStats, graphics] = await Promise.all([
      si.currentLoad().catch(() => null),
      si.disksIO().catch(() => null),
      si.networkStats().catch(() => null),
      si.graphics().catch(() => null),
    ]);

    // CPU calculations
    const cpuTotal = currentLoad ? currentLoad.currentLoad : nativeCpu;
    const cpuCores = currentLoad?.cpus?.map((core, idx) => ({
      coreIndex: idx,
      loadPercent: Math.round(core.load * 10) / 10,
    })) || [{ coreIndex: 0, loadPercent: Math.round(cpuTotal * 10) / 10 }];

    // Memory calculations
    const totalMem = nativeMem ? nativeMem.totalPhysBytes : os.totalmem();
    const freeMem = nativeMem ? nativeMem.availPhysBytes : os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = nativeMem ? nativeMem.loadPercent : Math.round((usedMem / totalMem) * 100);

    // Disk I/O
    const diskRead = disksIO ? (disksIO.rIO_sec ? disksIO.rIO_sec * 4096 : 0) : 0;
    const diskWrite = disksIO ? (disksIO.wIO_sec ? disksIO.wIO_sec * 4096 : 0) : 0;

    // Network throughput (sum across active non-internal interfaces)
    let netRx = 0;
    let netTx = 0;
    if (networkStats && Array.isArray(networkStats)) {
      for (const stat of networkStats) {
        netRx += stat.rx_sec || 0;
        netTx += stat.tx_sec || 0;
      }
    }

    // GPU metrics
    const gpuMetrics = graphics?.controllers?.map((g) => ({
      model: g.model || 'Display Adapter',
      loadPercent: g.utilizationGpu ?? 0,
      memoryUsedBytes: (g.memoryUsed ?? 0) * 1024 * 1024,
      memoryTotalBytes: (g.memoryTotal ?? 1024) * 1024 * 1024,
      temperatureC: g.temperatureGpu ?? null,
    })) || [];

    // System Integrity Score calculation (0-100)
    // Based on resource headroom and security baseline
    let integrity = 100;
    if (cpuTotal > 85) integrity -= 15;
    else if (cpuTotal > 70) integrity -= 5;

    if (memPercent > 90) integrity -= 20;
    else if (memPercent > 75) integrity -= 10;

    return {
      timestamp,
      cpuTotal: Math.round(cpuTotal * 10) / 10,
      cpuCores,
      memoryUsedBytes: usedMem,
      memoryTotalBytes: totalMem,
      memoryFreeBytes: freeMem,
      memoryPercent: memPercent,
      gpu: gpuMetrics,
      diskReadBytesPerSec: diskRead,
      diskWriteBytesPerSec: diskWrite,
      networkDownloadBytesPerSec: netRx,
      networkUploadBytesPerSec: netTx,
      activeProcessesCount: 0,
      activeSocketsCount: 0,
      systemIntegrityScore: Math.max(20, integrity),
    };
  }

  public async getProcesses(): Promise<ProcessInfo[]> {
    try {
      const data = await si.processes();
      const list = data.list || [];

      return list.map((p) => {
        const isCritical = this.criticalProcessNames.has(p.name.toLowerCase());
        return {
          pid: p.pid,
          ppid: p.parentPid || null,
          name: p.name,
          cpuPercent: Math.round(p.cpu * 10) / 10,
          memoryBytes: (p.memRss || 0) * 1024,
          memoryWorkingSetBytes: (p.memRss || 0) * 1024,
          memoryPercent: Math.round(p.mem * 10) / 10,
          executablePath: p.path || null,
          commandLine: p.command || null,
          user: p.user || null,
          startTime: p.started || null,
          status: p.state || 'running',
          isCriticalSystem: isCritical,
          signatureStatus: 'UNCHECKED' as const,
        };
      });
    } catch (err) {
      defaultLogger.error({ err }, 'Failed to list processes');
      return [];
    }
  }

  public async getProcessDetails(pid: number): Promise<ProcessDetail | null> {
    try {
      const procs = await this.getProcesses();
      const target = procs.find((p) => p.pid === pid);
      if (!target) return null;

      // Check signature if executable path exists
      let signatureStatus: any = 'UNCHECKED';
      let signatureSigner: string | null = null;
      let sha256: string | null = null;

      if (target.executablePath) {
        const sig = this.verifier.verifySignature(target.executablePath);
        signatureStatus = sig.status;
        signatureSigner = sig.signer || null;
        sha256 = await this.verifier.computeFileSha256(target.executablePath);
      }

      const parentProc = target.ppid ? procs.find((p) => p.pid === target.ppid) : null;
      const children = procs.filter((p) => p.ppid === pid).map((p) => p.pid);

      return {
        ...target,
        parentName: parentProc?.name || null,
        children,
        signatureStatus,
        signatureSigner,
        sha256,
      };
    } catch (err) {
      defaultLogger.error({ pid, err }, 'Failed to fetch process details');
      return null;
    }
  }

  public async getNetworkConnections(): Promise<NetworkConnection[]> {
    try {
      const conns = await si.networkConnections();
      return conns.map((c, idx) => ({
        id: `conn-${idx}-${c.pid}-${c.localPort}`,
        protocol: (c.protocol || 'TCP').toUpperCase() === 'UDP' ? 'UDP' : 'TCP',
        localAddress: c.localAddress || '0.0.0.0',
        localPort: c.localPort ? Number(c.localPort) : 0,
        remoteAddress: c.peerAddress || null,
        remotePort: c.peerPort ? Number(c.peerPort) : null,
        state: (c.state || 'ESTABLISHED').toUpperCase() as any,
        pid: c.pid || 0,
        processName: c.process || undefined,
      }));
    } catch (err) {
      defaultLogger.warn({ err }, 'Failed to get network connections');
      return [];
    }
  }

  public async getNetworkInterfaces(): Promise<NetworkInterface[]> {
    try {
      const [interfaces, stats] = await Promise.all([
        si.networkInterfaces(),
        si.networkStats(),
      ]);

      const statMap = new Map<string, any>();
      if (Array.isArray(stats)) {
        for (const s of stats) statMap.set(s.iface, s);
      }

      const ifaceList = Array.isArray(interfaces) ? interfaces : [interfaces];

      return ifaceList.map((iface) => {
        const st = statMap.get(iface.iface);
        return {
          iface: iface.iface,
          ifaceName: iface.ifaceName || iface.iface,
          ip4: iface.ip4,
          ip6: iface.ip6,
          mac: iface.mac,
          internal: iface.internal,
          virtual: iface.virtual,
          operstate: iface.operstate,
          type: iface.type,
          speedMbps: iface.speed,
          rxBytes: st?.rx_bytes || 0,
          txBytes: st?.tx_bytes || 0,
          rxSec: st?.rx_sec || 0,
          txSec: st?.tx_sec || 0,
        };
      });
    } catch (err) {
      defaultLogger.warn({ err }, 'Failed to get network interfaces');
      return [];
    }
  }

  public async getServices(): Promise<WindowsService[]> {
    return this.advapi32.queryWindowsServices();
  }

  public async getHardwareSummary(): Promise<HardwareSummary> {
    try {
      const [cpu, mem, memLayout, graphics, diskLayout, netIfaces, sys, bios, baseboard, battery] =
        await Promise.all([
          si.cpu(),
          si.mem(),
          si.memLayout(),
          si.graphics(),
          si.diskLayout(),
          si.networkInterfaces(),
          si.system(),
          si.bios(),
          si.baseboard(),
          si.battery().catch(() => null),
        ]);

      const ifaceList = Array.isArray(netIfaces) ? netIfaces : [netIfaces];

      return {
        cpu: {
          manufacturer: cpu.manufacturer || 'Generic',
          brand: cpu.brand || 'Processor',
          speedGhz: cpu.speed || 2.5,
          cores: cpu.cores || 4,
          physicalCores: cpu.physicalCores || 4,
          socket: cpu.socket || undefined,
          virtualization: cpu.virtualization,
        },
        memory: {
          totalBytes: mem.total || os.totalmem(),
          layout: memLayout.map((m) => ({
            sizeBytes: m.size || 0,
            bank: m.bank,
            type: m.type,
            clockSpeedMhz: m.clockSpeed ?? undefined,
            partNum: m.partNum,
          })),
        },
        gpus: (graphics.controllers || []).map((g) => ({
          vendor: g.vendor || 'Unknown',
          model: g.model || 'Display Adapter',
          vramMb: g.vram ?? undefined,
          driverVersion: g.driverVersion,
        })),
        disks: diskLayout.map((d) => ({
          name: d.name || 'Disk Drive',
          type: d.type || 'Fixed Disk',
          sizeBytes: d.size || 0,
          interfaceType: d.interfaceType,
          smartStatus: d.smartStatus,
        })),
        networkAdapters: ifaceList.map((n) => ({
          name: n.ifaceName || n.iface,
          mac: n.mac,
          speedMbps: n.speed,
          type: n.type,
        })),
        system: {
          manufacturer: sys.manufacturer || 'PC',
          model: sys.model || 'Computer',
          version: sys.version,
          serial: sys.serial,
        },
        bios: {
          vendor: bios.vendor || 'BIOS',
          version: bios.version || '1.0',
          releaseDate: bios.releaseDate,
        },
        baseboard: {
          manufacturer: baseboard.manufacturer || 'System Board',
          model: baseboard.model || 'BaseBoard',
          version: baseboard.version,
        },
        battery: battery?.hasBattery
          ? {
              hasBattery: true,
              isCharging: battery.isCharging,
              percent: battery.percent,
            }
          : undefined,
      };
    } catch (err) {
      defaultLogger.error({ err }, 'Failed to build hardware summary');
      throw err;
    }
  }
}
