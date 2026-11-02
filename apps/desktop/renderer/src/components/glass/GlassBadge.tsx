import React from 'react';
import { cn } from './utils';

export type GlassBadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'cyan'
  | 'purple';

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: GlassBadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  pulsing?: boolean;
  specular?: boolean;
}

const variantStyles: Record<GlassBadgeVariant, { badge: string; dot: string }> = {
  default: {
    badge: 'bg-slate-700/30 text-slate-300 border-white/10 dark:text-slate-300 light:text-slate-700',
    dot: 'bg-slate-400',
  },
  success: {
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-emerald-500/10',
    dot: 'bg-emerald-400',
  },
  warning: {
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25 shadow-amber-500/10',
    dot: 'bg-amber-400',
  },
  danger: {
    badge: 'bg-red-500/15 text-red-400 border-red-500/25 shadow-red-500/10',
    dot: 'bg-red-400',
  },
  info: {
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25 shadow-blue-500/10',
    dot: 'bg-blue-400',
  },
  cyan: {
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25 shadow-cyan-500/10',
    dot: 'bg-cyan-400',
  },
  purple: {
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/25 shadow-purple-500/10',
    dot: 'bg-purple-400',
  },
};

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  variant = 'default',
  size = 'md',
  dot = false,
  pulsing = false,
  specular = true,
  className,
  children,
  ...props
}) => {
  const config = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-medium rounded-full border backdrop-blur-md transition-colors select-none',
        config.badge,
        size === 'sm' ? 'px-2 py-0.5 text-[9px] tracking-wider' : 'px-2.5 py-0.5 text-[10px] tracking-wide',
        specular && 'shadow-[var(--glass-specular)]',
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            config.dot,
            pulsing && 'animate-pulse'
          )}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

