import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "elevated" | "glass" | "interactive";
type Padding = "none" | "sm" | "md" | "lg";
type Accent = "brand" | "success" | "warning" | "danger" | "info";

const VARIANTS: Record<Variant, string> = {
  default: "bg-card text-card-foreground border border-border shadow-e1",
  elevated: "bg-card text-card-foreground border border-border shadow-e2",
  glass: "glass text-card-foreground shadow-e2",
  // Hover changes colour and shadow only — never scale/translate, which would
  // shift the neighbouring cards in a grid.
  interactive:
    "bg-card text-card-foreground border border-border shadow-e1 transition-[box-shadow,border-color] duration-200 hover:border-primary/40 hover:shadow-e2 cursor-pointer",
};

const PADDINGS: Record<Padding, string> = {
  none: "",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-6",
  lg: "p-6 sm:p-8",
};

const ACCENTS: Record<Accent, string> = {
  brand: "border-l-4 border-l-primary",
  success: "border-l-4 border-l-success",
  warning: "border-l-4 border-l-warning",
  danger: "border-l-4 border-l-destructive",
  info: "border-l-4 border-l-info",
};

export interface YbCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  padding?: Padding;
  accent?: Accent;
}

export const YbCard = forwardRef<HTMLDivElement, YbCardProps>(
  (
    {
      variant = "default",
      padding = "md",
      accent,
      children,
      className,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl",
        VARIANTS[variant],
        PADDINGS[padding],
        accent && ACCENTS[accent],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
YbCard.displayName = "YbCard";

export const YbCardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => (
  <div ref={ref} className={cn("mb-4", className)} {...props}>
    {children}
  </div>
));
YbCardHeader.displayName = "YbCardHeader";

export const YbCardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ children, className, ...props }, ref) => (
  <h3 ref={ref} className={cn("t-h3 text-foreground", className)} {...props}>
    {children}
  </h3>
));
YbCardTitle.displayName = "YbCardTitle";

export const YbCardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ children, className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("t-body-sm text-muted-foreground mt-1", className)}
    {...props}
  >
    {children}
  </p>
));
YbCardDescription.displayName = "YbCardDescription";

export const YbCardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-6 pt-4 border-t border-border", className)}
    {...props}
  >
    {children}
  </div>
));
YbCardFooter.displayName = "YbCardFooter";
