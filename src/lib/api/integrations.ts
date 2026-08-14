/**
 * Stage-2 Integrations API layer.
 *
 * Every endpoint path used by the Integrations UI lives in this file so it can
 * be adjusted in one place when the backend contract changes.
 */
import { API_URL, apiFetch } from "@/lib/api";
import { asList } from "./_shared";

// --- Types ---

export type DeliveryType =
  | "telegram"
  | "sheets"
  | "bitrix24"
  | "amocrm"
  | "cpa"
  | "webhook";

export type IntegrationStatus = "active" | "paused";
export type SourceType = "webhook" | "facebook";
export type LeadStatus = "pending" | "delivered" | "failed" | "paused_hold";
export type IntegrationAction = "pause" | "start" | "send" | "reset";

export interface Folder {
  id: number | string;
  name: string;
}

export interface DeliveryConnection {
  id: number | string;
  name: string;
  type: DeliveryType;
  config?: Record<string, unknown>;
}

export interface DeliveryConnectionRef {
  id: number | string;
  name: string;
  type: DeliveryType;
}

export interface Integration {
  id: number | string;
  name: string;
  status: IntegrationStatus;
  source_type: SourceType;
  folder_id: number | string | null;
  delivery_connection: DeliveryConnectionRef | null;
  today_leads: number;
  pending_leads: number;
  last_lead_at: string | null;
  /** Absent/null for non-webhook sources (e.g. facebook). */
  webhook_token: string | null;
}

export interface Lead {
  id: number | string;
  status: LeadStatus;
  raw: unknown;
  created_at: string;
  retry_count: number;
  last_error: string | null;
}

export interface LeadPage {
  items: Lead[];
  total: number;
}

// Some list endpoints may return either a bare array or an `{items: []}`
// envelope; normalize both shapes.

// --- Query keys ---

export const integrationKeys = {
  folders: ["folders"] as const,
  deliveryConnections: ["delivery-connections"] as const,
  integrations: (filters?: { folderId?: string | null; search?: string }) =>
    filters === undefined
      ? (["integrations"] as const)
      : (["integrations", filters] as const),
  leads: (
    integrationId: string,
    filters: { status?: string; page: number },
  ) => ["integration-leads", integrationId, filters] as const,
  /** Every cached lead page of one integration. */
  leadsFor: (integrationId: Integration["id"]) =>
    ["integration-leads", String(integrationId)] as const,
  /** Every cached lead page of every integration — use sparingly. */
  allLeads: ["integration-leads"] as const,
};

// --- Folders ---

export async function listFolders(): Promise<Folder[]> {
  return asList<Folder>(await apiFetch<unknown>("/folders"));
}

export function createFolder(name: string): Promise<Folder> {
  return apiFetch<Folder>("/folders", { method: "POST", body: { name } });
}

export function renameFolder(id: Folder["id"], name: string): Promise<Folder> {
  return apiFetch<Folder>(`/folders/${id}`, { method: "PATCH", body: { name } });
}

/** Fails with 409 when the folder still contains integrations. */
export function deleteFolder(id: Folder["id"]): Promise<void> {
  return apiFetch<void>(`/folders/${id}`, { method: "DELETE" });
}

// --- Delivery connections ---

export async function listDeliveryConnections(): Promise<DeliveryConnection[]> {
  return asList<DeliveryConnection>(await apiFetch<unknown>("/delivery-connections"));
}

export interface DeliveryConnectionPayload {
  name: string;
  type: DeliveryType;
  config: Record<string, unknown>;
}

export function createDeliveryConnection(
  payload: DeliveryConnectionPayload,
): Promise<DeliveryConnection> {
  return apiFetch<DeliveryConnection>("/delivery-connections", {
    method: "POST",
    body: payload,
  });
}

export function updateDeliveryConnection(
  id: DeliveryConnection["id"],
  payload: Partial<DeliveryConnectionPayload>,
): Promise<DeliveryConnection> {
  return apiFetch<DeliveryConnection>(`/delivery-connections/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

/** Fails with 409 when the connection is used by an integration. */
export function deleteDeliveryConnection(
  id: DeliveryConnection["id"],
): Promise<void> {
  return apiFetch<void>(`/delivery-connections/${id}`, { method: "DELETE" });
}

// --- Integrations ---

export async function listIntegrations(filters?: {
  folderId?: string | null;
  search?: string;
}): Promise<Integration[]> {
  const params = new URLSearchParams();
  if (filters?.folderId) params.set("folder_id", filters.folderId);
  if (filters?.search) params.set("search", filters.search);
  const qs = params.toString();
  return asList<Integration>(
    await apiFetch<unknown>(`/integrations${qs ? `?${qs}` : ""}`),
  );
}

export interface FacebookSourceConfig {
  connection_id: number | string;
  page_id: number | string;
  form_id: number | string;
}

export interface CreateIntegrationPayload {
  name: string;
  source_type: SourceType;
  /** Required when `source_type` is "facebook". */
  source_config?: FacebookSourceConfig;
  delivery_connection_id: DeliveryConnection["id"];
  folder_id?: Folder["id"] | null;
}

export function createIntegration(
  payload: CreateIntegrationPayload,
): Promise<Integration> {
  return apiFetch<Integration>("/integrations", { method: "POST", body: payload });
}

export interface UpdateIntegrationPayload {
  name?: string;
  delivery_connection_id?: DeliveryConnection["id"];
  folder_id?: Folder["id"] | null;
}

export function updateIntegration(
  id: Integration["id"],
  payload: UpdateIntegrationPayload,
): Promise<Integration> {
  return apiFetch<Integration>(`/integrations/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteIntegration(id: Integration["id"]): Promise<void> {
  return apiFetch<void>(`/integrations/${id}`, { method: "DELETE" });
}

export function runIntegrationAction(
  id: Integration["id"],
  action: IntegrationAction,
): Promise<void> {
  return apiFetch<void>(`/integrations/${id}/${action}`, { method: "POST" });
}

export function runBulkIntegrationAction(
  ids: Integration["id"][],
  action: IntegrationAction,
): Promise<void> {
  return apiFetch<void>("/integrations/bulk", {
    method: "POST",
    body: { ids, action },
  });
}

// --- Leads ---

export async function listIntegrationLeads(
  integrationId: string,
  filters: { status?: LeadStatus | ""; page?: number } = {},
): Promise<LeadPage> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const qs = params.toString();
  const data = await apiFetch<unknown>(
    `/integrations/${integrationId}/leads${qs ? `?${qs}` : ""}`,
  );
  if (Array.isArray(data)) return { items: data as Lead[], total: data.length };
  const page = data as { items?: Lead[]; total?: number } | null;
  return { items: page?.items ?? [], total: page?.total ?? 0 };
}

export async function listRecentLeads(limit = 10): Promise<Lead[]> {
  return asList<Lead>(await apiFetch<unknown>(`/leads/recent?limit=${limit}`));
}

// --- Helpers ---

/** Public URL an external source posts leads to. */
export function webhookIncomingUrl(webhookToken: string): string {
  return `${API_URL}/webhooks/incoming/${webhookToken}`;
}

/** Ready-to-paste curl snippet for sending a test lead. */
export function webhookCurlSnippet(webhookToken: string): string {
  return [
    `curl -X POST ${webhookIncomingUrl(webhookToken)} \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"name": "Test Lead", "phone": "+998901234567"}'`,
  ].join("\n");
}
