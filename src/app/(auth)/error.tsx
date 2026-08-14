"use client";

import { ErrorState } from "@/components/error-state";

export default function AuthError({
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
      homeHref="/"
      homeLabelKey="home"
    />
  );
}
