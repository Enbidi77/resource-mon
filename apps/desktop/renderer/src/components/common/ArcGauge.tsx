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
  // 29 ticks (28 intervals) ensures an exact center tick at 270° (12 o'clock / 50%)
  // and exact integer tick indices for every quartile (0%, 25%, 50%, 75%, 100%)
  const totalTicks = 29;
  const activeTicks =
    clamped === 0 ? 0 : Math.round((clamped / 100) * totalTicks);

  // SVG dimensions
  const center = size / 2;
  const radius = size * 0.38;
  const svgHeight = Math.round(size * 0.62);

  const activeStroke = isLight ? "#0284c7" : "#22d3ee";
  const inactiveStroke = isLight
    ? "rgba(0, 0, 0, 0.10)"
    : "rgba(255, 255, 255, 0.12)";

  // Precompute tick geometry for all 29 ticks
  const tickCoordinates = React.useMemo(() => {
    return Array.from({ length: totalTicks }).map((_, i) => {
      // Angle range evenly distributed from 180° (left) to 360° (right)
      // Index 14 lands precisely at 270° (top apex)
      const angle = 180 + (i / (totalTicks - 1)) * 180;
      const rad = (angle * Math.PI) / 180;

      const r1 = radius - 7;
      const r2 = radius + 7;

      const x1 = center + r1 * Math.cos(rad);
      const y1 = center * 0.85 + r1 * Math.sin(rad);
      const x2 = center + r2 * Math.cos(rad);
      const y2 = center * 0.85 + r2 * Math.sin(rad);

      return { x1, y1, x2, y2 };
    });
  }, [center, radius, totalTicks]);

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <svg
        width={size}
        height={svgHeight}
        viewBox={`0 0 ${size} ${svgHeight}`}
        className="overflow-visible"
      >
        <defs>
          {/*
            filterUnits="userSpaceOnUse" is critical here:
            Default objectBoundingBox causes SVG engines (Chromium/WebKit) to collapse the filter region
            to 0 width for perfectly vertical lines (x1 === x2 at 270°) and 0 height for horizontal lines (y1 === y2 at 180°),
            causing those ticks to disappear in dark mode!
          */}
          <filter
            id="cyanGlow"
            filterUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={size}
            height={svgHeight}
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation={isLight ? 1 : 2}
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Inactive Track Ticks (Full Arc Background) */}
        {showTicks && (
          <g>
            {tickCoordinates.map((coords, i) => (
              <line
                key={`inactive-${i}`}
                x1={coords.x1}
                y1={coords.y1}
                x2={coords.x2}
                y2={coords.y2}
                stroke={inactiveStroke}
                strokeWidth={4}
                strokeLinecap="round"
              />
            ))}
          </g>
        )}

        {/* Active Illuminated Ticks with Unified Glow Filter */}
        {showTicks && activeTicks > 0 && (
          <g filter={!isLight ? "url(#cyanGlow)" : undefined}>
            {tickCoordinates.slice(0, activeTicks).map((coords, i) => (
              <line
                key={`active-${i}`}
                x1={coords.x1}
                y1={coords.y1}
                x2={coords.x2}
                y2={coords.y2}
                stroke={activeStroke}
                strokeWidth={4}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            ))}
          </g>
        )}

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
