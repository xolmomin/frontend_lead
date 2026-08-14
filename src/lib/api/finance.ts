/**
 * Stage-6 Finance insights API layer.
 *
 * Every finance endpoint path used by the UI lives in this file so it can be
 * adjusted in one place when the backend contract changes.
 */
import { apiFetch } from "@/lib/api";
import { asList } from "./_shared";

// --- Types ---

/** ISO "YYYY-MM-DD" bounds, inclusive. */
export interface DateRange {
  from: string;
  to: string;
}

export interface CurrencyRate {
  usd_uzs: number;
  updated_at: string | null;
}

export interface FinanceOverview {
  profit: number;
  roas: number;
  cpl: number;
  spend: number;
  revenue: number;
  hold: number;
  /** Percentage 0-100. */
  delivery_rate: number;
  currency_rate: CurrencyRate | null;
}

export interface FinanceDailyPoint {
  /** "YYYY-MM-DD" */
  date: string;
  spend: number;
  revenue: number;
  profit: number;
  leads: number;
}

export interface CampaignFinance {
  campaign_id: number | string;
  campaign_name: string;
  leads: number;
  accepted: number;
  delivered: number;
  spend: number;
  cpl: number;
  roas: number;
  profit: number;
}

export interface PlatformFinance {
  platform: string;
  leads: number;
  delivered: number;
  revenue: number;
}

// Some list endpoints may return either a bare array or an `{items: []}`
// envelope; normalize both shapes.

function rangeQuery(range: DateRange): string {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  return params.toString();
}

// --- Query keys ---

export const financeKeys = {
  overview: (range: DateRange) =>
    ["finance-overview", range.from, range.to] as const,
  daily: (range: DateRange) => ["finance-daily", range.from, range.to] as const,
  byCampaign: (range: DateRange) =>
    ["finance-by-campaign", range.from, range.to] as const,
  byPlatform: (range: DateRange) =>
    ["finance-by-platform", range.from, range.to] as const,
};

// --- Fetchers ---

export function getFinanceOverview(range: DateRange): Promise<FinanceOverview> {
  return apiFetch<FinanceOverview>(`/finance/overview?${rangeQuery(range)}`);
}

export async function getFinanceDaily(
  range: DateRange,
): Promise<FinanceDailyPoint[]> {
  return asList<FinanceDailyPoint>(
    await apiFetch<unknown>(`/finance/daily?${rangeQuery(range)}`),
  );
}

export async function getFinanceByCampaign(
  range: DateRange,
): Promise<CampaignFinance[]> {
  return asList<CampaignFinance>(
    await apiFetch<unknown>(`/finance/by-campaign?${rangeQuery(range)}`),
  );
}

export async function getFinanceByPlatform(
  range: DateRange,
): Promise<PlatformFinance[]> {
  return asList<PlatformFinance>(
    await apiFetch<unknown>(`/finance/by-platform?${rangeQuery(range)}`),
  );
}
