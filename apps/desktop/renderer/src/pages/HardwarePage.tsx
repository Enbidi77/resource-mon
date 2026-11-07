import React, { useEffect, useState } from "react";
import { Cpu, Zap, Monitor, Layers } from "lucide-react";
import type { HardwareSummary } from "@sentinel/contracts";
import { formatBytes } from "@sentinel/shared";
import {
  GlassCard,
  GlassSurface,
  PageLoadingSkeleton,
} from "../components/glass";

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
    return <PageLoadingSkeleton page="hardware" />;
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full select-none">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-text-primary font-mono flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          Hardware Component Inventory & BIOS Inspector
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Low-level motherboard, DIMM slot layout, GPU engines, NVMe
          controllers, and firmware versions
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Processor Section */}
        <GlassCard className="col-span-12 lg:col-span-6 p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-sm font-bold text-text-primary font-mono border-b border-glass-border-subtle pb-2.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Processor Architecture</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-glass-border-subtle">
              <span className="text-text-tertiary">Model Name</span>
              <span className="text-text-primary font-semibold">
                {hardware.cpu.brand}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-glass-border-subtle">
              <span className="text-text-tertiary">
                Physical Cores / Logical
              </span>
              <span className="text-cyan-400">
                {hardware.cpu.physicalCores} Cores / {hardware.cpu.cores}{" "}
                Threads
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-glass-border-subtle">
              <span className="text-text-tertiary">Base Clock Speed</span>
              <span className="text-text-secondary">
                {hardware.cpu.speedGhz} GHz
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-tertiary">Socket</span>
              <span className="text-text-secondary">
                {hardware.cpu.socket || "Integrated"}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Motherboard & BIOS */}
        <GlassCard className="col-span-12 lg:col-span-6 p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-sm font-bold text-text-primary font-mono border-b border-glass-border-subtle pb-2.5">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Baseboard & UEFI Firmware</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-glass-border-subtle">
              <span className="text-text-tertiary">System Manufacturer</span>
              <span className="text-text-primary">
                {hardware.system.manufacturer}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-glass-border-subtle">
              <span className="text-text-tertiary">Motherboard Model</span>
              <span className="text-text-primary">
                {hardware.baseboard.model}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-glass-border-subtle">
              <span className="text-text-tertiary">BIOS Vendor & Version</span>
              <span className="text-cyan-400">
                {hardware.bios.vendor} ({hardware.bios.version})
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-text-tertiary">Release Date</span>
              <span className="text-text-secondary">
                {hardware.bios.releaseDate || "N/A"}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Memory Sticks Layout & GPUs */}
      <div className="grid grid-cols-12 gap-6">
        {/* Physical RAM Slots */}
        <GlassCard className="col-span-12 lg:col-span-6 p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-sm font-bold text-text-primary font-mono border-b border-glass-border-subtle pb-2.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>
              Memory DIMM Modules ({hardware.memory.layout.length} Slots
              Detected)
            </span>
          </div>
          <div className="space-y-2">
            {hardware.memory.layout.map((slot, i) => (
              <GlassSurface
                key={i}
                elevation="subtle"
                rounded="xl"
                className="p-2.5 flex justify-between items-center text-xs font-mono"
              >
                <div>
                  <div className="text-text-primary font-semibold">
                    {slot.bank || `Slot #${i + 1}`}
                  </div>
                  <div className="text-[11px] text-text-tertiary">
                    {slot.type || "DDR"} • {slot.clockSpeedMhz || 3200} MHz
                  </div>
                </div>
                <div className="text-cyan-400 font-bold">
                  {formatBytes(slot.sizeBytes)}
                </div>
              </GlassSurface>
            ))}
          </div>
        </GlassCard>

        {/* Graphics Adapters */}
        <GlassCard className="col-span-12 lg:col-span-6 p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-sm font-bold text-text-primary font-mono border-b border-glass-border-subtle pb-2.5">
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span>Graphics Processing Units (GPUs)</span>
          </div>
          <div className="space-y-2">
            {hardware.gpus.map((gpu, i) => (
              <GlassSurface
                key={i}
                elevation="subtle"
                rounded="xl"
                className="p-2.5 flex justify-between items-center text-xs font-mono"
              >
                <div>
                  <div className="text-text-primary font-semibold">
                    {gpu.model}
                  </div>
                  <div className="text-[11px] text-text-tertiary">
                    Driver: {gpu.driverVersion || "Default Display Driver"}
                  </div>
                </div>
                <div className="text-emerald-400 font-bold">
                  {gpu.vramMb ? `${gpu.vramMb} MB` : "Dynamic VRAM"}
                </div>
              </GlassSurface>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
