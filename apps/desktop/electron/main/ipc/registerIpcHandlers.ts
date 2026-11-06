import { ipcMain } from "electron";
import { IPC_CHANNELS } from "@sentinel/contracts";
import type { SentinelCoreService } from "@sentinel/core";
import type { WindowManager } from "../windows/WindowManager";
import type { ThemeManager } from "../services/ThemeManager";

export interface IpcDependencies {
  coreService: SentinelCoreService;
  windowManager: WindowManager;
  themeManager: ThemeManager;
}

export function registerIpcHandlers({
  coreService,
  windowManager,
  themeManager,
}: IpcDependencies): void {
  // Window Management Handlers
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, (event) => {
    windowManager.minimize(event.sender);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, (event) => {
    return windowManager.toggleMaximize(event.sender);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, (event) => {
    windowManager.close(event.sender);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, (event) => {
    return windowManager.isMaximized(event.sender);
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_RESTORE_MAIN, () => {
    windowManager.restoreMainWindow();
  });

  // Compact HUD Always-On-Top Window Handlers
  ipcMain.handle(IPC_CHANNELS.COMPACT_WINDOW_OPEN, () => {
    windowManager.openCompactWindow(themeManager.getTheme());
  });

  ipcMain.handle(IPC_CHANNELS.COMPACT_WINDOW_CLOSE, () => {
    windowManager.closeCompactWindow();
  });

  ipcMain.handle(IPC_CHANNELS.COMPACT_WINDOW_TOGGLE, () => {
    return windowManager.toggleCompactWindow(themeManager.getTheme());
  });

  ipcMain.handle(IPC_CHANNELS.COMPACT_WINDOW_IS_OPEN, () => {
    return windowManager.isCompactWindowOpen();
  });

  ipcMain.handle(
    IPC_CHANNELS.COMPACT_WINDOW_SET_ALWAYS_ON_TOP,
    (_e, alwaysOnTop: boolean) => {
      return windowManager.setCompactAlwaysOnTop(alwaysOnTop);
    }
  );

  ipcMain.handle(IPC_CHANNELS.COMPACT_WINDOW_GET_ALWAYS_ON_TOP, () => {
    return windowManager.isCompactAlwaysOnTop();
  });

  ipcMain.handle(
    IPC_CHANNELS.COMPACT_WINDOW_SET_CLICK_THROUGH,
    (_e, clickThrough: boolean) => {
      windowManager.setCompactClickThrough(clickThrough);
    }
  );

  // Theme Synchronization Across Windows
  ipcMain.handle(IPC_CHANNELS.THEME_GET, () => {
    return themeManager.getTheme();
  });

  ipcMain.handle(IPC_CHANNELS.THEME_SET, (event, theme: "dark" | "light") => {
    themeManager.setTheme(theme, event.sender);
  });

  // System Telemetry Handlers
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_OVERVIEW, async () => {
    return coreService.getOverview();
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_METRICS, async () => {
    return coreService.getMetricsSnapshot();
  });

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM_TOGGLE_STREAM,
    (_e, enabled: boolean, intervalMs?: number) => {
      return coreService.toggleMetricsStream(enabled, intervalMs);
    }
  );

  // Stream live metrics updates to all active workstation windows
  coreService.onSystemMetrics((snapshot) => {
    windowManager.broadcast(IPC_CHANNELS.SYSTEM_STREAM_METRICS, snapshot);
  });

  // Process Handlers
  ipcMain.handle(IPC_CHANNELS.PROCESS_LIST, async () => {
    return coreService.getProcesses();
  });

  ipcMain.handle(IPC_CHANNELS.PROCESS_GET_DETAILS, async (_e, pid: number) => {
    return coreService.getProcessDetails(pid);
  });

  ipcMain.handle(IPC_CHANNELS.PROCESS_CONTROL, async (_e, req) => {
    return coreService.controlProcess(req);
  });

  ipcMain.handle(
    IPC_CHANNELS.PROCESS_VERIFY_SIGNATURE,
    async (_e, filePath: string) => {
      return coreService.verifyProcessSignature(filePath);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.PROCESS_COMPUTE_HASH,
    async (_e, filePath: string) => {
      return coreService.computeProcessHash(filePath);
    }
  );

  // Network Handlers
  ipcMain.handle(IPC_CHANNELS.NETWORK_GET_CONNECTIONS, async () => {
    return coreService.getNetworkConnections();
  });

  ipcMain.handle(IPC_CHANNELS.NETWORK_GET_INTERFACES, async () => {
    return coreService.getNetworkInterfaces();
  });

  // Windows Services Handlers
  ipcMain.handle(IPC_CHANNELS.SERVICES_LIST, async () => {
    return coreService.getServices();
  });

  ipcMain.handle(IPC_CHANNELS.SERVICES_CONTROL, async (_e, req) => {
    return coreService.controlService(req);
  });

  // Security Subsystem Handlers
  ipcMain.handle(IPC_CHANNELS.SECURITY_GET_POSTURE, async () => {
    return coreService.getSecurityPosture();
  });

  ipcMain.handle(IPC_CHANNELS.SECURITY_GET_ALERTS, async () => {
    return coreService.getSecurityAlerts();
  });

  ipcMain.handle(
    IPC_CHANNELS.SECURITY_RUN_FIM_SCAN,
    async (_e, dir?: string) => {
      return coreService.runFimScan(dir);
    }
  );

  ipcMain.handle(
    IPC_CHANNELS.SECURITY_DISMISS_ALERT,
    async (_e, alertId: string) => {
      return coreService.dismissAlert(alertId);
    }
  );

  ipcMain.handle(IPC_CHANNELS.SECURITY_RUN_AUDIT, async () => {
    return coreService.runSecurityAudit();
  });

  ipcMain.handle(
    IPC_CHANNELS.SECURITY_ANALYZE_BINARY,
    async (_e, target: { filePath?: string; pid?: number }) => {
      return coreService.analyzeBinary(target);
    }
  );

  // Event Log Reader Handlers
  ipcMain.handle(IPC_CHANNELS.EVENTS_QUERY, async (_e, req) => {
    return coreService.queryEvents(req);
  });

  // Hardware Summary Handlers
  ipcMain.handle(IPC_CHANNELS.HARDWARE_GET_SUMMARY, async () => {
    return coreService.getHardwareSummary();
  });

  // Reports Generation Handlers
  ipcMain.handle(IPC_CHANNELS.REPORTS_GENERATE, async (_e, config) => {
    return coreService.generateReport(config);
  });
}

