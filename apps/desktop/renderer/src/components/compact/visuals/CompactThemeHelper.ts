import type { CompactAccentColor, CompactSpecId } from "@sentinel/contracts";
import type { SpecStatus } from "../types";

export interface ColorScheme {
  stroke: string;
  fillGradientFrom: string;
  fillGradientTo: string;
  glow: string;
  barGradient: string;
  badgeBg: string;
  text: string;
}

export const SPEC_SCHEMES: Record<CompactSpecId, ColorScheme> = {
  cpu: {
    stroke: "#06b6d4",
    fillGradientFrom: "rgba(6, 182, 212, 0.4)",
    fillGradientTo: "rgba(6, 182, 212, 0.0)",
    glow: "rgba(6, 182, 212, 0.45)",
    barGradient: "from-cyan-500 to-blue-500",
    badgeBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  memory: {
    stroke: "#a855f7",
    fillGradientFrom: "rgba(168, 85, 247, 0.4)",
    fillGradientTo: "rgba(168, 85, 247, 0.0)",
    glow: "rgba(168, 85, 247, 0.45)",
    barGradient: "from-purple-500 to-indigo-500",
    badgeBg: "bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-400",
    text: "text-purple-600 dark:text-purple-400",
  },
  gpu: {
    stroke: "#14b8a6",
    fillGradientFrom: "rgba(20, 184, 166, 0.4)",
    fillGradientTo: "rgba(20, 184, 166, 0.0)",
    glow: "rgba(20, 184, 166, 0.45)",
    barGradient: "from-teal-400 to-cyan-500",
    badgeBg: "bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-400",
    text: "text-teal-600 dark:text-teal-400",
  },
  network: {
    stroke: "#0284c7",
    fillGradientFrom: "rgba(2, 132, 199, 0.4)",
    fillGradientTo: "rgba(2, 132, 199, 0.0)",
    glow: "rgba(2, 132, 199, 0.45)",
    barGradient: "from-sky-500 to-cyan-400",
    badgeBg: "bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400",
    text: "text-sky-600 dark:text-sky-400",
  },
  disk: {
    stroke: "#f59e0b",
    fillGradientFrom: "rgba(245, 158, 11, 0.4)",
    fillGradientTo: "rgba(245, 158, 11, 0.0)",
    glow: "rgba(245, 158, 11, 0.45)",
    barGradient: "from-amber-500 to-orange-400",
    badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
    text: "text-amber-600 dark:text-amber-400",
  },
  security: {
    stroke: "#10b981",
    fillGradientFrom: "rgba(16, 185, 129, 0.4)",
    fillGradientTo: "rgba(16, 185, 129, 0.0)",
    glow: "rgba(16, 185, 129, 0.45)",
    barGradient: "from-emerald-500 to-teal-400",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  battery: {
    stroke: "#10b981",
    fillGradientFrom: "rgba(16, 185, 129, 0.4)",
    fillGradientTo: "rgba(16, 185, 129, 0.0)",
    glow: "rgba(16, 185, 129, 0.45)",
    barGradient: "from-emerald-500 to-teal-400",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  processes: {
    stroke: "#6366f1",
    fillGradientFrom: "rgba(99, 102, 241, 0.4)",
    fillGradientTo: "rgba(99, 102, 241, 0.0)",
    glow: "rgba(99, 102, 241, 0.45)",
    barGradient: "from-indigo-500 to-blue-500",
    badgeBg: "bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-400",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  system: {
    stroke: "#38bdf8",
    fillGradientFrom: "rgba(56, 189, 248, 0.4)",
    fillGradientTo: "rgba(56, 189, 248, 0.0)",
    glow: "rgba(56, 189, 248, 0.45)",
    barGradient: "from-cyan-500 to-slate-400",
    badgeBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400",
    text: "text-cyan-600 dark:text-cyan-400",
  },
};

export const ACCENT_SCHEMES: Record<CompactAccentColor, ColorScheme> = {
  cyan: {
    stroke: "#06b6d4",
    fillGradientFrom: "rgba(6, 182, 212, 0.4)",
    fillGradientTo: "rgba(6, 182, 212, 0.0)",
    glow: "rgba(6, 182, 212, 0.45)",
    barGradient: "from-cyan-500 to-blue-500",
    badgeBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-700 dark:text-cyan-300",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  emerald: {
    stroke: "#10b981",
    fillGradientFrom: "rgba(16, 185, 129, 0.4)",
    fillGradientTo: "rgba(16, 185, 129, 0.0)",
    glow: "rgba(16, 185, 129, 0.45)",
    barGradient: "from-emerald-500 to-teal-500",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  purple: {
    stroke: "#a855f7",
    fillGradientFrom: "rgba(168, 85, 247, 0.4)",
    fillGradientTo: "rgba(168, 85, 247, 0.0)",
    glow: "rgba(168, 85, 247, 0.45)",
    barGradient: "from-purple-500 to-indigo-500",
    badgeBg: "bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300",
    text: "text-purple-600 dark:text-purple-400",
  },
  blue: {
    stroke: "#3b82f6",
    fillGradientFrom: "rgba(59, 130, 246, 0.4)",
    fillGradientTo: "rgba(59, 130, 246, 0.0)",
    glow: "rgba(59, 130, 246, 0.45)",
    barGradient: "from-blue-500 to-indigo-600",
    badgeBg: "bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300",
    text: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    stroke: "#f59e0b",
    fillGradientFrom: "rgba(245, 158, 11, 0.4)",
    fillGradientTo: "rgba(245, 158, 11, 0.0)",
    glow: "rgba(245, 158, 11, 0.45)",
    barGradient: "from-amber-500 to-orange-500",
    badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300",
    text: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    stroke: "#f43f5e",
    fillGradientFrom: "rgba(244, 63, 94, 0.4)",
    fillGradientTo: "rgba(244, 63, 94, 0.0)",
    glow: "rgba(244, 63, 94, 0.45)",
    barGradient: "from-rose-500 to-red-600",
    badgeBg: "bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300",
    text: "text-rose-600 dark:text-rose-400",
  },
};

export const STATUS_SCHEMES: Record<SpecStatus, ColorScheme> = {
  optimal: {
    stroke: "#10b981",
    fillGradientFrom: "rgba(16, 185, 129, 0.35)",
    fillGradientTo: "rgba(16, 185, 129, 0.0)",
    glow: "rgba(16, 185, 129, 0.4)",
    barGradient: "from-emerald-500 to-emerald-400",
    badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    stroke: "#f59e0b",
    fillGradientFrom: "rgba(245, 158, 11, 0.35)",
    fillGradientTo: "rgba(245, 158, 11, 0.0)",
    glow: "rgba(245, 158, 11, 0.4)",
    barGradient: "from-amber-500 to-amber-400",
    badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
    text: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    stroke: "#ef4444",
    fillGradientFrom: "rgba(239, 68, 68, 0.4)",
    fillGradientTo: "rgba(239, 68, 68, 0.0)",
    glow: "rgba(239, 68, 68, 0.5)",
    barGradient: "from-rose-500 to-red-600",
    badgeBg: "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400",
    text: "text-rose-600 dark:text-rose-400",
  },
  info: {
    stroke: "#06b6d4",
    fillGradientFrom: "rgba(6, 182, 212, 0.35)",
    fillGradientTo: "rgba(6, 182, 212, 0.0)",
    glow: "rgba(6, 182, 212, 0.4)",
    barGradient: "from-cyan-500 to-blue-500",
    badgeBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-400",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  neutral: {
    stroke: "#94a3b8",
    fillGradientFrom: "rgba(148, 163, 184, 0.25)",
    fillGradientTo: "rgba(148, 163, 184, 0.0)",
    glow: "rgba(148, 163, 184, 0.2)",
    barGradient: "from-slate-400 to-slate-500",
    badgeBg: "bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/15 text-slate-600 dark:text-slate-300",
    text: "text-slate-600 dark:text-slate-300",
  },
};
