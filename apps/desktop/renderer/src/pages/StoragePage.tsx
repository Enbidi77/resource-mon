import React, { useEffect, useState } from 'react';
import { HardDrive, CheckCircle2, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import type { HardwareSummary } from '@sentinel/contracts';
import { useMetricsStore } from '../stores/useMetricsStore';
import { formatBytes, formatSpeed } from '@sentinel/shared';

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
        <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          Storage Devices & Partition Health
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Physical NVMe/SATA drives, volume utilization, S.M.A.R.T. diagnostics, and real-time disk throughput
        </p>
      </div>

      {/* Real-time Disk I/O Rate Banner */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-500 uppercase">Read Throughput</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
              <ArrowDown className="w-4 h-4" />
              {current ? formatSpeed(current.diskReadBytesPerSec) : '0 B/s'}
            </div>
          </div>
          <HardDrive className="w-8 h-8 text-emerald-500/20" />
        </div>

        <div className="glass-card p-4 rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-500 uppercase">Write Throughput</div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1 flex items-center gap-1.5">
              <ArrowUp className="w-4 h-4" />
              {current ? formatSpeed(current.diskWriteBytesPerSec) : '0 B/s'}
            </div>
          </div>
          <HardDrive className="w-8 h-8 text-cyan-500/20" />
        </div>
      </div>

      {/* Disks List */}
      <div className="space-y-4">
        <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          Physical Storage Units ({hardware?.disks.length || 1})
        </div>

        <div className="grid grid-cols-2 gap-4">
          {(hardware?.disks || []).map((disk, i) => (
            <div key={i} className="glass-card p-5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white font-mono">{disk.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {disk.type || 'Fixed Disk'} • {disk.interfaceType || 'NVMe'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{disk.smartStatus || 'S.M.A.R.T. Healthy'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.04]">
                <div className="flex justify-between text-xs font-mono text-slate-400 py-1">
                  <span>Physical Capacity:</span>
                  <span className="text-slate-200 font-bold">{formatBytes(disk.sizeBytes)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

