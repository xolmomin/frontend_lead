"use client";

import { useTranslations } from "next-intl";
import { useUser } from "@/hooks/use-user";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { LeadsChart } from "@/components/dashboard/leads-chart";
import { IntegrationPerformance } from "@/components/dashboard/integration-performance";
import { RecentLeads } from "@/components/dashboard/recent-leads";
import { SetupChecklist } from "@/components/dashboard/setup-checklist";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");
  const { data: user, isLoading } = useUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{tNav("dashboard")}</h1>
        <p className="text-muted-foreground">
          {isLoading
            ? "…"
            : t("greeting", { name: user?.full_name || user?.email || "—" })}
        </p>
      </div>

      <SetupChecklist />

      <StatsCards />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">
          <LeadsChart />
          <IntegrationPerformance />
          <RecentLeads />
        </div>
        <div className="min-w-0">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
