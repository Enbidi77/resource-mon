import React from "react";
import type { SpecDefinition, SpecRenderContext } from "./types";
import { CompactSparkline } from "./visuals/CompactSparkline";
import { CompactMicroBar } from "./visuals/CompactMicroBar";
import { CompactMicroGauge } from "./visuals/CompactMicroGauge";
import { SPEC_SCHEMES, ACCENT_SCHEMES, STATUS_SCHEMES } from "./visuals/CompactThemeHelper";

interface CompactSpecCardProps {
  spec: SpecDefinition;
  context: SpecRenderContext;
  className?: string;
}

export const CompactSpecCard: React.FC<CompactSpecCardProps> = React.memo(
  ({ spec, context, className = "" }) => {
    const { settings } = context;
    const value = spec.extract(context);
    const Icon = spec.icon;

    // Use spec's canonical signature scheme, fallback to accent
    const specScheme = SPEC_SCHEMES[spec.id] || ACCENT_SCHEMES[settings.accentColor];
    const isAlert = value.status === "danger" || value.status === "warning";
    const statusScheme = isAlert && value.status ? STATUS_SCHEMES[value.status] : specScheme;

    const isDetailed = settings.density === "detailed";
    const gaugeStyle = settings.gaugeStyle;

    return (
      <div
        className={`group relative rounded-xl p-2.5 transition-all duration-200 bg-white/70 dark:bg-white/[0.04] hover:bg-white/90 dark:hover:bg-white/[0.07] border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 backdrop-blur-xl shadow-xs dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] overflow-hidden ${className}`}
      >
        {/* Subtle ambient accent glow on card hover */}
        <div
          className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-0 group-hover:opacity-25 transition-opacity duration-300 pointer-events-none blur-xl"
          style={{ backgroundColor: specScheme.stroke }}
        />

        {/* Card Header: Icon, Label, Status Indicator */}
        <div className="flex items-center justify-between gap-1.5 mb-1.5 relative z-10">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10 shadow-xs"
              style={{
                backgroundColor: specScheme.fillGradientFrom,
              }}
            >
              <Icon className={`w-3 h-3 ${specScheme.text}`} />
            </div>
            <span className="text-[11px] font-mono font-semibold tracking-wide text-slate-700 dark:text-white/80 truncate">
              {spec.shortLabel}
            </span>
          </div>

          {/* Micro Status Dot */}
          {value.status && (
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAlert ? "animate-pulse" : ""}`}
              style={{ backgroundColor: statusScheme.stroke }}
              title={`Status: ${value.status}`}
            />
          )}
        </div>

        {/* Primary & Secondary Values */}
        <div className="flex items-baseline justify-between gap-2 mb-1.5 relative z-10">
          <div className="text-sm font-bold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
            {value.primary}
          </div>
          {value.secondary && (
            <div className="text-[10px] font-mono text-slate-600 dark:text-white/60 truncate text-right tabular-nums">
              {value.secondary}
            </div>
          )}
        </div>

        {/* Visual Gauge Renderer */}
        <div className="relative z-10">
          {gaugeStyle === "sparkline" && value.sparklinePoints && value.sparklinePoints.length > 1 ? (
            <div className="mt-1">
              <CompactSparkline
                data={value.sparklinePoints}
                strokeColor={specScheme.stroke}
                fillFrom={specScheme.fillGradientFrom}
                fillTo={specScheme.fillGradientTo}
                height={22}
              />
            </div>
          ) : gaugeStyle === "gauge" && value.percent !== undefined ? (
            <div className="flex items-center justify-end mt-1">
              <CompactMicroGauge
                percent={value.percent}
                size={28}
                strokeWidth={3}
                status={value.status}
                strokeColor={specScheme.stroke}
              />
            </div>
          ) : gaugeStyle === "bar" && value.percent !== undefined ? (
            <div className="mt-1">
              <CompactMicroBar
                percent={value.percent}
                height={4}
                status={value.status}
                barGradient={specScheme.barGradient}
              />
            </div>
          ) : null}
        </div>

        {/* Detailed Key-Value Drawer (When density is Detailed) */}
        {isDetailed && value.details && value.details.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-black/[0.08] dark:border-white/[0.08] grid grid-cols-2 gap-1 text-[9px] font-mono relative z-10">
            {value.details.map((d, i) => (
              <div key={i} className="flex justify-between items-center text-slate-600 dark:text-white/60">
                <span className="truncate">{d.label}:</span>
                <span className="font-semibold text-slate-900 dark:text-white/90 truncate ml-1">
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

CompactSpecCard.displayName = "CompactSpecCard";
