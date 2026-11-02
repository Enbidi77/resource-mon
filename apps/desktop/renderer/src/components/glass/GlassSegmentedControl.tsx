import React from 'react';
import { motion } from 'framer-motion';
import { cn } from './utils';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface GlassSegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function GlassSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
}: GlassSegmentedControlProps<T>) {
  const controlId = React.useId();

  return (
    <div
      className={cn(
        'inline-flex items-center p-1 rounded-xl relative select-none',
        'bg-[var(--glass-surface-subtle)] backdrop-blur-md border border-[var(--glass-border-subtle)] shadow-inner',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 font-mono transition-colors duration-150 flex items-center justify-center gap-1.5 cursor-pointer',
              size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-xs',
              isSelected
                ? 'text-cyan-400 font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            {isSelected && (
              <motion.div
                layoutId={`segmented-active-${controlId}`}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-lg bg-[var(--glass-surface-elevated)] border border-[var(--glass-border)] shadow-[var(--glass-shadow-soft)] -z-10"
              >
                {/* Specular Edge Highlight on active pill */}
                <div
                  className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  aria-hidden="true"
                />
              </motion.div>
            )}

            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

