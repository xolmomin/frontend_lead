import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info";
type Size = "sm" | "md" | "lg";
type Tone = "soft" | "solid";

const SOFT: Record<Variant, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/12 text-primary",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-destructive-muted text-destructive",
  info: "bg-info-muted text-info",
};

const SOLID: Record<Variant, string> = {
  default: "bg-foreground/80 text-background",
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-destructive text-destructive-foreground",
  info: "bg-info text-info-foreground",
};

// Dot colour when `dot` is set — gives status a second, non-colour cue.
const DOTS: Record<Variant, string> = {
  default: "bg-muted-foreground",
  primary: "bg-primary",
  secondary: "bg-secondary-foreground",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
};

const SIZES: Record<Size, string> = {
  sm: "px-2 py-0.5 text-xs gap-1",
  md: "px-2.5 py-1 text-sm gap-1.5",
  lg: "px-3 py-1.5 text-base gap-1.5",
};

export interface YbBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
  tone?: Tone;
  dot?: boolean;
}

export const YbBadge = forwardRef<HTMLSpanElement, YbBadgeProps>(
  (
    {
      variant = "default",
      size = "md",
      tone = "soft",
      dot = false,
      children,
      className,
      ...props
    },
    ref,
  ) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-full whitespace-nowrap",
        tone === "solid" ? SOLID[variant] : SOFT[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            tone === "solid" ? "bg-current opacity-80" : DOTS[variant],
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  ),
);
YbBadge.displayName = "YbBadge";
