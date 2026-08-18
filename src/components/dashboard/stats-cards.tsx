"use client";

import type { ReactNode } from "react";
import { YbStatCard, type StatTone } from "@/components/yb/stat-card";

export function StatCard({
  label,
  value,
  leadsLabel,
  icon,
  tone = "brand",
  loading = false,
  errors,
  deliveredLabel,
  failedLabel,
}: {
  label: string;
  value: number;
  leadsLabel: string;
  icon: ReactNode;
  tone?: StatTone;
  loading?: boolean;
  errors?: number;
  deliveredLabel?: string;
  failedLabel?: string;
}) {
  const showBreakdown = errors !== undefined && value > 0;
  const delivered = Math.max(0, value - (errors ?? 0));

  return (
    <YbStatCard
      label={label}
      value={value.toLocaleString()}
      unit={leadsLabel}
      icon={icon}
      tone={tone}
      loading={loading}
      footer={
        showBreakdown ? (
          <div className="mt-1 flex items-center gap-2.5 text-[11px] font-medium">
            {/* A dot alongside the colour, so status does not rely on hue alone. */}
            <span
              className="t-numeric inline-flex items-center gap-1 text-success"
              title={deliveredLabel}
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-success"
                aria-hidden="true"
              />
              {delivered.toLocaleString()}
            </span>
            {(errors ?? 0) > 0 && (
              <span
                className="t-numeric inline-flex items-center gap-1 text-destructive"
                title={failedLabel}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full bg-destructive"
                  aria-hidden="true"
                />
                {(errors ?? 0).toLocaleString()}
              </span>
            )}
          </div>
        ) : undefined
      }
    />
  );
}
