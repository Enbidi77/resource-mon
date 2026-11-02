import type { ISystemAdapter } from '@sentinel/system-adapter';
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

export class MockSystemAdapter implements ISystemAdapter {
  public async getOverview(): Promise<SystemOverview> {
    return {
      hostname: 'SENTINEL-TEST-NODE',
      platform: 'win32',
      arch: 'x64',
      osName: 'Windows 11 Pro',
      osRelease: '10.0.22631',
      uptimeSeconds: 86400,
      bootTime: '2026-11-01T00:00:00.000Z',
      cpuBrand: '13th Gen Intel(R) Core(TM) i9-13900K',
      cpuCores: 24,
      cpuPhysicalCores: 16,
      cpuBaseSpeedGhz: 3.0,
      totalMemoryBytes: 34359738368,
      isElevated: true,
      sentinelVersion: '1.0.0',
    };
  }

  public async getMetricsSnapshot(): Promise<SystemMetricsSnapshot> {
    return {
      timestamp: Date.now(),
      cpuTotal: 28.5,
      cpuCores: [
        { coreIndex: 0, loadPercent: 32.1 },
        { coreIndex: 1, loadPercent: 24.9 },
      ],
      memoryUsedBytes: 17179869184,
      memoryTotalBytes: 34359738368,
      memoryFreeBytes: 17179869184,
      memoryPercent: 50,
      gpu: [
        {
          model: 'NVIDIA GeForce RTX 4090',
          loadPercent: 12.0,
          memoryUsedBytes: 4294967296,
          memoryTotalBytes: 25769803776,
          temperatureC: 45,
        },
      ],
      diskReadBytesPerSec: 1048576,
      diskWriteBytesPerSec: 524288,
      networkDownloadBytesPerSec: 2097152,
      networkUploadBytesPerSec: 262144,
      activeProcessesCount: 142,
      activeSocketsCount: 38,
      systemIntegrityScore: 98,
    };
  }

  public async getProcesses(): Promise<ProcessInfo[]> {
    return [
      {
        pid: 1000,
        name: 'explorer.exe',
        cpuPercent: 1.2,
        memoryBytes: 104857600,
        status: 'running',
        isCriticalSystem: true,
      },
      {
        pid: 4050,
        name: 'sentinel.exe',
        cpuPercent: 0.5,
        memoryBytes: 52428800,
        status: 'running',
        isCriticalSystem: false,
      },
    ];
  }

  public async getProcessDetails(pid: number): Promise<ProcessDetail | null> {
    return {
      pid,
      name: 'sentinel.exe',
      cpuPercent: 0.5,
      memoryBytes: 52428800,
      status: 'running',
      children: [],
      signatureStatus: 'VALID',
      signatureSigner: 'CN=Sentinel Security',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    };
  }

  public async getNetworkConnections(): Promise<NetworkConnection[]> {
    return [
      {
        id: 'conn-1',
        protocol: 'TCP',
        localAddress: '127.0.0.1',
        localPort: 8080,
        remoteAddress: '127.0.0.1',
        remotePort: 54321,
        state: 'ESTABLISHED',
        pid: 4050,
        processName: 'sentinel.exe',
      },
    ];
  }

  public async getNetworkInterfaces(): Promise<NetworkInterface[]> {
    return [
      {
        iface: 'Ethernet',
        ifaceName: 'Intel Gigabit Network Connection',
        ip4: '192.168.1.100',
        mac: '00:1A:2B:3C:4D:5E',
        internal: false,
      },
    ];
  }

  public async getServices(): Promise<WindowsService[]> {
    return [
      {
        name: 'SentinelAgent',
        displayName: 'Sentinel Background Agent',
        status: 'RUNNING',
        startupType: 'AUTOMATIC',
        description: 'Sentinel Desktop System Agent',
        serviceAccount: 'LocalSystem',
      },
    ];
  }

  public async getHardwareSummary(): Promise<HardwareSummary> {
    return {
      cpu: {
        manufacturer: 'Intel',
        brand: '13th Gen Intel Core i9',
        speedGhz: 3.0,
        cores: 24,
        physicalCores: 16,
      },
      memory: {
        totalBytes: 34359738368,
        layout: [
          { sizeBytes: 17179869184, bank: 'DIMM 1', clockSpeedMhz: 6000, type: 'DDR5' },
          { sizeBytes: 17179869184, bank: 'DIMM 2', clockSpeedMhz: 6000, type: 'DDR5' },
        ],
      },
      gpus: [
        {
          vendor: 'NVIDIA',
          model: 'GeForce RTX 4090',
          vramMb: 24576,
          driverVersion: '551.86',
        },
      ],
      disks: [
        {
          name: 'Samsung 990 PRO 2TB',
          sizeBytes: 2000398934016,
          interfaceType: 'NVMe',
          smartStatus: 'Ok',
        },
      ],
      networkAdapters: [
        {
          name: 'Intel I225-V 2.5GbE',
          mac: '00:1A:2B:3C:4D:5E',
          speedMbps: 2500,
        },
      ],
      system: {
        manufacturer: 'ASUS',
        model: 'ROG MAXIMUS Z790',
      },
      bios: {
        vendor: 'American Megatrends Inc.',
        version: '1904',
      },
      baseboard: {
        manufacturer: 'ASUSTeK COMPUTER INC.',
        model: 'ROG MAXIMUS Z790 HERO',
      },
    };
  }
}
