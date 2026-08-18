import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";
type Variant = "primary" | "secondary" | "white";

const SIZES: Record<Size, string> = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-3",
  xl: "w-16 h-16 border-4",
};

const VARIANTS: Record<Variant, string> = {
  primary: " border-primary/35 border-t-primary-600",
  secondary: "border-secondary-200 border-t-secondary-600",
  white: "border-white/20 border-t-white",
};

export interface YbSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: Size;
  variant?: Variant;
}

export const YbSpinner = forwardRef<HTMLDivElement, YbSpinnerProps>(
  ({ size = "md", variant = "primary", className, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn(
        "animate-spin rounded-full",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  ),
);
YbSpinner.displayName = "YbSpinner";
