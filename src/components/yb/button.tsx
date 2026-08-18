"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "gradient"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "warning";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  // Flat brand fill is the default across the app. `gradient` keeps the
  // marketing look for the hero/CTA buttons that still want it.
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-e1 hover:shadow-e2 active:bg-primary/95",
  gradient:
    "bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white shadow-e2 hover:shadow-e3",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
  outline:
    "border border-primary text-primary bg-transparent hover:bg-primary/10",
  ghost: "text-foreground/80 hover:text-foreground hover:bg-muted",
  danger:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-e1 hover:shadow-e2",
  warning:
    "border border-warning/60 bg-warning-muted text-warning hover:bg-warning/20",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5 min-h-9",
  md: "px-4 py-2.5 text-base rounded-lg gap-2 min-h-11",
  lg: "px-6 py-3 text-lg rounded-xl gap-2.5 min-h-12",
  // Icon-only buttons must still clear the 44px touch target.
  icon: "w-11 h-11 rounded-lg shrink-0",
};

export interface YbButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const YbButton = forwardRef<HTMLButtonElement, YbButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      className,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center font-medium transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && leftIcon && (
        <span className="flex-shrink-0">{leftIcon}</span>
      )}
      <span className="inline-flex items-center gap-1.5">{children}</span>
      {!loading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </button>
  ),
);
YbButton.displayName = "YbButton";
