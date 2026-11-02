import React from 'react';
import { Play, Pause, Clock, ShieldCheck, Activity } from 'lucide-react';
import { useMetricsStore } from '../../stores/useMetricsStore';
import { useAppStore } from '../../stores/useAppStore';
import { formatDuration, formatPercentage, formatBytes } from '@sentinel/shared';

export const StatusBar: React.FC = () => {
  const { current, isStreaming, setIsStreaming, intervalMs, setIntervalMs } = useMetricsStore();
  const { overview } = useAppStore();

  return (
    <footer className="h-7 w-full bg-[#0a0d14]/95 border-t border-white/[0.08] flex items-center justify-between px-3 text-[11px] text-slate-400 font-mono select-none z-40">
      {/* Left: Stream Controller & Collector Health */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsStreaming(!isStreaming)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition-colors ${
            isStreaming
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
          }`}
          title={isStreaming ? 'Pause streaming metrics' : 'Resume streaming metrics'}
        >
          {isStreaming ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Pause className="w-2.5 h-2.5" />
              <span>COLLECTOR ACTIVE</span>
            </>
          ) : (
            <>
              <Play className="w-2.5 h-2.5" />
              <span>PAUSED</span>
            </>
          )}
        </button>

        {/* Polling Interval Select */}
        <div className="flex items-center gap-1 text-slate-500">
          <span>Rate:</span>
          <select
            value={intervalMs}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
            className="bg-slate-900 text-slate-300 rounded px-1 py-0.5 border border-white/5 outline-none cursor-pointer"
          >
            <option value={500}>500ms (High)</option>
            <option value={1000}>1000ms (Std)</option>
            <option value={3000}>3000ms (Eco)</option>
          </select>
        </div>
      </div>

      {/* Center: Live Snapshot Quick View */}
      {current && (
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1">
            <span className="text-slate-500">CPU:</span>
            <span className="text-cyan-400 font-semibold">{formatPercentage(current.cpuTotal)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">RAM:</span>
            <span className="text-cyan-400 font-semibold">
              {formatBytes(current.memoryUsedBytes)} / {formatBytes(current.memoryTotalBytes)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Integrity:</span>
            <span className="text-emerald-400 font-semibold">{current.systemIntegrityScore}%</span>
          </div>
        </div>
      )}

      {/* Right: Host Uptime & Privilege */}
      <div className="flex items-center gap-4">
        {overview && (
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Uptime: {formatDuration(overview.uptimeSeconds)}</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          <span>FIM: Engaged</span>
        </div>
      </div>
    </footer>
  );
};
