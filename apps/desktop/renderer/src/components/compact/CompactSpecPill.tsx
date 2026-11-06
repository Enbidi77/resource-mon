import React from "react";
import type { SpecDefinition, SpecRenderContext } from "./types";
import { CompactSparkline } from "./visuals/CompactSparkline";
import { CompactMicroBar } from "./visuals/CompactMicroBar";
import { CompactMicroGauge } from "./visuals/CompactMicroGauge";
import { TelemetryAreaChart } from "../common";
import { SPEC_SCHEMES, ACCENT_SCHEMES } from "./visuals/CompactThemeHelper";

interface CompactSpecPillProps {
  spec: SpecDefinition;
  context: SpecRenderContext;
  className?: string;
}

export const CompactSpecPill: React.FC<CompactSpecPillProps> = React.memo(
  ({ spec, context, className = "" }) => {
    const { settings } = context;
    const value = spec.extract(context);
    const Icon = spec.icon;

    const specScheme =
      SPEC_SCHEMES[spec.id] || ACCENT_SCHEMES[settings.accentColor];
    const showSparkline =
      settings.gaugeStyle === "sparkline" &&
      value.sparklinePoints &&
      value.sparklinePoints.length > 1;

    return (
      <div
        className={`flex items-center justify-between gap-2.5 w-full px-2.5 py-1.5 rounded-lg bg-white/70 dark:bg-white/[0.04] hover:bg-white/90 dark:hover:bg-white/[0.07] border border-black/10 dark:border-white/10 backdrop-blur-lg transition-all duration-150 shrink-0 overflow-hidden ${className}`}
      >
        {/* Left Side: Icon, Spec Short Label, Value */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
          <Icon className={`w-3.5 h-3.5 shrink-0 ${specScheme.text}`} />
          <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-white/60 uppercase shrink-0">
            {spec.shortLabel}:
          </span>
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums truncate">
            {value.primary}
          </span>
        </div>

        {/* Right Side: Spec Visualization Aligned to the Right */}
        <div className="shrink-0 flex items-center justify-end ml-auto">
          {showSparkline ? (
            <div className="w-14 h-4 shrink-0">
              <CompactSparkline
                data={value.sparklinePoints!}
                strokeColor={specScheme.stroke}
                fillFrom={specScheme.fillGradientFrom}
                fillTo={specScheme.fillGradientTo}
                height={16}
              />
            </div>
          ) : settings.gaugeStyle === "chart" ? (
            <div className="w-16 h-5 shrink-0 flex items-center justify-end">
              <TelemetryAreaChart
                data={
                  value.sparklinePoints && value.sparklinePoints.length > 1
                    ? value.sparklinePoints
                    : value.percent !== undefined
                      ? [value.percent, value.percent]
                      : [0, 0]
                }
                height={20}
                width={64}
                series={[
                  {
                    dataKey: "value",
                    name: spec.shortLabel,
                    stroke: specScheme.stroke,
                    gradientFrom: specScheme.fillGradientFrom,
                    gradientTo: specScheme.fillGradientTo,
                    strokeWidth: 1.5,
                  },
                ]}
                showXAxis={false}
                showYAxis={false}
                showGrid={false}
                showTooltip={false}
                compact={true}
              />
            </div>
          ) : settings.gaugeStyle === "gauge" && value.percent !== undefined ? (
            <div className="w-5 h-5 shrink-0 flex items-center justify-end">
              <CompactMicroGauge
                percent={value.percent}
                size={18}
                strokeWidth={2.5}
                status={value.status}
                strokeColor={specScheme.stroke}
              />
            </div>
          ) : (settings.gaugeStyle === "bar" || !settings.gaugeStyle) &&
            value.percent !== undefined ? (
            <div className="w-14 sm:w-16 shrink-0">
              <CompactMicroBar
                percent={value.percent}
                height={3.5}
                status={value.status}
                barGradient={specScheme.barGradient}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);

CompactSpecPill.displayName = "CompactSpecPill";
