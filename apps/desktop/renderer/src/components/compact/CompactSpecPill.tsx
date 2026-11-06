import React from "react";
import type { SpecDefinition, SpecRenderContext } from "./types";
import { CompactSparkline } from "./visuals/CompactSparkline";
import { CompactMicroBar } from "./visuals/CompactMicroBar";
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

    const specScheme = SPEC_SCHEMES[spec.id] || ACCENT_SCHEMES[settings.accentColor];
    const showSparkline = settings.gaugeStyle === "sparkline" && value.sparklinePoints && value.sparklinePoints.length > 1;

    return (
      <div
        className={`flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/70 dark:bg-white/[0.04] hover:bg-white/90 dark:hover:bg-white/[0.07] border border-black/10 dark:border-white/10 backdrop-blur-lg transition-all duration-150 shrink-0 ${className}`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className={`w-3.5 h-3.5 shrink-0 ${specScheme.text}`} />
          <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-white/60 uppercase">
            {spec.shortLabel}:
          </span>
          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
            {value.primary}
          </span>
        </div>

        {/* Optional mini sparkline or mini bar */}
        {showSparkline ? (
          <div className="w-12 h-4 shrink-0">
            <CompactSparkline
              data={value.sparklinePoints!}
              strokeColor={specScheme.stroke}
              fillFrom={specScheme.fillGradientFrom}
              fillTo={specScheme.fillGradientTo}
              height={16}
            />
          </div>
        ) : settings.gaugeStyle === "bar" && value.percent !== undefined ? (
          <div className="w-10 shrink-0">
            <CompactMicroBar
              percent={value.percent}
              height={3}
              status={value.status}
              barGradient={specScheme.barGradient}
            />
          </div>
        ) : null}
      </div>
    );
  }
);

CompactSpecPill.displayName = "CompactSpecPill";
