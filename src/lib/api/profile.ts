/**
 * Profile / settings API layer.
 *
 * Every profile endpoint path used by the settings page lives in this file so
 * it can be adjusted in one place when the backend contract changes.
 */
import { apiFetch, type User } from "@/lib/api";

export const userKeys = {
  me: ["me"] as const,
};

// Fields the production settings page reads that the base `User` type does not
// guarantee yet — all optional so missing backend data degrades gracefully.
export interface ProfileUser extends User {
  name?: string | null;
  image?: string | null;
  telegram_id?: number | string | null;
  has_password?: boolean;
}

export interface UpdateSettingsPayload {
  name: string;
  email: string;
  phone: string;
  telegram_id?: string;
}

export interface UpdatePasswordPayload {
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}

export function updateSettings(payload: UpdateSettingsPayload): Promise<void> {
  return apiFetch<void>("/me", { method: "PATCH", body: payload });
}

export function updatePassword(payload: UpdatePasswordPayload): Promise<void> {
  return apiFetch<void>("/me/password", { method: "POST", body: payload });
}

export function updateImage(form: FormData): Promise<void> {
  return apiFetch<void>("/me/image", { method: "POST", body: form });
}

export async function getTelegramConnectToken(): Promise<{
  token: string;
} | null> {
  return apiFetch<{ token: string } | null>("/me/telegram-connect-token", {
    method: "POST",
  });
}
