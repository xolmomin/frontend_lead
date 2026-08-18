"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Check, Crown, TrendingUp, Zap, type LucideIcon } from "lucide-react";
import { usePlans } from "@/hooks/use-billing";
import type { BillingPlan } from "@/lib/api/billing";
import { YbButton } from "@/components/yb/button";
import { YbCard } from "@/components/yb/card";
import { cn } from "@/lib/utils";

/** "Tarif rejalar" — production `pricing` section (id=pricing). */

interface DisplayPlan {
  id: number | string;
  name: string;
  price: number;
  limit: number | null;
  isFree: boolean;
  isUnlimited: boolean;
}

/** Production plan data, used until the billing API responds. */
const FALLBACK_PLANS: DisplayPlan[] = [
  {
    id: 0,
    name: "Boshlang'ich",
    price: 0,
    limit: 1000,
    isFree: true,
    isUnlimited: false,
  },
  {
    id: 1,
    name: "Professional",
    price: 49000,
    limit: 5000,
    isFree: false,
    isUnlimited: false,
  },
  {
    id: 2,
    name: "Biznes",
    price: 69000,
    limit: 10000,
    isFree: false,
    isUnlimited: false,
  },
  {
    id: 3,
    name: "Korporativ",
    price: 89000,
    limit: null,
    isFree: false,
    isUnlimited: true,
  },
];

const REGISTER_LINKS: Record<number, string> = {
  0: "/register?plan=1k",
  1: "/register?plan=5k",
  2: "/register?plan=10k",
  3: "/register?plan=unlimited",
};

function formatNumber(value: number) {
  // Manual grouping (production's own helper) — Intl output differs between
  // Node and the browser for uz-UZ, which caused hydration mismatches.
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function planVisual(
  plan: DisplayPlan,
  index: number,
): { Icon: LucideIcon; gradient: string } {
  if (plan.isUnlimited) {
    return { Icon: Crown, gradient: "from-accent-500 to-accent-600" };
  }
  const icons: LucideIcon[] = [Zap, TrendingUp, TrendingUp];
  const gradients = [
    "from-gray-500 to-gray-600",
    "from-primary-500 to-primary-600",
    "from-secondary-500 to-secondary-600",
  ];
  const i = Math.min(index, icons.length - 1);
  return { Icon: icons[i], gradient: gradients[i] };
}

function toDisplayPlan(plan: BillingPlan): DisplayPlan {
  return {
    id: plan.id,
    name: plan.name,
    price: plan.price_monthly,
    limit: plan.lead_limit,
    isFree: plan.is_free,
    isUnlimited: !plan.is_free && plan.lead_limit === null,
  };
}

export function Pricing() {
  const t = useTranslations("landing");
  const { data } = usePlans();
  const plans: DisplayPlan[] =
    data && data.length > 0 ? data.map(toDisplayPlan) : FALLBACK_PLANS;

  const featuresFor = (plan: DisplayPlan): string[] => {
    const leads = plan.isUnlimited
      ? t("pricing.features.unlimited")
      : `${formatNumber(plan.limit ?? 0)} ${t("pricing.features.leads")}`;
    return [
      leads,
      t("pricing.features.integrations"),
      t("pricing.features.stats"),
      t("pricing.features.support"),
      ...(plan.isFree ? [] : [t("pricing.features.domains")]),
    ];
  };

  return (
    <section id="pricing" className="py-14 sm:py-20 lg:py-28">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="t-h1 text-foreground">{t("pricing.title")}</h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("pricing.subtitle")}
          </p>
          <div className="mt-8 inline-flex items-center gap-1 p-1 rounded-xl bg-muted">
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] flex items-center bg-card text-foreground shadow-sm"
              aria-current="true"
            >
              {t("pricing.monthly")}
            </button>
            <button
              disabled
              aria-disabled="true"
              className="px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] flex items-center gap-2 text-muted-foreground cursor-not-allowed"
            >
              {t("pricing.yearly")}
              <span className="text-xs font-semibold text-white bg-gradient-to-r from-primary-500 to-secondary-500 px-2 py-0.5 rounded-full">
                {t("pricing.comingSoon")}
              </span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {plans.map((plan, index) => {
            const { Icon, gradient } = planVisual(plan, index);
            const href =
              REGISTER_LINKS[Number(plan.id)] ??
              REGISTER_LINKS[index] ??
              "/register";
            const features = featuresFor(plan);
            return (
              <div key={plan.id}>
                <YbCard
                  variant={plan.isUnlimited ? "elevated" : "default"}
                  className={cn(
                    "relative flex h-full flex-col overflow-hidden",
                    plan.isUnlimited && "ring-2 ring-primary lg:-my-2 lg:py-8",
                  )}
                >
                  {plan.isUnlimited && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
                        {t("pricing.popular")}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col h-full">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="mb-4">
                      <h3 className="t-h2 text-foreground mb-1">{plan.name}</h3>
                    </div>
                    <div className="mb-6">
                      {plan.isFree ? (
                        <span className="text-4xl font-bold text-foreground">
                          {t("pricing.free")}
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-foreground">
                            {formatNumber(plan.price)}
                          </span>
                          <span className="text-muted-foreground">
                            {t("pricing.perMonth")}
                          </span>
                        </div>
                      )}
                      <p className="text-sm font-medium text-muted-foreground mt-2">
                        {plan.isUnlimited
                          ? t("pricing.unlimitedLeads")
                          : t("pricing.leadsPerMonth", {
                              leads: formatNumber(plan.limit ?? 0),
                            })}
                      </p>
                    </div>
                    <div className="flex-1 mb-6">
                      <ul className="space-y-3">
                        {features.map((feature, featureIndex) => (
                          <li
                            key={featureIndex}
                            className="flex items-start gap-3"
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}
                            >
                              <Check
                                className="w-3 h-3 text-white"
                                aria-hidden="true"
                              />
                            </div>
                            <span className="text-sm text-foreground/80 break-words min-w-0">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link href={href} className="block">
                      <YbButton
                        variant={plan.isUnlimited ? "primary" : "outline"}
                        size="md"
                        className="w-full"
                      >
                        {t("pricing.choose")}
                      </YbButton>
                    </Link>
                  </div>
                </YbCard>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
