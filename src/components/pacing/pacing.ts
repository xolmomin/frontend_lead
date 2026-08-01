/**
 * Port of the production `pacing` service helper (status resolution, coverage
 * notes, progress-bar gradients, pct clamping) plus a derivation layer that
 * maps the local `/pacing` API shape onto the richer card model the
 * production Lead Pacing UI renders.
 *
 * The production backend returns `plan_pct` / `projected_pct` /
 * `required_daily` / `severity` precomputed; the local API only exposes
 * monthly goal counters, so the pure-arithmetic fields are derived here from
 * the goal counters and the current date.
 */
import type { PacingGoal } from "@/lib/api/pacing";

// Production scope types. The local API only supports "account" and
// "integration" (rendered with the production "form" scope labels);
// fb_account / ad_account exist in the UI as disabled options only.
export type PacingScopeType = "account" | "form" | "fb_account" | "ad_account";

export type StatusVariant = "success" | "warning" | "danger" | "info";

export type StatusKey =
  | "onTrack"
  | "behind"
  | "severe"
  | "complete"
  | "early"
  | "upcoming"
  | "finished";

export interface PacingStatus {
  key: StatusKey;
  variant: StatusVariant;
}

/** Card model mirroring the production `/lead-targets/` target payload. */
export interface PacingCardData {
  goal: PacingGoal;
  scope_type: "account" | "form";
  scope_label: string | null;
  target: number;
  month_to_date: number;
  today: number;
  fixed_daily: number;
  required_daily: number;
  plan_pct: number;
  projected_pct: number | null;
  is_complete: boolean;
  is_finished: boolean;
  not_started: boolean;
  severity: 0 | 1 | 2;
  mode: "monthly" | "custom";
  period_start: string | null;
  period_end: string | null;
  day_of_month: number;
  days_in_month: number;
  coverage: string | null;
}

/** 1:1 port of the production status resolver. */
export function pacingStatus(p: PacingCardData): PacingStatus {
  return p.not_started
    ? { key: "upcoming", variant: "info" }
    : p.is_complete
      ? { key: "complete", variant: "success" }
      : p.is_finished
        ? { key: "finished", variant: "info" }
        : p.projected_pct === null
          ? { key: "early", variant: "info" }
          : p.severity >= 2
            ? { key: "severe", variant: "danger" }
            : p.severity === 1
              ? { key: "behind", variant: "warning" }
              : { key: "onTrack", variant: "success" };
}

/** 1:1 port: only paid-only coverage produces a note. */
export function coverageNote(coverage: string | null): "paid_only" | null {
  return coverage === "paid_only" ? "paid_only" : null;
}

/** 1:1 port of the production progress-bar gradient per status variant. */
export function progressBarClass(variant: StatusVariant): string {
  switch (variant) {
    case "danger":
      return "bg-gradient-to-r from-red-500 to-red-600";
    case "warning":
      return "bg-gradient-to-r from-yellow-500 to-orange-500";
    case "info":
      return "bg-gradient-to-r from-blue-500 to-blue-600";
    default:
      return "bg-gradient-to-r from-green-500 to-green-600";
  }
}

/** 1:1 port: clamp a percentage into [0, 100]. */
export function clampPct(value: number | null | undefined): number {
  return value == null || Number.isNaN(value)
    ? 0
    : Math.min(Math.max(value, 0), 100);
}

/** Production number formatting (ru-RU grouping). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value));
}

/** "YYYY-MM-DD" -> "DD.MM" (production custom-period label). */
export function formatPeriodDay(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}.${month}`;
}

/**
 * Derive the production card model from a local pacing goal.
 *
 * - `plan_pct` / `projected_pct` / `required_daily` are pure arithmetic over
 *   the goal counters and the current date (projection unlocks from day 4,
 *   like production).
 * - `severity` approximates the production server-side value: the API's
 *   `on_track` flag decides on-track vs behind, and "severe" kicks in when
 *   actual progress is under half of the time-expected progress.
 * - The local API has no custom periods, so `mode` is always "monthly".
 */
export function toPacingCard(goal: PacingGoal): PacingCardData {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  const target = goal.monthly_goal;
  const monthToDate = goal.current_month_leads;
  const planPct = target > 0 ? (monthToDate / target) * 100 : 0;
  const projectedPct =
    target > 0 && dayOfMonth >= 4
      ? ((monthToDate / dayOfMonth) * daysInMonth * 100) / target
      : null;
  const isComplete = target > 0 && monthToDate >= target;
  const remainingDays = Math.max(1, daysInMonth - dayOfMonth + 1);
  const requiredDaily = isComplete
    ? 0
    : Math.max(0, (target - monthToDate) / remainingDays);
  const expectedPct = (dayOfMonth / daysInMonth) * 100;
  const severity: 0 | 1 | 2 = goal.on_track
    ? 0
    : planPct < expectedPct / 2
      ? 2
      : 1;

  return {
    goal,
    scope_type: goal.scope === "account" ? "account" : "form",
    scope_label:
      goal.scope === "account"
        ? null
        : (goal.integration_name ??
          (goal.integration_id != null ? String(goal.integration_id) : null)),
    target,
    month_to_date: monthToDate,
    today: goal.today_leads,
    fixed_daily: goal.daily_target,
    required_daily: requiredDaily,
    plan_pct: planPct,
    projected_pct: projectedPct,
    is_complete: isComplete,
    is_finished: false,
    not_started: false,
    severity,
    mode: "monthly",
    period_start: null,
    period_end: null,
    day_of_month: dayOfMonth,
    days_in_month: daysInMonth,
    coverage: null,
  };
}
