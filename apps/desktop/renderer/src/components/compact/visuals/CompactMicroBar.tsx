import React from "react";
import type { SpecStatus } from "../types";
import { STATUS_SCHEMES } from "./CompactThemeHelper";

interface CompactMicroBarProps {
  percent: number;
  height?: number;
  barGradient?: string;
  status?: SpecStatus;
  className?: string;
}

export const CompactMicroBar: React.FC<CompactMicroBarProps> = React.memo(
  ({ percent, height = 4, barGradient, status, className = "" }) => {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));

    // Choose gradient: explicit barGradient takes precedence
    let gradient = barGradient;
    if (!gradient) {
      if (status && status !== "neutral" && status !== "optimal") {
        gradient = STATUS_SCHEMES[status]?.barGradient;
      } else {
        gradient = "from-cyan-500 to-blue-500";
      }
    }

    return (
      <div
        style={{ height }}
        className={`w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden relative border border-black/5 dark:border-white/5 ${className}`}
      >
        {/* Specular inset highlight */}
        <div
          className="absolute inset-0 pointer-events-none rounded-full"
          style={{ boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.2)" }}
        />
        {/* Fill bar */}
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-300 ease-out relative`}
          style={{ width: `${clamped}%` }}
        >
          {/* Subtle leading glow tip */}
          {clamped > 0 && clamped < 100 && (
            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/70 rounded-full blur-[1px]" />
          )}
        </div>
      </div>
    );
  }
);

CompactMicroBar.displayName = "CompactMicroBar";
