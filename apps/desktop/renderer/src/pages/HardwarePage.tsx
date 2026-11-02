import React, { useEffect, useState } from 'react';
import { Cpu, Zap, HardDrive, Monitor, Shield, Layers, Battery } from 'lucide-react';
import type { HardwareSummary } from '@sentinel/contracts';
import { formatBytes } from '@sentinel/shared';

export const HardwarePage: React.FC = () => {
  const [hardware, setHardware] = useState<HardwareSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.sentinelAPI) {
      window.sentinelAPI.getHardwareSummary().then((data) => {
        setHardware(data);
        setLoading(false);
      });
    }
  }, []);

  if (loading || !hardware) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 font-mono">
        Querying hardware bus, BIOS, and ACPI tables...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          Hardware Component Inventory & BIOS Inspector
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Low-level motherboard, DIMM slot layout, GPU engines, NVMe controllers, and firmware versions
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Processor Section */}
        <div className="col-span-6 glass-card p-5 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-mono border-b border-white/5 pb-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Processor Architecture</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-slate-500">Model Name</span>
              <span className="text-slate-200 font-semibold">{hardware.cpu.brand}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-slate-500">Physical Cores / Logical</span>
              <span className="text-cyan-400">{hardware.cpu.physicalCores} Cores / {hardware.cpu.cores} Threads</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-slate-500">Base Clock Speed</span>
              <span className="text-slate-200">{hardware.cpu.speedGhz} GHz</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Socket</span>
              <span className="text-slate-200">{hardware.cpu.socket || 'Integrated'}</span>
            </div>
          </div>
        </div>

        {/* Motherboard & BIOS */}
        <div className="col-span-6 glass-card p-5 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-mono border-b border-white/5 pb-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Baseboard & UEFI Firmware</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-slate-500">System Manufacturer</span>
              <span className="text-slate-200">{hardware.system.manufacturer}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-slate-500">Motherboard Model</span>
              <span className="text-slate-200">{hardware.baseboard.model}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.04]">
              <span className="text-slate-500">BIOS Vendor & Version</span>
              <span className="text-cyan-400">{hardware.bios.vendor} ({hardware.bios.version})</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Release Date</span>
              <span className="text-slate-200">{hardware.bios.releaseDate || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Sticks Layout & GPUs */}
      <div className="grid grid-cols-12 gap-6">
        {/* Physical RAM Slots */}
        <div className="col-span-6 glass-card p-5 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-mono border-b border-white/5 pb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Memory DIMM Modules ({hardware.memory.layout.length} Slots Detected)</span>
          </div>
          <div className="space-y-2">
            {hardware.memory.layout.map((slot, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex justify-between items-center text-xs font-mono">
                <div>
                  <div className="text-slate-300 font-semibold">{slot.bank || `Slot #${i + 1}`}</div>
                  <div className="text-[11px] text-slate-500">{slot.type || 'DDR'} • {slot.clockSpeedMhz || 3200} MHz</div>
                </div>
                <div className="text-cyan-400 font-bold">{formatBytes(slot.sizeBytes)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Graphics Adapters */}
        <div className="col-span-6 glass-card p-5 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white font-mono border-b border-white/5 pb-2">
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span>Graphics Processing Units (GPUs)</span>
          </div>
          <div className="space-y-2">
            {hardware.gpus.map((gpu, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 flex justify-between items-center text-xs font-mono">
                <div>
                  <div className="text-slate-300 font-semibold">{gpu.model}</div>
                  <div className="text-[11px] text-slate-500">Driver: {gpu.driverVersion || 'Default Display Driver'}</div>
                </div>
                <div className="text-emerald-400 font-bold">{gpu.vramMb ? `${gpu.vramMb} MB` : 'Dynamic VRAM'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
