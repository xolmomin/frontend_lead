/**
 * Stage-6 Domains API layer.
 *
 * Every domains endpoint path lives in this file so it can be adjusted in one
 * place when the backend contract changes.
 */
import { apiFetch } from "@/lib/api";

// --- Types ---

export type DomainStatus = "active" | "pending" | "expired";

export interface OwnedDomain {
  id: number | string;
  name: string;
  price: string | number;
  status: DomainStatus;
  expires_at: string | null;
  created_at: string;
}

export interface DomainSearchResult {
  name: string;
  available: boolean;
  price: string | number;
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

export const domainKeys = {
  owned: ["domains"] as const,
  search: (q: string) => ["domains-search", q] as const,
};

// --- Fetchers ---

export async function listDomains(): Promise<OwnedDomain[]> {
  return asList<OwnedDomain>(await apiFetch<unknown>("/domains"));
}

export async function searchDomains(q: string): Promise<DomainSearchResult[]> {
  return asList<DomainSearchResult>(
    await apiFetch<unknown>(`/domains/search?q=${encodeURIComponent(q)}`),
  );
}

/**
 * Purchase a domain for one year; the price is charged from the account
 * balance. Throws `ApiError` with `status === 402` and `data: {detail}` when
 * the balance is insufficient.
 */
export function purchaseDomain(name: string): Promise<OwnedDomain> {
  return apiFetch<OwnedDomain>("/domains/purchase", {
    method: "POST",
    body: { name },
  });
}
