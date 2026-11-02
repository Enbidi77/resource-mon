import type { ISystemAdapter } from '../interfaces/ISystemAdapter.js';
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
import os from 'os';
import si from 'systeminformation';

export class LinuxSystemAdapter implements ISystemAdapter {
  public async getOverview(): Promise<SystemOverview> {
    const [osInfo, cpu, mem] = await Promise.all([si.osInfo(), si.cpu(), si.mem()]);
    return {
      hostname: os.hostname(),
      platform: 'linux',
      arch: os.arch(),
      osName: osInfo.distro || 'Linux',
      osRelease: os.release(),
      uptimeSeconds: Math.floor(os.uptime()),
      bootTime: new Date(Date.now() - os.uptime() * 1000).toISOString(),
      cpuBrand: cpu.brand || 'Generic Linux CPU',
      cpuCores: cpu.cores || os.cpus().length,
      cpuPhysicalCores: cpu.physicalCores || cpu.cores || os.cpus().length,
      cpuBaseSpeedGhz: cpu.speed || 2.4,
      totalMemoryBytes: mem.total || os.totalmem(),
      isElevated: process.getuid ? process.getuid() === 0 : false,
      sentinelVersion: '1.0.0',
    };
  }

  public async getMetricsSnapshot(): Promise<SystemMetricsSnapshot> {
    const [currentLoad, mem] = await Promise.all([si.currentLoad(), si.mem()]);
    const cpuTotal = currentLoad.currentLoad;
    return {
      timestamp: Date.now(),
      cpuTotal: Math.round(cpuTotal * 10) / 10,
      cpuCores: currentLoad.cpus.map((c, i) => ({ coreIndex: i, loadPercent: Math.round(c.load * 10) / 10 })),
      memoryUsedBytes: mem.used,
      memoryTotalBytes: mem.total,
      memoryFreeBytes: mem.free,
      memoryPercent: Math.round((mem.used / mem.total) * 100),
      diskReadBytesPerSec: 0,
      diskWriteBytesPerSec: 0,
      networkDownloadBytesPerSec: 0,
      networkUploadBytesPerSec: 0,
      activeProcessesCount: 0,
      activeSocketsCount: 0,
      systemIntegrityScore: 95,
    };
  }

  public async getProcesses(): Promise<ProcessInfo[]> {
    const data = await si.processes();
    return data.list.map((p) => ({
      pid: p.pid,
      ppid: p.parentPid || null,
      name: p.name,
      cpuPercent: p.cpu,
      memoryBytes: (p.memRss || 0) * 1024,
      executablePath: p.path || null,
      commandLine: p.command || null,
      user: p.user || null,
      status: p.state || 'running',
    }));
  }

  public async getProcessDetails(pid: number): Promise<ProcessDetail | null> {
    const procs = await this.getProcesses();
    const p = procs.find((x) => x.pid === pid);
    return p ? { ...p, children: [] } : null;
  }

  public async getNetworkConnections(): Promise<NetworkConnection[]> {
    const conns = await si.networkConnections();
    return conns.map((c, i) => ({
      id: `conn-lnx-${i}-${c.pid}`,
      protocol: (c.protocol || 'TCP').toUpperCase() as any,
      localAddress: c.localAddress || '0.0.0.0',
      localPort: Number(c.localPort) || 0,
      remoteAddress: c.peerAddress || null,
      remotePort: c.peerPort ? Number(c.peerPort) : null,
      state: 'ESTABLISHED',
      pid: c.pid || 0,
    }));
  }

  public async getNetworkInterfaces(): Promise<NetworkInterface[]> {
    const ifaces = await si.networkInterfaces();
    const list = Array.isArray(ifaces) ? ifaces : [ifaces];
    return list.map((i) => ({
      iface: i.iface,
      ifaceName: i.ifaceName || i.iface,
      ip4: i.ip4,
      mac: i.mac,
      internal: i.internal,
    }));
  }

  public async getServices(): Promise<WindowsService[]> {
    return [];
  }

  public async getHardwareSummary(): Promise<HardwareSummary> {
    const [cpu, mem, sys] = await Promise.all([si.cpu(), si.mem(), si.system()]);
    return {
      cpu: {
        manufacturer: cpu.manufacturer || 'Linux',
        brand: cpu.brand || 'Processor',
        speedGhz: cpu.speed || 2.4,
        cores: cpu.cores || 4,
        physicalCores: cpu.physicalCores || 4,
      },
      memory: { totalBytes: mem.total, layout: [] },
      gpus: [],
      disks: [],
      networkAdapters: [],
      system: { manufacturer: sys.manufacturer || 'Generic', model: sys.model || 'Linux Box' },
      bios: { vendor: 'Linux BIOS', version: '1.0' },
      baseboard: { manufacturer: 'Generic', model: 'Motherboard' },
    };
  }
}

