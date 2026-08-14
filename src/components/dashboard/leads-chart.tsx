"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { getStatsChart } from "@/lib/api/stats";
import {
  ChartSkeleton,
  PERIODS,
  PERIOD_QUERY,
  PeriodIcon,
  type Period,
} from "./leads-chart-shared";

/**
 * recharts is ~9 MB installed and its runtime is only needed once a chart
 * actually renders. Loading it lazily keeps it out of the dashboard's initial
 * chunk; ssr:false is legal because this component is already client-side.
 */
const PeriodChart = dynamic(() => import("./leads-chart-graphs"), {
  ssr: false,
  loading: () => <ChartSkeleton icon={<PeriodIcon period="daily" />} />,
});

export function ChartsSection() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [active, setActive] = useState<Period>("daily");

  const query = useQuery({
    queryKey: ["stats-chart-period", active],
    queryFn: () =>
      getStatsChart(PERIOD_QUERY[active].days, PERIOD_QUERY[active].period),
  });
  const data = query.data;
  const loading = query.isLoading;

  const hasErrors = useMemo(
    () => (data ?? []).some((p) => (p.failed ?? 0) > 0),
    [data],
  );

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={t("charts.tabs.label")}
        className="inline-flex max-w-full overflow-x-auto rounded-xl bg-gray-100 dark:bg-gray-800 p-1 gap-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {PERIODS.map((period) => {
          const isActive = period === active;
          const showDot =
            isActive && hasErrors && ["hourly", "weekly", "daily"].includes(period);
          return (
            <button
              key={period}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(period)}
              className={`relative inline-flex flex-shrink-0 items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <PeriodIcon period={period} />
              <span>{t(`charts.tabs.${period}`)}</span>
              {showDot && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500"
                  aria-label={t("charts.tabs.hasErrors")}
                />
              )}
            </button>
          );
        })}
      </div>
      {loading ? (
        <div className="animate-in fade-in duration-200">
          <ChartSkeleton
            icon={<PeriodIcon period={active} />}
            tall={active === "monthly" || active === "yearly"}
          />
        </div>
      ) : data ? (
        <PeriodChart period={active} data={data} lang={locale} t={t} />
      ) : null}
    </div>
  );
}
