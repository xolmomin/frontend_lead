"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStatsSummary } from "@/hooks/use-stats";

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const summaryQuery = useStatsSummary();

  if (summaryQuery.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
        <p className="text-sm text-muted-foreground">{t("loadError")}</p>
        <Button variant="outline" onClick={() => summaryQuery.refetch()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  const summary = summaryQuery.data;
  const counters = [
    { key: "todayLeads", value: summary.today },
    { key: "weekLeads", value: summary.week },
    { key: "monthLeads", value: summary.month },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {counters.map((stat) => (
        <Card key={stat.key}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t(stat.key)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {stat.value.toLocaleString(locale)}
            </p>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("todayDelivery")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-end gap-6">
          <div>
            <p className="text-3xl font-bold text-primary">
              {summary.delivered_today.toLocaleString(locale)}
            </p>
            <p className="text-xs text-muted-foreground">{t("delivered")}</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-destructive">
              {summary.failed_today.toLocaleString(locale)}
            </p>
            <p className="text-xs text-muted-foreground">{t("failed")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
