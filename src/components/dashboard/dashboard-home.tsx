"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowRight, TrendingUp, Zap } from "lucide-react";
import { usePlan, useStatsSummary } from "@/hooks/use-stats";
import { YbButton } from "@/components/yb/button";
import { YbCard } from "@/components/yb/card";
import { PlanCard, type PlanSummary } from "./plan-card";
import { StatCard } from "./stats-cards";
import { ChartsSection } from "./leads-chart";
import { IntegrationPerformance } from "./integration-performance";
import { SetupChecklist } from "./setup-checklist";
import { ActivityFeed } from "./activity-feed";

const EXPIRY_SOON_MS = 10_080 * 60 * 1000; // 7 days

export function DashboardHome() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();

  const planQuery = usePlan();
  const statsQuery = useStatsSummary();
  const stats = statsQuery.data;
  const statsLoading = statsQuery.isLoading;

  const plan = useMemo<PlanSummary | null>(() => {
    const info = planQuery.data;
    if (!info) return null;
    const isUnlimited = !info.lead_limit;
    return {
      planName: info.plan_name,
      totalLeads: isUnlimited ? null : info.lead_limit,
      usedLeads: info.leads_used,
      remainingLeads: isUnlimited
        ? null
        : Math.max(0, info.lead_limit - info.leads_used),
      expiryDate: info.period_ends_at ? new Date(info.period_ends_at) : null,
      isUnlimited,
    };
  }, [planQuery.data]);
  const planLoading = planQuery.isLoading;

  const planPercentage =
    plan && !plan.isUnlimited && plan.totalLeads
      ? Math.min(100, (plan.usedLeads / plan.totalLeads) * 100)
      : 0;
  const isLowOnLeads = !plan?.isUnlimited && planPercentage > 80;
  const [now] = useState(() => Date.now());
  const isExpiringSoon = useMemo(() => {
    if (!plan || planLoading || !plan.expiryDate) return false;
    const diff = plan.expiryDate.getTime() - now;
    return diff > 0 && diff < EXPIRY_SOON_MS;
  }, [plan, planLoading, now]);
  const showPricingCta = !plan?.isUnlimited && (isLowOnLeads || isExpiringSoon);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="animate-in fade-in slide-in-from-top-4 duration-300">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t("title")}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          {t("subtitle")}
        </p>
      </div>

      <SetupChecklist />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-3 sm:gap-4">
        <div className="xl:col-span-2">
          <PlanCard
            plan={plan}
            loading={planLoading}
            lang={locale}
            planPercentage={planPercentage}
            isLowOnLeads={isLowOnLeads}
            isExpiringSoon={isExpiringSoon}
            onUpgrade={() => router.push("/dashboard/pricing")}
            onTopUp={() => router.push("/dashboard/balance")}
          />
        </div>
        <div className="xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 auto-rows-fr">
          <StatCard
            label={t("stats.today")}
            value={stats?.today ?? 0}
            errors={stats?.failed_today}
            deliveredLabel={t("stats.delivered")}
            failedLabel={t("stats.failed")}
            leadsLabel={t("stats.leadsCount")}
            icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
            iconBgGradient="from-blue-500 to-blue-600"
            loading={statsLoading}
          />
          <StatCard
            label={t("stats.week")}
            value={stats?.week ?? 0}
            deliveredLabel={t("stats.delivered")}
            failedLabel={t("stats.failed")}
            leadsLabel={t("stats.leadsCount")}
            icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
            iconBgGradient="from-purple-500 to-purple-600"
            loading={statsLoading}
          />
          <StatCard
            label={t("stats.month")}
            value={stats?.month ?? 0}
            deliveredLabel={t("stats.delivered")}
            failedLabel={t("stats.failed")}
            leadsLabel={t("stats.leadsCount")}
            icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
            iconBgGradient="from-green-500 to-green-600"
            loading={statsLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          <ChartsSection />
          <IntegrationPerformance />
        </div>
        <div className="xl:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      {showPricingCta && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <YbCard
            variant="elevated"
            className="relative overflow-hidden bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-accent-500/10 dark:from-primary-500/20 dark:via-secondary-500/20 dark:to-accent-500/20 border-primary-200 dark:border-primary-700 p-0"
          >
            <div className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
                    {t("pricing.title")}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("pricing.description")}
                  </p>
                </div>
                <YbButton
                  variant="primary"
                  size="lg"
                  onClick={() => router.push("/dashboard/pricing")}
                  leftIcon={<Zap className="w-5 h-5" />}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                  className="w-full md:w-auto bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 shadow-lg"
                >
                  {t("pricing.button")}
                </YbButton>
              </div>
            </div>
          </YbCard>
        </div>
      )}
    </div>
  );
}
