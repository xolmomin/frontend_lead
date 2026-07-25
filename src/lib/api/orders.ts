/**
 * Stage-6 CPA orders API layer.
 *
 * Every orders endpoint path used by the UI lives in this file so it can be
 * adjusted in one place when the backend contract changes.
 */
import { apiFetch } from "@/lib/api";
import type { DateRange } from "@/lib/api/finance";

// --- Types ---

export type OrderStatus =
  | "pending"
  | "accepted"
  | "delivered"
  | "cancelled"
  | "archived";

export interface Order {
  id: number | string;
  external_id: string;
  campaign: string | null;
  status: OrderStatus;
  payout: number;
  created_at: string;
}

export interface OrdersPage {
  items: Order[];
  total: number;
}

export interface OrdersSummary {
  total: number;
  pending: number;
  accepted: number;
  delivered: number;
  cancelled: number;
  payout_total: number;
}

export interface OrdersFilters extends DateRange {
  status?: OrderStatus | "";
  page: number;
}

// --- Query keys ---

export const orderKeys = {
  list: (filters: OrdersFilters) =>
    [
      "orders",
      filters.status ?? "",
      filters.from,
      filters.to,
      filters.page,
    ] as const,
  summary: (range: DateRange) =>
    ["orders-summary", range.from, range.to] as const,
};

// --- Fetchers ---

export async function listOrders(filters: OrdersFilters): Promise<OrdersPage> {
  const params = new URLSearchParams({
    from: filters.from,
    to: filters.to,
    page: String(filters.page),
  });
  if (filters.status) params.set("status", filters.status);
  const data = await apiFetch<unknown>(`/orders?${params.toString()}`);
  // Normalize a bare array (no envelope) into the page shape.
  if (Array.isArray(data)) {
    return { items: data as Order[], total: (data as Order[]).length };
  }
  const page = data as Partial<OrdersPage> | null;
  return {
    items: Array.isArray(page?.items) ? page.items : [],
    total: typeof page?.total === "number" ? page.total : 0,
  };
}

export function getOrdersSummary(range: DateRange): Promise<OrdersSummary> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  return apiFetch<OrdersSummary>(`/orders/summary?${params.toString()}`);
}
