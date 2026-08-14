"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  createDeliveryConnection,
  createFolder,
  createIntegration,
  deleteDeliveryConnection,
  deleteFolder,
  deleteIntegration,
  integrationKeys,
  listDeliveryConnections,
  listFolders,
  listIntegrationLeads,
  listIntegrations,
  renameFolder,
  runBulkIntegrationAction,
  runIntegrationAction,
  updateDeliveryConnection,
  updateIntegration,
  type CreateIntegrationPayload,
  type DeliveryConnection,
  type DeliveryConnectionPayload,
  type Folder,
  type Integration,
  type IntegrationAction,
  type LeadStatus,
  type UpdateIntegrationPayload,
} from "@/lib/api/integrations";
import { statsKeys } from "@/lib/api/stats";
import { useInvalidate } from "./_use-invalidate";

/**
 * The integration list, in every folder/search variant. Deliberately does NOT
 * include ["integration-leads"] — that prefix covers every cached lead page of
 * every integration, and with keepPreviousData on useIntegrationLeads a bare
 * rename would refetch all of them. Lead keys are invalidated per integration,
 * and only by the actions that actually change leads.
 */
const INTEGRATION_LIST = integrationKeys.integrations();

/** Actions that mutate the integration's leads, not just its state. */
function touchesLeads(action: IntegrationAction) {
  return action === "send" || action === "reset";
}

// --- Queries ---

export function useFolders() {
  return useQuery({ queryKey: integrationKeys.folders, queryFn: listFolders });
}

export function useDeliveryConnections() {
  return useQuery({
    queryKey: integrationKeys.deliveryConnections,
    queryFn: listDeliveryConnections,
  });
}

export function useIntegrations(filters: {
  folderId?: string | null;
  search?: string;
}) {
  return useQuery({
    queryKey: integrationKeys.integrations({
      folderId: filters.folderId ?? null,
      search: filters.search ?? "",
    }),
    queryFn: () => listIntegrations(filters),
    placeholderData: keepPreviousData,
  });
}

export function useIntegrationLeads(
  integrationId: string,
  filters: { status?: LeadStatus | ""; page: number },
) {
  return useQuery({
    queryKey: integrationKeys.leads(integrationId, filters),
    queryFn: () => listIntegrationLeads(integrationId, filters),
    placeholderData: keepPreviousData,
  });
}

// --- Folder mutations ---

export function useCreateFolder() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (name: string) => createFolder(name),
    onSuccess: () => invalidate(integrationKeys.folders),
  });
}

export function useRenameFolder() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, name }: { id: Folder["id"]; name: string }) =>
      renameFolder(id, name),
    onSuccess: () => invalidate(integrationKeys.folders),
  });
}

export function useDeleteFolder() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: Folder["id"]) => deleteFolder(id),
    // Deleting a folder can take its integrations (and their leads) with it,
    // so this is the one place a blanket lead invalidation is justified.
    onSuccess: () =>
      invalidate(
        integrationKeys.folders,
        INTEGRATION_LIST,
        integrationKeys.allLeads,
        statsKeys.setupStatus,
      ),
  });
}

// --- Delivery connection mutations ---

export function useCreateDeliveryConnection() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: DeliveryConnectionPayload) =>
      createDeliveryConnection(payload),
    // "has_delivery_connection" is one of the dashboard setup checklist items.
    onSuccess: () =>
      invalidate(integrationKeys.deliveryConnections, statsKeys.setupStatus),
  });
}

export function useUpdateDeliveryConnection() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: DeliveryConnection["id"];
      payload: Partial<DeliveryConnectionPayload>;
    }) => updateDeliveryConnection(id, payload),
    // Integration rows render the connection's name/type, so the list is stale
    // too — leads are untouched.
    onSuccess: () =>
      invalidate(integrationKeys.deliveryConnections, INTEGRATION_LIST),
  });
}

export function useDeleteDeliveryConnection() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: DeliveryConnection["id"]) => deleteDeliveryConnection(id),
    onSuccess: () =>
      invalidate(
        integrationKeys.deliveryConnections,
        INTEGRATION_LIST,
        statsKeys.setupStatus,
      ),
  });
}

// --- Integration mutations ---

export function useCreateIntegration() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: CreateIntegrationPayload) => createIntegration(payload),
    // "has_integration" is a dashboard setup checklist item.
    onSuccess: () => invalidate(INTEGRATION_LIST, statsKeys.setupStatus),
  });
}

export function useUpdateIntegration() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Integration["id"];
      payload: UpdateIntegrationPayload;
    }) => updateIntegration(id, payload),
    onSuccess: () => invalidate(INTEGRATION_LIST),
  });
}

export function useDeleteIntegration() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: Integration["id"]) => deleteIntegration(id),
    onSuccess: (_data, id) =>
      invalidate(
        INTEGRATION_LIST,
        integrationKeys.leadsFor(id),
        statsKeys.setupStatus,
      ),
  });
}

export function useIntegrationAction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: Integration["id"];
      action: IntegrationAction;
    }) => runIntegrationAction(id, action),
    // pause/start only flip the integration's own state; send/reset rewrite its
    // leads, and only that integration's.
    onSuccess: (_data, { id, action }) =>
      invalidate(
        INTEGRATION_LIST,
        ...(touchesLeads(action) ? [integrationKeys.leadsFor(id)] : []),
      ),
  });
}

export function useBulkIntegrationAction() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      ids,
      action,
    }: {
      ids: Integration["id"][];
      action: IntegrationAction;
    }) => runBulkIntegrationAction(ids, action),
    onSuccess: (_data, { ids, action }) =>
      invalidate(
        INTEGRATION_LIST,
        ...(touchesLeads(action) ? ids.map(integrationKeys.leadsFor) : []),
      ),
  });
}
