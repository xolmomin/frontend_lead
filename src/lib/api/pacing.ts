/**
 * Stage-6 Lead pacing (monthly goals) API layer.
 *
 * Every pacing endpoint path used by the UI lives in this file so it can be
 * adjusted in one place when the backend contract changes.
 */
import { apiFetch } from "@/lib/api";
import { asList } from "./_shared";

// --- Types ---

export type PacingScope = "account" | "integration";

export interface PacingGoal {
  id: number | string;
  scope: PacingScope;
  integration_id: number | string | null;
  integration_name: string | null;
  monthly_goal: number;
  current_month_leads: number;
  daily_target: number;
  today_leads: number;
  on_track: boolean;
}

export interface CreatePacingGoalPayload {
  scope: PacingScope;
  integration_id?: number | string;
  monthly_goal: number;
}

export interface UpdatePacingGoalPayload {
  monthly_goal: number;
}

// Some list endpoints may return either a bare array or an `{items: []}`
// envelope; normalize both shapes.

// --- Query keys ---

export const pacingKeys = {
  list: ["pacing"] as const,
};

// --- Fetchers ---

export async function listPacingGoals(): Promise<PacingGoal[]> {
  return asList<PacingGoal>(await apiFetch<unknown>("/pacing"));
}

export function createPacingGoal(
  payload: CreatePacingGoalPayload,
): Promise<PacingGoal> {
  return apiFetch<PacingGoal>("/pacing", { method: "POST", body: payload });
}

export function updatePacingGoal(
  id: PacingGoal["id"],
  payload: UpdatePacingGoalPayload,
): Promise<PacingGoal> {
  return apiFetch<PacingGoal>(`/pacing/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deletePacingGoal(id: PacingGoal["id"]): Promise<void> {
  return apiFetch<void>(`/pacing/${id}`, { method: "DELETE" });
}
