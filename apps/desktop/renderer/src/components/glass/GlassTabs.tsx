import React from "react";
import { motion } from "framer-motion";
import { cn } from "./utils";
import { GlassBadge, GlassBadgeVariant } from "./GlassBadge";

export interface GlassTabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: GlassBadgeVariant;
  disabled?: boolean;
}

export interface GlassTabsProps<T extends string = string> {
  items: GlassTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: "glass" | "pills" | "underline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface GlassTabPanelProps {
  value: string;
  activeValue: string;
  className?: string;
  children: React.ReactNode;
}

export function GlassTabs<T extends string = string>({
  items,
  value,
  onChange,
  variant = "glass",
  size = "md",
  fullWidth = false,
  className,
  children,
}: GlassTabsProps<T>) {
  const rawId = React.useId();
  const tabsId = React.useMemo(
    () => rawId.replace(/[^a-zA-Z0-9_-]/g, ""),
    [rawId],
  );

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs font-medium gap-2",
    lg: "px-5 py-2.5 text-sm font-semibold gap-2.5",
  };

  const containerVariantClasses = {
    glass:
      "bg-[var(--glass-surface-subtle)] backdrop-blur-xl border border-[var(--glass-border-subtle)] p-1 rounded-2xl shadow-[var(--glass-specular)]",
    pills: "bg-transparent gap-2 p-0",
    underline:
      "bg-transparent border-b border-[var(--glass-border-subtle)] gap-4 p-0 rounded-none",
  };

  return (
    <div className="w-full space-y-4">
      {/* Tab Navigation List */}
      <div
        role="tablist"
        className={cn(
          "inline-flex items-center relative select-none",
          fullWidth ? "w-full flex" : "",
          containerVariantClasses[variant],
          className,
        )}
      >
        {items.map((tab) => {
          const isSelected = tab.id === value;

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-btn-${tabsId}-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`tab-panel-${tabsId}-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              className={cn(
                "relative z-10 font-mono transition-colors duration-200 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/50 rounded-xl",
                fullWidth ? "flex-1" : "",
                sizeClasses[size],
                isSelected
                  ? "text-cyan-400 font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {/* Active Animated Glass Indicator */}
              {isSelected && (
                <>
                  {variant === "glass" && (
                    <motion.div
                      layoutId={`glass-tab-active-${tabsId}`}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-xl bg-[var(--glass-surface-elevated)] border border-[var(--glass-border)] shadow-[var(--glass-shadow-soft)] -z-10"
                    >
                      {/* Specular Edge Highlight */}
                      <div
                        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
                        aria-hidden="true"
                      />
                    </motion.div>
                  )}

                  {variant === "pills" && (
                    <motion.div
                      layoutId={`glass-tab-active-${tabsId}`}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-xl bg-cyan-500/15 border border-cyan-400/30 shadow-sm shadow-cyan-500/10 -z-10"
                    >
                      <div
                        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent"
                        aria-hidden="true"
                      />
                    </motion.div>
                  )}

                  {variant === "underline" && (
                    <motion.div
                      layoutId={`glass-tab-active-${tabsId}`}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                      className="absolute -bottom-px inset-x-0 h-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)] -z-10"
                    />
                  )}
                </>
              )}

              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>

              {tab.badge !== undefined && (
                <GlassBadge
                  variant={
                    tab.badgeVariant || (isSelected ? "cyan" : "default")
                  }
                  size="sm"
                  className="ml-1"
                >
                  {tab.badge}
                </GlassBadge>
              )}
            </button>
          );
        })}
      </div>

      {/* Optional Embedded Tab Panels */}
      {children}
    </div>
  );
}

export const GlassTabPanel: React.FC<GlassTabPanelProps> = ({
  value,
  activeValue,
  className,
  children,
}) => {
  if (value !== activeValue) return null;

  return (
    <div role="tabpanel" className={cn("w-full", className)}>
      {children}
    </div>
  );
};
