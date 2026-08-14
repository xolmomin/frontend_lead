"use client";

import { useQueryClient } from "@tanstack/react-query";

/** Invalidate several query keys at once — used by every mutation hook. */
export function useInvalidate() {
  const queryClient = useQueryClient();
  return (...keys: readonly (readonly unknown[])[]) => {
    for (const key of keys) {
      void queryClient.invalidateQueries({ queryKey: key as unknown[] });
    }
  };
}
