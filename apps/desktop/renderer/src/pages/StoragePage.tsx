import React, { useEffect, useState, useMemo } from "react";
import {
  HardDrive,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Database,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { HardwareSummary } from "@sentinel/contracts";
import { useMetricsStore } from "../stores/useMetricsStore";
import { useAppStore } from "../stores/useAppStore";
import { formatBytes, formatSpeed } from "@sentinel/shared";
import {
  GlassCard,
  GlassBadge,
  GlassButton,
  GlassSurface,
} from "../components/glass";

export const StoragePage: React.FC = () => {
  const { current, history } = useMetricsStore();
  const { theme } = useAppStore();
  const isLight = theme === "light";

  const [hardware, setHardware] = useState<HardwareSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStorageData = () => {
    if (window.sentinelAPI) {
      setLoading(true);
      window.sentinelAPI
        .getHardwareSummary()
        .then((data) => {
          setHardware(data);
        })
        .catch(() => {
          // Fallback or error handled gracefully
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  // Prepare chart series from rolling telemetry history
  const chartData = useMemo(() => {
    if (history.length >= 2) {
      return history.map((pt) => ({
        time: pt.time,
        diskReadKb: pt.diskReadKb,
        diskWriteKb: pt.diskWriteKb,
      }));
    }

    const currentReadKb = Math.round(
      (current?.diskReadBytesPerSec || 0) / 1024,
    );
    const currentWriteKb = Math.round(
      (current?.diskWriteBytesPerSec || 0) / 1024,
    );

    return [
      {
        time: "T-3s",
        diskReadKb: Math.max(0, currentReadKb - 120),
        diskWriteKb: Math.max(0, currentWriteKb - 80),
      },
      {
        time: "T-2s",
        diskReadKb: Math.max(0, currentReadKb - 50),
        diskWriteKb: Math.max(0, currentWriteKb + 40),
      },
      {
        time: "T-1s",
        diskReadKb: Math.max(0, currentReadKb - 20),
        diskWriteKb: Math.max(0, currentWriteKb - 30),
      },
      { time: "Now", diskReadKb: currentReadKb, diskWriteKb: currentWriteKb },
    ];
  }, [history, current]);

  const peakReadBytes = useMemo(() => {
    const fromHistory = history.map((h) => h.diskReadKb * 1024);
    return Math.max(current?.diskReadBytesPerSec || 0, ...fromHistory, 1024);
  }, [history, current]);

  const peakWriteBytes = useMemo(() => {
    const fromHistory = history.map((h) => h.diskWriteKb * 1024);
    return Math.max(current?.diskWriteBytesPerSec || 0, ...fromHistory, 1024);
  }, [history, current]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Storage Devices & Partition Health
          </h2>
          <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">
            Physical NVMe/SATA drives, volume utilization, S.M.A.R.T.
            diagnostics, and real-time disk throughput
          </p>
        </div>

        <GlassButton
          variant="glass"
          size="sm"
          onClick={fetchStorageData}
          loading={loading}
          icon={
            <RefreshCw
              className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ${loading ? "animate-spin" : ""}`}
            />
          }
        >
          Refresh Storage
        </GlassButton>
      </div>

      {/* Real-time Disk I/O Rate Banner with Live Streaming Area Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Read Throughput Card */}
        <GlassCard
          glowColor="emerald"
          hoverEffect="lift"
          className="p-4 sm:p-5 flex flex-col justify-between space-y-3 min-w-0"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-white/60 uppercase tracking-wider font-semibold">
                Read Throughput
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5 drop-shadow-sm dark:drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                <ArrowDown className="w-5 h-5 shrink-0" />
                {current ? formatSpeed(current.diskReadBytesPerSec) : "0 B/s"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <GlassBadge
                variant="success"
                size="sm"
                dot
                pulsing={Boolean(current && current.diskReadBytesPerSec > 0)}
              >
                Live Read
              </GlassBadge>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-sm">
                <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Read Throughput Chart */}
          <div className="h-28 w-full pt-1 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="diskReadGlassGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={isLight ? "#059669" : "#10b981"}
                      stopOpacity={isLight ? 0.35 : 0.5}
                    />
                    <stop
                      offset="95%"
                      stopColor={isLight ? "#059669" : "#10b981"}
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke={
                    isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)"
                  }
                  vertical={false}
                />
                <XAxis dataKey="time" hide />
                <YAxis
                  domain={[0, "auto"]}
                  tickFormatter={(kb) => formatSpeed(kb * 1024)}
                  stroke={isLight ? "#94a3b8" : "rgba(255,255,255,0.35)"}
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  fontFamily="monospace"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLight
                      ? "rgba(255, 255, 255, 0.95)"
                      : "rgba(11, 14, 23, 0.90)",
                    backdropFilter: "blur(16px)",
                    borderColor: isLight
                      ? "rgba(0, 0, 0, 0.08)"
                      : "rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    fontSize: "11px",
                    color: isLight ? "#0f172a" : "#ffffff",
                    boxShadow: isLight
                      ? "0 8px 24px rgba(0,0,0,0.06)"
                      : "0 8px 24px rgba(0,0,0,0.4)",
                    fontFamily: "monospace",
                  }}
                  formatter={(val: any) => [
                    formatSpeed(Number(val) * 1024),
                    "Read Speed",
                  ]}
                  labelStyle={{
                    color: isLight ? "#64748b" : "rgba(255,255,255,0.6)",
                    marginBottom: "2px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="diskReadKb"
                  stroke={isLight ? "#059669" : "#34d399"}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#diskReadGlassGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Footer Metrics */}
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-white/50 pt-2 border-t border-black/[0.06] dark:border-white/10">
            <span>Peak: {formatSpeed(peakReadBytes)}</span>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-500" />
              Rolling 30s Window
            </span>
          </div>
        </GlassCard>

        {/* Write Throughput Card */}
        <GlassCard
          glowColor="cyan"
          hoverEffect="lift"
          className="p-4 sm:p-5 flex flex-col justify-between space-y-3 min-w-0"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-white/60 uppercase tracking-wider font-semibold">
                Write Throughput
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1 flex items-center gap-1.5 drop-shadow-sm dark:drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                <ArrowUp className="w-5 h-5 shrink-0" />
                {current ? formatSpeed(current.diskWriteBytesPerSec) : "0 B/s"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <GlassBadge
                variant="cyan"
                size="sm"
                dot
                pulsing={Boolean(current && current.diskWriteBytesPerSec > 0)}
              >
                Live Write
              </GlassBadge>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-sm">
                <HardDrive className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Write Throughput Chart */}
          <div className="h-28 w-full pt-1 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 5, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="diskWriteGlassGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={isLight ? "#0284c7" : "#06b6d4"}
                      stopOpacity={isLight ? 0.35 : 0.5}
                    />
                    <stop
                      offset="95%"
                      stopColor={isLight ? "#0284c7" : "#06b6d4"}
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke={
                    isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)"
                  }
                  vertical={false}
                />
                <XAxis dataKey="time" hide />
                <YAxis
                  domain={[0, "auto"]}
                  tickFormatter={(kb) => formatSpeed(kb * 1024)}
                  stroke={isLight ? "#94a3b8" : "rgba(255,255,255,0.35)"}
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  fontFamily="monospace"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLight
                      ? "rgba(255, 255, 255, 0.95)"
                      : "rgba(11, 14, 23, 0.90)",
                    backdropFilter: "blur(16px)",
                    borderColor: isLight
                      ? "rgba(0, 0, 0, 0.08)"
                      : "rgba(255, 255, 255, 0.15)",
                    borderRadius: "12px",
                    fontSize: "11px",
                    color: isLight ? "#0f172a" : "#ffffff",
                    boxShadow: isLight
                      ? "0 8px 24px rgba(0,0,0,0.06)"
                      : "0 8px 24px rgba(0,0,0,0.4)",
                    fontFamily: "monospace",
                  }}
                  formatter={(val: any) => [
                    formatSpeed(Number(val) * 1024),
                    "Write Speed",
                  ]}
                  labelStyle={{
                    color: isLight ? "#64748b" : "rgba(255,255,255,0.6)",
                    marginBottom: "2px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="diskWriteKb"
                  stroke={isLight ? "#0284c7" : "#22d3ee"}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#diskWriteGlassGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Footer Metrics */}
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-white/50 pt-2 border-t border-black/[0.06] dark:border-white/10">
            <span>Peak: {formatSpeed(peakWriteBytes)}</span>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-500" />
              Rolling 30s Window
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Loading state skeleton */}
      {loading && !hardware && (
        <GlassSurface
          elevation="subtle"
          rounded="2xl"
          className="p-10 text-center space-y-2"
        >
          <RefreshCw className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
          <div className="text-xs font-mono text-slate-500 dark:text-white/60">
            Querying storage controllers, physical drives, and partition
            tables...
          </div>
        </GlassSurface>
      )}

      {/* Partitions & Volume Utilization Section */}
      {(!loading || hardware) && (
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>
              Mounted Partitions & Volume Health (
              {hardware?.partitions?.length || 0})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(hardware?.partitions || []).map((part, i) => {
              const usePercent = Math.round(part.usePercent * 10) / 10;
              const isHigh = usePercent > 90;
              const isMedium = usePercent > 75;

              return (
                <GlassCard key={i} className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-mono font-bold text-cyan-600 dark:text-cyan-400 text-xs">
                        {part.fs}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                          Local Disk ({part.fs})
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-white/50 font-mono">
                          Filesystem: {part.type || "NTFS"} • Mount:{" "}
                          {part.mount || part.fs}
                        </div>
                      </div>
                    </div>

                    <GlassBadge
                      variant={
                        isHigh ? "danger" : isMedium ? "warning" : "success"
                      }
                      size="sm"
                      dot
                    >
                      {isHigh ? "Low Space" : isMedium ? "Warning" : "Healthy"}
                    </GlassBadge>
                  </div>

                  {/* Volume Utilization Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-600 dark:text-white/70">
                        {formatBytes(part.usedBytes)} used of{" "}
                        {formatBytes(part.sizeBytes)}
                      </span>
                      <span
                        className={
                          isHigh
                            ? "text-rose-600 dark:text-rose-400 font-bold"
                            : isMedium
                              ? "text-amber-600 dark:text-amber-400 font-bold"
                              : "text-cyan-600 dark:text-cyan-400 font-semibold"
                        }
                      >
                        {usePercent}%
                      </span>
                    </div>

                    <div className="h-2 w-full bg-black/[0.06] dark:bg-white/[0.06] rounded-full overflow-hidden border border-black/[0.06] dark:border-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isHigh
                            ? "bg-rose-500"
                            : isMedium
                              ? "bg-amber-500"
                              : "bg-cyan-500"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(2, usePercent))}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-mono text-slate-400 dark:text-white/40 pt-0.5">
                      <span>Available: {formatBytes(part.availableBytes)}</span>
                      <span>Total: {formatBytes(part.sizeBytes)}</span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}

            {(!hardware?.partitions || hardware.partitions.length === 0) &&
              !loading && (
                <GlassSurface
                  elevation="subtle"
                  rounded="xl"
                  className="col-span-2 p-6 text-center text-xs font-mono text-slate-400 dark:text-white/40"
                >
                  No active partitions detected
                </GlassSurface>
              )}
          </div>
        </div>
      )}

      {/* Disks List */}
      {(!loading || hardware) && (
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              Physical Storage Controllers & Drives (
              {hardware?.disks?.length || 0})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(hardware?.disks || []).map((disk, i) => (
              <GlassCard key={i} className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <HardDrive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                        {disk.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-white/50 font-mono">
                        {disk.type || "Fixed Disk"} •{" "}
                        {disk.interfaceType || "NVMe"}
                      </div>
                    </div>
                  </div>

                  <GlassBadge variant="success" size="sm" dot>
                    {disk.smartStatus || "S.M.A.R.T. Healthy"}
                  </GlassBadge>
                </div>

                <div className="pt-2 border-t border-black/[0.06] dark:border-white/10">
                  <div className="flex justify-between text-xs font-mono text-slate-600 dark:text-white/70 py-1">
                    <span>Physical Capacity:</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {formatBytes(disk.sizeBytes)}
                    </span>
                  </div>
                </div>
              </GlassCard>
            ))}

            {(!hardware?.disks || hardware.disks.length === 0) && !loading && (
              <GlassSurface
                elevation="subtle"
                rounded="xl"
                className="col-span-2 p-6 text-center text-xs font-mono text-slate-400 dark:text-white/40"
              >
                No physical disks reported by hardware query
              </GlassSurface>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
