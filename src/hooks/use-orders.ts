"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { DateRange } from "@/lib/api/finance";
import {
  getOrdersSummary,
  listOrders,
  orderKeys,
  type OrdersFilters,
} from "@/lib/api/orders";

export function useOrders(filters: OrdersFilters) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => listOrders(filters),
    placeholderData: keepPreviousData,
  });
}

export function useOrdersSummary(range: DateRange) {
  return useQuery({
    queryKey: orderKeys.summary(range),
    queryFn: () => getOrdersSummary(range),
    placeholderData: keepPreviousData,
  });
}
