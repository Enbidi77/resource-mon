import React from 'react';
import {
  Activity,
  Cpu,
  Layers,
  ShieldAlert,
  Wifi,
  HardDrive,
  TrendingUp,
  Server,
  Zap,
} from 'lucide-react';
import { useMetricsStore } from '../stores/useMetricsStore';
import { useAppStore } from '../stores/useAppStore';
import { ArcGauge } from '../components/common/ArcGauge';
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
  const { overview, setCurrentPage, setSelectedAlert } = useAppStore();

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Top Banner KPI Cards (Inspired by Reference Images) */}
      <div className="grid grid-cols-4 gap-4">
        {/* Global Threat Level */}
        <div className="glass-card p-4 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Global Threat Level
            </span>
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">OPTIMAL</div>
          <div className="text-[11px] text-slate-500 mt-1">Defensive EDR Baseline Active</div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
        </div>

        {/* Active Incidents */}
        <div className="glass-card p-4 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Active Security Alerts
            </span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-2">
            {current ? (current.systemIntegrityScore < 80 ? '2' : '0') : '0'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Host FIM & Network Auditor</div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />
        </div>

        {/* System Memory Load */}
        <div className="glass-card p-4 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Memory In Use
            </span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300 mt-2">
            {current ? formatBytes(current.memoryUsedBytes) : '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total {current ? formatBytes(current.memoryTotalBytes) : '--'}
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
        </div>

        {/* Network Throughput */}
        <div className="glass-card p-4 rounded-xl border border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Network Bandwidth
            </span>
            <Wifi className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-300 mt-2">
            {current ? formatSpeed(current.networkDownloadBytesPerSec + current.networkUploadBytesPerSec) : '--'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ↓ {current ? formatSpeed(current.networkDownloadBytesPerSec) : '0 B/s'} • ↑ {current ? formatSpeed(current.networkUploadBytesPerSec) : '0 B/s'}
          </div>
          <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />
        </div>
      </div>

      {/* Main Two-Column Section: Gauges + Real-Time Charts */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: System Health & Integrity Gauges (Exon / SentinelX inspired) */}
        <div className="col-span-4 glass-card p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                System Defensive Health
              </span>
              <button
                onClick={() => setCurrentPage('security')}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300"
              >
                Run Scan
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
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5 text-center">
            <div className="bg-slate-900/40 p-2 rounded-lg">
              <div className="text-[10px] text-slate-500 font-mono">CPU Load</div>
              <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
                {current ? formatPercentage(current.cpuTotal) : '--'}
              </div>
            </div>
            <div className="bg-slate-900/40 p-2 rounded-lg">
              <div className="text-[10px] text-slate-500 font-mono">RAM Load</div>
              <div className="text-sm font-bold text-purple-400 font-mono mt-0.5">
                {current ? formatPercentage(current.memoryPercent) : '--'}
              </div>
            </div>
            <div className="bg-slate-900/40 p-2 rounded-lg">
              <div className="text-[10px] text-slate-500 font-mono">Disk I/O</div>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                {current ? formatSpeed(current.diskReadBytesPerSec + current.diskWriteBytesPerSec) : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Telemetry Trends Chart (Recharts) */}
        <div className="col-span-8 glass-card p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Telemetry & Threat Activity Stream
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                High-frequency Win32 FFI metric sampling (1000ms rolling window)
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-slate-400">CPU %</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span className="text-slate-400">RAM %</span>
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
                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#475569" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
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
        </div>
      </div>

      {/* Connected Subsystems & Quick Navigation */}
      <div className="glass-card p-5 rounded-2xl border border-white/5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Connected Workstation Telemetry Subsystems
          </div>
          <button
            onClick={() => setCurrentPage('processes')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
          >
            View Process Tree →
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div
            onClick={() => setCurrentPage('processes')}
            className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-cyan-400 font-semibold text-xs">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Process Explorer</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Authenticode Verification & PID Trees</div>
          </div>

          <div
            onClick={() => setCurrentPage('network')}
            className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-blue-500/30 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-blue-400 font-semibold text-xs">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span>Network Monitor</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Active Sockets & Interface Traffic</div>
          </div>

          <div
            onClick={() => setCurrentPage('security')}
            className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-emerald-500/30 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-emerald-400 font-semibold text-xs">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>Security Center</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">File Integrity Baselines & Posture</div>
          </div>

          <div
            onClick={() => setCurrentPage('hardware')}
            className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 hover:border-purple-500/30 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-purple-400 font-semibold text-xs">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Hardware Inspector</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">CPU Topology, RAM Slots & Disks</div>
          </div>
        </div>
      </div>
    </div>
  );
};
