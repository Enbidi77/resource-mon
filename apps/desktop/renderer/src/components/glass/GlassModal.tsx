import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from './utils';

export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const maxWidthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export const GlassModal: React.FC<GlassModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
          />

          {/* Floating Glass Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={cn(
              'relative w-full rounded-2xl overflow-hidden z-10',
              'bg-[var(--glass-surface-elevated)] backdrop-blur-2xl backdrop-saturate-200',
              'border border-[var(--glass-border)] shadow-[var(--glass-shadow-elevated)]',
              'shadow-[var(--glass-specular-bright)]',
              maxWidthStyles[maxWidth],
              className
            )}
          >
            {/* Specular Edge Highlight */}
            <div
              className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none"
              aria-hidden="true"
            />

            {/* Modal Header */}
            {(title || subtitle) && (
              <div className="p-4 sm:p-5 border-b border-[var(--glass-border-subtle)] flex items-center justify-between">
                <div>
                  {title && (
                    <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] font-mono">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-4 sm:p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

