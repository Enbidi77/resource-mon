import type { SystemOverview, SystemMetricsSnapshot } from "../system/index.js";
import type {
  ProcessInfo,
  ProcessDetail,
  ProcessActionRequest,
  ProcessActionResult,
} from "../process/index.js";
import type { NetworkConnection, NetworkInterface } from "../network/index.js";
import type {
  SecurityAlert,
  SecurityPosture,
  FimScanResult,
  SecurityAuditReport,
  BinaryAnalysisResult,
} from "../security/index.js";
import type {
  WindowsService,
  ServiceControlRequest,
  ServiceControlResult,
} from "../services/index.js";
import type {
  WindowsEventLogEntry,
  QueryEventsRequest,
} from "../events/index.js";
import type { HardwareSummary } from "../hardware/index.js";
import type { ReportConfig, GeneratedReport } from "../reports/index.js";

export const IPC_CHANNELS = {
  // System & Realtime Metrics
  SYSTEM_GET_OVERVIEW: "sentinel:system:get-overview",
  SYSTEM_GET_METRICS: "sentinel:system:get-metrics",
  SYSTEM_STREAM_METRICS: "sentinel:stream:system-metrics",
  SYSTEM_TOGGLE_STREAM: "sentinel:stream:toggle-metrics",
  SYSTEM_TRIM_MEMORY: "sentinel:system:trim-memory",

  // Process Management
  PROCESS_LIST: "sentinel:processes:list",
  PROCESS_GET_DETAILS: "sentinel:processes:get-details",
  PROCESS_CONTROL: "sentinel:processes:control",
  PROCESS_VERIFY_SIGNATURE: "sentinel:processes:verify-signature",
  PROCESS_COMPUTE_HASH: "sentinel:processes:compute-hash",

  // Network & Connections
  NETWORK_GET_CONNECTIONS: "sentinel:network:get-connections",
  NETWORK_GET_INTERFACES: "sentinel:network:get-interfaces",

  // Windows Services
  SERVICES_LIST: "sentinel:services:list",
  SERVICES_CONTROL: "sentinel:services:control",

  // Security & FIM
  SECURITY_GET_POSTURE: "sentinel:security:get-posture",
  SECURITY_GET_ALERTS: "sentinel:security:get-alerts",
  SECURITY_RUN_FIM_SCAN: "sentinel:security:run-fim-scan",
  SECURITY_DISMISS_ALERT: "sentinel:security:dismiss-alert",
  SECURITY_RUN_AUDIT: "sentinel:security:run-audit",
  SECURITY_ANALYZE_BINARY: "sentinel:security:analyze-binary",

  // Windows Event Viewer
  EVENTS_QUERY: "sentinel:events:query",

  // Hardware Inspector
  HARDWARE_GET_SUMMARY: "sentinel:hardware:get-summary",

  // Reports & Export
  REPORTS_GENERATE: "sentinel:reports:generate",

  // Window Controls
  WINDOW_MINIMIZE: "sentinel:window:minimize",
  WINDOW_MAXIMIZE: "sentinel:window:maximize",
  WINDOW_CLOSE: "sentinel:window:close",
  WINDOW_IS_MAXIMIZED: "sentinel:window:is-maximized",
  WINDOW_RESTORE_MAIN: "sentinel:window:restore-main",

  // Compact HUD / Always-On-Top Window Controls
  COMPACT_WINDOW_OPEN: "sentinel:compact:open",
  COMPACT_WINDOW_CLOSE: "sentinel:compact:close",
  COMPACT_WINDOW_TOGGLE: "sentinel:compact:toggle",
  COMPACT_WINDOW_IS_OPEN: "sentinel:compact:is-open",
  COMPACT_WINDOW_SET_ALWAYS_ON_TOP: "sentinel:compact:set-always-on-top",
  COMPACT_WINDOW_GET_ALWAYS_ON_TOP: "sentinel:compact:get-always-on-top",
  COMPACT_WINDOW_SET_CLICK_THROUGH: "sentinel:compact:set-click-through",

  // Theme Synchronization Across Windows
  THEME_GET: "sentinel:theme:get",
  THEME_SET: "sentinel:theme:set",
  THEME_STREAM: "sentinel:theme:stream",
} as const;

export type IpcChannelName = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/**
 * The strongly-typed API bridge exposed to the React Renderer
 * via `window.sentinelAPI`
 */
export interface ISentinelAPI {
  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;
  restoreMainWindow: () => Promise<void>;

  // System
  getSystemOverview: () => Promise<SystemOverview>;
  getSystemMetrics: () => Promise<SystemMetricsSnapshot>;
  onSystemMetrics: (
    callback: (metrics: SystemMetricsSnapshot) => void,
  ) => (() => void) & Disposable;
  toggleMetricsStream: (
    enabled: boolean,
    intervalMs?: number,
  ) => Promise<boolean>;
  trimMemory: () => Promise<{ success: boolean; memory?: unknown }>;

  // Processes
  listProcesses: () => Promise<ProcessInfo[]>;
  getProcessDetails: (pid: number) => Promise<ProcessDetail | null>;
  controlProcess: (
    request: ProcessActionRequest,
  ) => Promise<ProcessActionResult>;
  verifyProcessSignature: (
    filePath: string,
  ) => Promise<{ status: string; signer?: string | null }>;
  computeProcessHash: (
    filePath: string,
  ) => Promise<{ sha256?: string | null; error?: string }>;

  // Network
  getNetworkConnections: () => Promise<NetworkConnection[]>;
  getNetworkInterfaces: () => Promise<NetworkInterface[]>;

  // Services
  listServices: () => Promise<WindowsService[]>;
  controlService: (
    request: ServiceControlRequest,
  ) => Promise<ServiceControlResult>;

  // Security
  getSecurityPosture: () => Promise<SecurityPosture>;
  getSecurityAlerts: () => Promise<SecurityAlert[]>;
  runFimScan: (directoryPath?: string) => Promise<FimScanResult>;
  dismissAlert: (alertId: string) => Promise<boolean>;
  runSecurityAudit: () => Promise<SecurityAuditReport>;
  analyzeBinary: (target: {
    filePath?: string;
    pid?: number;
  }) => Promise<BinaryAnalysisResult>;

  // Events
  queryEvents: (request: QueryEventsRequest) => Promise<WindowsEventLogEntry[]>;

  // Hardware
  getHardwareSummary: () => Promise<HardwareSummary>;

  // Reports
  generateReport: (config: ReportConfig) => Promise<GeneratedReport>;

  // Compact HUD Always-On-Top Window
  openCompactWindow: () => Promise<void>;
  closeCompactWindow: () => Promise<void>;
  toggleCompactWindow: () => Promise<boolean>;
  isCompactWindowOpen: () => Promise<boolean>;
  setCompactAlwaysOnTop: (alwaysOnTop: boolean) => Promise<boolean>;
  isCompactAlwaysOnTop: () => Promise<boolean>;
  setCompactClickThrough: (clickThrough: boolean) => Promise<void>;

  // Theme synchronization across windows
  getTheme: () => Promise<"dark" | "light">;
  setTheme: (theme: "dark" | "light") => Promise<void>;
  onThemeChanged: (
    callback: (theme: "dark" | "light") => void,
  ) => (() => void) & Disposable;
}
