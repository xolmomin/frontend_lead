"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { billingKeys } from "@/lib/api/billing";
import {
  domainKeys,
  listDomains,
  purchaseDomain,
  searchDomains,
} from "@/lib/api/domains";

function useInvalidate() {
  const queryClient = useQueryClient();
  return (...keys: readonly (readonly unknown[])[]) => {
    for (const key of keys) {
      void queryClient.invalidateQueries({ queryKey: key as unknown[] });
    }
  };
}

// --- Queries ---

export function useDomains() {
  return useQuery({ queryKey: domainKeys.owned, queryFn: listDomains });
}

/** Runs only after the user submits a non-empty search query. */
export function useDomainSearch(query: string) {
  return useQuery({
    queryKey: domainKeys.search(query),
    queryFn: () => searchDomains(query),
    enabled: query.length > 0,
  });
}

// --- Mutations ---

export function usePurchaseDomain() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (name: string) => purchaseDomain(name),
    // The purchase is charged from the balance — refresh it together with the
    // owned-domains list and any cached search results (availability changed).
    onSuccess: () =>
      invalidate(domainKeys.owned, billingKeys.balance, ["domains-search"]),
  });
}
