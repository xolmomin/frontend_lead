import type { DateRange } from "@/lib/api/finance";

/** Client-side date-range presets shared by finance and orders pages. */
export type DateRangePreset = "today" | "last7" | "last30" | "thisMonth";

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  "today",
  "last7",
  "last30",
  "thisMonth",
];

/** Local-timezone "YYYY-MM-DD". */
function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Inclusive [from, to] range for a preset, computed in the local timezone. */
export function presetRange(preset: DateRangePreset): DateRange {
  const now = new Date();
  const to = toIsoDate(now);

  switch (preset) {
    case "today":
      return { from: to, to };
    case "last7": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: toIsoDate(from), to };
    }
    case "last30": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: toIsoDate(from), to };
    }
    case "thisMonth":
      return {
        from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
        to,
      };
  }
}
