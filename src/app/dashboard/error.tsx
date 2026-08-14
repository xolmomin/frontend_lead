"use client";

import { ErrorState } from "@/components/error-state";

/**
 * Scoped to the dashboard segment, so it renders *inside* DashboardShell —
 * sidebar and header survive the error.
 *
 * Next 16.2 exposes `unstable_retry`, which re-fetches and re-renders the
 * boundary's children; `reset` only clears error state without re-fetching,
 * which is useless for these react-query backed views.
 */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <ErrorState
      digest={error.digest}
      onRetry={unstable_retry}
      homeHref="/dashboard"
      homeLabelKey="dashboard"
    />
  );
}
