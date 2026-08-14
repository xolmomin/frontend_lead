"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { statsKeys } from "@/lib/api/stats";
import { useInvalidate } from "./_use-invalidate";
import {
  completeFacebookOAuth,
  deleteFacebookConnection,
  facebookKeys,
  getFacebookOAuthUrl,
  listFacebookAdAccounts,
  listFacebookConnections,
  listFacebookForms,
  listFacebookPages,
  subscribeFacebookPage,
  type FacebookConnection,
  type FacebookPage,
} from "@/lib/api/facebook";

// --- Queries ---

export function useFacebookConnections() {
  return useQuery({
    queryKey: facebookKeys.connections,
    queryFn: listFacebookConnections,
  });
}

/** Pages of a connection; disabled until a connection is picked. */
export function useFacebookPages(connectionId: string) {
  return useQuery({
    queryKey: facebookKeys.pages(connectionId),
    queryFn: () => listFacebookPages(connectionId),
    enabled: connectionId !== "",
  });
}

/** Lead forms of a page; disabled until a page is picked. */
export function useFacebookForms(connectionId: string, pageId: string) {
  return useQuery({
    queryKey: facebookKeys.forms(connectionId, pageId),
    queryFn: () => listFacebookForms(connectionId, pageId),
    enabled: connectionId !== "" && pageId !== "",
  });
}

/** Ad accounts for the daily-report settings. */
export function useFacebookAdAccounts() {
  return useQuery({
    queryKey: facebookKeys.adAccounts,
    queryFn: listFacebookAdAccounts,
  });
}

// --- Mutations ---

/** Fetch the FB Login dialog URL and redirect the browser to it. */
export function useStartFacebookOAuth() {
  return useMutation({
    mutationFn: getFacebookOAuthUrl,
    onSuccess: (url) => {
      window.location.href = url;
    },
  });
}

export function useCompleteFacebookOAuth() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: { code: string; state: string }) =>
      completeFacebookOAuth(payload),
    // "has_facebook_connection" is a dashboard setup checklist item — without
    // this the checklist keeps showing Facebook as unconnected until a reload.
    onSuccess: () => invalidate(facebookKeys.connections, statsKeys.setupStatus),
  });
}

export function useDeleteFacebookConnection() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: FacebookConnection["id"]) => deleteFacebookConnection(id),
    onSuccess: () => invalidate(facebookKeys.connections, statsKeys.setupStatus),
  });
}

export function useSubscribeFacebookPage() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      connectionId,
      pageId,
    }: {
      connectionId: FacebookConnection["id"];
      pageId: FacebookPage["id"];
    }) => subscribeFacebookPage(connectionId, pageId),
    onSuccess: (_data, { connectionId }) =>
      invalidate(
        facebookKeys.pages(String(connectionId)),
        facebookKeys.connections,
        statsKeys.setupStatus,
      ),
  });
}
