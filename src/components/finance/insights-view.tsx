"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatSum } from "@/lib/money";
import { formatRelativeTime } from "@/lib/relative-time";
import { presetRange, type DateRangePreset } from "@/lib/date-range";
import type { CampaignFinance, FinanceDailyPoint } from "@/lib/api/finance";
import {
  useFinanceByCampaign,
  useFinanceByPlatform,
  useFinanceDaily,
  useFinanceOverview,
} from "@/hooks/use-finance";
import { DateRangeTabs } from "@/components/finance/date-range-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

/** Signed sum with green/red coloring; neutral when zero. */
function profitClass(value: number): string {
  if (value > 0) return "text-emerald-700 dark:text-emerald-400";
  if (value < 0) return "text-red-700 dark:text-red-400";
  return "";
}

function formatDay(iso: string, locale: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(date);
}

/** Compact axis ticks: 1 200 000 -> "1.2M". */
function formatAxisSum(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
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
  labels,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  locale: string;
  labels: { revenue: string; spend: string; profit: string };
}) {
  if (!active || !payload?.length) return null;
  const byKey = new Map(payload.map((entry) => [entry.dataKey, entry.value]));
  const rows: { key: "revenue" | "spend" | "profit"; swatch: string }[] = [
    { key: "revenue", swatch: "bg-primary" },
    { key: "spend", swatch: "bg-destructive" },
    { key: "profit", swatch: "bg-foreground" },
  ];
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{formatDay(String(label), locale)}</p>
      <div className="flex flex-col gap-1">
        {rows.map(({ key, swatch }) => (
          <p key={key} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-[3px]", swatch)} />
            {labels[key]}:{" "}
            <span className="font-semibold tabular-nums">
              {formatSum(Number(byKey.get(key) ?? 0)) ?? 0}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

function DailyChartBody({ data }: { data: FinanceDailyPoint[] }) {
  const t = useTranslations("finance.chart");
  const locale = useLocale();
  const labels = {
    revenue: t("revenue"),
    spend: t("spend"),
    profit: t("profit"),
  };

  return (
    <>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -4 }}
          >
            <defs>
              <linearGradient id="finance-revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(value: number) => formatAxisSum(value)}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              content={<ChartTooltipContent locale={locale} labels={labels} />}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#finance-revenue)"
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="spend"
              stroke="var(--destructive)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="var(--foreground)"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-primary" />
          {labels.revenue}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-destructive" />
          {labels.spend}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-foreground" />
          {labels.profit}
        </span>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Card className="py-3">
      <CardContent className="px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-xl font-bold tabular-nums", className)}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function CampaignsTable({ campaigns }: { campaigns: CampaignFinance[] }) {
  const t = useTranslations("finance.campaigns");

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("colCampaign")}</TableHead>
            <TableHead className="text-right">{t("colLeads")}</TableHead>
            <TableHead className="text-right">{t("colAccepted")}</TableHead>
            <TableHead className="text-right">{t("colDelivered")}</TableHead>
            <TableHead className="text-right">{t("colSpend")}</TableHead>
            <TableHead className="text-right">{t("colCpl")}</TableHead>
            <TableHead className="text-right">{t("colRoas")}</TableHead>
            <TableHead className="text-right">{t("colProfit")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.campaign_id}>
              <TableCell className="max-w-56">
                <span className="block truncate font-medium" title={campaign.campaign_name}>
                  {campaign.campaign_name}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {campaign.leads}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {campaign.accepted}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {campaign.delivered}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">
                {formatSum(campaign.spend) ?? "—"}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap tabular-nums">
                {formatSum(campaign.cpl) ?? "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {(campaign.roas ?? 0).toFixed(2)}x
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-medium whitespace-nowrap tabular-nums",
                  profitClass(campaign.profit),
                )}
              >
                {formatSum(campaign.profit) ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function FinanceInsightsView() {
  const t = useTranslations("finance");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [preset, setPreset] = useState<DateRangePreset>("last30");
  const range = useMemo(() => presetRange(preset), [preset]);

  const overviewQuery = useFinanceOverview(range);
  const dailyQuery = useFinanceDaily(range);
  const campaignsQuery = useFinanceByCampaign(range);
  const platformsQuery = useFinanceByPlatform(range);

  const overview = overviewQuery.data;
  const rate = overview?.currency_rate;
  const rateUpdated = formatRelativeTime(rate?.updated_at, locale);

  const campaigns = useMemo(
    () => [...(campaignsQuery.data ?? [])].sort((a, b) => b.spend - a.spend),
    [campaignsQuery.data],
  );
  const platforms = platformsQuery.data ?? [];

  const sum = (value: number | undefined) =>
    value === undefined ? "—" : `${formatSum(value) ?? 0}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        {rate && (
          <Badge variant="outline" className="gap-1.5 py-1.5 font-normal">
            <span className="font-semibold tabular-nums">
              1 USD = {formatSum(rate.usd_uzs)} {tCommon("sum")}
            </span>
            {rateUpdated && (
              <span className="text-muted-foreground">· {rateUpdated}</span>
            )}
          </Badge>
        )}
      </div>

      <DateRangeTabs value={preset} onChange={setPreset} />

      {overviewQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      ) : overviewQuery.isError ? (
        <LoadErrorState onRetry={() => overviewQuery.refetch()} />
      ) : overview ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label={t("kpi.profit")}
            value={sum(overview.profit)}
            className={profitClass(overview.profit)}
          />
          <KpiCard
            label={t("kpi.roas")}
            value={`${(overview.roas ?? 0).toFixed(2)}x`}
          />
          <KpiCard label={t("kpi.cpl")} value={sum(overview.cpl)} />
          <KpiCard
            label={t("kpi.deliveryRate")}
            value={`${(overview.delivery_rate ?? 0).toFixed(1)}%`}
          />
          <KpiCard label={t("kpi.spend")} value={sum(overview.spend)} />
          <KpiCard label={t("kpi.revenue")} value={sum(overview.revenue)} />
          <KpiCard label={t("kpi.hold")} value={sum(overview.hold)} />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("chart.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyQuery.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : dailyQuery.isError ? (
            <LoadErrorState onRetry={() => dailyQuery.refetch()} />
          ) : (dailyQuery.data ?? []).length === 0 ? (
            <EmptyState label={t("noData")} />
          ) : (
            <DailyChartBody data={dailyQuery.data ?? []} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("campaigns.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : campaignsQuery.isError ? (
            <LoadErrorState onRetry={() => campaignsQuery.refetch()} />
          ) : campaigns.length === 0 ? (
            <EmptyState label={t("noData")} />
          ) : (
            <CampaignsTable campaigns={campaigns} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("platforms.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {platformsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-10" />
              ))}
            </div>
          ) : platformsQuery.isError ? (
            <LoadErrorState onRetry={() => platformsQuery.refetch()} />
          ) : platforms.length === 0 ? (
            <EmptyState label={t("noData")} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("platforms.colPlatform")}</TableHead>
                    <TableHead className="text-right">
                      {t("platforms.colLeads")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("platforms.colDelivered")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("platforms.colRevenue")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platforms.map((platform) => (
                    <TableRow key={platform.platform}>
                      <TableCell className="font-medium">
                        {platform.platform}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {platform.leads}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {platform.delivered}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums">
                        {formatSum(platform.revenue) ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
