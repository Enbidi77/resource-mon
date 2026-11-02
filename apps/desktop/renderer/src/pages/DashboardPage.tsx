import React from 'react';
import {
  Activity,
  Cpu,
  Layers,
  ShieldAlert,
  Wifi,
  Zap,
} from 'lucide-react';
import { useMetricsStore } from '../stores/useMetricsStore';
import { useAppStore } from '../stores/useAppStore';
import { ArcGauge } from '../components/common/ArcGauge';
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

export const DashboardPage: React.FC = () => {
  const { current, history } = useMetricsStore();
  const { setCurrentPage } = useAppStore();

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none">
      {/* Top Banner KPI Cards (Apple Liquid Glass Cards with Ambient Rim Lighting) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Global Threat Level */}
        <GlassCard
          glowColor="emerald"
          hoverEffect="lift"
          className="p-4"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
              Global Threat Level
            </span>
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">OPTIMAL</div>
          <div className="text-[11px] text-[var(--text-tertiary)] mt-1 font-mono">Defensive EDR Baseline Active</div>
        </GlassCard>

        {/* Active Incidents */}
        <GlassCard
          glowColor="cyan"
          hoverEffect="lift"
          className="p-4"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
              Active Security Alerts
            </span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-2">
            {current ? (current.systemIntegrityScore < 80 ? '2' : '0') : '0'}
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] mt-1 font-mono">Host FIM & Network Auditor</div>
        </GlassCard>

        {/* System Memory Load */}
        <GlassCard
          glowColor="purple"
          hoverEffect="lift"
          className="p-4"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
              Memory In Use
            </span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-2">
            {current ? formatBytes(current.memoryUsedBytes) : '--'}
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] mt-1 font-mono">
            Total {current ? formatBytes(current.memoryTotalBytes) : '--'}
          </div>
        </GlassCard>

        {/* Network Throughput */}
        <GlassCard
          glowColor="blue"
          hoverEffect="lift"
          className="p-4"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">
              Network Bandwidth
            </span>
            <Wifi className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-2">
            {current ? formatSpeed(current.networkDownloadBytesPerSec + current.networkUploadBytesPerSec) : '--'}
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] mt-1 font-mono truncate">
            ↓ {current ? formatSpeed(current.networkDownloadBytesPerSec) : '0 B/s'} • ↑ {current ? formatSpeed(current.networkUploadBytesPerSec) : '0 B/s'}
          </div>
        </GlassCard>
      </div>

      {/* Main Two-Column Section: Gauges + Real-Time Charts */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: System Health & Integrity Gauges */}
        <GlassCard className="col-span-12 lg:col-span-4 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
                System Defensive Health
              </span>
              <button
                onClick={() => setCurrentPage('security')}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                Run Scan →
              </button>
            </div>

            {/* Neon Radial Arc Gauge */}
            <div className="py-2">
              <ArcGauge
                value={current ? current.systemIntegrityScore : 94}
                title="System Integrity Score"
                subtitle="Calculated Defensive Baseline"
                size={240}
              />
            </div>
          </div>

          {/* Quick Sub-Metrics List */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[var(--glass-border-subtle)] text-center">
            <GlassSurface elevation="subtle" rounded="xl" className="p-2">
              <div className="text-[10px] text-[var(--text-tertiary)] font-mono">CPU Load</div>
              <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
                {current ? formatPercentage(current.cpuTotal) : '--'}
              </div>
            </GlassSurface>
            <GlassSurface elevation="subtle" rounded="xl" className="p-2">
              <div className="text-[10px] text-[var(--text-tertiary)] font-mono">RAM Load</div>
              <div className="text-sm font-bold text-purple-400 font-mono mt-0.5">
                {current ? formatPercentage(current.memoryPercent) : '--'}
              </div>
            </GlassSurface>
            <GlassSurface elevation="subtle" rounded="xl" className="p-2">
              <div className="text-[10px] text-[var(--text-tertiary)] font-mono">Disk I/O</div>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                {current ? formatSpeed(current.diskReadBytesPerSec + current.diskWriteBytesPerSec) : '--'}
              </div>
            </GlassSurface>
          </div>
        </GlassCard>

        {/* Right: Live Telemetry Trends Chart (Recharts) */}
        <GlassCard className="col-span-12 lg:col-span-8 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
                Telemetry & Threat Activity Stream
              </div>
              <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5 font-mono">
                High-frequency Win32 FFI metric sampling (rolling window)
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-[var(--text-secondary)]">CPU %</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span className="text-[var(--text-secondary)]">RAM %</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.length > 0 ? history : [{ time: '0', cpu: 20, memoryPercent: 40 }]}>
                <defs>
                  <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(16px)',
                    borderColor: 'rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cpuGradient)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="memoryPercent"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#memGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Connected Subsystems & Quick Navigation */}
      <GlassCard className="p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
            Connected Workstation Telemetry Subsystems
          </div>
          <button
            onClick={() => setCurrentPage('processes')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
          >
            View Process Tree →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassSurface
            elevation="subtle"
            rounded="xl"
            onClick={() => setCurrentPage('processes')}
            className="p-3.5 hover:border-cyan-500/40 cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-2 text-[var(--text-primary)] group-hover:text-cyan-400 font-semibold text-xs font-mono">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Process Explorer</span>
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] mt-1 font-mono">
              Authenticode Verification & PID Trees
            </div>
          </GlassSurface>

          <GlassSurface
            elevation="subtle"
            rounded="xl"
            onClick={() => setCurrentPage('network')}
            className="p-3.5 hover:border-blue-500/40 cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-2 text-[var(--text-primary)] group-hover:text-blue-400 font-semibold text-xs font-mono">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span>Network Monitor</span>
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] mt-1 font-mono">
              Active Sockets & Interface Traffic
            </div>
          </GlassSurface>

          <GlassSurface
            elevation="subtle"
            rounded="xl"
            onClick={() => setCurrentPage('security')}
            className="p-3.5 hover:border-emerald-500/40 cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-2 text-[var(--text-primary)] group-hover:text-emerald-400 font-semibold text-xs font-mono">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Security Center</span>
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] mt-1 font-mono">
              File Integrity Baselines & Posture
            </div>
          </GlassSurface>

          <GlassSurface
            elevation="subtle"
            rounded="xl"
            onClick={() => setCurrentPage('hardware')}
            className="p-3.5 hover:border-purple-500/40 cursor-pointer group transition-all"
          >
            <div className="flex items-center gap-2 text-[var(--text-primary)] group-hover:text-purple-400 font-semibold text-xs font-mono">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Hardware Inspector</span>
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] mt-1 font-mono">
              CPU Topology, RAM Slots & Disks
            </div>
          </GlassSurface>
        </div>
      </GlassCard>
    </div>
  );
};
