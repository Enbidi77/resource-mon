import React, { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from './utils';

export type GlassButtonVariant = 'primary' | 'glass' | 'secondary' | 'danger' | 'ghost';
export type GlassButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';

export interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  loading?: boolean;
  specular?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<GlassButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 border border-white/20',
  glass:
    'bg-[var(--glass-surface)] text-[var(--text-primary)] backdrop-blur-md border border-[var(--glass-border)] shadow-[var(--glass-shadow-soft)] hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-surface-elevated)]',
  secondary:
    'bg-[var(--glass-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--glass-border-subtle)] hover:border-[var(--glass-border)] hover:bg-[var(--glass-surface)]',
  danger:
    'bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25 hover:text-red-300 shadow-sm shadow-red-500/10',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-surface-subtle)] border border-transparent hover:border-[var(--glass-border-subtle)]',
};

const sizeStyles: Record<GlassButtonSize, string> = {
  xs: 'h-6 px-2 text-[10px] rounded-md gap-1.5',
  sm: 'h-8 px-3 text-xs rounded-lg gap-2',
  md: 'h-9 px-4 text-xs rounded-xl gap-2 font-medium',
  lg: 'h-11 px-5 text-sm rounded-xl gap-2.5 font-semibold',
  icon: 'w-8 h-8 rounded-lg p-0 flex items-center justify-center',
};

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      variant = 'glass',
      size = 'md',
      loading = false,
      specular = true,
      icon,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.02 } : undefined}
        whileTap={!isDisabled ? { scale: 0.96 } : undefined}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        className={cn(
          'relative inline-flex items-center justify-center select-none font-mono cursor-pointer transition-colors duration-150 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50',
          variantStyles[variant],
          sizeStyles[size],
          specular && 'shadow-[var(--glass-specular)]',
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        {...props}
      >
        {/* Specular Edge Highlight */}
        {specular && !isDisabled && (
          <div
            className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-white/30 to-transparent"
            aria-hidden="true"
          />
        )}

        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}

        {children && <span>{children}</span>}
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

