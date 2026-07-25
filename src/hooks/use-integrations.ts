"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createDeliveryConnection,
  createFolder,
  createIntegration,
  deleteDeliveryConnection,
  deleteFolder,
  deleteIntegration,
  getIntegration,
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

function useInvalidate() {
  const queryClient = useQueryClient();
  return (...keys: readonly (readonly unknown[])[]) => {
    for (const key of keys) {
      void queryClient.invalidateQueries({ queryKey: key as unknown[] });
    }
  };
}

const INTEGRATION_KEYS = [
  ["integrations"],
  ["integration"],
  ["integration-leads"],
] as const;

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

export function useIntegration(id: string) {
  return useQuery({
    queryKey: ["integration", id],
    queryFn: () => getIntegration(id),
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
    onSuccess: () => invalidate(integrationKeys.folders, ...INTEGRATION_KEYS),
  });
}

// --- Delivery connection mutations ---

export function useCreateDeliveryConnection() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: DeliveryConnectionPayload) =>
      createDeliveryConnection(payload),
    onSuccess: () => invalidate(integrationKeys.deliveryConnections),
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
    onSuccess: () =>
      invalidate(integrationKeys.deliveryConnections, ...INTEGRATION_KEYS),
  });
}

export function useDeleteDeliveryConnection() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: DeliveryConnection["id"]) => deleteDeliveryConnection(id),
    onSuccess: () => invalidate(integrationKeys.deliveryConnections),
  });
}

// --- Integration mutations ---

export function useCreateIntegration() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: CreateIntegrationPayload) => createIntegration(payload),
    onSuccess: () => invalidate(...INTEGRATION_KEYS),
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
    onSuccess: () => invalidate(...INTEGRATION_KEYS),
  });
}

export function useDeleteIntegration() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: Integration["id"]) => deleteIntegration(id),
    onSuccess: () => invalidate(...INTEGRATION_KEYS),
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
    onSuccess: () => invalidate(...INTEGRATION_KEYS),
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
    onSuccess: () => invalidate(...INTEGRATION_KEYS),
  });
}
