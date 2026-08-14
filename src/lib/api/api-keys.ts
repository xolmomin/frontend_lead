/**
 * Stage-6 API Keys API layer.
 *
 * Every api-keys endpoint path lives in this file so it can be adjusted in one
 * place when the backend contract changes.
 */
import { apiFetch } from "@/lib/api";
import { asList } from "./_shared";

// --- Types ---

export interface ApiKey {
  id: number | string;
  name: string;
  site: string;
  /** Masked like "wLxkRmWc***". */
  key_masked: string;
  created_at: string;
}

/** Returned only by the create endpoint — the full key is shown exactly once. */
export interface ApiKeyWithSecret extends ApiKey {
  key: string;
}

export interface CreateApiKeyPayload {
  name: string;
  site: string;
}

// Some list endpoints may return either a bare array or an `{items: []}`
// envelope; normalize both shapes.

// --- Query keys ---

export const apiKeyKeys = {
  list: ["api-keys"] as const,
};

// --- Fetchers ---

export async function listApiKeys(): Promise<ApiKey[]> {
  return asList<ApiKey>(await apiFetch<unknown>("/api-keys"));
}

export function createApiKey(
  payload: CreateApiKeyPayload,
): Promise<ApiKeyWithSecret> {
  return apiFetch<ApiKeyWithSecret>("/api-keys", {
    method: "POST",
    body: payload,
  });
}

export function deleteApiKey(id: ApiKey["id"]): Promise<void> {
  return apiFetch<void>(`/api-keys/${id}`, { method: "DELETE" });
}
