import React, { forwardRef } from "react";
import { X } from "lucide-react";
import { cn } from "./utils";

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
  specular?: boolean;
  inputSize?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "h-8 px-2.5 text-xs",
  md: "h-9 px-3 text-xs",
  lg: "h-11 px-4 text-sm",
};

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      icon,
      rightElement,
      clearable = false,
      onClear,
      specular = true,
      inputSize = "md",
      value,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const hasValue = Boolean(value && String(value).length > 0);

    return (
      <div
        className={cn(
          "relative flex items-center w-full rounded-xl transition-all duration-200 group",
          "bg-black/[0.04] dark:bg-white/[0.04] backdrop-blur-xl",
          "border border-black/[0.08] dark:border-white/10 hover:border-black/[0.15] dark:hover:border-white/20",
          "focus-within:border-cyan-500/60 dark:focus-within:border-cyan-400/50 focus-within:ring-2 focus-within:ring-cyan-500/20",
          specular && "shadow-[var(--glass-specular)]",
          disabled && "opacity-50 pointer-events-none",
          className,
        )}
      >
        {/* Specular Edge Highlight */}
        {specular && (
          <div
            className="absolute top-0 inset-x-0 h-px pointer-events-none bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent"
            aria-hidden="true"
          />
        )}

        {/* Leading Icon */}
        {icon && (
          <div className="pl-3 pr-1 text-slate-400 dark:text-white/40 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors shrink-0">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          value={value}
          disabled={disabled}
          className={cn(
            "w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 outline-none font-mono",
            sizeStyles[inputSize],
            icon && "pl-1.5",
            (rightElement || (clearable && hasValue)) && "pr-8",
          )}
          {...props}
        />

        {/* Clear Button */}
        {clearable && hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:text-white/50 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
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
  },
);

GlassInput.displayName = "GlassInput";
