"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createPacingGoal,
  deletePacingGoal,
  listPacingGoals,
  pacingKeys,
  updatePacingGoal,
  type CreatePacingGoalPayload,
  type PacingGoal,
  type UpdatePacingGoalPayload,
} from "@/lib/api/pacing";
import { useInvalidate } from "./_use-invalidate";


// --- Queries ---

export function usePacingGoals() {
  return useQuery({ queryKey: pacingKeys.list, queryFn: listPacingGoals });
}

// --- Mutations ---

export function useCreatePacingGoal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: CreatePacingGoalPayload) => createPacingGoal(payload),
    onSuccess: () => invalidate(pacingKeys.list),
  });
}

export function useUpdatePacingGoal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: PacingGoal["id"];
      payload: UpdatePacingGoalPayload;
    }) => updatePacingGoal(id, payload),
    onSuccess: () => invalidate(pacingKeys.list),
  });
}

export function useDeletePacingGoal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: PacingGoal["id"]) => deletePacingGoal(id),
    onSuccess: () => invalidate(pacingKeys.list),
  });
}
