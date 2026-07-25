"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiKeyKeys,
  createApiKey,
  deleteApiKey,
  listApiKeys,
  type ApiKey,
  type CreateApiKeyPayload,
} from "@/lib/api/api-keys";

function useInvalidate() {
  const queryClient = useQueryClient();
  return (...keys: readonly (readonly unknown[])[]) => {
    for (const key of keys) {
      void queryClient.invalidateQueries({ queryKey: key as unknown[] });
    }
  };
}

// --- Queries ---

export function useApiKeys() {
  return useQuery({ queryKey: apiKeyKeys.list, queryFn: listApiKeys });
}

// --- Mutations ---

export function useCreateApiKey() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: CreateApiKeyPayload) => createApiKey(payload),
    onSuccess: () => invalidate(apiKeyKeys.list),
  });
}

export function useDeleteApiKey() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: ApiKey["id"]) => deleteApiKey(id),
    onSuccess: () => invalidate(apiKeyKeys.list),
  });
}
