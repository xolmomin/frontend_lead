"use client";

import { useQuery } from "@tanstack/react-query";
import { listRecentLeads, type Lead } from "@/lib/api/integrations";
import {
  getPlan,
  getSetupStatus,
  getStatsByIntegration,
  getStatsChart,
  getStatsSummary,
  listRecentActivity,
  statsKeys,
  type RecentLead,
} from "@/lib/api/stats";

export function useStatsSummary() {
  return useQuery({ queryKey: statsKeys.summary, queryFn: getStatsSummary });
}

export function useStatsChart(days = 14) {
  return useQuery({
    queryKey: statsKeys.chart(days),
    queryFn: () => getStatsChart(days),
  });
}

export function useStatsByIntegration(window = "week") {
  return useQuery({
    queryKey: statsKeys.byIntegration(window),
    queryFn: () => getStatsByIntegration(window),
  });
}

/** `data === null` means the endpoint is unavailable — hide the section. */
export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: statsKeys.activity(limit),
    queryFn: () => listRecentActivity(limit),
  });
}

export function useSetupStatus() {
  return useQuery({
    queryKey: statsKeys.setupStatus,
    queryFn: getSetupStatus,
  });
}

/** `data === null` means billing is not live yet — use the static fallback. */
export function usePlan() {
  return useQuery({
    queryKey: statsKeys.plan,
    queryFn: getPlan,
    retry: false,
  });
}

export function useRecentLeads(limit = 10) {
  return useQuery({
    queryKey: statsKeys.recentLeads(limit),
    queryFn: async (): Promise<RecentLead[]> =>
      (await listRecentLeads(limit)) as (Lead & RecentLead)[],
  });
}
