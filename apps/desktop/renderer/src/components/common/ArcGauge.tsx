import React from "react";
import { useAppStore } from "../../stores/useAppStore";

interface ArcGaugeProps {
  value: number; // 0 - 100
  title: string;
  subtitle?: string;
  size?: number;
  color?: string;
  showTicks?: boolean;
}

export const ArcGauge: React.FC<ArcGaugeProps> = ({
  value,
  title,
  subtitle,
  size = 240,
  showTicks = true,
}) => {
  const { theme } = useAppStore();
  const isLight = theme === "light";

  const clamped = Math.max(0, Math.min(100, value));
  const totalTicks = 28;
  const activeTicks = Math.round((clamped / 100) * totalTicks);

  // SVG dimensions
  const center = size / 2;
  const radius = size * 0.38;

  const activeStroke = isLight ? "#0284c7" : "#22d3ee";
  const inactiveStroke = isLight
    ? "rgba(0, 0, 0, 0.10)"
    : "rgba(255, 255, 255, 0.12)";

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <svg
        width={size}
        height={size * 0.62}
        viewBox={`0 0 ${size} ${size * 0.65}`}
        className="overflow-visible"
      >
        <defs>
          <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={isLight ? 1.5 : 3}
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Radial Arc Ticks */}
        {showTicks &&
          Array.from({ length: totalTicks }).map((_, i) => {
            // Angle range from 180 (left) to 360/0 (right)
            const angle = 180 + (i / (totalTicks - 1)) * 180;
            const rad = (angle * Math.PI) / 180;
            const isFilled = i <= activeTicks;

            const r1 = radius - 7;
            const r2 = radius + 7;

            const x1 = center + r1 * Math.cos(rad);
            const y1 = center * 0.85 + r1 * Math.sin(rad);
            const x2 = center + r2 * Math.cos(rad);
            const y2 = center * 0.85 + r2 * Math.sin(rad);

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isFilled ? activeStroke : inactiveStroke}
                strokeWidth={isFilled ? 4.5 : 4}
                strokeLinecap="round"
                filter={isFilled ? "url(#cyanGlow)" : undefined}
                className="transition-all duration-300"
              />
            );
          })}

        {/* Value Label inside */}
        <text
          x={center}
          y={center * 0.76}
          textAnchor="middle"
          className="fill-slate-900 dark:fill-white font-extrabold text-4xl font-mono tracking-tight"
          style={
            isLight
              ? undefined
              : { filter: "drop-shadow(0 0 14px rgba(255, 255, 255, 0.35))" }
          }
        >
          {Math.round(clamped)}%
        </text>

        {/* Subtitle inside */}
        <text
          x={center}
          y={center * 0.94}
          textAnchor="middle"
          className="fill-slate-500 dark:fill-white/60 text-xs font-mono"
        >
          {subtitle || "Calculated Defensive Baseline"}
        </text>
      </svg>

      {/* Title below arc */}
      <div className="text-sm font-semibold text-slate-800 dark:text-white mt-1 tracking-wide">
        {title}
      </div>
    </div>
  );
};
