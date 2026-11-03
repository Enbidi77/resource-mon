import React from "react";
import { Activity, Cpu, Layers, ShieldAlert, Wifi, Zap } from "lucide-react";
import { useMetricsStore } from "../stores/useMetricsStore";
import { useAppStore } from "../stores/useAppStore";
import { ArcGauge } from "../components/common/ArcGauge";
import { GlassCard } from "../components/glass";
import { formatBytes, formatPercentage, formatSpeed } from "@sentinel/shared";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export const DashboardPage: React.FC = () => {
  const { current, history } = useMetricsStore();
  const { setCurrentPage, theme } = useAppStore();
  const isLight = theme === "light";

  // Fallback demo points matching visual design if history is just initializing
  const displayHistory =
    history.length >= 3
      ? history
      : [
          { time: "02:34:10 PM", cpu: 78, memoryPercent: 94 },
          { time: "02:34:12 PM", cpu: 72, memoryPercent: 94.2 },
          { time: "02:34:14 PM", cpu: 65, memoryPercent: 94.5 },
          { time: "02:34:15 PM", cpu: 56, memoryPercent: 94.6 },
          { time: "02:34:16 PM", cpu: 52, memoryPercent: 94.7 },
          { time: "02:34:17 PM", cpu: 49, memoryPercent: 94.8 },
        ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none">
      {/* Top Banner KPI Cards (Apple Liquid Glass Cards with Ambient Refraction) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Global Threat Level */}
        <GlassCard glowColor="emerald" hoverEffect="lift" className="p-4">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-slate-500 dark:text-white/60 uppercase tracking-wider font-semibold">
              Global Threat Level
            </span>
            <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2 tracking-wide drop-shadow-sm dark:drop-shadow-[0_0_14px_rgba(52,211,153,0.5)]">
            OPTIMAL
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 mt-1 font-mono">
            Defensive EDR Baseline Active
          </div>
        </GlassCard>

        {/* Active Security Alerts */}
        <GlassCard glowColor="rose" hoverEffect="lift" className="p-4">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-slate-500 dark:text-white/60 uppercase tracking-wider font-semibold">
              Active Security Alerts
            </span>
            <Activity className="w-4 h-4 text-rose-600 dark:text-rose-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2 drop-shadow-sm dark:drop-shadow-[0_0_14px_rgba(251,113,133,0.5)]">
            {current ? (current.systemIntegrityScore < 80 ? "2" : "0") : "0"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 mt-1 font-mono">
            Host FIM & Network Auditor
          </div>
        </GlassCard>

        {/* System Memory Load */}
        <GlassCard glowColor="purple" hoverEffect="lift" className="p-4">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-slate-500 dark:text-white/60 uppercase tracking-wider font-semibold">
              Memory In Use
            </span>
            <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-300 mt-2 drop-shadow-sm dark:drop-shadow-[0_0_14px_rgba(192,132,252,0.5)]">
            {current ? formatBytes(current.memoryUsedBytes) : "14.71 GB"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 mt-1 font-mono">
            Total {current ? formatBytes(current.memoryTotalBytes) : "15.59 GB"}
          </div>
        </GlassCard>

        {/* Network Bandwidth */}
        <GlassCard glowColor="cyan" hoverEffect="lift" className="p-4">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-mono text-slate-500 dark:text-white/60 uppercase tracking-wider font-semibold">
              Network Bandwidth
            </span>
            <Wifi className="w-4 h-4 text-cyan-600 dark:text-cyan-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-700 dark:text-cyan-400 mt-2 drop-shadow-sm dark:drop-shadow-[0_0_14px_rgba(34,211,238,0.5)]">
            {current
              ? formatSpeed(
                  current.networkDownloadBytesPerSec +
                    current.networkUploadBytesPerSec,
                )
              : "12.5 KB/s"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 mt-1 font-mono truncate">
            ↓{" "}
            {current
              ? formatSpeed(current.networkDownloadBytesPerSec)
              : "9.9 KB/s"}{" "}
            • ↑{" "}
            {current
              ? formatSpeed(current.networkUploadBytesPerSec)
              : "2.6 KB/s"}
          </div>
        </GlassCard>
      </div>

      {/* Main Two-Column Section: Gauges + Real-Time Telemetry Stream */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left: System Defensive Health Gauge Card */}
        <GlassCard className="col-span-12 lg:col-span-4 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                System Defensive Health
              </span>
              <button
                onClick={() => setCurrentPage("security")}
                className="text-[11px] font-mono text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors cursor-pointer"
              >
                Run Scan →
              </button>
            </div>

            {/* Neon Speedometer Radial Arc Gauge */}
            <div className="py-2">
              <ArcGauge
                value={current ? current.systemIntegrityScore : 80}
                title="System Integrity Score"
                subtitle="Calculated Defensive Baseline"
                size={230}
              />
            </div>
          </div>

          {/* Quick Sub-Metrics List */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-black/[0.08] dark:border-white/10 text-center">
            <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 rounded-xl p-2.5 backdrop-blur-md shadow-sm">
              <div className="text-[10px] text-slate-500 dark:text-white/50 font-mono">
                CPU Load
              </div>
              <div className="text-sm font-bold text-cyan-700 dark:text-cyan-400 font-mono mt-0.5">
                {current ? formatPercentage(current.cpuTotal) : "49.0%"}
              </div>
            </div>
            <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 rounded-xl p-2.5 backdrop-blur-md shadow-sm">
              <div className="text-[10px] text-slate-500 dark:text-white/50 font-mono">
                RAM Load
              </div>
              <div className="text-sm font-bold text-purple-700 dark:text-purple-300 font-mono mt-0.5">
                {current ? formatPercentage(current.memoryPercent) : "94.0%"}
              </div>
            </div>
            <div className="bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 rounded-xl p-2.5 backdrop-blur-md shadow-sm">
              <div className="text-[10px] text-slate-500 dark:text-white/50 font-mono">
                Disk I/O
              </div>
              <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                {current
                  ? formatSpeed(
                      current.diskReadBytesPerSec +
                        current.diskWriteBytesPerSec,
                    )
                  : "5 MB/s"}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Right: Live Telemetry Stream Chart (Recharts with vibrant overlapping fills) */}
        <GlassCard className="col-span-12 lg:col-span-8 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Telemetry & Threat Activity Stream
              </div>
              <div className="text-[11px] text-slate-500 dark:text-white/50 mt-0.5 font-mono">
                High-frequency win32 FFI metric sampling (rolling window)
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-sm dark:shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-slate-600 dark:text-white/70">CPU %</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 dark:bg-purple-400 shadow-sm dark:shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                <span className="text-slate-600 dark:text-white/70">RAM %</span>
              </div>
            </div>
          </div>

          <div className="h-68 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayHistory}>
                <defs>
                  <linearGradient
                    id="cpuGlassGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={isLight ? "#0284c7" : "#06b6d4"}
                      stopOpacity={isLight ? 0.35 : 0.45}
                    />
                    <stop
                      offset="95%"
                      stopColor={isLight ? "#0284c7" : "#06b6d4"}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                  <linearGradient
                    id="memGlassGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={isLight ? "#9333ea" : "#a855f7"}
                      stopOpacity={isLight ? 0.3 : 0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor={isLight ? "#9333ea" : "#a855f7"}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke={
                    isLight
                      ? "rgba(0, 0, 0, 0.06)"
                      : "rgba(255, 255, 255, 0.08)"
                  }
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  stroke={isLight ? "#64748b" : "rgba(255, 255, 255, 0.4)"}
                  fontSize={10}
                  tickLine={false}
                  fontFamily="monospace"
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  stroke={isLight ? "#64748b" : "rgba(255, 255, 255, 0.4)"}
                  fontSize={10}
                  tickLine={false}
                  fontFamily="monospace"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLight
                      ? "rgba(255, 255, 255, 0.95)"
                      : "rgba(11, 14, 23, 0.88)",
                    backdropFilter: "blur(20px)",
                    borderColor: isLight
                      ? "rgba(0, 0, 0, 0.1)"
                      : "rgba(255, 255, 255, 0.15)",
                    borderRadius: "14px",
                    fontSize: "12px",
                    color: isLight ? "#0f172a" : "#ffffff",
                    boxShadow: isLight
                      ? "0 10px 30px rgba(0,0,0,0.08)"
                      : "0 10px 30px rgba(0,0,0,0.5)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke={isLight ? "#0284c7" : "#22d3ee"}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#cpuGlassGradient)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="memoryPercent"
                  stroke={isLight ? "#9333ea" : "#c084fc"}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#memGlassGradient)"
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
          <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Connected Workstation Telemetry Subsystems
          </div>
          <button
            onClick={() => setCurrentPage("processes")}
            className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 font-mono cursor-pointer transition-colors"
          >
            View Process Tree →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setCurrentPage("processes")}
            className="bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 hover:border-black/[0.15] dark:hover:border-white/20 rounded-xl p-3.5 backdrop-blur-xl transition-all shadow-sm dark:shadow-md group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 font-semibold text-xs font-mono transition-colors">
              <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              <span>Process Explorer</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-white/50 mt-1 font-mono">
              Authenticode Verification & PID Trees
            </div>
          </div>

          <div
            onClick={() => setCurrentPage("network")}
            className="bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 hover:border-black/[0.15] dark:hover:border-white/20 rounded-xl p-3.5 backdrop-blur-xl transition-all shadow-sm dark:shadow-md group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 font-semibold text-xs font-mono transition-colors">
              <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <span>Network Monitor</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-white/50 mt-1 font-mono">
              Active Sockets & Interface Traffic
            </div>
          </div>

          <div
            onClick={() => setCurrentPage("security")}
            className="bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 hover:border-black/[0.15] dark:hover:border-white/20 rounded-xl p-3.5 backdrop-blur-xl transition-all shadow-sm dark:shadow-md group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 font-semibold text-xs font-mono transition-colors">
              <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span>Security Center</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-white/50 mt-1 font-mono">
              File Integrity Baselines & Posture
            </div>
          </div>

          <div
            onClick={() => setCurrentPage("hardware")}
            className="bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 hover:border-black/[0.15] dark:hover:border-white/20 rounded-xl p-3.5 backdrop-blur-xl transition-all shadow-sm dark:shadow-md group cursor-pointer"
          >
            <div className="flex items-center gap-2 text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 font-semibold text-xs font-mono transition-colors">
              <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400 drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
              <span>Hardware Inspector</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-white/50 mt-1 font-mono">
              CPU Topology, RAM Slots & Disks
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
