import React from "react";
import { cn } from "./utils";

export type GlassBadgeVariant =
  "default" | "success" | "warning" | "danger" | "info" | "cyan" | "purple";

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: GlassBadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  pulsing?: boolean;
  specular?: boolean;
}

const variantStyles: Record<GlassBadgeVariant, { badge: string; dot: string }> =
  {
    default: {
      badge:
        "bg-black/[0.04] dark:bg-white/[0.05] text-slate-700 dark:text-white/80 border-black/[0.08] dark:border-white/10 shadow-sm",
      dot: "bg-slate-400 dark:bg-white/60",
    },
    success: {
      badge:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-400/40 shadow-sm dark:shadow-[0_0_10px_rgba(52,211,153,0.35)]",
      dot: "bg-emerald-500 dark:bg-emerald-400",
    },
    warning: {
      badge:
        "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-400/40 shadow-sm dark:shadow-[0_0_10px_rgba(245,158,11,0.35)]",
      dot: "bg-amber-500 dark:bg-amber-400",
    },
    danger: {
      badge:
        "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 dark:border-rose-400/40 shadow-sm dark:shadow-[0_0_10px_rgba(244,63,94,0.35)]",
      dot: "bg-rose-500 dark:bg-rose-400",
    },
    info: {
      badge:
        "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 dark:border-blue-400/40 shadow-sm dark:shadow-[0_0_10px_rgba(59,130,246,0.35)]",
      dot: "bg-blue-500 dark:bg-blue-400",
    },
    cyan: {
      badge:
        "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 dark:border-cyan-400/40 shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.35)]",
      dot: "bg-cyan-500 dark:bg-cyan-400",
    },
    purple: {
      badge:
        "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 dark:border-purple-400/40 shadow-sm dark:shadow-[0_0_10px_rgba(192,132,252,0.35)]",
      dot: "bg-purple-500 dark:bg-purple-400",
    },
  };

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  variant = "default",
  size = "md",
  dot = false,
  pulsing = false,
  specular = true,
  className,
  children,
  ...props
}) => {
  const config = variantStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-medium rounded-full border backdrop-blur-xl transition-all select-none",
        config.badge,
        size === "sm"
          ? "px-2 py-0.5 text-[9px] tracking-wider"
          : "px-2.5 py-0.5 text-[10px] tracking-wide",
        specular && "shadow-[var(--glass-specular)]",
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            config.dot,
            pulsing && "animate-pulse",
          )}
        />
      )}
      {children}
    </span>
  );
};
