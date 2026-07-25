/**
 * Stage-5 Billing API layer.
 *
 * Every billing endpoint path (plans, subscription, balance, payments) lives in
 * this file so it can be adjusted in one place when the backend contract
 * changes. The current-plan endpoint (`GET /plan`) stays in `@/lib/api/stats`
 * because the sidebar widget consumed it before billing existed — reuse
 * `usePlan` from `@/hooks/use-stats` instead of duplicating it here.
 */
import { ApiError, apiFetch } from "@/lib/api";

// --- Types ---

export interface BillingPlan {
  id: number | string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  /** `null` means unlimited leads. */
  lead_limit: number | null;
  is_free: boolean;
}

export type BillingPeriod = "monthly" | "yearly";

export interface SubscribePayload {
  plan_id: BillingPlan["id"];
  period: BillingPeriod;
}

export interface BalanceInfo {
  balance: string | number;
}

export type PaymentMethod = "receipt" | "online";
export type PaymentStatus = "pending" | "confirmed" | "rejected";

export interface Payment {
  id: number | string;
  amount: string | number;
  method: PaymentMethod;
  status: PaymentStatus;
  receipt_filename?: string | null;
  comment?: string | null;
  created_at: string;
}

export interface PaymentRequisites {
  card_number: string;
  card_holder: string;
}

export interface OnlinePaymentResponse {
  payment_url: string;
}

// Some list endpoints may return either a bare array or an `{items: []}`
// envelope; normalize both shapes.
function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { items?: unknown }).items)
  ) {
    return (data as { items: T[] }).items;
  }
  return [];
}

// --- Query keys ---

export const billingKeys = {
  plans: ["billing-plans"] as const,
  balance: ["billing-balance"] as const,
  payments: ["billing-payments"] as const,
  requisites: ["billing-requisites"] as const,
};

// --- Fetchers ---

export async function listPlans(): Promise<BillingPlan[]> {
  return asList<BillingPlan>(await apiFetch<unknown>("/plans"));
}

/**
 * Subscribe to a plan. Throws `ApiError` with `status === 402` and
 * `data: {detail}` when the balance is insufficient.
 */
export function subscribePlan(payload: SubscribePayload): Promise<unknown> {
  return apiFetch<unknown>("/plan/subscribe", {
    method: "POST",
    body: payload,
  });
}

/**
 * Returns `null` when the endpoint is not available yet (404) so the sidebar
 * widget can fall back to its static content.
 */
export async function getBalance(): Promise<BalanceInfo | null> {
  try {
    return await apiFetch<BalanceInfo>("/balance");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function listPayments(): Promise<Payment[]> {
  return asList<Payment>(await apiFetch<unknown>("/payments"));
}

export function getPaymentRequisites(): Promise<PaymentRequisites> {
  return apiFetch<PaymentRequisites>("/payments/requisites");
}

/** Upload a bank-transfer receipt (image or pdf); creates a pending payment. */
export function uploadReceipt(payload: {
  amount: number;
  receipt: File;
}): Promise<Payment> {
  const form = new FormData();
  form.append("amount", String(payload.amount));
  form.append("receipt", payload.receipt);
  return apiFetch<Payment>("/payments/receipt", {
    method: "POST",
    body: form,
  });
}

/** Start an online payment (Payme/Click stub); open `payment_url` in a new tab. */
export function createOnlinePayment(
  amount: number,
): Promise<OnlinePaymentResponse> {
  return apiFetch<OnlinePaymentResponse>("/payments/online", {
    method: "POST",
    body: { amount },
  });
}
