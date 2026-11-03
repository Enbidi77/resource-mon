import React from "react";
import { cn } from "./utils";

export interface GlassTableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const GlassTableContainer: React.FC<GlassTableContainerProps> = ({
  header,
  footer,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.08] dark:border-white/10 overflow-hidden flex flex-col",
        "bg-white/70 dark:bg-white/[0.035] backdrop-blur-2xl backdrop-saturate-180",
        "shadow-md dark:shadow-2xl dark:shadow-black/40 relative",
        "transition-all duration-200",
        className,
      )}
      {...props}
    >
      {/* Specular Edge Highlight */}
      <div
        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/30 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Header Container */}
      {header && (
        <div className="bg-black/[0.03] dark:bg-white/[0.04] backdrop-blur-xl border-b border-black/[0.08] dark:border-white/10 px-4 py-3 shrink-0 select-none">
          {header}
        </div>
      )}

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* Footer Container */}
      {footer && (
        <div className="bg-black/[0.03] dark:bg-white/[0.03] backdrop-blur-xl border-t border-black/[0.08] dark:border-white/10 px-4 py-2.5 text-[11px] font-mono text-slate-600 dark:text-white/70 shrink-0 select-none">
          {footer}
        </div>
      )}
    </div>
  );
};
