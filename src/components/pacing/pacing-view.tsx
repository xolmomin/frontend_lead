"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  PencilEdit01Icon,
  PlusSignIcon,
  Target02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { PacingGoal, PacingScope } from "@/lib/api/pacing";
import {
  useCreatePacingGoal,
  useDeletePacingGoal,
  usePacingGoals,
  useUpdatePacingGoal,
} from "@/hooks/use-pacing";
import { useIntegrations } from "@/hooks/use-integrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function LoadErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("dashboard");
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
      <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      <Button variant="outline" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}

function goalName(
  goal: PacingGoal,
  accountLabel: string,
): string {
  if (goal.scope === "account") return accountLabel;
  return goal.integration_name ?? String(goal.integration_id ?? "");
}

function PacingFormDialog({
  goal,
  open,
  onOpenChange,
}: {
  /** `null` — create mode. */
  goal: PacingGoal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pacing.form");
  const tToasts = useTranslations("pacing.toasts");
  const tCommon = useTranslations("common");

  const createMutation = useCreatePacingGoal();
  const updateMutation = useUpdatePacingGoal();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [scope, setScope] = useState<PacingScope>(goal?.scope ?? "account");
  const [integrationId, setIntegrationId] = useState<string>(
    goal?.integration_id != null ? String(goal.integration_id) : "",
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Only needed for the integration scope; fetched lazily by the same hook
  // the integrations page uses.
  const integrationsQuery = useIntegrations({});
  const integrations = integrationsQuery.data ?? [];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const form = new FormData(event.currentTarget);
    const monthlyGoal = Number(String(form.get("monthly_goal") ?? ""));

    if (!Number.isInteger(monthlyGoal) || monthlyGoal < 1) {
      setFormError(t("goalInvalid"));
      return;
    }
    if (!goal && scope === "integration" && !integrationId) {
      setFormError(t("integrationRequired"));
      return;
    }
    setFormError(null);

    const options = {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(tToasts("saved"));
      },
      onError: () => toast.error(tToasts("error")),
    };

    if (goal) {
      updateMutation.mutate(
        { id: goal.id, payload: { monthly_goal: monthlyGoal } },
        options,
      );
    } else {
      createMutation.mutate(
        {
          scope,
          monthly_goal: monthlyGoal,
          ...(scope === "integration"
            ? { integration_id: integrationId }
            : {}),
        },
        options,
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {!goal && (
            <div className="flex flex-col gap-2">
              <Label>{t("scope")}</Label>
              <Select
                value={scope}
                onValueChange={(value) => setScope(value as PacingScope)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">{t("scopeAccount")}</SelectItem>
                  <SelectItem value="integration">
                    {t("scopeIntegration")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!goal && scope === "integration" && (
            <div className="flex flex-col gap-2">
              <Label>{t("integration")}</Label>
              <Select
                value={integrationId || undefined}
                onValueChange={setIntegrationId}
                disabled={integrationsQuery.isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      integrationsQuery.isLoading
                        ? tCommon("loading")
                        : t("integrationPlaceholder")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {integrations.map((integration) => (
                    <SelectItem
                      key={integration.id}
                      value={String(integration.id)}
                    >
                      {integration.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!integrationsQuery.isLoading && integrations.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("noIntegrations")}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="pacing-monthly-goal">{t("monthlyGoal")}</Label>
            <Input
              id="pacing-monthly-goal"
              name="monthly_goal"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              defaultValue={goal ? String(goal.monthly_goal) : ""}
              placeholder={t("monthlyGoalPlaceholder")}
            />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeletePacingDialog({
  goal,
  open,
  onOpenChange,
}: {
  goal: PacingGoal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("pacing.deleteDialog");
  const tRoot = useTranslations("pacing");
  const tToasts = useTranslations("pacing.toasts");
  const tCommon = useTranslations("common");
  const mutation = useDeletePacingGoal();

  function handleDelete() {
    mutation.mutate(goal.id, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(tToasts("deleted"));
      },
      onError: () => {
        onOpenChange(false);
        toast.error(tToasts("error"));
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("description", { name: goalName(goal, tRoot("accountScope")) })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={mutation.isPending}>
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: PacingGoal;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("pacing");

  const percent =
    goal.monthly_goal > 0
      ? Math.round((goal.current_month_leads / goal.monthly_goal) * 100)
      : 0;
  const barWidth = Math.min(100, Math.max(0, percent));

  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <HugeiconsIcon
              icon={goal.scope === "account" ? UserGroupIcon : Target02Icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <div className="min-w-0">
              <p
                className="truncate font-semibold"
                title={goalName(goal, t("accountScope"))}
              >
                {goalName(goal, t("accountScope"))}
              </p>
              <p className="text-xs text-muted-foreground">
                {goal.scope === "account"
                  ? t("scopeAccountLabel")
                  : t("scopeIntegrationLabel")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("edit")}
              onClick={onEdit}
            >
              <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("delete")}
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">{t("monthlyProgress")}</span>
            <span className="font-medium tabular-nums">
              {goal.current_month_leads}/{goal.monthly_goal}
              <span className="ml-1 text-xs text-muted-foreground">
                ({percent}%)
              </span>
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={barWidth}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                goal.on_track ? "bg-primary" : "bg-amber-500",
              )}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("today", {
              today: goal.today_leads,
              target: goal.daily_target,
            })}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium",
              goal.on_track
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-amber-700 dark:text-amber-400",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                goal.on_track ? "bg-emerald-500" : "bg-amber-500",
              )}
            />
            {goal.on_track ? t("onTrack") : t("behind")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function PacingView() {
  const t = useTranslations("pacing");
  const goalsQuery = usePacingGoals();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PacingGoal | null>(null);
  const [deleting, setDeleting] = useState<PacingGoal | null>(null);

  const goals = goalsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          {t("add")}
        </Button>
      </div>

      {goalsQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44" />
          ))}
        </div>
      ) : goalsQuery.isError ? (
        <LoadErrorState onRetry={() => goalsQuery.refetch()} />
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <HugeiconsIcon
            icon={Target02Icon}
            className="size-10 text-muted-foreground/50"
          />
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            {t("add")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => setEditing(goal)}
              onDelete={() => setDeleting(goal)}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <PacingFormDialog
          goal={null}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
      {editing && (
        <PacingFormDialog
          key={String(editing.id)}
          goal={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}
      {deleting && (
        <DeletePacingDialog
          goal={deleting}
          open
          onOpenChange={(open) => {
            if (!open) setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
