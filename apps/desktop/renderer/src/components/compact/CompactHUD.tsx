import React, { useEffect, useMemo, useState } from "react";
import {
  Pin,
  PinOff,
  Settings,
  Maximize2,
  Minus,
  X,
  Layers,
  Sun,
  Moon,
} from "lucide-react";
import { useMetricsStore } from "../../stores/useMetricsStore";
import { useAppStore } from "../../stores/useAppStore";
import { useCompactStore } from "../../stores/useCompactStore";
import { SPEC_REGISTRY, ALL_SPEC_IDS } from "./registry";
import { CompactSpecCard } from "./CompactSpecCard";
import { CompactSpecPill } from "./CompactSpecPill";
import { CompactCustomizer } from "./CompactCustomizer";
import type { SpecRenderContext } from "./types";
import type { CompactSpecId, CompactSpecItemConfig } from "@sentinel/contracts";
import { ACCENT_SCHEMES } from "./visuals/CompactThemeHelper";

interface CompactHUDProps {
  standalone?: boolean;
  className?: string;
}

export const CompactHUD: React.FC<CompactHUDProps> = ({
  standalone = false,
  className = "",
}) => {
  const { current, history } = useMetricsStore();
  const { overview, setOverview, theme, toggleTheme, setTheme } = useAppStore();
  const {
    settings,
    isCustomizerOpen,
    setIsCustomizerOpen,
    toggleAlwaysOnTop,
    setAlwaysOnTop,
  } = useCompactStore();

  const [isHovered, setIsHovered] = useState(false);

  // Synchronize system overview on mount if empty
  useEffect(() => {
    if (!overview && window.sentinelAPI) {
      window.sentinelAPI.getSystemOverview().then((data) => {
        if (data) setOverview(data);
      });
    }
  }, [overview, setOverview]);

  // Synchronize alwaysOnTop state with Electron window on mount
  useEffect(() => {
    if (standalone && window.sentinelAPI?.isCompactAlwaysOnTop) {
      window.sentinelAPI.isCompactAlwaysOnTop().then((isTop) => {
        if (isTop !== settings.alwaysOnTop) {
          setAlwaysOnTop(isTop);
        }
      });
    }
  }, [standalone, settings.alwaysOnTop, setAlwaysOnTop]);

  // Keyboard shortcut: Escape closes customizer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCustomizerOpen) {
        setIsCustomizerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCustomizerOpen, setIsCustomizerOpen]);

  // Filter and sort active spec definitions
  const activeSpecs = useMemo(() => {
    return ALL_SPEC_IDS.filter((id) => settings.specs[id]?.enabled ?? true)
      .sort((a, b) => {
        const orderA = settings.specs[a]?.order ?? 99;
        const orderB = settings.specs[b]?.order ?? 99;
        return orderA - orderB;
      })
      .map((id) => SPEC_REGISTRY[id])
      .filter(Boolean);
  }, [settings.specs]);

  const context: SpecRenderContext = useMemo(
    () => ({
      metrics: current,
      overview,
      history,
      settings,
    }),
    [current, overview, history, settings]
  );

  const getSpecConfig = (specId: CompactSpecId): CompactSpecItemConfig => {
    return (
      settings.specs[specId] ?? {
        enabled: true,
        order: 0,
        showSparkline: false,
        showDetails: true,
      }
    );
  };

  const accent = ACCENT_SCHEMES[settings.accentColor];

  // Window action handlers
  const handleMinimize = () => window.sentinelAPI?.minimizeWindow();
  const handleClose = () => {
    if (standalone) {
      window.sentinelAPI?.closeWindow();
    } else {
      window.sentinelAPI?.closeCompactWindow();
    }
  };
  const handleRestoreMain = () => {
    window.sentinelAPI?.restoreMainWindow();
  };

  const isUltraCompact = settings.density === "ultra-compact";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        opacity: settings.opacity / 100,
      }}
      className={`h-full w-full flex flex-col bg-glass-canvas backdrop-blur-3xl rounded-2xl border border-black/10 dark:border-white/15 ${
        standalone ? "shadow-[var(--glass-specular)]" : "shadow-2xl"
      } text-slate-800 dark:text-white select-none overflow-hidden relative ${className}`}
    >
      {/* Liquid Glass Vibrant Ambient Mesh Gradient (Exact match with Sentinel Desktop) */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden z-0"
        aria-hidden="true"
      >
        {/* Dark cosmic gradient base mesh (Active only in dark mode) */}
        <div className="hidden dark:block absolute inset-0 bg-linear-to-tr from-[#060814] via-[#090d1f] to-[#0e071c] opacity-95" />

        {/* Light pastel ambient base mesh (Active only in light mode) */}
        <div className="block dark:hidden absolute inset-0 bg-linear-to-tr from-[#eef2f8] via-[#f4f7fb] to-[#faf5fc]" />

        {/* Ambient blooms scaled for compact HUD */}
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-cyan-400/20 dark:bg-cyan-500/25 blur-[60px]" />
        <div className="absolute top-1/4 -right-12 w-48 h-48 rounded-full bg-blue-400/18 dark:bg-blue-600/35 blur-[70px]" />
        <div className="absolute top-2/3 -right-8 w-44 h-44 rounded-full bg-fuchsia-400/20 dark:bg-fuchsia-600/30 blur-[60px]" />
        <div className="absolute -bottom-12 left-1/4 w-48 h-48 rounded-full bg-purple-400/18 dark:bg-purple-600/30 blur-[60px]" />
      </div>

      {/* Specular Top Rim */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none z-30"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accent.stroke} 50%, transparent 100%)`,
          opacity: 0.6,
        }}
      />

      {/* Floating Mini Draggable TitleBar */}
      {settings.showTitleBar && (
        <header className="titlebar-drag-region h-9 shrink-0 flex items-center justify-between px-3 border-b border-black/[0.08] dark:border-white/10 bg-white/70 dark:bg-black/25 backdrop-blur-2xl rounded-t-2xl z-20">
          {/* Left: Branding & Status Dot */}
          <div className="flex items-center gap-2 no-drag">
            <span
              className="w-2 h-2 rounded-full animate-pulse shadow-sm"
              style={{ backgroundColor: accent.stroke }}
              title="System Telemetry Stream Active"
            />
            <span className="font-mono text-[11px] font-bold tracking-wider text-slate-900 dark:text-white">
              SENTINEL
              <span className={accent.text}>.MINI</span>
            </span>
          </div>

          {/* Right: Quick Controls */}
          <div className="flex items-center gap-1 no-drag">
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors cursor-pointer"
              title={`Switch to ${theme === "dark" ? "Light Frosted" : "Dark Liquid"} Glass`}
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-blue-600" />
              )}
            </button>

            {/* Always-on-top Pin Toggle */}
            <button
              onClick={toggleAlwaysOnTop}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/10 ${
                settings.alwaysOnTop
                  ? "text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                  : "text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white"
              }`}
              title={
                settings.alwaysOnTop
                  ? "Always on Top: Active (Click to Unpin)"
                  : "Always on Top: Inactive (Click to Pin)"
              }
            >
              {settings.alwaysOnTop ? (
                <Pin className="w-3.5 h-3.5 fill-current" />
              ) : (
                <PinOff className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Customizer Settings Trigger */}
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Customize Specs & Layout"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Expand / Restore Full Workstation */}
            <button
              onClick={handleRestoreMain}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Dock / Open Full Workstation"
            >
              <Maximize2 className="w-3 h-3" />
            </button>

            {/* Window Minimize */}
            <button
              onClick={handleMinimize}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Minimize HUD"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Window Close */}
            <button
              onClick={handleClose}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-white hover:bg-red-500 transition-colors cursor-pointer"
              title="Close HUD"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>
      )}

      {/* Main Telemetry Body Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 z-10 relative [scrollbar-gutter:stable]">
        {activeSpecs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 font-mono text-xs">
            <Layers className="w-6 h-6 mb-2 opacity-50" />
            <span>No specs enabled</span>
            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="mt-2 text-cyan-500 hover:underline"
            >
              Configure visible specs
            </button>
          </div>
        ) : isUltraCompact ? (
          /* Ultra-compact density: render slim pills */
          settings.layoutMode === "horizontal" ? (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none w-full">
              {activeSpecs.map((spec) => (
                <div key={spec.id} className="min-w-[150px] shrink-0">
                  <CompactSpecPill
                    spec={spec}
                    context={{ ...context, config: getSpecConfig(spec.id) }}
                  />
                </div>
              ))}
            </div>
          ) : settings.layoutMode === "grid" ? (
            <div className="grid grid-cols-2 gap-1.5 w-full">
              {activeSpecs.map((spec) => (
                <CompactSpecPill
                  key={spec.id}
                  spec={spec}
                  context={{ ...context, config: getSpecConfig(spec.id) }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 w-full">
              {activeSpecs.map((spec) => (
                <CompactSpecPill
                  key={spec.id}
                  spec={spec}
                  context={{ ...context, config: getSpecConfig(spec.id) }}
                />
              ))}
            </div>
          )
        ) : (
          /* Compact or Detailed density: render glass cards */
          settings.layoutMode === "horizontal" ? (
            <div className="flex items-stretch gap-2 overflow-x-auto py-1 scrollbar-none">
              {activeSpecs.map((spec) => (
                <div key={spec.id} className="min-w-[140px] shrink-0">
                  <CompactSpecCard
                    spec={spec}
                    context={{ ...context, config: getSpecConfig(spec.id) }}
                  />
                </div>
              ))}
            </div>
          ) : settings.layoutMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeSpecs.map((spec) => (
                <CompactSpecCard
                  key={spec.id}
                  spec={spec}
                  context={{ ...context, config: getSpecConfig(spec.id) }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {activeSpecs.map((spec) => (
                <CompactSpecCard
                  key={spec.id}
                  spec={spec}
                  context={{ ...context, config: getSpecConfig(spec.id) }}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Preferences & Customizer Drawer Modal */}
      {isCustomizerOpen && (
        <CompactCustomizer onClose={() => setIsCustomizerOpen(false)} />
      )}
    </div>
  );
};
