import React, { useEffect } from "react";
import {
  Search,
  Minus,
  Square,
  Copy,
  X,
  Sun,
  Moon,
  PictureInPicture2,
} from "lucide-react";
import appIcon from "../../../assets/icon.png";
import { useAppStore } from "../../stores/useAppStore";

export const TitleBar: React.FC = () => {
  const {
    overview,
    setIsCommandPaletteOpen,
    theme,
    toggleTheme,
    isMaximized,
    setIsMaximized,
  } = useAppStore();

  useEffect(() => {
    if (window.sentinelAPI) {
      window.sentinelAPI.isWindowMaximized().then(setIsMaximized);
    }
  }, [setIsMaximized]);

  const handleMinimize = () => window.sentinelAPI?.minimizeWindow();
  const handleMaximize = async () => {
    const max = await window.sentinelAPI?.maximizeWindow();
    setIsMaximized(max);
  };
  const handleClose = () => window.sentinelAPI?.closeWindow();

  return (
    <header className="titlebar-drag-region h-12 w-full bg-white/70 dark:bg-black/25 backdrop-blur-3xl backdrop-saturate-200 border-b border-black/[0.08] dark:border-white/10 flex items-center justify-between px-3.5 z-50 select-none shadow-sm dark:shadow-md dark:shadow-black/20">
      {/* Left: Branding & Host Info */}
      <div className="flex items-center gap-3 no-drag">
        <div className="flex items-center gap-2.5">
          <div className="relative w-6 h-6 rounded-lg overflow-hidden shadow-md shadow-cyan-500/20 border border-black/10 dark:border-white/20 shrink-0">
            <img
              src={appIcon}
              alt="Sentinel Desktop Icon"
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </div>
          <span className="font-bold text-xs tracking-wider font-mono text-slate-900 dark:text-white">
            SENTINEL
            <span className="text-cyan-600 dark:text-cyan-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
              .DESKTOP
            </span>
          </span>
        </div>

        {/* Machine Name Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-white/70 text-[10px] font-mono backdrop-blur-md">
          <span>
            {overview?.hostname
              ? `${overview.hostname}-Microsoft`
              : "DESKTOP-IZBACDH-Microsoft"}
          </span>
        </div>

        {/* Privilege Indicator Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-white/80 text-[10px] font-mono backdrop-blur-md">
          <span
            className={`w-1.5 h-1.5 rounded-full ${overview?.isElevated ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse" : "bg-slate-400 dark:bg-white/60"}`}
          />
          <span>{overview?.isElevated ? "ELEVATED" : "USER"}</span>
        </div>
      </div>

      {/* Center: Search / Command Palette Floating Glass Pill */}
      <button
        onClick={() => setIsCommandPaletteOpen(true)}
        className="no-drag flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.07] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] backdrop-blur-2xl border border-black/[0.08] hover:border-black/[0.15] dark:border-white/10 dark:hover:border-white/20 text-xs text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white/80 transition-all duration-200 w-72 md:w-88 justify-between shadow-inner cursor-pointer group"
      >
        <span className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 dark:text-white/40 dark:group-hover:text-cyan-400 transition-colors" />
          <span className="truncate">Search commands, processes, ports...</span>
        </span>
        <kbd className="px-1.5 py-0.5 rounded-md bg-black/[0.06] dark:bg-white/10 text-[10px] font-mono border border-black/[0.08] dark:border-white/10 text-slate-600 dark:text-white/60">
          Ctrl K
        </kbd>
      </button>

      {/* Right: Theme Toggle & Window Controls */}
      <div className="flex items-center gap-2 no-drag">
        {/* Always-on-top Compact HUD Button */}
        <button
          onClick={() => window.sentinelAPI?.toggleCompactWindow()}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-black/[0.05] dark:hover:bg-white/10 border border-transparent hover:border-black/[0.08] dark:hover:border-white/10 transition-all cursor-pointer"
          title="Toggle Always-On-Top Compact HUD"
        >
          <PictureInPicture2 className="w-3.5 h-3.5" />
        </button>

        {/* Light / Dark Mode Liquid Glass Toggle */}
        <button
          onClick={toggleTheme}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/10 border border-transparent hover:border-black/[0.08] dark:hover:border-white/10 transition-all cursor-pointer"
          title={`Switch to ${theme === "dark" ? "Light Frosted" : "Dark Liquid"} Glass`}
        >
          {theme === "dark" ? (
            <Sun className="w-3.5 h-3.5 text-amber-300" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-blue-600" />
          )}
        </button>

        <div className="h-4 w-px bg-black/[0.08] dark:bg-white/10" />

        {/* Window Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleMinimize}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <Copy className="w-3 h-3" />
            ) : (
              <Square className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-white hover:bg-red-500 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
