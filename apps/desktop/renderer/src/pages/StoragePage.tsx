import React, { useEffect, useState } from 'react';
import { HardDrive, CheckCircle2, AlertTriangle, ArrowDown, ArrowUp, RefreshCw, Database } from 'lucide-react';
import type { HardwareSummary } from '@sentinel/contracts';
import { useMetricsStore } from '../stores/useMetricsStore';
import { formatBytes, formatSpeed } from '@sentinel/shared';
import { GlassCard, GlassBadge, GlassButton, GlassSurface } from '../components/glass';

export const StoragePage: React.FC = () => {
  const { current } = useMetricsStore();
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

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            Storage Devices & Partition Health
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Physical NVMe/SATA drives, volume utilization, S.M.A.R.T. diagnostics, and real-time disk throughput
          </p>
        </div>

        <GlassButton
          variant="glass"
          size="sm"
          onClick={fetchStorageData}
          loading={loading}
          icon={<RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />}
        >
          Refresh Storage
        </GlassButton>
      </div>

      {/* Real-time Disk I/O Rate Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassCard glowColor="emerald" hoverEffect="lift" className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-[var(--text-secondary)] uppercase">Read Throughput</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
              <ArrowDown className="w-4 h-4" />
              {current ? formatSpeed(current.diskReadBytesPerSec) : '0 B/s'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-emerald-400" />
          </div>
        </GlassCard>

        <GlassCard glowColor="cyan" hoverEffect="lift" className="p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-[var(--text-secondary)] uppercase">Write Throughput</div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1 flex items-center gap-1.5">
              <ArrowUp className="w-4 h-4" />
              {current ? formatSpeed(current.diskWriteBytesPerSec) : '0 B/s'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-cyan-400" />
          </div>
        </GlassCard>
      </div>

      {/* Loading state skeleton */}
      {loading && !hardware && (
        <GlassSurface elevation="subtle" rounded="2xl" className="p-10 text-center space-y-2">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
          <div className="text-xs font-mono text-[var(--text-secondary)]">
            Querying storage controllers, physical drives, and partition tables...
          </div>
        </GlassSurface>
      )}

      {/* Partitions & Volume Utilization Section */}
      {(!loading || hardware) && (
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Mounted Partitions & Volume Health ({hardware?.partitions?.length || 0})</span>
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
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-mono font-bold text-cyan-400 text-xs">
                        {part.fs}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[var(--text-primary)] font-mono">
                          Local Disk ({part.fs})
                        </div>
                        <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                          Filesystem: {part.type || 'NTFS'} • Mount: {part.mount || part.fs}
                        </div>
                      </div>
                    </div>

                    <GlassBadge
                      variant={isHigh ? 'danger' : isMedium ? 'warning' : 'success'}
                      size="sm"
                      dot
                    >
                      {isHigh ? 'Low Space' : isMedium ? 'Warning' : 'Healthy'}
                    </GlassBadge>
                  </div>

                  {/* Volume Utilization Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[var(--text-secondary)]">
                        {formatBytes(part.usedBytes)} used of {formatBytes(part.sizeBytes)}
                      </span>
                      <span className={isHigh ? 'text-red-400 font-bold' : isMedium ? 'text-amber-400 font-bold' : 'text-cyan-400 font-semibold'}>
                        {usePercent}%
                      </span>
                    </div>

                    <div className="h-2 w-full bg-[var(--glass-surface-subtle)] rounded-full overflow-hidden border border-[var(--glass-border-subtle)]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isHigh ? 'bg-red-400' : isMedium ? 'bg-amber-400' : 'bg-cyan-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, usePercent))}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-mono text-[var(--text-tertiary)] pt-0.5">
                      <span>Available: {formatBytes(part.availableBytes)}</span>
                      <span>Total: {formatBytes(part.sizeBytes)}</span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}

            {(!hardware?.partitions || hardware.partitions.length === 0) && !loading && (
              <GlassSurface elevation="subtle" rounded="xl" className="col-span-2 p-6 text-center text-xs font-mono text-[var(--text-tertiary)]">
                No active partitions detected
              </GlassSurface>
            )}
          </div>
        </div>
      )}

      {/* Disks List */}
      {(!loading || hardware) && (
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Physical Storage Controllers & Drives ({hardware?.disks?.length || 0})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(hardware?.disks || []).map((disk, i) => (
              <GlassCard key={i} className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <HardDrive className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--text-primary)] font-mono">{disk.name}</div>
                      <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                        {disk.type || 'Fixed Disk'} • {disk.interfaceType || 'NVMe'}
                      </div>
                    </div>
                  </div>

                  <GlassBadge variant="success" size="sm" dot>
                    {disk.smartStatus || 'S.M.A.R.T. Healthy'}
                  </GlassBadge>
                </div>

                <div className="pt-2 border-t border-[var(--glass-border-subtle)]">
                  <div className="flex justify-between text-xs font-mono text-[var(--text-secondary)] py-1">
                    <span>Physical Capacity:</span>
                    <span className="text-[var(--text-primary)] font-bold">{formatBytes(disk.sizeBytes)}</span>
                  </div>
                </div>
              </GlassCard>
            ))}

            {(!hardware?.disks || hardware.disks.length === 0) && !loading && (
              <GlassSurface elevation="subtle" rounded="xl" className="col-span-2 p-6 text-center text-xs font-mono text-[var(--text-tertiary)]">
                No physical disks reported by hardware query
              </GlassSurface>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
