/**
 * Stage-3 Facebook connection API layer.
 *
 * Every Facebook endpoint path used by the UI lives in this file so it can be
 * adjusted in one place when the backend contract changes.
 */
import { apiFetch } from "@/lib/api";
import { asList } from "./_shared";

// --- Types ---

export type FacebookConnectionStatus = "active" | "error";

export interface FacebookConnection {
  id: number | string;
  fb_user_id: string;
  name: string;
  status: FacebookConnectionStatus;
  error_message: string | null;
  token_expires_at: string | null;
  created_at: string;
}

export interface FacebookPage {
  id: number | string;
  name: string;
}

export interface FacebookForm {
  id: number | string;
  name: string;
  status: string;
}

export interface FacebookAdAccount {
  id: string;
  name: string;
}

// Some list endpoints may return either a bare array or an `{items: []}`
// envelope; normalize both shapes.

// --- Query keys ---

export const facebookKeys = {
  connections: ["facebook-connections"] as const,
  pages: (connectionId: string) =>
    ["facebook-pages", connectionId] as const,
  forms: (connectionId: string, pageId: string) =>
    ["facebook-forms", connectionId, pageId] as const,
  adAccounts: ["facebook-ad-accounts"] as const,
};

// --- OAuth ---

/** URL of the Facebook Login dialog; redirect the browser to it. */
export async function getFacebookOAuthUrl(): Promise<string> {
  const data = await apiFetch<{ url: string }>("/facebook/oauth/url");
  return data.url;
}

/** Exchange the `code`/`state` query params for a connection. */
export function completeFacebookOAuth(payload: {
  code: string;
  state: string;
}): Promise<FacebookConnection> {
  return apiFetch<FacebookConnection>("/facebook/oauth/callback", {
    method: "POST",
    body: payload,
  });
}

// --- Connections ---

export async function listFacebookConnections(): Promise<FacebookConnection[]> {
  return asList<FacebookConnection>(
    await apiFetch<unknown>("/facebook/connections"),
  );
}

export function deleteFacebookConnection(
  id: FacebookConnection["id"],
): Promise<void> {
  return apiFetch<void>(`/facebook/connections/${id}`, { method: "DELETE" });
}

// --- Pages & forms ---

export async function listFacebookPages(
  connectionId: FacebookConnection["id"],
): Promise<FacebookPage[]> {
  return asList<FacebookPage>(
    await apiFetch<unknown>(`/facebook/connections/${connectionId}/pages`),
  );
}

export async function listFacebookForms(
  connectionId: FacebookConnection["id"],
  pageId: FacebookPage["id"],
): Promise<FacebookForm[]> {
  return asList<FacebookForm>(
    await apiFetch<unknown>(
      `/facebook/connections/${connectionId}/pages/${pageId}/forms`,
    ),
  );
}

/** Ad accounts of the user's connected Facebook profile(s). */
export async function listFacebookAdAccounts(): Promise<FacebookAdAccount[]> {
  return asList<FacebookAdAccount>(
    await apiFetch<unknown>("/facebook/ad-accounts"),
  );
}

/** Subscribe the page to the leadgen webhook (idempotent on the backend). */
export function subscribeFacebookPage(
  connectionId: FacebookConnection["id"],
  pageId: FacebookPage["id"],
): Promise<void> {
  return apiFetch<void>(
    `/facebook/connections/${connectionId}/pages/${pageId}/subscribe`,
    { method: "POST" },
  );
}
