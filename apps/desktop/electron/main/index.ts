import { app, BrowserWindow, ipcMain, shell, session, nativeImage, nativeTheme } from "electron";
import { join } from "path";
import { existsSync } from "fs";
import { SentinelCoreService } from "@sentinel/core";
import { IPC_CHANNELS } from "@sentinel/contracts";
import { defaultLogger } from "@sentinel/logger";

// Set application identity early so Windows OS process, taskbar grouping, and Task Manager register as Sentinel Desktop
app.name = "Sentinel Desktop";
if (process.platform === "win32") {
  app.setAppUserModelId("com.sentinel.desktop");
}

// Transparent visual support for Linux X11 environments if applicable
if (process.platform === "linux") {
  app.commandLine.appendSwitch("enable-transparent-visuals");
}

process.on("uncaughtException", (err) => {
  defaultLogger.error({ err }, "CRITICAL UNCAUGHT EXCEPTION in Main Process");
  console.error("CRITICAL UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  defaultLogger.error(
    { reason },
    "CRITICAL UNHANDLED REJECTION in Main Process",
  );
  console.error("CRITICAL UNHANDLED REJECTION:", reason);
});

let mainWindow: BrowserWindow | null = null;
let compactWindow: BrowserWindow | null = null;
let coreService: SentinelCoreService | null = null;
let currentTheme: "dark" | "light" = "dark";

function resolveAppIconPath(): string | undefined {
  const icoCandidates = [
    join(__dirname, "../../resources/icon.ico"),
    join(__dirname, "../../build/icon.ico"),
    join(app.getAppPath(), "resources/icon.ico"),
    join(app.getAppPath(), "build/icon.ico"),
    join(process.resourcesPath, "resources/icon.ico"),
    join(process.resourcesPath, "icon.ico"),
  ];

  const pngCandidates = [
    join(__dirname, "../../renderer/assets/icon.png"),
    join(__dirname, "../../resources/icon.png"),
    join(app.getAppPath(), "renderer/assets/icon.png"),
    join(app.getAppPath(), "resources/icon.png"),
    join(process.resourcesPath, "resources/icon.png"),
    join(process.resourcesPath, "icon.png"),
  ];

  const candidates =
    process.platform === "win32"
      ? [...icoCandidates, ...pngCandidates]
      : [...pngCandidates, ...icoCandidates];

  return candidates.find((filePath) => existsSync(filePath));
}

function createWindow(): void {
  const iconPath = resolveAppIconPath();
  const iconImage = iconPath ? nativeImage.createFromPath(iconPath) : undefined;

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    frame: false, // Frameless custom glass workstation titlebar
    transparent: true,
    backgroundColor: "#00000000", // Transparent base for authentic glass blur
    vibrancy: process.platform === "darwin" ? "under-window" : undefined,
    // Note: Do NOT set backgroundMaterial: "acrylic" on Windows with transparent: true & custom CSS rounded corners.
    // DWM renders a rectangular acrylic brush over the entire HWND, producing square gray corner artifacts outside the CSS border radius.
    title: "Sentinel Desktop",
    icon: iconPath || iconImage,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (iconPath) {
    try {
      mainWindow.setIcon(iconPath);
    } catch (e) {
      defaultLogger.warn({ err: e }, "Failed to explicitly set window icon");
    }
  }

  if (process.platform === "darwin" && iconImage && !iconImage.isEmpty()) {
    app.dock?.setIcon(iconImage);
  }

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  // Handle external link clicks safely in system browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // Load URL from Vite Dev Server in development or packaged file in production
  if (process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function createCompactWindow(): BrowserWindow {
  if (compactWindow && !compactWindow.isDestroyed()) {
    compactWindow.show();
    compactWindow.focus();
    return compactWindow;
  }

  const iconPath = resolveAppIconPath();
  const iconImage = iconPath ? nativeImage.createFromPath(iconPath) : undefined;

  compactWindow = new BrowserWindow({
    width: 380,
    height: 540,
    minWidth: 260,
    minHeight: 140,
    maxWidth: 960,
    maxHeight: 1200,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    title: "Sentinel Compact HUD",
    icon: iconPath || iconImage,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (iconPath) {
    try {
      compactWindow.setIcon(iconPath);
    } catch (e) {
      defaultLogger.warn({ err: e }, "Failed to explicitly set compact window icon");
    }
  }

  compactWindow.on("ready-to-show", () => {
    compactWindow?.show();
    compactWindow?.setAlwaysOnTop(true, "screen-saver");
    compactWindow?.webContents.send(IPC_CHANNELS.THEME_STREAM, currentTheme);
  });

  compactWindow.on("closed", () => {
    compactWindow = null;
  });

  compactWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    compactWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#compact`);
  } else {
    compactWindow.loadFile(join(__dirname, "../renderer/index.html"), {
      hash: "compact",
    });
  }

  return compactWindow;
}

function setupIpcHandlers(): void {
  coreService = new SentinelCoreService();

  // Window Controls (resolves caller window so compact or main window can be controlled)
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    win?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win?.isMaximized()) {
      win.unmaximize();
      return false;
    } else {
      win?.maximize();
      return true;
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    win?.close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    return win?.isMaximized() || false;
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_RESTORE_MAIN, () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
    } else {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Compact HUD Always-On-Top Window Controls
  ipcMain.handle(IPC_CHANNELS.COMPACT_WINDOW_OPEN, () => {
    createCompactWindow();
  });

  ipcMain.handle(IPC_CHANNELS.COMPACT_WINDOW_CLOSE, () => {
    if (compactWindow && !compactWindow.isDestroyed()) {
      compactWindow.close();
    }
  });

  ipcMain.handle(IPC_CHANNELS.COMPACT_WINDOW_TOGGLE, () => {
    if (compactWindow && !compactWindow.isDestroyed()) {
      compactWindow.close();
      return false;
    } else {
      createCompactWindow();
      return true;
    }
  });

  ipcMain.handle(IPC_CHANNELS.COMPACT_WINDOW_IS_OPEN, () => {
    return Boolean(compactWindow && !compactWindow.isDestroyed() && compactWindow.isVisible());
  });

  ipcMain.handle(IPC_CHANNELS.COMPACT_WINDOW_SET_ALWAYS_ON_TOP, (_e, alwaysOnTop: boolean) => {
    if (compactWindow && !compactWindow.isDestroyed()) {
      compactWindow.setAlwaysOnTop(alwaysOnTop, alwaysOnTop ? "screen-saver" : "normal");
      return alwaysOnTop;
    }
    return false;
  });

  ipcMain.handle(IPC_CHANNELS.COMPACT_WINDOW_GET_ALWAYS_ON_TOP, () => {
    if (compactWindow && !compactWindow.isDestroyed()) {
      return compactWindow.isAlwaysOnTop();
    }
    return false;
  });

  ipcMain.handle(IPC_CHANNELS.COMPACT_WINDOW_SET_CLICK_THROUGH, (_e, clickThrough: boolean) => {
    if (compactWindow && !compactWindow.isDestroyed()) {
      compactWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
    }
  });

  // Theme Synchronization Across Windows
  ipcMain.handle(IPC_CHANNELS.THEME_GET, () => {
    return currentTheme;
  });

  ipcMain.handle(IPC_CHANNELS.THEME_SET, (event, theme: "dark" | "light") => {
    if (theme !== "dark" && theme !== "light") return;
    currentTheme = theme;
    if (nativeTheme.themeSource !== theme) {
      nativeTheme.themeSource = theme;
    }
    const senderWebContents = event.sender;
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed() && win.webContents !== senderWebContents) {
        win.webContents.send(IPC_CHANNELS.THEME_STREAM, theme);
      }
    }
  });

  // System
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_OVERVIEW, async () => {
    return coreService?.getOverview();
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_METRICS, async () => {
    return coreService?.getMetricsSnapshot();
  });

  ipcMain.handle(
    IPC_CHANNELS.SYSTEM_TOGGLE_STREAM,
    (_e, enabled: boolean, intervalMs?: number) => {
      return coreService?.toggleMetricsStream(enabled, intervalMs);
    },
  );

  // Stream live metrics updates to all active workstation windows
  coreService.onSystemMetrics((snapshot) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.SYSTEM_STREAM_METRICS, snapshot);
    }
    if (compactWindow && !compactWindow.isDestroyed()) {
      compactWindow.webContents.send(IPC_CHANNELS.SYSTEM_STREAM_METRICS, snapshot);
    }
  });

  // Processes
  ipcMain.handle(IPC_CHANNELS.PROCESS_LIST, async () => {
    return coreService?.getProcesses();
  });

  ipcMain.handle(IPC_CHANNELS.PROCESS_GET_DETAILS, async (_e, pid: number) => {
    return coreService?.getProcessDetails(pid);
  });

  ipcMain.handle(IPC_CHANNELS.PROCESS_CONTROL, async (_e, req) => {
    return coreService?.controlProcess(req);
  });

  ipcMain.handle(
    IPC_CHANNELS.PROCESS_VERIFY_SIGNATURE,
    async (_e, filePath: string) => {
      return coreService?.verifyProcessSignature(filePath);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.PROCESS_COMPUTE_HASH,
    async (_e, filePath: string) => {
      return coreService?.computeProcessHash(filePath);
    },
  );

  // Network
  ipcMain.handle(IPC_CHANNELS.NETWORK_GET_CONNECTIONS, async () => {
    return coreService?.getNetworkConnections();
  });

  ipcMain.handle(IPC_CHANNELS.NETWORK_GET_INTERFACES, async () => {
    return coreService?.getNetworkInterfaces();
  });

  // Services
  ipcMain.handle(IPC_CHANNELS.SERVICES_LIST, async () => {
    return coreService?.getServices();
  });

  ipcMain.handle(IPC_CHANNELS.SERVICES_CONTROL, async (_e, req) => {
    return coreService?.controlService(req);
  });

  // Security
  ipcMain.handle(IPC_CHANNELS.SECURITY_GET_POSTURE, async () => {
    return coreService?.getSecurityPosture();
  });

  ipcMain.handle(IPC_CHANNELS.SECURITY_GET_ALERTS, async () => {
    return coreService?.getSecurityAlerts();
  });

  ipcMain.handle(
    IPC_CHANNELS.SECURITY_RUN_FIM_SCAN,
    async (_e, dir?: string) => {
      return coreService?.runFimScan(dir);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.SECURITY_DISMISS_ALERT,
    async (_e, alertId: string) => {
      return coreService?.dismissAlert(alertId);
    },
  );

  ipcMain.handle(IPC_CHANNELS.SECURITY_RUN_AUDIT, async () => {
    return coreService?.runSecurityAudit();
  });

  ipcMain.handle(
    IPC_CHANNELS.SECURITY_ANALYZE_BINARY,
    async (_e, target: { filePath?: string; pid?: number }) => {
      return coreService?.analyzeBinary(target);
    },
  );

  // Events
  ipcMain.handle(IPC_CHANNELS.EVENTS_QUERY, async (_e, req) => {
    return coreService?.queryEvents(req);
  });

  // Hardware
  ipcMain.handle(IPC_CHANNELS.HARDWARE_GET_SUMMARY, async () => {
    return coreService?.getHardwareSummary();
  });

  // Reports
  ipcMain.handle(IPC_CHANNELS.REPORTS_GENERATE, async (_e, config) => {
    return coreService?.generateReport(config);
  });
}

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.sentinel.desktop");
  }

  setupIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (coreService) {
    coreService.destroy();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  if (coreService) {
    coreService.destroy();
  }
});
