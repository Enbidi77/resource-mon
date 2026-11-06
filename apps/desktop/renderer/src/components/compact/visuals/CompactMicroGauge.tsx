import React from "react";
import type { SpecStatus } from "../types";
import { STATUS_SCHEMES } from "./CompactThemeHelper";

interface CompactMicroGaugeProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string;
  status?: SpecStatus;
  showPercent?: boolean;
  className?: string;
}

export const CompactMicroGauge: React.FC<CompactMicroGaugeProps> = React.memo(
  ({
    percent,
    size = 32,
    strokeWidth = 3,
    strokeColor,
    status,
    showPercent = true,
    className = "",
  }) => {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;

    const stroke =
      strokeColor ||
      (status ? STATUS_SCHEMES[status]?.stroke : undefined) ||
      (clamped >= 90 ? "#ef4444" : clamped >= 75 ? "#f59e0b" : "#06b6d4");

    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 select-none pointer-events-none"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-black/10 dark:text-white/10"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
        </svg>
        {showPercent && (
          <span className="absolute text-[9px] font-mono font-bold tracking-tighter text-slate-800 dark:text-white">
            {clamped}%
          </span>
        )}
      </div>
    );
  }
);

CompactMicroGauge.displayName = "CompactMicroGauge";

