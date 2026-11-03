import React, { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "./utils";

export type GlassCardVariant = "default" | "elevated" | "subtle" | "solid";
export type GlassCardGlow =
  "cyan" | "emerald" | "purple" | "blue" | "amber" | "rose" | "none";

export interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "title"> {
  variant?: GlassCardVariant;
  hoverEffect?: "lift" | "glow" | "scale" | "none";
  glowColor?: GlassCardGlow;
  specular?: boolean;
  interactive?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

const variantStyles: Record<GlassCardVariant, string> = {
  default:
    "bg-[var(--glass-surface)] backdrop-blur-2xl backdrop-saturate-200 border border-[var(--glass-border)] shadow-[var(--glass-shadow-soft)]",
  elevated:
    "bg-[var(--glass-surface-elevated)] backdrop-blur-3xl backdrop-saturate-200 border border-[var(--glass-border)] shadow-[var(--glass-shadow-elevated)]",
  subtle:
    "bg-[var(--glass-surface-subtle)] backdrop-blur-xl border border-[var(--glass-border-subtle)] shadow-sm",
  solid:
    "bg-[var(--glass-surface-solid)] border border-[var(--glass-border-subtle)] shadow-[var(--glass-shadow-soft)]",
};

const glowStyles: Record<GlassCardGlow, string> = {
  none: "",
  cyan: "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-br before:from-cyan-500/10 dark:before:from-cyan-500/15 before:to-transparent before:opacity-75",
  emerald:
    "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-br before:from-emerald-500/10 dark:before:from-emerald-500/15 before:to-transparent before:opacity-75",
  purple:
    "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-br before:from-purple-500/10 dark:before:from-purple-500/18 before:to-transparent before:opacity-75",
  blue: "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-br before:from-blue-500/10 dark:before:from-blue-500/15 before:to-transparent before:opacity-75",
  amber:
    "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-br before:from-amber-500/10 dark:before:from-amber-500/15 before:to-transparent before:opacity-75",
  rose: "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-br before:from-rose-500/10 dark:before:from-rose-500/18 before:to-transparent before:opacity-75",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = "default",
      hoverEffect = "none",
      glowColor = "none",
      specular = true,
      interactive,
      title,
      subtitle,
      action,
      header,
      footer,
      className,
      children,
      onClick,
      ...motionProps
    },
    ref,
  ) => {
    const isInteractive =
      interactive ?? (Boolean(onClick) || hoverEffect !== "none");

    // Fluid spring interaction physics
    const hoverAnimation = isInteractive
      ? hoverEffect === "lift"
        ? {
            y: -3,
            transition: {
              type: "spring" as const,
              stiffness: 400,
              damping: 25,
            },
          }
        : hoverEffect === "scale"
          ? {
              scale: 1.015,
              transition: {
                type: "spring" as const,
                stiffness: 400,
                damping: 25,
              },
            }
          : undefined
      : undefined;

    const tapAnimation = isInteractive
      ? {
          scale: 0.985,
          transition: { type: "spring" as const, stiffness: 500, damping: 30 },
        }
      : undefined;

    return (
      <motion.div
        ref={ref}
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        onClick={onClick}
        className={cn(
          "relative rounded-2xl overflow-hidden transition-all duration-200",
          variantStyles[variant],
          glowStyles[glowColor],
          specular && "shadow-[var(--glass-specular)]",
          isInteractive &&
            "cursor-pointer hover:border-[var(--glass-border-hover)]",
          className,
        )}
        {...motionProps}
      >
        {/* Specular Edge Light Reflection */}
        {specular && (
          <div
            className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-white/80 dark:via-white/25 to-transparent"
            aria-hidden="true"
          />
        )}

        {/* Custom Header or Standard Title/Subtitle/Action */}
        {(header || title || action) && (
          <div className="p-4 sm:p-5 border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between gap-3">
            {header ? (
              header
            ) : (
              <>
                <div className="min-w-0">
                  {title && (
                    <div className="text-sm font-semibold text-slate-900 dark:text-white font-mono tracking-tight truncate">
                      {title}
                    </div>
                  )}
                  {subtitle && (
                    <div className="text-xs text-slate-500 dark:text-white/60 mt-0.5 truncate">
                      {subtitle}
                    </div>
                  )}
                </div>
                {action && <div className="shrink-0">{action}</div>}
              </>
            )}
          </div>
        )}

        {/* Card Body */}
        {children}

        {/* Card Footer */}
        {footer && (
          <div className="p-3 sm:p-4 border-t border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
            {footer}
          </div>
        )}
      </motion.div>
    );
  },
);

GlassCard.displayName = "GlassCard";
