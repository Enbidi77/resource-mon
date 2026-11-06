import React from "react";
import {
  Cpu,
  Zap,
  Activity,
  Wifi,
  HardDrive,
  ShieldCheck,
  Battery,
  Layers,
  Info,
} from "lucide-react";
import type { CompactSpecId } from "@sentinel/contracts";
import type { SpecDefinition, SpecRenderContext } from "./types";
import {
  formatBytes,
  formatSpeed,
  formatDuration,
  truncate,
} from "@sentinel/shared";

export const SPEC_REGISTRY: Record<CompactSpecId, SpecDefinition> = {
  cpu: {
    id: "cpu",
    label: "Processor (CPU)",
    shortLabel: "CPU",
    category: "compute",
    description: "Total CPU load, active core count, and clock frequency",
    icon: Cpu,
    extract: (ctx: SpecRenderContext) => {
      const load = ctx.metrics?.cpuTotal ?? 0;
      const cores = ctx.overview?.cpuCores;
      const speed = ctx.overview?.cpuBaseSpeedGhz;
      const secondary = cores && speed ? `${cores}C • ${speed.toFixed(2)} GHz` : cores ? `${cores} Cores` : undefined;

      return {
        primary: `${load.toFixed(1)}%`,
        secondary,
        percent: load,
        status: load >= 95 ? "danger" : load >= 85 ? "warning" : "optimal",
        sparklinePoints: ctx.history.map((h) => h.cpu),
        details: [
          { label: "Model", value: ctx.overview?.cpuBrand || "Generic CPU" },
          { label: "Cores", value: cores ? `${cores} (${ctx.overview?.cpuPhysicalCores || cores} Phys)` : "N/A" },
          { label: "Base Speed", value: speed ? `${speed.toFixed(2)} GHz` : "N/A" },
        ],
      };
    },
  },

  memory: {
    id: "memory",
    label: "Memory (RAM)",
    shortLabel: "RAM",
    category: "memory",
    description: "Physical RAM utilization, used, and free capacity",
    icon: Zap,
    extract: (ctx: SpecRenderContext) => {
      const percent = ctx.metrics?.memoryPercent ?? 0;
      const used = ctx.metrics?.memoryUsedBytes ?? 0;
      const total = ctx.metrics?.memoryTotalBytes ?? 0;
      const free = ctx.metrics?.memoryFreeBytes ?? 0;

      return {
        primary: `${percent.toFixed(1)}%`,
        secondary: total > 0 ? `${formatBytes(used, 1)} / ${formatBytes(total, 1)}` : undefined,
        percent,
        status: percent >= 98 ? "danger" : percent >= 92 ? "warning" : "optimal",
        sparklinePoints: ctx.history.map((h) => h.memoryPercent),
        details: [
          { label: "In Use", value: formatBytes(used) },
          { label: "Available", value: formatBytes(free) },
          { label: "Total", value: formatBytes(total) },
        ],
      };
    },
  },

  gpu: {
    id: "gpu",
    label: "Graphics (GPU)",
    shortLabel: "GPU",
    category: "compute",
    description: "GPU core utilization, allocated VRAM, and thermal sensors",
    icon: Activity,
    extract: (ctx: SpecRenderContext) => {
      const gpus = ctx.metrics?.gpu || [];
      const primaryGpu = gpus[0];

      if (!primaryGpu) {
        return {
          primary: "N/A",
          secondary: "Integrated Graphics",
          percent: 0,
          status: "neutral",
          sparklinePoints: [],
        };
      }

      const load = primaryGpu.loadPercent;
      const tempStr = primaryGpu.temperatureC != null ? ` • ${primaryGpu.temperatureC}°C` : "";

      return {
        primary: `${load.toFixed(0)}%`,
        secondary: `${truncate(primaryGpu.model, 16)}${tempStr}`,
        percent: load,
        status: load >= 95 ? "danger" : load >= 85 ? "warning" : "optimal",
        sparklinePoints: ctx.history.map(() => load),
        details: [
          { label: "Model", value: primaryGpu.model },
          {
            label: "VRAM",
            value: `${formatBytes(primaryGpu.memoryUsedBytes)} / ${formatBytes(primaryGpu.memoryTotalBytes)}`,
          },
          {
            label: "Temp",
            value: primaryGpu.temperatureC != null ? `${primaryGpu.temperatureC} °C` : "N/A",
          },
        ],
      };
    },
  },

  network: {
    id: "network",
    label: "Network Bandwidth",
    shortLabel: "NET",
    category: "network",
    description: "Live download and upload throughput speed",
    icon: Wifi,
    extract: (ctx: SpecRenderContext) => {
      const rx = ctx.metrics?.networkDownloadBytesPerSec ?? 0;
      const tx = ctx.metrics?.networkUploadBytesPerSec ?? 0;
      const totalSpeed = rx + tx;
      const percent = Math.min(100, Math.round((totalSpeed / (50 * 1024 * 1024)) * 100));

      return {
        primary: `↓ ${formatSpeed(rx, 1)}`,
        secondary: `↑ ${formatSpeed(tx, 1)}`,
        percent: Math.max(3, percent),
        status: "optimal",
        sparklinePoints: ctx.history.map((h) => h.netRxKb + h.netTxKb),
        details: [
          { label: "Download", value: formatSpeed(rx) },
          { label: "Upload", value: formatSpeed(tx) },
          { label: "Total I/O", value: formatSpeed(totalSpeed) },
        ],
      };
    },
  },

  disk: {
    id: "disk",
    label: "Disk Activity (I/O)",
    shortLabel: "DISK",
    category: "storage",
    description: "Real-time physical drive read and write throughput",
    icon: HardDrive,
    extract: (ctx: SpecRenderContext) => {
      const r = ctx.metrics?.diskReadBytesPerSec ?? 0;
      const w = ctx.metrics?.diskWriteBytesPerSec ?? 0;
      const totalDisk = r + w;
      const percent = Math.min(100, Math.round((totalDisk / (100 * 1024 * 1024)) * 100));

      return {
        primary: `R: ${formatSpeed(r, 1)}`,
        secondary: `W: ${formatSpeed(w, 1)}`,
        percent: Math.max(2, percent),
        status: "neutral",
        sparklinePoints: ctx.history.map((h) => h.diskReadKb + h.diskWriteKb),
        details: [
          { label: "Read Rate", value: formatSpeed(r) },
          { label: "Write Rate", value: formatSpeed(w) },
        ],
      };
    },
  },

  security: {
    id: "security",
    label: "Security & Posture",
    shortLabel: "SEC",
    category: "security",
    description: "Defensive integrity score and active anomaly indicators",
    icon: ShieldCheck,
    extract: (ctx: SpecRenderContext) => {
      const score = ctx.metrics?.systemIntegrityScore ?? 100;
      const status = score >= 80 ? "optimal" : score >= 60 ? "warning" : "danger";
      const postureLabel = score >= 80 ? "Optimal Baseline" : score >= 60 ? "Elevated Warning" : "Threat Detected";

      return {
        primary: `${score}/100`,
        secondary: postureLabel,
        percent: score,
        status,
        sparklinePoints: ctx.history.map((h) => h.integrity),
        details: [
          { label: "Integrity Score", value: `${score} / 100` },
          { label: "Posture Status", value: postureLabel },
          { label: "Defensive EDR", value: "Active" },
        ],
      };
    },
  },

  battery: {
    id: "battery",
    label: "Battery & Power",
    shortLabel: "PWR",
    category: "system",
    description: "Battery reserve level and AC power status",
    icon: Battery,
    extract: () => {
      return {
        primary: "AC Connected",
        secondary: "Standard Power",
        percent: 100,
        status: "optimal",
        sparklinePoints: [100, 100, 100],
        details: [
          { label: "Source", value: "AC Line Power" },
          { label: "Health", value: "Good" },
        ],
      };
    },
  },

  processes: {
    id: "processes",
    label: "Processes & Sockets",
    shortLabel: "PROC",
    category: "system",
    description: "Running tasks count and active network sockets",
    icon: Layers,
    extract: (ctx: SpecRenderContext) => {
      const procs = ctx.metrics?.activeProcessesCount ?? 0;
      const sockets = ctx.metrics?.activeSocketsCount ?? 0;
      const percent = Math.min(100, Math.round((procs / 400) * 100));

      return {
        primary: procs > 0 ? `${procs} Tasks` : "Active Tasks",
        secondary: sockets > 0 ? `${sockets} Sockets` : "Network Sockets",
        percent: Math.max(5, percent),
        status: "neutral",
        sparklinePoints: ctx.history.map(() => procs),
        details: [
          { label: "Active Tasks", value: procs > 0 ? procs.toString() : "Running" },
          { label: "Network Sockets", value: sockets > 0 ? sockets.toString() : "Connected" },
        ],
      };
    },
  },

  system: {
    id: "system",
    label: "System & Host Info",
    shortLabel: "SYS",
    category: "system",
    description: "Hostname, OS release, architecture, and uptime",
    icon: Info,
    extract: (ctx: SpecRenderContext) => {
      const uptimeSec = ctx.overview?.uptimeSeconds ?? 0;
      const hostname = ctx.overview?.hostname || "Localhost";
      const osName = ctx.overview?.osName || "Windows";

      return {
        primary: hostname,
        secondary: uptimeSec > 0 ? `Up ${formatDuration(uptimeSec)}` : osName,
        percent: 100,
        status: "info",
        sparklinePoints: [],
        details: [
          { label: "Hostname", value: hostname },
          { label: "OS", value: `${osName} (${ctx.overview?.arch || "x64"})` },
          { label: "Uptime", value: formatDuration(uptimeSec) },
          { label: "Elevation", value: ctx.overview?.isElevated ? "Administrator" : "Standard User" },
        ],
      };
    },
  },
};

export const ALL_SPEC_IDS: CompactSpecId[] = [
  "cpu",
  "memory",
  "gpu",
  "network",
  "disk",
  "security",
  "battery",
  "processes",
  "system",
];
