import React from 'react';
import { cn } from './utils';

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
        'rounded-2xl border border-[var(--glass-border)] overflow-hidden flex flex-col',
        'bg-[var(--glass-surface-solid)] shadow-[var(--glass-shadow-soft)] relative',
        'transition-colors duration-200',
        className
      )}
      {...props}
    >
      {/* Specular Edge Highlight */}
      <div
        className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Header Container */}
      {header && (
        <div className="bg-[var(--glass-surface-subtle)] border-b border-[var(--glass-border-subtle)] px-4 py-3">
          {header}
        </div>
      )}

      {/* Scrollable Table Area */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* Footer Container */}
      {footer && (
        <div className="bg-[var(--glass-surface-subtle)] border-t border-[var(--glass-border-subtle)] px-4 py-2 text-[11px] font-mono text-[var(--text-secondary)]">
          {footer}
        </div>
      )}
    </div>
  );
};

