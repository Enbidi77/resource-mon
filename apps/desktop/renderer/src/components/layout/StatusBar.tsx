import React from "react";
import { Play, Pause, Clock } from "lucide-react";
import { useMetricsStore } from "../../stores/useMetricsStore";
import { useAppStore } from "../../stores/useAppStore";
import {
  formatDuration,
  formatPercentage,
  formatBytes,
} from "@sentinel/shared";

export const StatusBar: React.FC = () => {
  const { current, isStreaming, setIsStreaming, intervalMs, setIntervalMs } =
    useMetricsStore();
  const { overview } = useAppStore();

  return (
    <footer className="h-8 w-full bg-white/70 dark:bg-black/25 backdrop-blur-3xl backdrop-saturate-200 border-t border-black/[0.08] dark:border-white/10 flex items-center justify-between px-3 text-[11px] text-slate-600 dark:text-white/60 font-mono select-none z-40 shadow-sm">
      {/* Left: Stream Controller & Collector Health */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsStreaming(!isStreaming)}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
            isStreaming
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-400/30 shadow-sm dark:shadow-[0_0_10px_rgba(16,185,129,0.25)] hover:bg-emerald-500/25"
              : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 dark:border-amber-400/30 shadow-sm dark:shadow-[0_0_10px_rgba(245,158,11,0.25)] hover:bg-amber-500/25"
          }`}
          title={
            isStreaming ? "Pause streaming metrics" : "Resume streaming metrics"
          }
        >
          {isStreaming ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <Pause className="w-2.5 h-2.5" />
              <span className="text-[10px] font-semibold">
                COLLECTOR ACTIVE
              </span>
            </>
          ) : (
            <>
              <Play className="w-2.5 h-2.5" />
              <span className="text-[10px] font-semibold">PAUSED</span>
            </>
          )}
        </button>

        {/* Polling Interval Select */}
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/50 text-[10px]">
          <span>Rate:</span>
          <select
            value={intervalMs}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
            className="bg-black/[0.04] dark:bg-white/[0.05] text-slate-800 dark:text-white/80 rounded-md px-1.5 py-0.5 border border-black/[0.08] dark:border-white/10 outline-none cursor-pointer hover:border-black/[0.15] dark:hover:border-white/20 transition-colors"
          >
            <option
              value={500}
              className="bg-white dark:bg-[#0b0e17] text-slate-900 dark:text-white"
            >
              500ms (High)
            </option>
            <option
              value={1000}
              className="bg-white dark:bg-[#0b0e17] text-slate-900 dark:text-white"
            >
              1000ms (Std)
            </option>
            <option
              value={3000}
              className="bg-white dark:bg-[#0b0e17] text-slate-900 dark:text-white"
            >
              3000ms (Eco)
            </option>
          </select>
        </div>
      </div>

      {/* Center: Live Snapshot Quick View */}
      {current && (
        <div className="hidden md:flex items-center gap-6 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-white/40">CPU:</span>
            <span className="text-cyan-700 dark:text-cyan-400 font-semibold drop-shadow-sm dark:drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]">
              {formatPercentage(current.cpuTotal)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-white/40">RAM:</span>
            <span className="text-cyan-700 dark:text-cyan-400 font-semibold drop-shadow-sm dark:drop-shadow-[0_0_6px_rgba(34,211,238,0.4)]">
              {formatBytes(current.memoryUsedBytes)} /{" "}
              {formatBytes(current.memoryTotalBytes)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-white/40">
              Integrity:
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold drop-shadow-sm dark:drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]">
              {current.systemIntegrityScore}%
            </span>
          </div>
        </div>
      )}

      {/* Right: Host Uptime & Privilege */}
      <div className="flex items-center gap-3">
        {overview && (
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-white/60">
            <Clock className="w-3 h-3 text-slate-400 dark:text-white/40" />
            <span>Uptime: {formatDuration(overview.uptimeSeconds)}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold shadow-sm dark:shadow-[0_0_10px_rgba(16,185,129,0.25)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          <span>EDR ALIVE</span>
        </div>
      </div>
    </footer>
  );
};
