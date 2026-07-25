"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStatsChart } from "@/hooks/use-stats";
import type { ChartPoint } from "@/lib/api/stats";

const CHART_DAYS = 14;

function formatDay(iso: string, locale: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(date);
}

interface TooltipEntry {
  dataKey?: string | number;
  value?: number | string;
}

function ChartTooltipContent({
  active,
  payload,
  label,
  locale,
  deliveredLabel,
  failedLabel,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  locale: string;
  deliveredLabel: string;
  failedLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const byKey = new Map(payload.map((entry) => [entry.dataKey, entry.value]));
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{formatDay(String(label), locale)}</p>
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-primary" />
          {deliveredLabel}:{" "}
          <span className="font-semibold">{byKey.get("delivered") ?? 0}</span>
        </p>
        <p className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-destructive" />
          {failedLabel}:{" "}
          <span className="font-semibold">{byKey.get("failed") ?? 0}</span>
        </p>
      </div>
    </div>
  );
}

function ChartBody({ data }: { data: ChartPoint[] }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(value: string) => formatDay(value, locale)}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.5 }}
              content={
                <ChartTooltipContent
                  locale={locale}
                  deliveredLabel={t("delivered")}
                  failedLabel={t("failed")}
                />
              }
            />
            <Bar
              dataKey="delivered"
              stackId="leads"
              fill="var(--primary)"
              stroke="var(--card)"
              strokeWidth={1}
              maxBarSize={28}
            />
            <Bar
              dataKey="failed"
              stackId="leads"
              fill="var(--destructive)"
              stroke="var(--card)"
              strokeWidth={1}
              radius={[3, 3, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-primary" />
          {t("delivered")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-destructive" />
          {t("failed")}
        </span>
      </div>
    </>
  );
}

export function LeadsChart() {
  const t = useTranslations("dashboard");
  const chartQuery = useStatsChart(CHART_DAYS);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("chartTitle")}</CardTitle>
        <CardDescription>
          {t("chartSubtitle", { days: CHART_DAYS })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartQuery.isLoading && <Skeleton className="h-64 w-full" />}
        {chartQuery.isError && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center">
            <p className="text-sm text-muted-foreground">{t("loadError")}</p>
            <Button variant="outline" onClick={() => chartQuery.refetch()}>
              {t("retry")}
            </Button>
          </div>
        )}
        {chartQuery.data &&
          (chartQuery.data.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            </div>
          ) : (
            <ChartBody data={chartQuery.data} />
          ))}
      </CardContent>
    </Card>
  );
}
