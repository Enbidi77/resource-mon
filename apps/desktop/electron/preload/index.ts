import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "@sentinel/contracts";
import type {
  ISentinelAPI,
  ProcessActionRequest,
  ServiceControlRequest,
  QueryEventsRequest,
  ReportConfig,
  SystemMetricsSnapshot,
} from "@sentinel/contracts";

const api: ISentinelAPI = {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
  isWindowMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
  restoreMainWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_RESTORE_MAIN),

  // System
  getSystemOverview: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_OVERVIEW),
  getSystemMetrics: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_GET_METRICS),
  onSystemMetrics: (callback: (metrics: SystemMetricsSnapshot) => void) => {
    const subscription = (_event: any, metrics: SystemMetricsSnapshot) =>
      callback(metrics);
    ipcRenderer.on(IPC_CHANNELS.SYSTEM_STREAM_METRICS, subscription);
    let isDisposed = false;
    const unsub = () => {
      if (isDisposed) return;
      isDisposed = true;
      ipcRenderer.removeListener(
        IPC_CHANNELS.SYSTEM_STREAM_METRICS,
        subscription,
      );
    };
    (unsub as any)[Symbol.dispose] = unsub;
    return unsub as (() => void) & Disposable;
  },
  toggleMetricsStream: (enabled: boolean, intervalMs?: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.SYSTEM_TOGGLE_STREAM, enabled, intervalMs),

  // Processes
  listProcesses: () => ipcRenderer.invoke(IPC_CHANNELS.PROCESS_LIST),
  getProcessDetails: (pid: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.PROCESS_GET_DETAILS, pid),
  controlProcess: (request: ProcessActionRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.PROCESS_CONTROL, request),
  verifyProcessSignature: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PROCESS_VERIFY_SIGNATURE, filePath),
  computeProcessHash: (filePath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PROCESS_COMPUTE_HASH, filePath),

  // Network
  getNetworkConnections: () =>
    ipcRenderer.invoke(IPC_CHANNELS.NETWORK_GET_CONNECTIONS),
  getNetworkInterfaces: () =>
    ipcRenderer.invoke(IPC_CHANNELS.NETWORK_GET_INTERFACES),

  // Services
  listServices: () => ipcRenderer.invoke(IPC_CHANNELS.SERVICES_LIST),
  controlService: (request: ServiceControlRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.SERVICES_CONTROL, request),

  // Security
  getSecurityPosture: () =>
    ipcRenderer.invoke(IPC_CHANNELS.SECURITY_GET_POSTURE),
  getSecurityAlerts: () => ipcRenderer.invoke(IPC_CHANNELS.SECURITY_GET_ALERTS),
  runFimScan: (directoryPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SECURITY_RUN_FIM_SCAN, directoryPath),
  dismissAlert: (alertId: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SECURITY_DISMISS_ALERT, alertId),
  runSecurityAudit: () => ipcRenderer.invoke(IPC_CHANNELS.SECURITY_RUN_AUDIT),
  analyzeBinary: (target: { filePath?: string; pid?: number }) =>
    ipcRenderer.invoke(IPC_CHANNELS.SECURITY_ANALYZE_BINARY, target),

  // Events
  queryEvents: (request: QueryEventsRequest) =>
    ipcRenderer.invoke(IPC_CHANNELS.EVENTS_QUERY, request),

  // Hardware
  getHardwareSummary: () =>
    ipcRenderer.invoke(IPC_CHANNELS.HARDWARE_GET_SUMMARY),

  // Reports
  generateReport: (config: ReportConfig) =>
    ipcRenderer.invoke(IPC_CHANNELS.REPORTS_GENERATE, config),

  // Compact HUD Always-On-Top Window
  openCompactWindow: () => ipcRenderer.invoke(IPC_CHANNELS.COMPACT_WINDOW_OPEN),
  closeCompactWindow: () => ipcRenderer.invoke(IPC_CHANNELS.COMPACT_WINDOW_CLOSE),
  toggleCompactWindow: () => ipcRenderer.invoke(IPC_CHANNELS.COMPACT_WINDOW_TOGGLE),
  isCompactWindowOpen: () => ipcRenderer.invoke(IPC_CHANNELS.COMPACT_WINDOW_IS_OPEN),
  setCompactAlwaysOnTop: (alwaysOnTop: boolean) =>
    ipcRenderer.invoke(IPC_CHANNELS.COMPACT_WINDOW_SET_ALWAYS_ON_TOP, alwaysOnTop),
  isCompactAlwaysOnTop: () =>
    ipcRenderer.invoke(IPC_CHANNELS.COMPACT_WINDOW_GET_ALWAYS_ON_TOP),
  setCompactClickThrough: (clickThrough: boolean) =>
    ipcRenderer.invoke(IPC_CHANNELS.COMPACT_WINDOW_SET_CLICK_THROUGH, clickThrough),

  // Theme synchronization across windows
  getTheme: () => ipcRenderer.invoke(IPC_CHANNELS.THEME_GET),
  setTheme: (theme: "dark" | "light") =>
    ipcRenderer.invoke(IPC_CHANNELS.THEME_SET, theme),
  onThemeChanged: (callback: (theme: "dark" | "light") => void) => {
    const subscription = (_event: any, theme: "dark" | "light") =>
      callback(theme);
    ipcRenderer.on(IPC_CHANNELS.THEME_STREAM, subscription);
    let isDisposed = false;
    const unsub = () => {
      if (isDisposed) return;
      isDisposed = true;
      ipcRenderer.removeListener(IPC_CHANNELS.THEME_STREAM, subscription);
    };
    (unsub as any)[Symbol.dispose] = unsub;
    return unsub as (() => void) & Disposable;
  },
};

contextBridge.exposeInMainWorld("sentinelAPI", api);
