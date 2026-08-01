import type { DateRange } from "@/lib/api/finance";

/**
 * Production-style time windows shared by the finance insights and orders
 * pages. The production API accepts these tokens directly; the local API works
 * with inclusive [from, to] ranges, so each window is mapped to a range here.
 */
export const FINANCE_WINDOWS = ["today", "yesterday", "7d", "30d"] as const;
export type FinanceWindow = (typeof FINANCE_WINDOWS)[number];

export function isFinanceWindow(
  value: string | null | undefined,
): value is FinanceWindow {
  return FINANCE_WINDOWS.some((window) => window === value);
}

/** Local-timezone "YYYY-MM-DD". */
function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Inclusive [from, to] range for a window, computed in the local timezone. */
export function financeWindowRange(window: FinanceWindow): DateRange {
  const now = new Date();
  const today = toIsoDate(now);
  switch (window) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const date = new Date(now);
      date.setDate(date.getDate() - 1);
      const day = toIsoDate(date);
      return { from: day, to: day };
    }
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: toIsoDate(from), to: today };
    }
    case "30d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: toIsoDate(from), to: today };
    }
  }
}

/** "$1,234.56" — production USD formatting. */
export const formatUsd = (value?: number | null): string =>
  "$" + (value ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

/** "1,234" — production count formatting. */
export const formatCount = (value?: number | null): string =>
  (value ?? 0).toLocaleString();
