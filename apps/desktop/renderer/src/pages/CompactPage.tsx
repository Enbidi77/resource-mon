import React from "react";
import {
  Pin,
  ExternalLink,
  Sliders,
  Layers,
  Sparkles,
  Monitor,
  CheckCircle2,
} from "lucide-react";
import { GlassCard, GlassButton, GlassBadge } from "../components/glass";
import { CompactHUD } from "../components/compact/CompactHUD";
import { useCompactStore } from "../stores/useCompactStore";
import { SPEC_REGISTRY, ALL_SPEC_IDS } from "../components/compact/registry";
import type {
  CompactLayoutMode,
  CompactDisplayDensity,
  CompactVisualGauge,
  CompactAccentColor,
} from "@sentinel/contracts";

export const CompactPage: React.FC = () => {
  const {
    settings,
    setLayoutMode,
    setDensity,
    setGaugeStyle,
    setAccentColor,
    toggleSpec,
    setIsCustomizerOpen,
  } = useCompactStore();

  const handleLaunchFloating = async () => {
    if (window.sentinelAPI?.openCompactWindow) {
      await window.sentinelAPI.openCompactWindow();
    }
  };

  const accentOptions: Array<{ id: CompactAccentColor; color: string; label: string }> = [
    { id: "cyan", color: "#06b6d4", label: "Cyan" },
    { id: "emerald", color: "#10b981", label: "Emerald" },
    { id: "purple", color: "#a855f7", label: "Purple" },
    { id: "blue", color: "#3b82f6", label: "Blue" },
    { id: "amber", color: "#f59e0b", label: "Amber" },
    { id: "rose", color: "#f43f5e", label: "Rose" },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none text-slate-800 dark:text-white">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.04] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 backdrop-blur-2xl shadow-lg relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <GlassBadge variant="cyan" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse mr-1" />
              Real-Time Overlay
            </GlassBadge>
            <span className="text-[11px] font-mono text-slate-500 dark:text-white/50">
              Win32 Native Telemetry
            </span>
          </div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
            Always-on-Top Compact HUD
          </h1>
          <p className="text-xs text-slate-600 dark:text-white/60 max-w-xl">
            A lightweight, customizable floating system monitor with sub-second live metrics, customizable spec modules, and Apple Glass liquid aesthetics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <GlassButton
            variant="glass"
            size="sm"
            onClick={() => setIsCustomizerOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Specs</span>
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleLaunchFloating}
            className="flex items-center gap-1.5 shadow-lg shadow-cyan-500/25"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Launch Floating HUD</span>
          </GlassButton>
        </div>
      </div>

      {/* Main Grid: Interactive Live Preview & Customizer Quick Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive HUD Live Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase font-semibold text-slate-500 dark:text-white/60 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-cyan-500" />
              Live HUD Preview
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {settings.layoutMode} • {settings.density}
            </span>
          </div>

          {/* Container simulating the floating window */}
          <div className="p-3 rounded-2xl bg-black/40 dark:bg-black/60 border border-black/10 dark:border-white/10 backdrop-blur-3xl shadow-2xl flex items-center justify-center min-h-[460px]">
            <div
              style={{
                width: settings.layoutMode === "horizontal" ? "100%" : "340px",
                height: settings.layoutMode === "horizontal" ? "auto" : "480px",
                maxWidth: "100%",
              }}
              className="transition-all duration-300"
            >
              <CompactHUD standalone={false} />
            </div>
          </div>
        </div>

        {/* Right Column: Customization & Specs Selector */}
        <div className="lg:col-span-7 space-y-4">
          {/* Quick Display Mode Controls */}
          <GlassCard className="p-4 space-y-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Appearance & Layout Engine
            </h2>

            {/* Layout Mode */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-500 dark:text-white/60">
                Orientation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["vertical", "horizontal", "grid"] as CompactLayoutMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setLayoutMode(mode)}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition-all capitalize cursor-pointer ${
                      settings.layoutMode === mode
                        ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-600 dark:text-cyan-300 font-semibold"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Density & Visual Gauge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-500 dark:text-white/60">
                  Density
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(["ultra-compact", "compact", "detailed"] as CompactDisplayDensity[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDensity(d)}
                      className={`py-1.5 px-2 rounded-lg border text-[10px] font-mono transition-all truncate cursor-pointer ${
                        settings.density === d
                          ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-600 dark:text-cyan-300 font-semibold"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {d.replace("-", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-500 dark:text-white/60">
                  Gauge Style
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(["bar", "sparkline", "gauge", "minimal"] as CompactVisualGauge[]).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGaugeStyle(g)}
                      className={`py-1.5 px-2 rounded-lg border text-[10px] font-mono transition-all truncate cursor-pointer ${
                        settings.gaugeStyle === g
                          ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-600 dark:text-cyan-300 font-semibold"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Accent Color */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-mono text-slate-500 dark:text-white/60">
                Accent Illumination
              </label>
              <div className="flex items-center gap-2">
                {accentOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAccentColor(opt.id)}
                    style={{ backgroundColor: opt.color }}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                      settings.accentColor === opt.id
                        ? "scale-110 border-white shadow-md shadow-white/20"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Visible Hardware & Specs Modules Selector */}
          <GlassCard className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Active Hardware Specs Modules
              </h2>
              <span className="text-[10px] font-mono text-slate-400">
                {Object.values(settings.specs).filter((s) => s.enabled).length} Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_SPEC_IDS.map((specId) => {
                const def = SPEC_REGISTRY[specId];
                if (!def) return null;
                const isEnabled = settings.specs[specId]?.enabled ?? true;
                const Icon = def.icon;

                return (
                  <button
                    key={specId}
                    onClick={() => toggleSpec(specId)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isEnabled
                        ? "bg-white/[0.08] border-cyan-400/30 text-slate-900 dark:text-white shadow-xs"
                        : "bg-white/[0.02] border-white/5 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                          isEnabled
                            ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-400"
                            : "bg-white/5 border-white/10 text-slate-500"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold font-mono truncate">{def.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {def.description}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ml-2 ${
                        isEnabled
                          ? "bg-cyan-500 border-cyan-400 text-black"
                          : "border-white/20 bg-transparent text-transparent"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

