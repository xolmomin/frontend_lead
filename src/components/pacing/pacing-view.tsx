"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Info, Plus, TrendingUp } from "lucide-react";
import type { PacingGoal } from "@/lib/api/pacing";
import { useDeletePacingGoal, usePacingGoals } from "@/hooks/use-pacing";
import { YbCard } from "@/components/yb/card";
import { YbButton } from "@/components/yb/button";
import { YbModal } from "@/components/yb/modal";
import { GoalCard } from "@/components/pacing/goal-card";
import { GoalFormModal } from "@/components/pacing/goal-form-modal";
import { formatNumber, toPacingCard } from "@/components/pacing/pacing";

export function PacingView() {
  const t = useTranslations("leadPacing");
  const goalsQuery = usePacingGoals();
  const deleteMutation = useDeletePacingGoal();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PacingGoal | null>(null);
  const [deleting, setDeleting] = useState<PacingGoal | null>(null);

  const goals = goalsQuery.data ?? [];
  const cards = useMemo(() => goals.map(toPacingCard), [goals]);
  // Production has a dedicated whole-profile `account_summary` in the
  // response; locally it is derived from the account-scope goal (the card is
  // hidden when no account goal exists, and the undelivered-errors counter is
  // not exposed by the local API).
  const accountCard =
    cards.find((card) => card.scope_type === "account") ?? null;

  const formOpen = createOpen || editing !== null;

  function closeForm() {
    setCreateOpen(false);
    setEditing(null);
  }

  function handleDelete() {
    if (!deleting || deleteMutation.isPending) return;
    deleteMutation.mutate(deleting.id, {
      onSuccess: () => toast.success(t("delete.done")),
      // Production closes the confirm modal in `finally` either way.
      onSettled: () => setDeleting(null),
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {t("title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <YbButton variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t("list.add")}
        </YbButton>
      </div>

      {goalsQuery.isLoading ? (
        <div className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      ) : (
        <>
          {accountCard ? (
            <YbCard variant="elevated">
              <div className="p-4 flex flex-wrap items-center gap-x-8 gap-y-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {t("accountSummary.title")}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("accountSummary.mtd")}:{" "}
                  <b className="tabular-nums text-gray-900 dark:text-gray-100">
                    {formatNumber(accountCard.month_to_date)}
                  </b>
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("accountSummary.today")}:{" "}
                  <b className="tabular-nums text-gray-900 dark:text-gray-100">
                    {formatNumber(accountCard.today)}
                  </b>
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("accountSummary.errors")}:{" "}
                  <b className="tabular-nums text-gray-900 dark:text-gray-100">
                    —
                  </b>
                </span>
              </div>
            </YbCard>
          ) : null}

          {cards.length > 0 ? (
            <>
              <p className="flex items-start gap-1 text-[11px] text-gray-400">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{t("overlapNote")}</span>
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <GoalCard
                    key={String(card.goal.id)}
                    p={card}
                    onEdit={(next) => setEditing(next.goal)}
                    onDelete={(next) => setDeleting(next.goal)}
                  />
                ))}
              </div>
            </>
          ) : (
            <YbCard variant="default">
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {t("list.empty")}
              </div>
            </YbCard>
          )}
        </>
      )}

      {formOpen ? (
        <GoalFormModal
          key={editing ? String(editing.id) : "create"}
          goal={editing}
          onClose={closeForm}
        />
      ) : null}

      <YbModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        title={t("delete.action")}
        size="sm"
      >
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          {t("delete.confirm")}
        </p>
        <div className="flex gap-3">
          <YbButton
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setDeleting(null)}
          >
            {t("form.cancel")}
          </YbButton>
          <YbButton
            type="button"
            variant="danger"
            className="flex-1"
            loading={deleteMutation.isPending}
            onClick={handleDelete}
          >
            {t("delete.action")}
          </YbButton>
        </div>
      </YbModal>
    </div>
  );
}
