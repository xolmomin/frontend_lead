"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { YbCard } from "./card";
import { YbSkeleton } from "./skeleton";

/**
 * `tone` replaces the free-form gradient string the old StatCard took, which
 * let each call site invent its own colour (blue/purple/green) and pulled the
 * dashboard off the teal brand.
 */
export type StatTone = "brand" | "success" | "warning" | "danger" | "neutral";

const TONES: Record<StatTone, string> = {
  brand: "bg-primary/12 text-primary",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-destructive-muted text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

export function YbStatCard({
  label,
  value,
  unit,
  icon,
  tone = "brand",
  loading = false,
  footer,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  icon?: ReactNode;
  tone?: StatTone;
  loading?: boolean;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <YbCard
      variant="elevated"
      padding="sm"
      className={cn("h-full flex flex-col justify-center", className)}
    >
      {loading ? (
        <div className="flex items-center gap-3">
          <YbSkeleton className="h-10 w-10 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <YbSkeleton className="h-3 w-20" />
            <YbSkeleton className="h-5 w-16" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {icon && (
            <div
              className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10",
                TONES[tone],
              )}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="t-numeric text-lg font-bold leading-tight text-foreground sm:text-xl">
              {value}
              {unit && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {unit}
                </span>
              )}
            </p>
            {footer}
          </div>
        </div>
      )}
    </YbCard>
  );
}
