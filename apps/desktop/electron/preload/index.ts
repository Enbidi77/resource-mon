import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@sentinel/contracts';
import type {
  ISentinelAPI,
  SystemMetricsSnapshot,
  ProcessActionRequest,
  ServiceControlRequest,
  QueryEventsRequest,
  ReportConfig,
} from '@sentinel/contracts';

const api: ISentinelAPI = {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
  isWindowMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),

  // System
  getSystemOverview: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_OVERVIEW),
  getSystemMetrics: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_METRICS),
  onSystemMetrics: (callback: (metrics: SystemMetricsSnapshot) => void) => {
    const handler = (_event: any, data: SystemMetricsSnapshot) => callback(data);
    ipcRenderer.on(IPC_CHANNELS.SYSTEM_STREAM_METRICS, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.SYSTEM_STREAM_METRICS, handler);
    };
  },
  toggleMetricsStream: (enabled: boolean, intervalMs?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_TOGGLE_STREAM, { enabled, intervalMs }),

  // Processes
  listProcesses: () => ipcRenderer.invoke(IPC_CHANNELS.PROCESS_LIST),
  getProcessDetails: (pid: number) => ipcRenderer.invoke(IPC_CHANNELS.PROCESS_GET_DETAILS, pid),
  controlProcess: (request: ProcessActionRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.PROCESS_CONTROL, request),
  verifyProcessSignature: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PROCESS_VERIFY_SIGNATURE, filePath),
  computeProcessHash: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PROCESS_COMPUTE_HASH, filePath),

  // Network
  getNetworkConnections: () => ipcRenderer.invoke(IPC_CHANNELS.NETWORK_GET_CONNECTIONS),
  getNetworkInterfaces: () => ipcRenderer.invoke(IPC_CHANNELS.NETWORK_GET_INTERFACES),

  // Services
  listServices: () => ipcRenderer.invoke(IPC_CHANNELS.SERVICES_LIST),
  controlService: (request: ServiceControlRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.SERVICES_CONTROL, request),

  // Security
  getSecurityPosture: () => ipcRenderer.invoke(IPC_CHANNELS.SECURITY_GET_POSTURE),
  getSecurityAlerts: () => ipcRenderer.invoke(IPC_CHANNELS.SECURITY_GET_ALERTS),
  runFimScan: (directoryPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SECURITY_RUN_FIM_SCAN, directoryPath),
  dismissAlert: (alertId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SECURITY_DISMISS_ALERT, alertId),

  // Events
  queryEvents: (request: QueryEventsRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.EVENTS_QUERY, request),

  // Hardware
  getHardwareSummary: () => ipcRenderer.invoke(IPC_CHANNELS.HARDWARE_GET_SUMMARY),

  // Reports
  generateReport: (config: ReportConfig) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORTS_GENERATE, config),
};

contextBridge.exposeInMainWorld('sentinelAPI', api);
