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

// Memory & V8 Engine Optimization Switches:
// 1. Cap V8 old space to 160MB to prompt active incremental GC and prevent unbounded heap bloat
// 2. Expose manual gc to enable deterministic working set and memory reclamation
app.commandLine.appendSwitch(
  "js-flags",
  "--max-old-space-size=160 --expose-gc",
);
// 3. Cap disk & media cache sizes to avoid unbounded memory-mapped file allocations
app.commandLine.appendSwitch("disk-cache-size", "16777216"); // 16 MB max cache
app.commandLine.appendSwitch("media-cache-size", "16777216"); // 16 MB max cache
app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");

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
let memoryTrimInterval: NodeJS.Timeout | null = null;

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.sentinel.desktop");
  }

  coreService = new SentinelCoreService();
  windowManager = new WindowManager();
  themeManager = new ThemeManager(windowManager);

  // Attach memory optimization handler to window minimize and background idle
  windowManager.setMemoryTrimHandler(() => {
    coreService?.trimMemory();
  });

  // Periodic background memory optimizer (every 60s)
  memoryTrimInterval = setInterval(() => {
    coreService?.trimMemory();
  }, 60000);

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
  if (memoryTrimInterval) {
    clearInterval(memoryTrimInterval);
    memoryTrimInterval = null;
  }
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
  if (memoryTrimInterval) {
    clearInterval(memoryTrimInterval);
    memoryTrimInterval = null;
  }
  if (coreService) {
    coreService.destroy();
  }
  if (windowManager) {
    windowManager.destroy();
  }
});
