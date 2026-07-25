"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { API_URL } from "@/lib/api";
import type { BillingPeriod, BillingPlan } from "@/lib/api/billing";
import { formatSum } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionHeader } from "./section-header";

const FEATURE_KEYS = [
  "accounts",
  "products",
  "analytics",
  "crm",
  "retry",
] as const;

/** Static §1.3 fallback used when GET /plans is unavailable. */
const FALLBACK_PLANS: Array<
  Omit<BillingPlan, "name"> & { nameKey: "starter" | "pro" | "business" | "corporate" }
> = [
  { id: "starter", nameKey: "starter", price_monthly: 0, price_yearly: 0, lead_limit: 1000, is_free: true },
  { id: "pro", nameKey: "pro", price_monthly: 49000, price_yearly: 490000, lead_limit: 5000, is_free: false },
  { id: "business", nameKey: "business", price_monthly: 69000, price_yearly: 690000, lead_limit: 10000, is_free: false },
  { id: "corporate", nameKey: "corporate", price_monthly: 89000, price_yearly: 890000, lead_limit: null, is_free: false },
];

/**
 * Plain fetch on purpose: `apiFetch` redirects to /login after a failed
 * 401-refresh cycle, which must never happen to anonymous landing visitors.
 * Any error (including 404) resolves to `null` so the static fallback renders.
 */
async function fetchPublicPlans(): Promise<BillingPlan[] | null> {
  try {
    const res = await fetch(`${API_URL}/plans`);
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const list = Array.isArray(data)
      ? data
      : (data as { items?: unknown } | null)?.items;
    return Array.isArray(list) && list.length > 0
      ? (list as BillingPlan[])
      : null;
  } catch {
    return null;
  }
}

function PlanCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-auto h-9 w-full" />
    </div>
  );
}

export function Pricing() {
  const t = useTranslations("marketing.pricing");
  const tCommon = useTranslations("common");
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  const { data, isLoading } = useQuery({
    queryKey: ["landing-plans"],
    queryFn: fetchPublicPlans,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const plans: Array<BillingPlan & { popular: boolean }> = (
    data ??
    FALLBACK_PLANS.map((plan) => ({
      ...plan,
      name: t(`planNames.${plan.nameKey}`),
    }))
  ).map((plan, index) => ({ ...plan, popular: index === 1 }));

  function priceParts(plan: BillingPlan): { amount: string; suffix?: string } {
    if (plan.is_free) return { amount: t("free") };
    const price = period === "monthly" ? plan.price_monthly : plan.price_yearly;
    return {
      amount: `${formatSum(price) ?? "—"} ${tCommon("sum")}`,
      suffix: period === "monthly" ? t("perMonth") : t("perYear"),
    };
  }

  return (
    <section id="tariflar" className="mk-anchor border-y bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeader
            eyebrow={t("eyebrow")}
            title={t("title")}
            subtitle={t("subtitle")}
          />
          <div className="flex items-center gap-3">
            <Tabs
              value={period}
              onValueChange={(value) => setPeriod(value as BillingPeriod)}
            >
              <TabsList>
                <TabsTrigger value="monthly">{t("monthly")}</TabsTrigger>
                <TabsTrigger value="yearly">{t("yearly")}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Badge
              variant="secondary"
              className={cn(
                "font-mono text-[10px] uppercase tracking-wider transition-opacity",
                period === "yearly"
                  ? "bg-primary/10 text-primary"
                  : "opacity-60",
              )}
            >
              {t("yearlyBadge")}
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <PlanCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const { amount, suffix } = priceParts(plan);
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col gap-5 rounded-2xl border bg-card p-6",
                    plan.popular &&
                      "border-primary shadow-lg shadow-primary/10",
                  )}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-6">
                      {t("popular")}
                    </Badge>
                  )}
                  <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {plan.name}
                  </h3>
                  <div>
                    <p className="text-3xl font-bold tracking-tight">
                      {amount}
                      {suffix && (
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          {suffix}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm font-medium text-primary">
                      {plan.lead_limit === null
                        ? t("unlimited")
                        : t("leads", {
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
                  <Button
                    asChild
                    className="mt-auto w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    <Link href="/register">{t("cta")}</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-sm text-muted-foreground">{t("note")}</p>
      </div>
    </section>
  );
}
