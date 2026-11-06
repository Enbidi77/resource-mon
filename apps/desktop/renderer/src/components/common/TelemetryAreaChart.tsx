import React, { useId, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useAppStore } from "../../stores/useAppStore";

export interface ChartSeries {
  dataKey: string;
  name?: string;
  stroke?: string;
  strokeWidth?: number;
  gradientFrom?: string;
  gradientTo?: string;
  fillOpacity?: number;
}

export interface TelemetryAreaChartProps {
  data: Array<Record<string, any> | object> | number[];
  series: ChartSeries[];
  height?: number | string;
  width?: number | string;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  xAxisKey?: string;
  yDomain?: [number, number];
  yTicks?: number[];
  compact?: boolean;
  theme?: "dark" | "light";
  className?: string;
}

export const TelemetryAreaChart: React.FC<TelemetryAreaChartProps> = React.memo(
  ({
    data,
    series,
    height = 200,
    width = "100%",
    showXAxis = false,
    showYAxis = false,
    showGrid = false,
    showTooltip = true,
    xAxisKey = "time",
    yDomain,
    yTicks,
    compact = false,
    theme: propTheme,
    className = "",
  }) => {
    const storeTheme = useAppStore((state) => state.theme);
    const theme = propTheme || storeTheme;
    const isLight = theme === "light";
    const chartId = useId().replace(/:/g, "_");

    // Normalize data: if an array of numbers is passed, transform to object records
    const normalizedData = useMemo(() => {
      if (!Array.isArray(data) || data.length === 0) return [];
      if (typeof data[0] === "number") {
        const key = series[0]?.dataKey || "value";
        return (data as number[]).map((val, idx) => ({
          index: idx,
          [key]: val,
        }));
      }
      return data as Array<Record<string, any>>;
    }, [data, series]);

    const containerStyle = useMemo(() => {
      return {
        height: typeof height === "number" ? `${height}px` : height,
        width: typeof width === "number" ? `${width}px` : width,
      };
    }, [height, width]);

    return (
      <div style={containerStyle} className={`relative w-full ${className}`}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart
            data={normalizedData}
            margin={{
              top: compact ? (showYAxis ? 2 : 0) : 4,
              right: compact ? (showYAxis ? 2 : 0) : 8,
              left: showYAxis ? (compact ? -18 : -10) : 0,
              bottom: compact ? (showYAxis ? 2 : 0) : 4,
            }}
          >
            <defs>
              {series.map((s, idx) => {
                const gradId = `${chartId}_grad_${idx}`;
                const fromColor =
                  s.gradientFrom ||
                  s.stroke ||
                  (isLight ? "#0284c7" : "#06b6d4");
                const toColor = s.gradientTo || fromColor;
                const fromOpacity =
                  s.fillOpacity ?? (isLight ? 0.35 : 0.45);

                return (
                  <linearGradient
                    key={gradId}
                    id={gradId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={fromColor}
                      stopOpacity={fromOpacity}
                    />
                    <stop
                      offset="95%"
                      stopColor={toColor}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                );
              })}
            </defs>

            {showGrid && (
              <CartesianGrid
                stroke={
                  isLight
                    ? "rgba(0, 0, 0, 0.06)"
                    : "rgba(255, 255, 255, 0.08)"
                }
                vertical={false}
              />
            )}

            {showXAxis && (
              <XAxis
                dataKey={xAxisKey}
                stroke={isLight ? "#64748b" : "rgba(255, 255, 255, 0.4)"}
                fontSize={compact ? 9 : 10}
                tickLine={false}
                fontFamily="monospace"
              />
            )}

            {showYAxis && (
              <YAxis
                domain={yDomain || [0, 100]}
                ticks={yTicks || (compact ? [0, 50, 100] : [0, 25, 50, 75, 100])}
                stroke={isLight ? "#64748b" : "rgba(255, 255, 255, 0.4)"}
                fontSize={compact ? 8 : 10}
                tickLine={false}
                fontFamily="monospace"
                width={compact ? 24 : 32}
              />
            )}

            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: isLight
                    ? "rgba(255, 255, 255, 0.95)"
                    : "rgba(11, 14, 23, 0.88)",
                  backdropFilter: "blur(20px)",
                  borderColor: isLight
                    ? "rgba(0, 0, 0, 0.1)"
                    : "rgba(255, 255, 255, 0.15)",
                  borderRadius: compact ? "8px" : "14px",
                  fontSize: compact ? "10px" : "12px",
                  padding: compact ? "4px 8px" : "8px 12px",
                  color: isLight ? "#0f172a" : "#ffffff",
                  boxShadow: isLight
                    ? "0 10px 30px rgba(0,0,0,0.08)"
                    : "0 10px 30px rgba(0,0,0,0.5)",
                }}
              />
            )}

            {series.map((s, idx) => {
              const gradId = `${chartId}_grad_${idx}`;
              const strokeColor =
                s.stroke || (isLight ? "#0284c7" : "#22d3ee");

              return (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={strokeColor}
                  strokeWidth={s.strokeWidth ?? (compact ? 1.75 : 2.5)}
                  fillOpacity={1}
                  fill={`url(#${gradId})`}
                  isAnimationActive={false}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

TelemetryAreaChart.displayName = "TelemetryAreaChart";
