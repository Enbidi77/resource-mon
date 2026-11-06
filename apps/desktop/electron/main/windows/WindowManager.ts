import { app, BrowserWindow, nativeImage, shell } from "electron";
import { join } from "path";
import { existsSync } from "fs";
import { IPC_CHANNELS } from "@sentinel/contracts";
import { defaultLogger } from "@sentinel/logger";

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private compactWindow: BrowserWindow | null = null;

  public resolveAppIconPath(): string | undefined {
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

  public createMainWindow(): BrowserWindow {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.restoreMainWindow();
      return this.mainWindow;
    }

    const iconPath = this.resolveAppIconPath();
    const iconImage = iconPath ? nativeImage.createFromPath(iconPath) : undefined;

    this.mainWindow = new BrowserWindow({
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
        this.mainWindow.setIcon(iconPath);
      } catch (e) {
        defaultLogger.warn({ err: e }, "Failed to explicitly set window icon");
      }
    }

    if (process.platform === "darwin" && iconImage && !iconImage.isEmpty()) {
      app.dock?.setIcon(iconImage);
    }

    this.mainWindow.on("ready-to-show", () => {
      this.mainWindow?.show();
    });

    // Handle external link clicks safely in system browser
    this.mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: "deny" };
    });

    // Load URL from Vite Dev Server in development or packaged file in production
    if (process.env["ELECTRON_RENDERER_URL"]) {
      this.mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
      this.mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
    }

    return this.mainWindow;
  }

  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow && !this.mainWindow.isDestroyed() ? this.mainWindow : null;
  }

  public createCompactWindow(theme?: "dark" | "light"): BrowserWindow {
    if (this.compactWindow && !this.compactWindow.isDestroyed()) {
      this.compactWindow.show();
      this.compactWindow.focus();
      return this.compactWindow;
    }

    const iconPath = this.resolveAppIconPath();
    const iconImage = iconPath ? nativeImage.createFromPath(iconPath) : undefined;

    this.compactWindow = new BrowserWindow({
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
        this.compactWindow.setIcon(iconPath);
      } catch (e) {
        defaultLogger.warn({ err: e }, "Failed to explicitly set compact window icon");
      }
    }

    this.compactWindow.on("ready-to-show", () => {
      this.compactWindow?.show();
      this.compactWindow?.setAlwaysOnTop(true, "screen-saver");
      if (theme) {
        this.compactWindow?.webContents.send(IPC_CHANNELS.THEME_STREAM, theme);
      }
    });

    this.compactWindow.on("closed", () => {
      this.compactWindow = null;
    });

    this.compactWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: "deny" };
    });

    if (process.env["ELECTRON_RENDERER_URL"]) {
      this.compactWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#compact`);
    } else {
      this.compactWindow.loadFile(join(__dirname, "../renderer/index.html"), {
        hash: "compact",
      });
    }

    return this.compactWindow;
  }

  public getCompactWindow(): BrowserWindow | null {
    return this.compactWindow && !this.compactWindow.isDestroyed() ? this.compactWindow : null;
  }

  public minimize(webContents?: Electron.WebContents): void {
    const win = (webContents ? BrowserWindow.fromWebContents(webContents) : null) || this.mainWindow;
    win?.minimize();
  }

  public toggleMaximize(webContents?: Electron.WebContents): boolean {
    const win = (webContents ? BrowserWindow.fromWebContents(webContents) : null) || this.mainWindow;
    if (win?.isMaximized()) {
      win.unmaximize();
      return false;
    } else {
      win?.maximize();
      return true;
    }
  }

  public close(webContents?: Electron.WebContents): void {
    const win = (webContents ? BrowserWindow.fromWebContents(webContents) : null) || this.mainWindow;
    win?.close();
  }

  public isMaximized(webContents?: Electron.WebContents): boolean {
    const win = (webContents ? BrowserWindow.fromWebContents(webContents) : null) || this.mainWindow;
    return win?.isMaximized() || false;
  }

  public restoreMainWindow(): void {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      this.createMainWindow();
    } else {
      if (this.mainWindow.isMinimized()) this.mainWindow.restore();
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  public openCompactWindow(theme?: "dark" | "light"): BrowserWindow {
    return this.createCompactWindow(theme);
  }

  public closeCompactWindow(): void {
    if (this.compactWindow && !this.compactWindow.isDestroyed()) {
      this.compactWindow.close();
    }
  }

  public toggleCompactWindow(theme?: "dark" | "light"): boolean {
    if (this.compactWindow && !this.compactWindow.isDestroyed()) {
      this.compactWindow.close();
      return false;
    } else {
      this.createCompactWindow(theme);
      return true;
    }
  }

  public isCompactWindowOpen(): boolean {
    return Boolean(
      this.compactWindow &&
        !this.compactWindow.isDestroyed() &&
        this.compactWindow.isVisible()
    );
  }

  public setCompactAlwaysOnTop(alwaysOnTop: boolean): boolean {
    if (this.compactWindow && !this.compactWindow.isDestroyed()) {
      this.compactWindow.setAlwaysOnTop(
        alwaysOnTop,
        alwaysOnTop ? "screen-saver" : "normal"
      );
      return alwaysOnTop;
    }
    return false;
  }

  public isCompactAlwaysOnTop(): boolean {
    if (this.compactWindow && !this.compactWindow.isDestroyed()) {
      return this.compactWindow.isAlwaysOnTop();
    }
    return false;
  }

  public setCompactClickThrough(clickThrough: boolean): void {
    if (this.compactWindow && !this.compactWindow.isDestroyed()) {
      this.compactWindow.setIgnoreMouseEvents(clickThrough, { forward: true });
    }
  }

  public broadcast(channel: string, ...args: unknown[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
    if (this.compactWindow && !this.compactWindow.isDestroyed()) {
      this.compactWindow.webContents.send(channel, ...args);
    }
  }

  public broadcastExcept(
    senderWebContents: Electron.WebContents | undefined,
    channel: string,
    ...args: unknown[]
  ): void {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed() && win.webContents !== senderWebContents) {
        win.webContents.send(channel, ...args);
      }
    }
  }

  public destroy(): void {
    if (this.compactWindow && !this.compactWindow.isDestroyed()) {
      this.compactWindow.destroy();
      this.compactWindow = null;
    }
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.destroy();
      this.mainWindow = null;
    }
  }
}
