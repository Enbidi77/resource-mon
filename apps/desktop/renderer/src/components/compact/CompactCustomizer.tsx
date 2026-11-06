import React from "react";
import {
  X,
  Sliders,
  Pin,
  Eye,
  RotateCcw,
  MousePointer,
  Check,
  Columns,
  Rows,
  Grid,
} from "lucide-react";
import { useCompactStore } from "../../stores/useCompactStore";
import { SPEC_REGISTRY, ALL_SPEC_IDS } from "./registry";
import type {
  CompactLayoutMode,
  CompactDisplayDensity,
  CompactVisualGauge,
  CompactAccentColor,
} from "@sentinel/contracts";

interface CompactCustomizerProps {
  onClose: () => void;
}

export const CompactCustomizer: React.FC<CompactCustomizerProps> = ({ onClose }) => {
  const {
    settings,
    setLayoutMode,
    setDensity,
    setGaugeStyle,
    setOpacity,
    setAccentColor,
    setAlwaysOnTop,
    setClickThrough,
    toggleSpec,
    resetToDefaults,
  } = useCompactStore();

  const layoutOptions: Array<{ id: CompactLayoutMode; label: string; icon: any }> = [
    { id: "vertical", label: "Vertical Stack", icon: Rows },
    { id: "horizontal", label: "Horizontal Bar", icon: Columns },
    { id: "grid", label: "Grid Matrix", icon: Grid },
  ];

  const densityOptions: Array<{ id: CompactDisplayDensity; label: string }> = [
    { id: "ultra-compact", label: "Ultra Minimal" },
    { id: "compact", label: "Balanced Glass" },
    { id: "detailed", label: "Detailed Specs" },
  ];

  const gaugeOptions: Array<{ id: CompactVisualGauge; label: string }> = [
    { id: "bar", label: "Progress Bar" },
    { id: "sparkline", label: "SVG Trend" },
    { id: "gauge", label: "Circular Dial" },
    { id: "minimal", label: "Numeric Only" },
  ];

  const accentOptions: Array<{ id: CompactAccentColor; label: string; color: string }> = [
    { id: "cyan", label: "Cyan", color: "#06b6d4" },
    { id: "emerald", label: "Emerald", color: "#10b981" },
    { id: "purple", label: "Purple", color: "#a855f7" },
    { id: "blue", label: "Blue", color: "#3b82f6" },
    { id: "amber", label: "Amber", color: "#f59e0b" },
    { id: "rose", label: "Rose", color: "#f43f5e" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex items-center justify-center p-3 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[92vh] flex flex-col rounded-2xl bg-white/[0.08] dark:bg-black/80 border border-white/20 dark:border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden text-slate-800 dark:text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10 bg-white/5 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-500" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              HUD Preferences & Specs
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Customizer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
          {/* 1. Layout Mode */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5 block">
              Orientation & Layout
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {layoutOptions.map((opt) => {
                const Icon = opt.icon;
                const active = settings.layoutMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setLayoutMode(opt.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                      active
                        ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-600 dark:text-cyan-300 shadow-sm"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Density & Gauge Style */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5 block">
                Visual Density
              </label>
              <div className="space-y-1">
                {densityOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDensity(opt.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
                      settings.density === opt.id
                        ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-600 dark:text-cyan-300 font-semibold"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5 block">
                Visual Telemetry Gauge
              </label>
              <div className="space-y-1">
                {gaugeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setGaugeStyle(opt.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
                      settings.gaugeStyle === opt.id
                        ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-600 dark:text-cyan-300 font-semibold"
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Glass Translucency Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] text-slate-400 uppercase font-semibold">
                Glass Translucency & Opacity
              </label>
              <span className="text-[11px] font-bold text-cyan-500">{settings.opacity}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              step="5"
              value={settings.opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
            />
          </div>

          {/* 4. Accent Color Swatches */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5 block">
              Accent Illumination
            </label>
            <div className="flex items-center gap-2">
              {accentOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAccentColor(opt.id)}
                  style={{ backgroundColor: opt.color }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer border-2 ${
                    settings.accentColor === opt.id
                      ? "scale-110 border-white shadow-md shadow-white/20"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  title={opt.label}
                >
                  {settings.accentColor === opt.id && <Check className="w-3.5 h-3.5 text-black" />}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Window Pinning & Click-Through Toggles */}
          <div className="space-y-2 pt-1 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <Pin className={`w-3.5 h-3.5 ${settings.alwaysOnTop ? "text-cyan-400" : "text-slate-400"}`} />
                <div>
                  <div className="text-[11px] font-semibold">Always on Top</div>
                  <div className="text-[9px] text-slate-400">Float above games and applications</div>
                </div>
              </div>
              <button
                onClick={() => setAlwaysOnTop(!settings.alwaysOnTop)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  settings.alwaysOnTop ? "bg-cyan-500" : "bg-white/20"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${
                    settings.alwaysOnTop ? "left-5.5" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
                <MousePointer className={`w-3.5 h-3.5 ${settings.clickThrough ? "text-cyan-400" : "text-slate-400"}`} />
                <div>
                  <div className="text-[11px] font-semibold">Click-Through HUD</div>
                  <div className="text-[9px] text-slate-400">Mouse clicks pass through to background</div>
                </div>
              </div>
              <button
                onClick={() => setClickThrough(!settings.clickThrough)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  settings.clickThrough ? "bg-cyan-500" : "bg-white/20"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${
                    settings.clickThrough ? "left-5.5" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 6. Active Spec Modules Chooser */}
          <div className="pt-1 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] text-slate-400 uppercase font-semibold">
                Visible Hardware & Telemetry Specs
              </label>
              <span className="text-[9px] text-slate-500">
                {Object.values(settings.specs).filter((s) => s.enabled).length} Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ALL_SPEC_IDS.map((specId) => {
                const def = SPEC_REGISTRY[specId];
                if (!def) return null;
                const isEnabled = settings.specs[specId]?.enabled ?? true;
                const Icon = def.icon;

                return (
                  <button
                    key={specId}
                    onClick={() => toggleSpec(specId)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isEnabled
                        ? "bg-white/10 border-cyan-400/40 text-slate-900 dark:text-white shadow-xs"
                        : "bg-white/[0.02] border-white/5 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isEnabled ? "text-cyan-400" : "text-slate-500"}`} />
                      <div className="truncate">
                        <div className="text-[11px] font-semibold truncate">{def.label}</div>
                        <div className="text-[9px] text-slate-400 truncate">{def.shortLabel}</div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border ${
                        isEnabled
                          ? "bg-cyan-500 border-cyan-400 text-black"
                          : "border-white/20 bg-transparent text-transparent"
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-black/10 dark:border-white/10 bg-white/5 dark:bg-white/[0.02]">
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-[11px] cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-colors text-[11px] cursor-pointer shadow-md shadow-cyan-500/20"
          >
            <Check className="w-3 h-3" />
            <span>Apply & Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};

