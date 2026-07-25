/**
 * Stage-6 FB Ads daily report settings API layer.
 *
 * Every reports endpoint path used by the UI lives in this file so it can be
 * adjusted in one place when the backend contract changes.
 */
import { apiFetch } from "@/lib/api";

// --- Types ---

export type ReportFormat = "short" | "detailed";
export type ReportStatus = "active" | "paused";

export interface Report {
  id: number | string;
  ad_account_id: string;
  ad_account_name: string | null;
  chat_id: string;
  /** "HH:MM" */
  send_time: string;
  period: string;
  campaigns_limit: number;
  format: ReportFormat;
  status: ReportStatus;
  last_sent_at: string | null;
  created_at: string;
}

export interface CreateReportPayload {
  ad_account_id: string;
  chat_id: string;
  send_time: string;
  period: string;
  campaigns_limit: number;
  format: ReportFormat;
}

export type UpdateReportPayload = Partial<CreateReportPayload> & {
  status?: ReportStatus;
};

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

export const reportKeys = {
  list: ["reports"] as const,
};

// --- Fetchers ---

export async function listReports(): Promise<Report[]> {
  return asList<Report>(await apiFetch<unknown>("/reports"));
}

export function createReport(payload: CreateReportPayload): Promise<Report> {
  return apiFetch<Report>("/reports", { method: "POST", body: payload });
}

export function updateReport(
  id: Report["id"],
  payload: UpdateReportPayload,
): Promise<Report> {
  return apiFetch<Report>(`/reports/${id}`, { method: "PATCH", body: payload });
}

export function deleteReport(id: Report["id"]): Promise<void> {
  return apiFetch<void>(`/reports/${id}`, { method: "DELETE" });
}

/** One-off send; the backend responds 202 and queues the report. */
export function sendReportNow(id: Report["id"]): Promise<void> {
  return apiFetch<void>(`/reports/${id}/send-now`, { method: "POST" });
}
