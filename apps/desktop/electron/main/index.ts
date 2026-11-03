import { app, BrowserWindow, ipcMain, shell, session } from 'electron';
import { join } from 'path';
import { SentinelCoreService } from '@sentinel/core';
import { IPC_CHANNELS } from '@sentinel/contracts';
import { defaultLogger } from '@sentinel/logger';

process.on('uncaughtException', (err) => {
  defaultLogger.error({ err }, 'CRITICAL UNCAUGHT EXCEPTION in Main Process');
  console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason) => {
  defaultLogger.error({ reason }, 'CRITICAL UNHANDLED REJECTION in Main Process');
  console.error('CRITICAL UNHANDLED REJECTION:', reason);
});

let mainWindow: BrowserWindow | null = null;
let coreService: SentinelCoreService | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    frame: false, // Frameless custom glass workstation titlebar
    backgroundColor: '#0a0c10',
    title: 'Sentinel Desktop',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle external link clicks safely in system browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Load URL from Vite Dev Server in development or packaged file in production
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function setupIpcHandlers(): void {
  coreService = new SentinelCoreService();

  // Window Controls
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow?.maximize();
      return true;
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow?.close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
    return mainWindow?.isMaximized() || false;
  });

  // System
  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_OVERVIEW, async () => {
    return coreService?.getOverview();
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_GET_METRICS, async () => {
    return coreService?.getMetricsSnapshot();
  });

  ipcMain.handle(IPC_CHANNELS.SYSTEM_TOGGLE_STREAM, (_e, { enabled, intervalMs }) => {
    return coreService?.toggleMetricsStream(enabled, intervalMs);
  });

  // Stream live metrics updates to the renderer
  coreService.onSystemMetrics((snapshot) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.SYSTEM_STREAM_METRICS, snapshot);
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

  ipcMain.handle(IPC_CHANNELS.PROCESS_VERIFY_SIGNATURE, async (_e, filePath: string) => {
    return coreService?.verifyProcessSignature(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.PROCESS_COMPUTE_HASH, async (_e, filePath: string) => {
    return coreService?.computeProcessHash(filePath);
  });

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

  ipcMain.handle(IPC_CHANNELS.SECURITY_RUN_FIM_SCAN, async (_e, dir?: string) => {
    return coreService?.runFimScan(dir);
  });

  ipcMain.handle(IPC_CHANNELS.SECURITY_DISMISS_ALERT, async (_e, alertId: string) => {
    return coreService?.dismissAlert(alertId);
  });

  ipcMain.handle(IPC_CHANNELS.SECURITY_RUN_AUDIT, async () => {
    return coreService?.runSecurityAudit();
  });

  ipcMain.handle(
    IPC_CHANNELS.SECURITY_ANALYZE_BINARY,
    async (_e, target: { filePath?: string; pid?: number }) => {
      return coreService?.analyzeBinary(target);
    }
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
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (coreService) {
    coreService.destroy();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
