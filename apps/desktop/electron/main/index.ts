import { app } from "electron";
import { SentinelCoreService } from "@sentinel/core";
import { defaultLogger } from "@sentinel/logger";
import { WindowManager } from "./windows/WindowManager";
import { ThemeManager } from "./services/ThemeManager";
import { registerIpcHandlers } from "./ipc/registerIpcHandlers";

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

let coreService: SentinelCoreService | null = null;
let windowManager: WindowManager | null = null;
let themeManager: ThemeManager | null = null;

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.sentinel.desktop");
  }

  coreService = new SentinelCoreService();
  windowManager = new WindowManager();
  themeManager = new ThemeManager(windowManager);

  registerIpcHandlers({
    coreService,
    windowManager,
    themeManager,
  });

  windowManager.createMainWindow();

  app.on("activate", () => {
    windowManager?.restoreMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (coreService) {
    coreService.destroy();
  }
  if (windowManager) {
    windowManager.destroy();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  if (coreService) {
    coreService.destroy();
  }
  if (windowManager) {
    windowManager.destroy();
  }
});
