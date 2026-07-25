"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";

export function useUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
    staleTime: 60_000,
  });
}
