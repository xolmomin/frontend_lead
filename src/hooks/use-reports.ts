"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReport,
  deleteReport,
  listReports,
  reportKeys,
  sendReportNow,
  updateReport,
  type CreateReportPayload,
  type Report,
  type UpdateReportPayload,
} from "@/lib/api/reports";

function useInvalidate() {
  const queryClient = useQueryClient();
  return (...keys: readonly (readonly unknown[])[]) => {
    for (const key of keys) {
      void queryClient.invalidateQueries({ queryKey: key as unknown[] });
    }
  };
}

// --- Queries ---

export function useReports() {
  return useQuery({ queryKey: reportKeys.list, queryFn: listReports });
}

// --- Mutations ---

export function useCreateReport() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: CreateReportPayload) => createReport(payload),
    onSuccess: () => invalidate(reportKeys.list),
  });
}

export function useUpdateReport() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Report["id"];
      payload: UpdateReportPayload;
    }) => updateReport(id, payload),
    onSuccess: () => invalidate(reportKeys.list),
  });
}

export function useDeleteReport() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: Report["id"]) => deleteReport(id),
    onSuccess: () => invalidate(reportKeys.list),
  });
}

/** One-off send; refreshes the list so `last_sent_at` updates. */
export function useSendReportNow() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: Report["id"]) => sendReportNow(id),
    onSuccess: () => invalidate(reportKeys.list),
  });
}
