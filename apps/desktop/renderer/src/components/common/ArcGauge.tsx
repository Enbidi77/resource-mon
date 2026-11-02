import React from 'react';

interface ArcGaugeProps {
  value: number; // 0 - 100
  title: string;
  subtitle?: string;
  size?: number;
  color?: string; // CSS color or gradient
  showTicks?: boolean;
}

export const ArcGauge: React.FC<ArcGaugeProps> = ({
  value,
  title,
  subtitle,
  size = 220,
  color = '#10b981',
  showTicks = true,
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const totalTicks = 28;
  const activeTicks = Math.round((clamped / 100) * totalTicks);

  // SVG dimensions
  const center = size / 2;
  const radius = size * 0.4;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.7}`} className="overflow-visible">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="60%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {/* Ticks rendering */}
        {showTicks &&
          Array.from({ length: totalTicks }).map((_, i) => {
            // Angle range from 180 (left) to 360/0 (right)
            const angle = 180 + (i / (totalTicks - 1)) * 180;
            const rad = (angle * Math.PI) / 180;
            const isFilled = i <= activeTicks;

            const r1 = radius - 8;
            const r2 = radius + 6;

            const x1 = center + r1 * Math.cos(rad);
            const y1 = center * 0.85 + r1 * Math.sin(rad);
            const x2 = center + r2 * Math.cos(rad);
            const y2 = center * 0.85 + r2 * Math.sin(rad);

            let strokeColor = 'rgba(255, 255, 255, 0.12)';
            if (isFilled) {
              if (clamped < 60) strokeColor = '#10b981';
              else if (clamped < 85) strokeColor = '#38bdf8';
              else strokeColor = '#ef4444';
            }

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth={4.5}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            );
          })}

        {/* Value Label inside */}
        <text
          x={center}
          y={center * 0.78}
          textAnchor="middle"
          className="fill-white font-extrabold text-3xl font-mono tracking-tight"
        >
          {Math.round(clamped)}%
        </text>
        <text
          x={center}
          y={center * 0.95}
          textAnchor="middle"
          className="fill-slate-400 text-xs font-medium"
        >
          {subtitle || 'calculated value'}
        </text>
      </svg>
      <div className="text-sm font-semibold text-slate-200 mt-1">{title}</div>
    </div>
  );
};
