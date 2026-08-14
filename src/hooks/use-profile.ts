"use client";

import { useMutation } from "@tanstack/react-query";
import {
  getTelegramConnectToken,
  updateImage,
  updatePassword,
  updateSettings,
  userKeys,
  type UpdatePasswordPayload,
  type UpdateSettingsPayload,
} from "@/lib/api/profile";
import { useInvalidate } from "./_use-invalidate";

export function useUpdateSettings() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: UpdateSettingsPayload) => updateSettings(payload),
    onSuccess: () => invalidate(userKeys.me),
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => updatePassword(payload),
  });
}

export function useUpdateProfileImage() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (form: FormData) => updateImage(form),
    onSuccess: () => invalidate(userKeys.me),
  });
}

export function useTelegramConnectToken() {
  return useMutation({ mutationFn: getTelegramConnectToken });
}
