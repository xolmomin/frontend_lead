"use client";

/**
 * Shapes, palette and chrome shared by the chart shell (leads-chart.tsx) and
 * the recharts-backed graphs (leads-chart-graphs.tsx). Split out so the shell
 * can render its skeleton without pulling recharts into the initial bundle.
 */

import type { ReactNode } from "react";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Clock,
  TrendingUp,
} from "lucide-react";
import { YbCard, YbCardHeader } from "@/components/yb/card";
import type { ChartPoint } from "@/lib/api/stats";

// CSS custom properties rather than literals, so the charts follow the active
// theme — the old hex values were tuned for light mode and stayed put in dark.
export const SUCCESS_COLOR = "var(--success)";
export const ERROR_COLOR = "var(--destructive)";
/** Highlight for the in-progress bar/point. Teal-cyan, not the old indigo. */
export const CURRENT_COLOR = "var(--chart-2)";

export const PERIODS = [
  "hourly",
  "weekly",
  "daily",
  "monthly",
  "yearly",
] as const;
export type Period = (typeof PERIODS)[number];

// Local `/stats/chart` query parameters per production tab.
export const PERIOD_QUERY: Record<Period, { period: string; days: number }> = {
  hourly: { period: "hourly", days: 1 },
  weekly: { period: "daily", days: 7 },
  daily: { period: "daily", days: 30 },
  monthly: { period: "monthly", days: 365 },
  yearly: { period: "yearly", days: 1825 },
};

export const MONTHS_FULL: Record<string, string[]> = {
  uz: [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentabr",
    "Oktabr",
    "Noyabr",
    "Dekabr",
  ],
  ru: [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

export const MONTHS_SHORT: Record<string, string[]> = {
  uz: [
    "Yan",
    "Fev",
    "Mar",
    "Apr",
    "May",
    "Iyn",
    "Iyl",
    "Avg",
    "Sen",
    "Okt",
    "Noy",
    "Dek",
  ],
  ru: [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
  ],
  en: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
};

export type Translate = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

export interface AreaPoint {
  date: string;
  total: number;
  errors: number;
  success: number;
  label: string;
  tooltipLabel?: string;
  isCurrent?: boolean;
  isToday?: boolean;
  hour?: string;
}

export function pointTotal(p: ChartPoint): number {
  return (p.delivered ?? 0) + (p.failed ?? 0);
}

export function hourLabel(date: string, index: number): string {
  if (/^\d{1,2}$/.test(date)) return date.padStart(2, "0");
  const isoMatch = date.match(/[T ](\d{2})/);
  if (isoMatch) return isoMatch[1];
  return String(index).padStart(2, "0");
}

export function PeriodIcon({ period }: { period: Period }) {
  if (period === "hourly")
    return <Clock className="w-4 h-4" aria-hidden="true" />;
  if (period === "weekly")
    return <TrendingUp className="w-4 h-4" aria-hidden="true" />;
  if (period === "daily")
    return <CalendarDays className="w-4 h-4" aria-hidden="true" />;
  if (period === "monthly")
    return <CalendarRange className="w-4 h-4" aria-hidden="true" />;
  return <BarChart3 className="w-4 h-4" aria-hidden="true" />;
}

const SKELETON_BARS = [35, 55, 78, 62, 45, 70, 88, 50, 32, 60, 75, 48];

export function ChartSkeleton({
  icon,
  tall = false,
}: {
  icon: ReactNode;
  tall?: boolean;
}) {
  return (
    <YbCard variant="elevated">
      <YbCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground/50">
              {icon}
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-28 sm:w-36 rounded bg-muted animate-pulse" />
              <div className="h-3 w-16 rounded bg-muted/60 animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-12 rounded bg-muted animate-pulse" />
        </div>
      </YbCardHeader>
      <div>
        <div
          className={`${tall ? "h-72 sm:h-80" : "h-64 sm:h-72"} flex items-end gap-1.5 sm:gap-2 pb-4 pr-2`}
        >
          {SKELETON_BARS.map((height, index) => (
            <div
              key={index}
              className="flex-1 rounded-t bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-800/40 animate-pulse"
              style={{
                height: `${height}%`,
                animationDelay: `${index * 70}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </YbCard>
  );
}
