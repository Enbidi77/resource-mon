import React from 'react';
import { Play, Pause, Clock, ShieldCheck } from 'lucide-react';
import { useMetricsStore } from '../../stores/useMetricsStore';
import { useAppStore } from '../../stores/useAppStore';
import { formatDuration, formatPercentage, formatBytes } from '@sentinel/shared';
import { GlassBadge } from '../glass';

export const StatusBar: React.FC = () => {
  const { current, isStreaming, setIsStreaming, intervalMs, setIntervalMs } = useMetricsStore();
  const { overview } = useAppStore();

  return (
    <footer className="h-8 w-full bg-[var(--glass-surface)] backdrop-blur-xl backdrop-saturate-180 border-t border-[var(--glass-border)] flex items-center justify-between px-3 text-[11px] text-[var(--text-secondary)] font-mono select-none z-40 shadow-[var(--glass-specular)]">
      {/* Left: Stream Controller & Collector Health */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setIsStreaming(!isStreaming)}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
            isStreaming
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
          }`}
          title={isStreaming ? 'Pause streaming metrics' : 'Resume streaming metrics'}
        >
          {isStreaming ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Pause className="w-2.5 h-2.5" />
              <span className="text-[10px] font-semibold">COLLECTOR ACTIVE</span>
            </>
          ) : (
            <>
              <Play className="w-2.5 h-2.5" />
              <span className="text-[10px] font-semibold">PAUSED</span>
            </>
          )}
        </button>

        {/* Polling Interval Select */}
        <div className="flex items-center gap-1 text-[var(--text-tertiary)]">
          <span>Rate:</span>
          <select
            value={intervalMs}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
            className="bg-[var(--glass-surface-subtle)] text-[var(--text-primary)] rounded-md px-1.5 py-0.5 border border-[var(--glass-border-subtle)] outline-none cursor-pointer"
          >
            <option value={500}>500ms (High)</option>
            <option value={1000}>1000ms (Std)</option>
            <option value={3000}>3000ms (Eco)</option>
          </select>
        </div>
      </div>

      {/* Center: Live Snapshot Quick View */}
      {current && (
        <div className="hidden md:flex items-center gap-5 text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-tertiary)]">CPU:</span>
            <span className="text-cyan-400 font-semibold">{formatPercentage(current.cpuTotal)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-tertiary)]">RAM:</span>
            <span className="text-cyan-400 font-semibold">
              {formatBytes(current.memoryUsedBytes)} / {formatBytes(current.memoryTotalBytes)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-tertiary)]">Integrity:</span>
            <span className="text-emerald-400 font-semibold">{current.systemIntegrityScore}%</span>
          </div>
        </div>
      )}

      {/* Right: Host Uptime & Privilege */}
      <div className="flex items-center gap-3">
        {overview && (
          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
            <span>Uptime: {formatDuration(overview.uptimeSeconds)}</span>
          </div>
        )}

        <GlassBadge variant="success" size="sm" dot>
          FIM Active
        </GlassBadge>
      </div>
    </footer>
  );
};
