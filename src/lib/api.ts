// The access token below is a module-level global. That is safe in the browser
// (one module instance per tab) and catastrophic on the server, where a single
// module instance is shared by every concurrent request — user A's bearer token
// would be attached to user B's fetch. "client-only" turns any accidental
// Server Component import of this file into a build error instead.
import "client-only";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

/** How long a single request may run before it is aborted. */
const REQUEST_TIMEOUT_MS = 15_000;

let accessToken: string | null = null;

// Notified on login/logout identity changes (NOT on silent refresh) so the
// query cache can be wiped — otherwise user B sees user A's cached data.
const authChangeHandlers = new Set<() => void>();

/** Returns an unsubscribe; without it a remount would leak the previous handler. */
export function registerAuthChangeHandler(handler: () => void) {
  authChangeHandlers.add(handler);
  return () => {
    authChangeHandlers.delete(handler);
  };
}

// The backend sets this cookie too, but on its own domain — when the API runs
// on a different site (e.g. cloudflared tunnels) the Next middleware would
// never see it, so we mirror it on the frontend domain as well.
// Without "remember me" the marker is a session cookie, so it dies with the
// browser just like the backend's refresh cookie.
function setSessionMarker(present: boolean, remember = true) {
  if (typeof document === "undefined") return;
  if (!present) {
    document.cookie = "logged_in=; path=/; max-age=0; samesite=lax";
    return;
  }
  document.cookie = remember
    ? "logged_in=1; path=/; max-age=2592000; samesite=lax"
    : "logged_in=1; path=/; samesite=lax";
}

export function setAccessToken(token: string | null, remember = true) {
  accessToken = token;
  setSessionMarker(token !== null, remember);
  authChangeHandlers.forEach((handler) => handler());
}

export function getAccessToken() {
  return accessToken;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`API error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/** Status used for failures that never reached the backend (offline, DNS, CORS, timeout). */
export const NETWORK_ERROR_STATUS = 0;

export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === NETWORK_ERROR_STATUS;
}

export function isStatus(error: unknown, ...statuses: number[]): boolean {
  return error instanceof ApiError && statuses.includes(error.status);
}

/**
 * Parses a response body as JSON.
 *
 * Anything non-JSON (a reverse-proxy interstitial, a tunnel error page, an HTML
 * 500) is an error, never a value: returning the raw string here would let
 * `apiFetch<T>` hand a string back typed as a domain object, and the first
 * property access downstream would blow up the whole React tree instead.
 */
async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    throw new ApiError(res.status, {
      detail: "non_json_response",
      contentType,
      body: text.slice(0, 500),
    });
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(res.status, {
      detail: "invalid_json",
      body: text.slice(0, 500),
    });
  }
}

/** Body reader for error paths — must never throw over the original failure. */
async function parseBodySafe(res: Response): Promise<unknown> {
  try {
    return await parseBody(res);
  } catch (error) {
    return error instanceof ApiError ? error.data : null;
  }
}

// Deduplicate concurrent refresh attempts.
let refreshPromise: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) return false;
      const data = (await parseBodySafe(res)) as { access_token?: string } | null;
      if (data?.access_token) {
        accessToken = data.access_token;
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  /** Skip the 401 -> refresh -> retry cycle (used for auth endpoints). */
  skipRefresh?: boolean;
  /**
   * Caller-side cancellation, e.g. React Query's `queryFn({ signal })`.
   * Always combined with an internal timeout.
   */
  signal?: AbortSignal;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { method = "GET", body, skipRefresh = false, signal } = options;

  const doFetch = async () => {
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    const headers: Record<string, string> = {};
    // For FormData the browser sets the multipart boundary header itself.
    if (body !== undefined && !isFormData) {
      headers["Content-Type"] = "application/json";
    }
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    // A hung backend must not leave queries pending forever, and an unmounted
    // view must be able to cancel — so caller signal and timeout are merged.
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    try {
      return await fetch(`${API_URL}${path}`, {
        method,
        headers,
        credentials: "include",
        // Per-user JSON must never be served from a shared/intermediary cache.
        cache: "no-store",
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        body:
          body === undefined
            ? undefined
            : isFormData
              ? (body as FormData)
              : JSON.stringify(body),
      });
    } catch (error) {
      // Let genuine caller cancellation propagate so React Query can ignore it.
      if (signal?.aborted) throw error;
      // Everything else (offline, DNS, CORS preflight, timeout) arrives here as
      // a bare TypeError/DOMException, which would slip past every
      // `instanceof ApiError` check downstream.
      throw new ApiError(NETWORK_ERROR_STATUS, {
        detail: timeout.aborted ? "timeout" : "network",
        cause: error instanceof Error ? error.message : String(error),
      });
    }
  };

  let res = await doFetch();

  if (res.status === 401 && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doFetch();
    }
    if (!refreshed || res.status === 401) {
      // Session is gone (refresh failed, or the new token was rejected too).
      accessToken = null;
      setSessionMarker(false);
      redirectToLogin();
      throw new ApiError(401, await parseBodySafe(res));
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseBodySafe(res));
  }

  return (await parseBody(res)) as T;
}

/** Full reload to /login, preserving where the user was headed. */
function redirectToLogin() {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (pathname === "/login") return;
  const next = encodeURIComponent(`${pathname}${search}`);
  window.location.href = `/login?next=${next}`;
}

// --- Auth API ---

export interface User {
  id: number | string;
  email: string;
  phone?: string | null;
  full_name?: string | null;
  balance?: number;
  locale?: string;
}

export interface RegisterPayload {
  email: string;
  phone: string;
  full_name: string;
  password: string;
}

export interface LoginPayload {
  /** Email address or phone number (digits only). */
  email: string;
  password: string;
  /** Keep the session for 30 days instead of until the browser closes. */
  remember?: boolean;
}

export async function register(payload: RegisterPayload): Promise<void> {
  await apiFetch("/auth/register", {
    method: "POST",
    body: payload,
    skipRefresh: true,
  });
}

export async function login(payload: LoginPayload): Promise<void> {
  const remember = payload.remember ?? false;
  const data = await apiFetch<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: { ...payload, remember },
    skipRefresh: true,
  });
  setAccessToken(data.access_token, remember);
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST", skipRefresh: true });
  } finally {
    setAccessToken(null);
  }
}

export function getMe(): Promise<User> {
  return apiFetch<User>("/me");
}

// --- Social login (OAuth2) ---

export type RedirectProvider = "google" | "facebook" | "telegram";

export interface OAuthProviders {
  google: boolean;
  facebook: boolean;
  telegram: boolean;
}

/** Which social providers the backend has credentials configured for. */
export function getOAuthProviders(
  signal?: AbortSignal,
): Promise<OAuthProviders> {
  return apiFetch<OAuthProviders>("/oauth/providers", {
    skipRefresh: true,
    signal,
  });
}

/** Get the provider consent URL to redirect the browser to. */
export async function getOAuthUrl(provider: RedirectProvider): Promise<string> {
  const data = await apiFetch<{ url: string }>(`/oauth/${provider}/url`, {
    skipRefresh: true,
  });
  return data.url;
}

/** Exchange the code returned on the OAuth callback for a session. */
export async function oauthCallback(
  provider: RedirectProvider,
  code: string,
  state: string,
): Promise<void> {
  const data = await apiFetch<{ access_token: string }>(
    `/oauth/${provider}/callback`,
    { method: "POST", body: { code, state }, skipRefresh: true },
  );
  setAccessToken(data.access_token);
}
