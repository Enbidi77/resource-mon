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

export interface ISystemAdapter {
  getOverview(): Promise<SystemOverview>;
  getMetricsSnapshot(): Promise<SystemMetricsSnapshot>;
  getProcesses(): Promise<ProcessInfo[]>;
  getProcessDetails(pid: number): Promise<ProcessDetail | null>;
  getNetworkConnections(): Promise<NetworkConnection[]>;
  getNetworkInterfaces(): Promise<NetworkInterface[]>;
  getServices(): Promise<WindowsService[]>;
  getHardwareSummary(): Promise<HardwareSummary>;
}
