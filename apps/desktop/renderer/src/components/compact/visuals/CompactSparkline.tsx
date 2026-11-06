import React, { useId, useMemo } from "react";

interface CompactSparklineProps {
  data: number[];
  strokeColor?: string;
  fillFrom?: string;
  fillTo?: string;
  height?: number;
  width?: number | string;
  min?: number;
  max?: number;
  className?: string;
}

export const CompactSparkline: React.FC<CompactSparklineProps> = React.memo(
  ({
    data,
    strokeColor = "#06b6d4",
    fillFrom = "rgba(6, 182, 212, 0.4)",
    fillTo = "rgba(6, 182, 212, 0.0)",
    height = 24,
    width = "100%",
    min: forcedMin,
    max: forcedMax,
    className = "",
  }) => {
    const gradientId = useId();

    const { linePath, areaPath } = useMemo(() => {
      if (!data || data.length < 2) {
        return { linePath: "", areaPath: "" };
      }

      const svgWidth = 100;
      const svgHeight = height;
      const padding = 2;

      const minVal = forcedMin !== undefined ? forcedMin : Math.min(...data);
      const maxVal = forcedMax !== undefined ? forcedMax : Math.max(...data);
      const range = maxVal - minVal <= 0 ? 1 : maxVal - minVal;

      const points = data.map((val, index) => {
        const x = (index / (data.length - 1)) * svgWidth;
        const normalized = (val - minVal) / range;
        // Invert Y because SVG coordinates go top-down
        const y = svgHeight - padding - normalized * (svgHeight - padding * 2);
        return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
      });

      // Construct line path
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
      }

      // Construct area path closing at the bottom
      const area = `${d} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

      return { linePath: d, areaPath: area };
    }, [data, height, forcedMin, forcedMax]);

    if (!linePath) {
      return (
        <div
          style={{ height }}
          className={`flex items-center justify-center opacity-30 text-[9px] font-mono ${className}`}
        >
          - - -
        </div>
      );
    }

    return (
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        style={{ width, height }}
        className={`overflow-visible select-none pointer-events-none ${className}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillFrom} />
            <stop offset="100%" stopColor={fillTo} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
);

CompactSparkline.displayName = "CompactSparkline";

