"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  financeKeys,
  getFinanceByCampaign,
  getFinanceByPlatform,
  getFinanceDaily,
  getFinanceOverview,
  type DateRange,
} from "@/lib/api/finance";

export function useFinanceOverview(range: DateRange) {
  return useQuery({
    queryKey: financeKeys.overview(range),
    queryFn: () => getFinanceOverview(range),
    placeholderData: keepPreviousData,
  });
}

export function useFinanceDaily(range: DateRange) {
  return useQuery({
    queryKey: financeKeys.daily(range),
    queryFn: () => getFinanceDaily(range),
    placeholderData: keepPreviousData,
  });
}

export function useFinanceByCampaign(range: DateRange) {
  return useQuery({
    queryKey: financeKeys.byCampaign(range),
    queryFn: () => getFinanceByCampaign(range),
    placeholderData: keepPreviousData,
  });
}

export function useFinanceByPlatform(range: DateRange) {
  return useQuery({
    queryKey: financeKeys.byPlatform(range),
    queryFn: () => getFinanceByPlatform(range),
    placeholderData: keepPreviousData,
  });
}
