"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { YbCard } from "@/components/yb/card";
import { YbSpinner } from "@/components/yb/spinner";

export function StatCard({
  label,
  value,
  leadsLabel,
  icon,
  iconBgGradient,
  loading = false,
  errors,
  deliveredLabel,
  failedLabel,
}: {
  label: string;
  value: number;
  leadsLabel: string;
  icon: ReactNode;
  iconBgGradient: string;
  loading?: boolean;
  errors?: number;
  deliveredLabel?: string;
  failedLabel?: string;
}) {
  const showBreakdown = errors !== undefined && value > 0;
  const delivered = Math.max(0, value - (errors ?? 0));

  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <YbCard
        variant="elevated"
        className="h-full flex flex-col justify-center p-3 sm:p-4 hover:shadow-lg transition-shadow duration-300"
      >
        <div>
          {loading ? (
            <div className="flex items-center justify-center h-10">
              <YbSpinner size="sm" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                  iconBgGradient,
                )}
                aria-hidden="true"
              >
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {label}
                </p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                  {value.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                    {leadsLabel}
                  </span>
                </p>
                {showBreakdown && (
                  <div className="flex items-center gap-2.5 mt-1 text-[11px] font-medium">
                    <span
                      className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 tabular-nums"
                      title={deliveredLabel}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                        aria-hidden="true"
                      />
                      {delivered.toLocaleString()}
                    </span>
                    {(errors ?? 0) > 0 && (
                      <span
                        className="inline-flex items-center gap-1 text-red-500 tabular-nums"
                        title={failedLabel}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-red-500"
                          aria-hidden="true"
                        />
                        {(errors ?? 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </YbCard>
    </div>
  );
}
