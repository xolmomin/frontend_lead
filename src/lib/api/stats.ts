/**
 * Stage-4 Dashboard stats API layer.
 *
 * Every stats/dashboard endpoint path used by the overview page lives in this
 * file so it can be adjusted in one place when the backend contract changes.
 */
import { ApiError, apiFetch } from "@/lib/api";
import type { Lead } from "@/lib/api/integrations";
import { asList } from "./_shared";

// --- Types ---

export interface StatsSummary {
  today: number;
  week: number;
  month: number;
  delivered_today: number;
  failed_today: number;
}

export interface ChartPoint {
  /** "YYYY-MM-DD" */
  date: string;
  delivered: number;
  failed: number;
}

export interface IntegrationStat {
  integration_id: number | string;
  name: string;
  total: number;
  delivered: number;
  failed: number;
  pending: number;
}

export interface ActivityItem {
  id: number | string;
  type: string;
  message: string;
  created_at: string;
}

export interface SetupStatus {
  has_delivery_connection: boolean;
  has_integration: boolean;
  has_facebook_connection: boolean;
  has_lead: boolean;
}

export interface PlanInfo {
  plan_name: string;
  lead_limit: number;
  leads_used: number;
  period_ends_at: string | null;
}

/**
 * `/leads/recent` items may carry integration context on top of the base lead
 * shape; both fields are optional until the backend guarantees them.
 */
export interface RecentLead extends Lead {
  integration_id?: number | string | null;
  integration_name?: string | null;
}

// Some list endpoints may return either a bare array or an `{items: []}`
// envelope; normalize both shapes.

// --- Query keys ---

export const statsKeys = {
  summary: ["stats-summary"] as const,
  chart: (days: number) => ["stats-chart", days] as const,
  byIntegration: (window: string) => ["stats-by-integration", window] as const,
  activity: (limit: number) => ["activity-recent", limit] as const,
  setupStatus: ["dashboard-setup-status"] as const,
  plan: ["plan"] as const,
  recentLeads: (limit: number) => ["recent-leads", limit] as const,
};

// --- Fetchers ---

export function getStatsSummary(): Promise<StatsSummary> {
  return apiFetch<StatsSummary>("/stats/summary");
}

export async function getStatsChart(
  days = 14,
  period = "daily",
): Promise<ChartPoint[]> {
  return asList<ChartPoint>(
    await apiFetch<unknown>(`/stats/chart?period=${period}&days=${days}`),
  );
}

/** Sorted desc by total on the backend. */
export async function getStatsByIntegration(
  window = "week",
): Promise<IntegrationStat[]> {
  return asList<IntegrationStat>(
    await apiFetch<unknown>(`/stats/by-integration?window=${window}`),
  );
}

/**
 * Returns `null` when the endpoint is not available yet (404) so the section
 * can hide itself gracefully.
 */
export async function listRecentActivity(
  limit = 10,
): Promise<ActivityItem[] | null> {
  try {
    return asList<ActivityItem>(
      await apiFetch<unknown>(`/activity/recent?limit=${limit}`),
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function getSetupStatus(): Promise<SetupStatus> {
  return apiFetch<SetupStatus>("/dashboard/setup-status");
}

/**
 * Billing lands in stage 5 — the endpoint may 404 until then. Returns `null`
 * in that case so the sidebar widget can fall back to static content.
 */
export async function getPlan(): Promise<PlanInfo | null> {
  try {
    return await apiFetch<PlanInfo>("/plan");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
