import { nativeTheme } from "electron";
import { IPC_CHANNELS } from "@sentinel/contracts";
import type { WindowManager } from "../windows/WindowManager";

export class ThemeManager {
  private currentTheme: "dark" | "light" = "dark";
  private windowManager: WindowManager;

  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }

  public getTheme(): "dark" | "light" {
    return this.currentTheme;
  }

  public setTheme(
    theme: "dark" | "light",
    senderWebContents?: Electron.WebContents
  ): void {
    if (theme !== "dark" && theme !== "light") return;
    this.currentTheme = theme;

    if (nativeTheme.themeSource !== theme) {
      nativeTheme.themeSource = theme;
    }

    this.windowManager.broadcastExcept(
      senderWebContents,
      IPC_CHANNELS.THEME_STREAM,
      theme
    );
  }
}

