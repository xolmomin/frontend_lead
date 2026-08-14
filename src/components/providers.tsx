"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ApiError, registerAuthChangeHandler } from "@/lib/api";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Without this every remount refetches everything, so simply
            // navigating away and back re-runs the whole dashboard.
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            // 4xx are verdicts, not blips: retrying a 402 "insufficient
            // balance" three times just delays the error toast by seconds.
            retry: (count, error) =>
              !(
                error instanceof ApiError &&
                error.status >= 400 &&
                error.status < 500
              ) && count < 2,
          },
          mutations: { retry: false },
        },
      }),
  );

  useEffect(() => {
    // Wipe cached queries whenever the signed-in identity changes, so a new
    // login never sees the previous account's data.
    return registerAuthChangeHandler(() => queryClient.clear());
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
