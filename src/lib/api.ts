export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
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

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Deduplicate concurrent refresh attempts.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      const data = (await parseBody(res)) as { access_token?: string } | null;
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
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { method = "GET", body, skipRefresh = false } = options;

  const doFetch = () => {
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    const headers: Record<string, string> = {};
    // For FormData the browser sets the multipart boundary header itself.
    if (body !== undefined && !isFormData) {
      headers["Content-Type"] = "application/json";
    }
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
    });
  };

  let res = await doFetch();

  if (res.status === 401 && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      accessToken = null;
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new ApiError(401, await parseBody(res));
    }
    res = await doFetch();
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseBody(res));
  }

  return (await parseBody(res)) as T;
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
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<void> {
  await apiFetch("/auth/register", {
    method: "POST",
    body: payload,
    skipRefresh: true,
  });
}

export async function login(payload: LoginPayload): Promise<void> {
  const data = await apiFetch<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: payload,
    skipRefresh: true,
  });
  setAccessToken(data.access_token);
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

export type RedirectProvider = "google" | "facebook";

export interface OAuthProviders {
  google: boolean;
  facebook: boolean;
  telegram: {
    enabled: boolean;
    bot_username: string | null;
    bot_id: number | null;
  };
}

/** Which social providers the backend has credentials configured for. */
export function getOAuthProviders(): Promise<OAuthProviders> {
  return apiFetch<OAuthProviders>("/oauth/providers", { skipRefresh: true });
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

export interface TelegramAuthPayload {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/** Verify a Telegram Login Widget payload and start a session. */
export async function telegramCallback(
  payload: TelegramAuthPayload,
): Promise<void> {
  const data = await apiFetch<{ access_token: string }>(
    "/oauth/telegram/callback",
    { method: "POST", body: payload, skipRefresh: true },
  );
  setAccessToken(data.access_token);
}
