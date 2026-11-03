import React, { forwardRef } from "react";
import { cn } from "./utils";

export type GlassElevation = "base" | "subtle" | "elevated" | "solid";
export type GlassBlur = "none" | "sm" | "md" | "lg";
export type GlassRounded = "none" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: GlassElevation;
  blur?: GlassBlur;
  rounded?: GlassRounded;
  specular?: boolean;
  border?: boolean;
  children?: React.ReactNode;
}

const elevationClasses: Record<GlassElevation, string> = {
  base: "bg-[var(--glass-surface)] shadow-[var(--glass-shadow-soft)]",
  subtle: "bg-[var(--glass-surface-subtle)]",
  elevated:
    "bg-[var(--glass-surface-elevated)] shadow-[var(--glass-shadow-elevated)]",
  solid: "bg-[var(--glass-surface-solid)] shadow-[var(--glass-shadow-soft)]",
};

const blurClasses: Record<GlassBlur, string> = {
  none: "",
  sm: "backdrop-blur-lg backdrop-saturate-180",
  md: "backdrop-blur-2xl backdrop-saturate-190",
  lg: "backdrop-blur-3xl backdrop-saturate-200",
};

const roundedClasses: Record<GlassRounded, string> = {
  none: "rounded-none",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
};

export const GlassSurface = forwardRef<HTMLDivElement, GlassSurfaceProps>(
  (
    {
      elevation = "base",
      blur = "md",
      rounded = "2xl",
      specular = true,
      border = true,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "transition-all duration-200",
          elevationClasses[elevation],
          elevation !== "solid" && blurClasses[blur],
          roundedClasses[rounded],
          border && "border border-black/[0.08] dark:border-white/10",
          specular && "shadow-[var(--glass-specular)]",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GlassSurface.displayName = "GlassSurface";
