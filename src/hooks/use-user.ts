"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api";
import { userKeys } from "@/lib/api/profile";

export function useUser() {
  return useQuery({
    queryKey: userKeys.me,
    queryFn: getMe,
    retry: false,
    staleTime: 60_000,
  });
}
