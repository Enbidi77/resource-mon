import React, { forwardRef } from 'react';
import { X } from 'lucide-react';
import { cn } from './utils';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  specular?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'h-8 px-2.5 text-xs',
  md: 'h-9 px-3 text-xs',
  lg: 'h-11 px-4 text-sm',
};

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      icon,
      rightElement,
      clearable = false,
      onClear,
      specular = true,
      inputSize = 'md',
      value,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasValue = Boolean(value && String(value).length > 0);

    return (
      <div
        className={cn(
          'relative flex items-center w-full rounded-xl transition-all duration-200 group',
          'bg-[var(--glass-surface-subtle)] backdrop-blur-md',
          'border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]',
          'focus-within:border-cyan-400/50 focus-within:ring-2 focus-within:ring-cyan-400/20',
          specular && 'shadow-[var(--glass-specular)]',
          disabled && 'opacity-50 pointer-events-none',
          className
        )}
      >
        {/* Specular Edge Highlight */}
        {specular && (
          <div
            className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent"
            aria-hidden="true"
          />
        )}

        {/* Leading Icon */}
        {icon && (
          <div className="pl-3 pr-1 text-[var(--text-secondary)] group-focus-within:text-cyan-400 transition-colors shrink-0">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          value={value}
          disabled={disabled}
          className={cn(
            'w-full bg-transparent text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none font-mono',
            sizeStyles[inputSize],
            icon && 'pl-1.5',
            (rightElement || (clearable && hasValue)) && 'pr-8'
          )}
          {...props}
        />

        {/* Clear Button */}
        {clearable && hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 p-1 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Right Element */}
        {rightElement && !clearable && (
          <div className="pr-3 shrink-0 flex items-center">{rightElement}</div>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

