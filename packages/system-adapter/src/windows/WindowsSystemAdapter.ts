import os from 'os';
import si from 'systeminformation';
import type { ISystemAdapter } from '../interfaces/ISystemAdapter.js';
import {
  Kernel32Bridge,
  Advapi32Bridge,
  AuthenticodeVerifier,
  PdhBridge,
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
  private pdh = new PdhBridge();

  private cachedOverview: SystemOverview | null = null;
  private cachedHardwareSummary: HardwareSummary | null = null;
  private hardwareSummaryPromise: Promise<HardwareSummary> | null = null;

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
      const uptime = await this.kernel32.getUptimeSeconds();
      return {
        ...this.cachedOverview,
        uptimeSeconds: Math.floor(uptime),
      };
    }

    try {
      const [osInfo, cpu, mem, uptimeSecRaw, isElevated] = await Promise.all([
        si.osInfo(),
        si.cpu(),
        si.mem(),
        this.kernel32.getUptimeSeconds(),
        this.advapi32.isProcessElevated(),
      ]);

      const uptimeSec = Math.floor(uptimeSecRaw);
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
      const [uptimeSecRaw, isElevated] = await Promise.all([
        this.kernel32.getUptimeSeconds(),
        this.advapi32.isProcessElevated(),
      ]);
      const uptimeSec = Math.floor(uptimeSecRaw);
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
        isElevated,
        sentinelVersion: '1.0.0',
      };
    }
  }

  public async getMetricsSnapshot(): Promise<SystemMetricsSnapshot> {
    const timestamp = Date.now();

    // 1. Parallel non-blocking async queries for native Win32 FFI and system telemetry
    const [nativeMem, nativeCpu, diskIo, currentLoad, networkStats, graphics] = await Promise.all([
      this.kernel32.getMemoryStatus(),
      this.kernel32.calculateCpuUsagePercent(),
      this.pdh.getDiskIo(),
      si.currentLoad().catch(() => null),
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

    // Fast Native Win32 PDH Disk I/O Throughput (Read/Write bytes per sec)
    const diskRead = diskIo.readBytesPerSec;
    const diskWrite = diskIo.writeBytesPerSec;

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
      defaultLogger.error({ err }, 'Failed to enumerate Windows processes');
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
        const [sig, sha256Val] = await Promise.all([
          this.verifier.verifySignature(target.executablePath),
          this.verifier.computeFileSha256(target.executablePath),
        ]);
        signatureStatus = sig.status;
        signatureSigner = sig.signer || null;
        sha256 = sha256Val;
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
      defaultLogger.error({ err, pid }, 'Failed to get process details');
      return null;
    }
  }

  public async controlProcess(pid: number, action: 'terminate' | 'suspend' | 'resume'): Promise<boolean> {
    try {
      if (action === 'terminate') {
        const res = await this.kernel32.terminateProcess(pid);
        return res.success;
      }
      return false;
    } catch (err) {
      defaultLogger.error({ err, pid, action }, 'Failed to control process');
      return false;
    }
  }

  public async getNetworkConnections(): Promise<NetworkConnection[]> {
    try {
      const conns = await si.networkConnections();
      return conns.map((c, idx) => ({
        id: `conn-${idx}-${c.pid}-${c.localPort}-${c.peerPort}`,
        protocol: (c.protocol || 'TCP').toUpperCase() as 'TCP' | 'UDP',
        localAddress: c.localAddress || '0.0.0.0',
        localPort: Number(c.localPort) || 0,
        remoteAddress: c.peerAddress || null,
        remotePort: c.peerPort ? Number(c.peerPort) : null,
        state: (c.state || 'UNKNOWN').toUpperCase() as any,
        pid: c.pid || 0,
        processName: c.process || undefined,
      }));
    } catch (err) {
      defaultLogger.error({ err }, 'Failed to query network connections');
      return [];
    }
  }

  public async getNetworkInterfaces(): Promise<NetworkInterface[]> {
    try {
      const [ifaces, stats] = await Promise.all([
        si.networkInterfaces(),
        si.networkStats().catch(() => []),
      ]);

      const ifaceList = Array.isArray(ifaces) ? ifaces : [ifaces];
      const statsList = Array.isArray(stats) ? stats : [stats];

      return ifaceList.map((iface) => {
        const st = statsList.find((s) => s.iface === iface.iface);
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
    if (this.cachedHardwareSummary) {
      return this.cachedHardwareSummary;
    }

    if (this.hardwareSummaryPromise) {
      return this.hardwareSummaryPromise;
    }

    this.hardwareSummaryPromise = (async () => {
      try {
        const [cpu, mem, memLayout, graphics, diskLayout, fsSize, netIfaces, sys, bios, baseboard, battery] =
          await Promise.all([
            si.cpu().catch(() => null),
            si.mem().catch(() => null),
            si.memLayout().catch(() => []),
            si.graphics().catch(() => null),
            si.diskLayout().catch(() => []),
            si.fsSize().catch(() => []),
            si.networkInterfaces().catch(() => []),
            si.system().catch(() => null),
            si.bios().catch(() => null),
            si.baseboard().catch(() => null),
            si.battery().catch(() => null),
          ]);

        const ifaceList = Array.isArray(netIfaces) ? netIfaces : [netIfaces];

        // Ensure physical disks list is resiliently constructed
        let diskList = Array.isArray(diskLayout) && diskLayout.length > 0
          ? diskLayout.map((d) => ({
              name: d.name || d.device || 'Storage Disk Drive',
              type: d.type || 'SSD',
              sizeBytes: d.size || 0,
              interfaceType: d.interfaceType || 'NVMe',
              smartStatus: d.smartStatus || 'Ok',
            }))
          : [];

        if (diskList.length === 0) {
          const blockDevs = await si.blockDevices().catch(() => []);
          if (Array.isArray(blockDevs) && blockDevs.length > 0) {
            diskList = blockDevs.map((bd) => ({
              name: bd.name ? `${bd.name} Storage Drive` : 'Primary Physical Drive',
              type: 'Fixed Disk',
              sizeBytes: Number(bd.size) || 0,
              interfaceType: bd.protocol || 'NVMe',
              smartStatus: 'Ok',
            }));
          }
        }

        if (diskList.length === 0 && Array.isArray(fsSize) && fsSize.length > 0) {
          const totalSize = fsSize.reduce((acc, f) => acc + (f.size || 0), 0);
          diskList.push({
            name: 'System NVMe/SSD Storage Drive',
            type: 'Fixed Disk',
            sizeBytes: totalSize,
            interfaceType: 'NVMe',
            smartStatus: 'Ok',
          });
        }

        // Map partitions/volumes
        const partitions = (Array.isArray(fsSize) ? fsSize : []).map((f) => ({
          fs: f.fs || f.mount || 'C:',
          type: f.type || 'NTFS',
          sizeBytes: f.size || 0,
          usedBytes: f.used || 0,
          availableBytes: f.available || 0,
          usePercent: f.use || 0,
          mount: f.mount || f.fs,
        }));

        const summary: HardwareSummary = {
          cpu: {
            manufacturer: cpu?.manufacturer || 'Generic',
            brand: cpu?.brand || os.cpus()[0]?.model || 'Processor',
            speedGhz: cpu?.speed || 2.5,
            cores: cpu?.cores || os.cpus().length,
            physicalCores: cpu?.physicalCores || cpu?.cores || os.cpus().length,
            socket: cpu?.socket || undefined,
            virtualization: cpu?.virtualization,
          },
          memory: {
            totalBytes: mem?.total || os.totalmem(),
            layout: (memLayout || []).map((m) => ({
              sizeBytes: m.size || 0,
              bank: m.bank,
              type: m.type,
              clockSpeedMhz: m.clockSpeed ?? undefined,
              partNum: m.partNum,
            })),
          },
          gpus: (graphics?.controllers || []).map((g) => ({
            vendor: g.vendor || 'Unknown',
            model: g.model || 'Display Adapter',
            vramMb: g.vram ?? undefined,
            driverVersion: g.driverVersion,
          })),
          disks: diskList,
          partitions,
          networkAdapters: ifaceList.filter(Boolean).map((n) => ({
            name: n.ifaceName || n.iface || 'Ethernet',
            mac: n.mac || '00:00:00:00:00:00',
            speedMbps: n.speed,
            type: n.type,
          })),
          system: {
            manufacturer: sys?.manufacturer || 'PC System',
            model: sys?.model || 'Computer',
            version: sys?.version,
            serial: sys?.serial,
          },
          bios: {
            vendor: bios?.vendor || 'System BIOS',
            version: bios?.version || '1.0',
            releaseDate: bios?.releaseDate,
          },
          baseboard: {
            manufacturer: baseboard?.manufacturer || 'System Board',
            model: baseboard?.model || 'BaseBoard',
            version: baseboard?.version,
          },
          battery: battery?.hasBattery
            ? {
                hasBattery: true,
                isCharging: battery.isCharging,
                percent: battery.percent,
              }
            : undefined,
        };

        this.cachedHardwareSummary = summary;
        return summary;
      } catch (err) {
        defaultLogger.error({ err }, 'Failed to build hardware summary; using safe fallback');
        const fallback: HardwareSummary = {
          cpu: {
            manufacturer: 'Generic',
            brand: os.cpus()[0]?.model || 'Processor',
            speedGhz: 2.5,
            cores: os.cpus().length,
            physicalCores: os.cpus().length,
          },
          memory: { totalBytes: os.totalmem(), layout: [] },
          gpus: [],
          disks: [
            {
              name: 'System NVMe Storage Drive',
              type: 'SSD',
              sizeBytes: 512 * 1024 * 1024 * 1024,
              interfaceType: 'NVMe',
              smartStatus: 'Ok',
            },
          ],
          partitions: [],
          networkAdapters: [],
          system: { manufacturer: 'PC System', model: 'Computer' },
          bios: { vendor: 'System BIOS', version: '1.0' },
          baseboard: { manufacturer: 'System Board', model: 'BaseBoard' },
        };
        this.cachedHardwareSummary = fallback;
        return fallback;
      } finally {
        this.hardwareSummaryPromise = null;
      }
    })();

    return this.hardwareSummaryPromise;
  }
}
