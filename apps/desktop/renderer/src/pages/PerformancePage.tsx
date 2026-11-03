import React from 'react';
import { useMetricsStore } from '../stores/useMetricsStore';
import { useAppStore } from '../stores/useAppStore';
import { Cpu, Zap, HardDrive, Wifi, Activity } from 'lucide-react';
import { GlassCard, GlassSurface, GlassBadge } from '../components/glass';
import { formatBytes, formatPercentage, formatSpeed } from '@sentinel/shared';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const PerformancePage: React.FC = () => {
  const { current, history } = useMetricsStore();
  const { overview } = useAppStore();

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Performance Workstation Monitor
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Dedicated processor topology, physical RAM allocation, GPU acceleration, and disk I/O
          </p>
        </div>
      </div>

      {/* Row 1: CPU Breakdown & Per-Core Utilization */}
      <div className="grid grid-cols-12 gap-6">
        <GlassCard className="col-span-12 lg:col-span-6 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)] font-mono">
                  {overview?.cpuBrand || 'System CPU'}
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                  {overview?.cpuCores || 8} Logical Cores • {overview?.cpuBaseSpeedGhz || 2.5} GHz Base
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-400">
              {current ? formatPercentage(current.cpuTotal) : '--'}
            </div>
          </div>

          {/* Per-Core Bars Grid */}
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
              Logical Processor Topology
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-48 overflow-y-auto pr-1">
              {(current?.cpuCores || []).map((core) => (
                <div key={core.coreIndex} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-[var(--text-secondary)]">
                    <span>Core #{core.coreIndex}</span>
                    <span className="text-cyan-400 font-semibold">{core.loadPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[var(--glass-surface-subtle)] rounded-full overflow-hidden border border-[var(--glass-border-subtle)]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        core.loadPercent > 80
                          ? 'bg-red-400'
                          : core.loadPercent > 50
                          ? 'bg-amber-400'
                          : 'bg-cyan-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, core.loadPercent))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Row 1 Right: Memory Allocation */}
        <GlassCard className="col-span-12 lg:col-span-6 p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)] font-mono">Physical RAM</div>
                <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                  Total Capacity: {current ? formatBytes(current.memoryTotalBytes) : '--'}
                </div>
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-purple-400">
              {current ? formatPercentage(current.memoryPercent) : '--'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <GlassSurface elevation="subtle" rounded="xl" className="p-3">
              <div className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">In Use</div>
              <div className="text-base font-bold font-mono text-purple-400 mt-1">
                {current ? formatBytes(current.memoryUsedBytes) : '--'}
              </div>
            </GlassSurface>
            <GlassSurface elevation="subtle" rounded="xl" className="p-3">
              <div className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase">Available</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                {current ? formatBytes(current.memoryFreeBytes) : '--'}
              </div>
            </GlassSurface>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-mono text-[var(--text-secondary)]">
              <span>Memory Pressure Status</span>
              <GlassBadge variant="success" size="sm" dot>
                Stable
              </GlassBadge>
            </div>
            <div className="h-2 w-full bg-[var(--glass-surface-subtle)] rounded-full overflow-hidden flex border border-[var(--glass-border-subtle)]">
              <div
                className="bg-purple-500 transition-all duration-300"
                style={{ width: `${current ? current.memoryPercent : 40}%` }}
              />
              <div
                className="bg-slate-700/40 transition-all duration-300"
                style={{ width: `${100 - (current ? current.memoryPercent : 40)}%` }}
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Row 2: Live Historical Network & Disk Charts */}
      <div className="grid grid-cols-12 gap-6">
        {/* Network Bandwidth History */}
        <GlassCard className="col-span-12 lg:col-span-6 p-5 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-bold text-[var(--text-primary)] font-mono">Live Network Bandwidth</span>
            </div>
            <div className="text-xs font-mono text-blue-400">
              ↓ {current ? formatSpeed(current.networkDownloadBytesPerSec) : '--'}
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="netRxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(16px)',
                    borderColor: 'rgba(255,255,255,0.15)',
                    fontSize: '11px',
                    color: '#f8fafc',
                    borderRadius: '10px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="netRxKb"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#netRxGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Disk I/O History */}
        <GlassCard className="col-span-12 lg:col-span-6 p-5 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-[var(--text-primary)] font-mono">Live Disk Read / Write</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400">↓ {current ? formatSpeed(current.diskReadBytesPerSec) : '--'}</span>
              <span className="text-cyan-400">↑ {current ? formatSpeed(current.diskWriteBytesPerSec) : '--'}</span>
            </div>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="diskReadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="diskWriteGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(16px)',
                    borderColor: 'rgba(255,255,255,0.15)',
                    fontSize: '11px',
                    color: '#f8fafc',
                    borderRadius: '10px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="diskReadKb"
                  name="Read (KB/s)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#diskReadGrad)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="diskWriteKb"
                  name="Write (KB/s)"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#diskWriteGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
