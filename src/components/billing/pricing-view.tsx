"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { ApiError } from "@/lib/api";
import { formatSum } from "@/lib/money";
import type { BillingPeriod, BillingPlan } from "@/lib/api/billing";
import { useBalance, usePlans, useSubscribePlan } from "@/hooks/use-billing";
import { usePlan } from "@/hooks/use-stats";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FEATURE_KEYS = ["accounts", "products", "analytics", "crm"] as const;

function PlanCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

export function PricingView() {
  const t = useTranslations("billing.pricing");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const router = useRouter();

  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [pendingPlan, setPendingPlan] = useState<BillingPlan | null>(null);

  const plansQuery = usePlans();
  const planQuery = usePlan();
  const balanceQuery = useBalance();
  const subscribe = useSubscribePlan();

  const currentPlanName = planQuery.data?.plan_name ?? null;
  const balance = formatSum(balanceQuery.data?.balance);

  function priceFor(plan: BillingPlan): string {
    if (plan.is_free) return t("free");
    const price = period === "monthly" ? plan.price_monthly : plan.price_yearly;
    const formatted = `${formatSum(price) ?? "—"} ${tCommon("sum")}`;
    return `${formatted}${period === "monthly" ? t("perMonth") : t("perYear")}`;
  }

  function handleConfirm() {
    const plan = pendingPlan;
    if (!plan || subscribe.isPending) return;
    subscribe.mutate(
      { plan_id: plan.id, period },
      {
        onSuccess: () => {
          setPendingPlan(null);
          toast.success(t("subscribeSuccess", { plan: plan.name }));
        },
        onError: (error) => {
          setPendingPlan(null);
          if (error instanceof ApiError && error.status === 402) {
            toast.error(t("insufficientBalance"), {
              action: {
                label: t("goToBalance"),
                onClick: () => router.push("/dashboard/balance"),
              },
            });
            return;
          }
          toast.error(t("subscribeError"));
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as BillingPeriod)}
        >
          <TabsList>
            <TabsTrigger value="monthly">{t("monthly")}</TabsTrigger>
            <TabsTrigger value="yearly">{t("yearly")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {plansQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <PlanCardSkeleton key={index} />
          ))}
        </div>
      ) : plansQuery.isError || !plansQuery.data ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {tDashboard("loadError")}
          </p>
          <Button variant="outline" onClick={() => plansQuery.refetch()}>
            {tDashboard("retry")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plansQuery.data.map((plan) => {
            const isCurrent =
              currentPlanName !== null && plan.name === currentPlanName;
            return (
              <Card
                key={plan.id}
                className={cn("flex flex-col", isCurrent && "border-primary")}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    {isCurrent && <Badge>{t("currentPlan")}</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {priceFor(plan)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {plan.lead_limit === null
                        ? t("unlimitedLeads")
                        : t("leadsPerMonth", {
                            count: formatSum(plan.lead_limit) ?? "—",
                          })}
                    </p>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {FEATURE_KEYS.map((key) => (
                      <li
                        key={key}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <HugeiconsIcon
                          icon={Tick02Icon}
                          className="mt-0.5 size-4 shrink-0 text-primary"
                        />
                        {t(`features.${key}`)}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent}
                    onClick={() => setPendingPlan(plan)}
                  >
                    {isCurrent ? t("currentPlan") : t("select")}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={pendingPlan !== null}
        onOpenChange={(open) => {
          if (!open) setPendingPlan(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col gap-2">
              <span>
                {pendingPlan &&
                  t("confirmDescription", {
                    plan: pendingPlan.name,
                    price: priceFor(pendingPlan),
                  })}
              </span>
              {pendingPlan && !pendingPlan.is_free && (
                <span>
                  {balance !== null
                    ? t("confirmBalanceNote", {
                        balance: `${balance} ${tCommon("sum")}`,
                      })
                    : t("confirmDeductNote")}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={subscribe.isPending}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <Button onClick={handleConfirm} disabled={subscribe.isPending}>
              {subscribe.isPending ? tCommon("loading") : t("confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
