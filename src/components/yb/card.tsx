import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "glass" | "elevated";

const VARIANTS: Record<Variant, string> = {
  default:
    "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm",
  glass: "glass shadow-lg",
  elevated:
    "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300",
};

export interface YbCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

export const YbCard = forwardRef<HTMLDivElement, YbCardProps>(
  ({ variant = "default", children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl p-6", VARIANTS[variant], className)}
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
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold text-gray-900 dark:text-gray-100",
      className,
    )}
    {...props}
  >
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
    className={cn("text-sm text-gray-600 dark:text-gray-400 mt-1", className)}
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
    className={cn(
      "mt-6 pt-4 border-t border-gray-200 dark:border-gray-700",
      className,
    )}
    {...props}
  >
    {children}
  </div>
));
YbCardFooter.displayName = "YbCardFooter";
