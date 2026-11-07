import React from "react";
import {
  LayoutDashboard,
  Activity,
  Layers,
  Cpu,
  Wifi,
  Cog,
  HardDrive,
  ShieldAlert,
  FileText,
  FileDown,
  Settings,
  Pin,
  Loader2,
} from "lucide-react";
import type { AppPage } from "../../stores/useAppStore";
import { GlassCard } from "./GlassCard";
import { GlassSurface } from "./GlassSurface";
import { GlassBadge } from "./GlassBadge";

export interface PageLoadingSkeletonProps {
  page?: AppPage;
  variant?: "overview" | "table" | "chart" | "grid" | "default";
  title?: string;
  subtitle?: string;
  statusText?: string;
  className?: string;
}

interface PageMeta {
  title: string;
  subtitle: string;
  statusText: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "overview" | "table" | "chart" | "grid";
  glowColor: "cyan" | "purple" | "emerald" | "blue" | "rose" | "amber";
}

const PAGE_METAS: Record<AppPage, PageMeta> = {
  overview: {
    title: "Mission Control Overview",
    subtitle:
      "Real-time host vitals, defensive EDR posture, and system integrity telemetry",
    statusText: "STREAMING LIVE TELEMETRY",
    icon: LayoutDashboard,
    variant: "overview",
    glowColor: "cyan",
  },
  performance: {
    title: "Performance Workstation Monitor",
    subtitle:
      "Dedicated processor topology, physical RAM allocation, GPU acceleration, and disk I/O",
    statusText: "ACQUIRING PROCESSOR TOPOLOGY",
    icon: Activity,
    variant: "chart",
    glowColor: "cyan",
  },
  processes: {
    title: "Process Explorer & Authenticode Inspector",
    subtitle:
      "Active Windows processes, memory footprints, digital signatures, and handle attributes",
    statusText: "ENUMERATING HOST PROCESSES",
    icon: Layers,
    variant: "table",
    glowColor: "cyan",
  },
  hardware: {
    title: "Hardware Component Inventory & BIOS Inspector",
    subtitle:
      "Low-level motherboard, DIMM slot layout, GPU engines, NVMe controllers, and firmware",
    statusText: "QUERYING DMI & ACPI BUS",
    icon: Cpu,
    variant: "grid",
    glowColor: "purple",
  },
  network: {
    title: "Network Monitor & Active Socket Attribution",
    subtitle:
      "Active TCP/UDP connections mapped directly to owning PIDs, listening ports, and adapters",
    statusText: "RESOLVING SOCKET ATTRIBUTIONS",
    icon: Wifi,
    variant: "table",
    glowColor: "blue",
  },
  services: {
    title: "Windows Services & Background Daemons",
    subtitle:
      "System services, startup types, execution status, and Service Control Manager controls",
    statusText: "QUERYING SERVICE CONTROL MANAGER",
    icon: Cog,
    variant: "table",
    glowColor: "cyan",
  },
  storage: {
    title: "Storage & Physical Drive Inspector",
    subtitle:
      "Fixed physical drives, NVMe partitions, health metrics, and disk throughput analysis",
    statusText: "INSPECTING STORAGE CONTROLLERS",
    icon: HardDrive,
    variant: "chart",
    glowColor: "emerald",
  },
  security: {
    title: "Host Defensive Security Center",
    subtitle:
      "Defensive posture assessment, process anomaly detection, and deep attack surface inspection",
    statusText: "EVALUATING DEFENSIVE POSTURE",
    icon: ShieldAlert,
    variant: "grid",
    glowColor: "rose",
  },
  events: {
    title: "Windows Event Viewer & Audit Logs",
    subtitle:
      "Real-time event stream from System, Application, and Security channels",
    statusText: "QUERYING WINDOWS EVENT LOGS",
    icon: FileText,
    variant: "table",
    glowColor: "cyan",
  },
  reports: {
    title: "Audit Reports & Compliance Export",
    subtitle:
      "Generate comprehensive host health, process inventories, network attributions, and audits",
    statusText: "PREPARING REPORT GENERATOR",
    icon: FileDown,
    variant: "grid",
    glowColor: "cyan",
  },
  compact: {
    title: "Compact HUD Always-On-Top",
    subtitle: "Ultra-compact customizable telemetry heads-up display",
    statusText: "ATTACHING COMPACT HUD",
    icon: Pin,
    variant: "overview",
    glowColor: "cyan",
  },
  settings: {
    title: "Workstation Configuration & Settings",
    subtitle:
      "Tune Liquid Glass appearance, high-frequency telemetry intervals, and defensive rules",
    statusText: "LOADING PREFERENCES",
    icon: Settings,
    variant: "grid",
    glowColor: "cyan",
  },
};

export const PageLoadingSkeleton: React.FC<PageLoadingSkeletonProps> = ({
  page = "overview",
  variant: propVariant,
  title: propTitle,
  subtitle: propSubtitle,
  statusText: propStatusText,
  className = "",
}) => {
  const meta = PAGE_METAS[page] || PAGE_METAS.overview;
  const Icon = meta.icon;
  const title = propTitle || meta.title;
  const subtitle = propSubtitle || meta.subtitle;
  const statusText = propStatusText || meta.statusText;
  const variant = propVariant || meta.variant;

  return (
    <div
      className={`p-6 space-y-6 overflow-hidden h-full flex flex-col select-none animate-in fade-in duration-200 ${className}`}
      aria-busy="true"
      aria-label={`Loading ${title}`}
    >
      {/* Top Header Placeholder */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm">
            <Icon className="w-5 h-5 text-cyan-400 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono leading-none tracking-tight">
                {title}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] font-mono max-w-2xl line-clamp-1">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Dynamic Activity Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <GlassBadge variant="cyan" size="sm" className="font-mono">
            <Loader2 className="w-3 h-3 animate-spin text-cyan-400 mr-1" />
            <span>{statusText}</span>
          </GlassBadge>
        </div>
      </div>

      {/* Top Banner 4 KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "METRIC ALPHA",
            glow: "cyan" as const,
            dotColor: "bg-cyan-400",
          },
          {
            label: "METRIC BETA",
            glow: "emerald" as const,
            dotColor: "bg-emerald-400",
          },
          {
            label: "METRIC GAMMA",
            glow: "purple" as const,
            dotColor: "bg-purple-400",
          },
          {
            label: "METRIC DELTA",
            glow: "rose" as const,
            dotColor: "bg-rose-400",
          },
        ].map((card, idx) => (
          <GlassCard
            key={idx}
            glowColor={card.glow}
            className="p-4 relative overflow-hidden space-y-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                {card.label}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${card.dotColor} animate-pulse`}
              />
            </div>
            <div className="h-7 w-28 rounded-lg glass-skeleton" />
            <div className="h-3 w-40 rounded glass-skeleton opacity-70" />
          </GlassCard>
        ))}
      </div>

      {/* Main Dynamic View Skeleton Body */}
      <div className="flex-1 min-h-0 flex flex-col">
        {variant === "table" ? (
          /* Table Skeleton: Search Filter & Dense Rows */
          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex justify-between items-center gap-3">
              <div className="h-9 w-72 rounded-xl glass-skeleton" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 rounded-xl glass-skeleton" />
                <div className="h-8 w-24 rounded-xl glass-skeleton" />
              </div>
            </div>

            <GlassSurface
              elevation="subtle"
              rounded="2xl"
              className="flex-1 p-4 border border-[var(--glass-border-subtle)] flex flex-col space-y-3 overflow-hidden"
            >
              {/* Table Header Row Skeleton */}
              <div className="grid grid-cols-12 gap-4 pb-3 border-b border-[var(--glass-border-subtle)]">
                <div className="col-span-3 h-3 rounded glass-skeleton" />
                <div className="col-span-2 h-3 rounded glass-skeleton" />
                <div className="col-span-3 h-3 rounded glass-skeleton" />
                <div className="col-span-2 h-3 rounded glass-skeleton" />
                <div className="col-span-2 h-3 rounded glass-skeleton" />
              </div>

              {/* Table Data Rows Skeleton */}
              <div className="space-y-2.5 flex-1 overflow-hidden pt-1">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-4 py-2.5 px-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04] items-center"
                    style={{ opacity: Math.max(0.35, 1 - i * 0.1) }}
                  >
                    <div className="col-span-3 flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-lg glass-skeleton shrink-0" />
                      <div className="h-3.5 w-32 rounded glass-skeleton" />
                    </div>
                    <div className="col-span-2 h-3 w-16 rounded glass-skeleton" />
                    <div className="col-span-3 h-3 w-28 rounded glass-skeleton" />
                    <div className="col-span-2 h-3 w-20 rounded glass-skeleton" />
                    <div className="col-span-2 h-5 w-16 rounded-full glass-skeleton justify-self-end" />
                  </div>
                ))}
              </div>
            </GlassSurface>
          </div>
        ) : variant === "chart" ? (
          /* Chart Skeleton: Two High-Def Frosted Chart Waveform Cards */
          <div className="grid grid-cols-12 gap-6 flex-1">
            <GlassCard className="col-span-12 lg:col-span-6 p-5 flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl glass-skeleton" />
                  <div className="space-y-1">
                    <div className="h-4 w-32 rounded glass-skeleton" />
                    <div className="h-2.5 w-44 rounded glass-skeleton opacity-60" />
                  </div>
                </div>
                <div className="h-6 w-16 rounded glass-skeleton" />
              </div>

              {/* Simulated Waveform / Grid */}
              <div className="flex-1 min-h-[160px] rounded-xl border border-[var(--glass-border-subtle)] p-4 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-px w-full bg-[var(--glass-border-subtle)]" />
                  <div className="h-px w-full bg-[var(--glass-border-subtle)]" />
                  <div className="h-px w-full bg-[var(--glass-border-subtle)]" />
                </div>
                <div className="h-24 w-full rounded-lg glass-skeleton opacity-75" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-12 rounded-xl glass-skeleton" />
                <div className="h-12 rounded-xl glass-skeleton" />
              </div>
            </GlassCard>

            <GlassCard className="col-span-12 lg:col-span-6 p-5 flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl glass-skeleton" />
                  <div className="space-y-1">
                    <div className="h-4 w-36 rounded glass-skeleton" />
                    <div className="h-2.5 w-48 rounded glass-skeleton opacity-60" />
                  </div>
                </div>
                <div className="h-6 w-20 rounded glass-skeleton" />
              </div>

              <div className="flex-1 min-h-[160px] rounded-xl border border-[var(--glass-border-subtle)] p-4 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="h-px w-full bg-[var(--glass-border-subtle)]" />
                  <div className="h-px w-full bg-[var(--glass-border-subtle)]" />
                  <div className="h-px w-full bg-[var(--glass-border-subtle)]" />
                </div>
                <div className="h-24 w-full rounded-lg glass-skeleton opacity-75" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-12 rounded-xl glass-skeleton" />
                <div className="h-12 rounded-xl glass-skeleton" />
              </div>
            </GlassCard>
          </div>
        ) : (
          /* Grid / Overview / Default Skeleton */
          <div className="grid grid-cols-12 gap-6 flex-1">
            <GlassCard className="col-span-12 lg:col-span-7 p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-[var(--glass-border-subtle)] pb-3">
                <div className="w-8 h-8 rounded-xl glass-skeleton" />
                <div className="h-4 w-44 rounded glass-skeleton" />
              </div>

              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between py-2 border-b border-[var(--glass-border-subtle)]"
                  >
                    <div className="h-3 w-28 rounded glass-skeleton" />
                    <div className="h-3 w-40 rounded glass-skeleton" />
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="col-span-12 lg:col-span-5 p-5 space-y-4">
              <div className="flex items-center gap-3 border-b border-[var(--glass-border-subtle)] pb-3">
                <div className="w-8 h-8 rounded-xl glass-skeleton" />
                <div className="h-4 w-36 rounded glass-skeleton" />
              </div>

              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <div className="w-32 h-32 rounded-full border-4 border-cyan-400/20 glass-skeleton" />
                <div className="h-4 w-24 rounded glass-skeleton" />
                <div className="h-3 w-36 rounded glass-skeleton opacity-70" />
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};
