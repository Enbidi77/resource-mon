import React, { useEffect, useState } from 'react';
import { HardDrive, CheckCircle2, ArrowDown, ArrowUp } from 'lucide-react';
import type { HardwareSummary } from '@sentinel/contracts';
import { useMetricsStore } from '../stores/useMetricsStore';
import { formatBytes, formatSpeed } from '@sentinel/shared';
import { GlassCard, GlassBadge } from '../components/glass';

export const StoragePage: React.FC = () => {
  const { current } = useMetricsStore();
  const [hardware, setHardware] = useState<HardwareSummary | null>(null);

  useEffect(() => {
    if (window.sentinelAPI) {
      window.sentinelAPI.getHardwareSummary().then(setHardware);
    }
  }, []);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none">
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          Storage Devices & Partition Health
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Physical NVMe/SATA drives, volume utilization, S.M.A.R.T. diagnostics, and real-time disk throughput
        </p>
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

      {/* Disks List */}
      <div className="space-y-4">
        <div className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider">
          Physical Storage Units ({hardware?.disks.length || 1})
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
        </div>
      </div>
    </div>
  );
};
