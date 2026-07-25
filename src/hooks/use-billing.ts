"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  billingKeys,
  createOnlinePayment,
  getBalance,
  getPaymentRequisites,
  listPayments,
  listPlans,
  subscribePlan,
  uploadReceipt,
  type SubscribePayload,
} from "@/lib/api/billing";
import { statsKeys } from "@/lib/api/stats";

function useInvalidate() {
  const queryClient = useQueryClient();
  return (...keys: readonly (readonly unknown[])[]) => {
    for (const key of keys) {
      void queryClient.invalidateQueries({ queryKey: key as unknown[] });
    }
  };
}

// --- Queries ---

export function usePlans() {
  return useQuery({ queryKey: billingKeys.plans, queryFn: listPlans });
}

/** `data === null` means billing is not live yet — use the static fallback. */
export function useBalance() {
  return useQuery({
    queryKey: billingKeys.balance,
    queryFn: getBalance,
    retry: false,
  });
}

export function usePayments() {
  return useQuery({ queryKey: billingKeys.payments, queryFn: listPayments });
}

export function usePaymentRequisites() {
  return useQuery({
    queryKey: billingKeys.requisites,
    queryFn: getPaymentRequisites,
  });
}

// --- Mutations ---

export function useSubscribePlan() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: SubscribePayload) => subscribePlan(payload),
    onSuccess: () =>
      invalidate(statsKeys.plan, billingKeys.balance, billingKeys.payments),
  });
}

export function useUploadReceipt() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: { amount: number; receipt: File }) =>
      uploadReceipt(payload),
    onSuccess: () => invalidate(billingKeys.payments, billingKeys.balance),
  });
}

export function useCreateOnlinePayment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (amount: number) => createOnlinePayment(amount),
    onSuccess: () => invalidate(billingKeys.payments),
  });
}
