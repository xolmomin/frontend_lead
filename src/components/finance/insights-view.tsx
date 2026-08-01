"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  DollarSign,
  Info,
  Package,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { CampaignFinance, FinanceOverview } from "@/lib/api/finance";
import {
  useFinanceByCampaign,
  useFinanceByPlatform,
  useFinanceDaily,
  useFinanceOverview,
} from "@/hooks/use-finance";
import { YbBadge } from "@/components/yb/badge";
import { YbButton } from "@/components/yb/button";
import { YbCard, YbCardHeader, YbCardTitle } from "@/components/yb/card";
import { YbSpinner } from "@/components/yb/spinner";
import { YbTooltip } from "@/components/yb/tooltip";
import { FinanceSettingsModal } from "@/components/finance/settings-modal";
import {
  FINANCE_WINDOWS,
  financeWindowRange,
  formatCount,
  formatUsd,
  isFinanceWindow,
  type FinanceWindow,
} from "@/components/finance/finance-window";

export const AUTO_REFRESH_MS = 120_000;

const TREND_METRICS = ["leads", "revenue", "spend", "hold"] as const;
type TrendMetric = (typeof TREND_METRICS)[number];

type SortKey = "leads" | "spend" | "cpl" | "roas" | "profit";
type SortDir = "asc" | "desc";
interface SortState {
  key: SortKey;
  dir: SortDir;
}

/**
 * Production breakdown rows carry health / alert metadata the local
 * /finance/by-campaign endpoint does not provide yet. The fields are optional
 * so the production markup renders (and gracefully hides) either way.
 */
type BreakdownRow = CampaignFinance & {
  /** Per-campaign revenue is not exposed by the local API yet. */
  revenue?: number | null;
  health?: "green" | "amber" | "red" | null;
  break_even_cpl?: number | null;
  is_new?: boolean;
  unconnected?: boolean;
  expense_level?: "ok" | "warn" | "over" | null;
  is_expensive?: boolean;
  ad_account_id?: string | null;
};

/** Optional production-only overview fields (absent from the local API). */
type OverviewExtra = FinanceOverview & {
  spend_currency_warning?: string[];
  connected_recently?: boolean;
  ad_accounts?: { id: string; name?: string | null }[];
};

function sortValue(row: BreakdownRow, key: SortKey): number | null {
  const value = row[key];
  return typeof value === "number" ? value : null;
}

function meterBarClass(level: "danger" | "warning" | "success"): string {
  switch (level) {
    case "danger":
      return "bg-gradient-to-r from-red-500 to-red-600";
    case "warning":
      return "bg-gradient-to-r from-yellow-500 to-orange-500";
    default:
      return "bg-gradient-to-r from-green-500 to-green-600";
  }
}

function clampPct(value: number | null | undefined): number {
  return value == null || Number.isNaN(value)
    ? 0
    : Math.min(Math.max(value, 0), 100);
}

export function FinanceInsightsView() {
  const t = useTranslations("finance");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [windowSel, setWindowSel] = useState<FinanceWindow>(() => {
    const fromUrl = searchParams.get("window");
    return isFinanceWindow(fromUrl) ? fromUrl : "7d";
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [metric, setMetric] = useState<TrendMetric>("revenue");
  const [search, setSearch] = useState("");
  const [accountSel, setAccountSel] = useState("");
  const [sort, setSort] = useState<SortState | null>(null);

  const range = useMemo(() => financeWindowRange(windowSel), [windowSel]);

  const overviewQuery = useFinanceOverview(range);
  const dailyQuery = useFinanceDaily(range);
  const campaignsQuery = useFinanceByCampaign(range);
  const platformsQuery = useFinanceByPlatform(range);

  const overview = overviewQuery.data as OverviewExtra | undefined;
  const totals = overview;

  const syncing =
    overviewQuery.isFetching ||
    dailyQuery.isFetching ||
    campaignsQuery.isFetching ||
    platformsQuery.isFetching;

  const refetchAllRef = useRef<() => void>(() => {});
  useEffect(() => {
    refetchAllRef.current = () => {
      void overviewQuery.refetch();
      void dailyQuery.refetch();
      void campaignsQuery.refetch();
      void platformsQuery.refetch();
    };
  });

  // Production auto-refreshes insights every 2 minutes while visible.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refetchAllRef.current();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  // The production sync API is unavailable locally; the "last updated" label
  // reflects when the overview query last fetched instead.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const secondsAgo =
    overviewQuery.dataUpdatedAt > 0
      ? Math.max(0, Math.floor((now - overviewQuery.dataUpdatedAt) / 1000))
      : null;

  const lastSyncLabel = () =>
    secondsAgo === null
      ? t("sync.never")
      : secondsAgo < 60
        ? t("sync.just_now")
        : secondsAgo < 3600
          ? t("sync.minutes_ago", { n: Math.floor(secondsAgo / 60) })
          : secondsAgo < 86400
            ? t("sync.hours_ago", { n: Math.floor(secondsAgo / 3600) })
            : t("sync.days_ago", { n: Math.floor(secondsAgo / 86400) });

  const trendLoading = dailyQuery.isPending;
  const breakdownLoading = campaignsQuery.isPending;

  const breakdown = useMemo<BreakdownRow[]>(
    () => (campaignsQuery.data ?? []) as BreakdownRow[],
    [campaignsQuery.data],
  );
  const adAccounts = overview?.ad_accounts ?? [];
  const accountFilter = adAccounts.some((a) => a.id === accountSel)
    ? accountSel
    : "";

  const filteredRows = useMemo(() => {
    const other = breakdown.find((row) => row.campaign_id === "_other");
    const named = breakdown.filter((row) => row.campaign_id !== "_other");
    const query = search.trim().toLowerCase();
    const matchesSearch = (row: BreakdownRow) =>
      !query || (row.campaign_name || "").toLowerCase().includes(query);
    const matchesAccount = (row: BreakdownRow) =>
      !accountFilter || row.ad_account_id === accountFilter;
    let rows = named.filter((row) => matchesAccount(row) && matchesSearch(row));
    if (sort) {
      const { key, dir } = sort;
      rows = [...rows].sort((a, b) => {
        const va = sortValue(a, key);
        const vb = sortValue(b, key);
        return va === null && vb === null
          ? 0
          : va === null
            ? 1
            : vb === null
              ? -1
              : dir === "asc"
                ? va - vb
                : vb - va;
      });
    }
    if (!accountFilter && other && matchesSearch(other)) rows = [...rows, other];
    return rows;
  }, [breakdown, search, accountFilter, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      !prev || prev.key !== key
        ? { key, dir: "desc" }
        : prev.dir === "desc"
          ? { key, dir: "asc" }
          : null,
    );
  };

  const trend = dailyQuery.data ?? [];
  const platforms = useMemo(
    () =>
      [...(platformsQuery.data ?? [])].sort((a, b) => b.revenue - a.revenue),
    [platformsQuery.data],
  );

  const currencyWarnings = overview?.spend_currency_warning ?? [];
  const connectedRecently = overview?.connected_recently ?? false;

  const hasOther = breakdown.some((row) => row.campaign_id === "_other");
  const shownCount = breakdown.length - (hasOther ? 1 : 0);
  // breakdown_total (server-side cap) is not exposed by the local API.
  const breakdownTotal: number | undefined = undefined;
  const isCapped = breakdownTotal !== undefined && breakdownTotal > shownCount;

  // Totals the local overview endpoint lacks, derived from the breakdown.
  const leadsTotal = campaignsQuery.data
    ? breakdown.reduce((sum, row) => sum + (row.leads ?? 0), 0)
    : undefined;
  const deliveredTotal = campaignsQuery.data
    ? breakdown.reduce((sum, row) => sum + (row.delivered ?? 0), 0)
    : undefined;

  const rate = overview?.currency_rate?.usd_uzs;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex-shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {t("insights.title")}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {t("insights.subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {rate != null ? (
              <span className="hidden md:inline text-[11px] text-gray-400 dark:text-gray-500">
                {t("insights.rate")}: 1$ = {formatCount(Math.round(rate))}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => refetchAllRef.current()}
              disabled={syncing}
              title={`${t("sync.last_updated")}: ${lastSyncLabel()}`}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-primary-400 disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", syncing && "animate-spin")} />
              <span className="hidden sm:inline">
                {syncing ? t("sync.syncing") : lastSyncLabel()}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              title={t("settings.title")}
              aria-label={t("settings.title")}
              className="inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-primary-400 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex sm:justify-end">
          <div className="inline-flex w-full sm:w-auto rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 gap-0.5">
            {FINANCE_WINDOWS.map((window) => (
              <button
                key={window}
                type="button"
                onClick={() => setWindowSel(window)}
                className={`flex-1 sm:flex-none text-xs px-3 py-1.5 rounded-md transition-colors ${
                  window === windowSel
                    ? "bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 shadow-sm font-medium"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {t(`insights.window.${window}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {currencyWarnings.length > 0 ? (
        <div className="flex items-start gap-3 p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {t("insights.currency_warning", {
              list: currencyWarnings.join(", "),
            })}
          </p>
        </div>
      ) : null}

      {connectedRecently ? (
        <div className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {t("insights.connected_recently")}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          label={t("insights.kpi.profit")}
          value={typeof totals?.profit === "number" ? formatUsd(totals.profit) : "—"}
          tone={
            typeof totals?.profit === "number"
              ? totals.profit < 0
                ? "rose"
                : "emerald"
              : undefined
          }
        />
        {/* projected_profit is not exposed by the local API — placeholder. */}
        <StatCard
          label={t("insights.kpi.projected_profit")}
          value="—"
          icon={<TrendingUp className="w-4 h-4" />}
          hint={t("insights.kpi.projected_hint")}
        />
        <StatCard
          label={t("insights.kpi.roas")}
          value={
            totals?.roas !== null && totals?.roas !== undefined
              ? `${totals.roas.toFixed(2)}×`
              : "—"
          }
          tone={
            totals?.roas !== null && totals?.roas !== undefined && totals.roas < 1
              ? "rose"
              : "default"
          }
        />
        <StatCard
          label={t("insights.kpi.delivery_rate")}
          value={
            totals?.delivery_rate !== null && totals?.delivery_rate !== undefined
              ? `${totals.delivery_rate}%`
              : "—"
          }
          icon={<Truck className="w-4 h-4" />}
          meterPct={
            totals?.delivery_rate !== null && totals?.delivery_rate !== undefined
              ? totals.delivery_rate
              : null
          }
        />
        <StatCard
          label={t("insights.kpi.revenue")}
          value={formatUsd(totals?.revenue)}
          icon={<Wallet className="w-4 h-4" />}
        />
        <StatCard
          label={t("insights.kpi.spend")}
          value={formatUsd(totals?.spend)}
          invertChange
          icon={<CreditCard className="w-4 h-4" />}
        />
        <StatCard
          label={t("insights.kpi.cpl")}
          value={typeof totals?.cpl === "number" ? formatUsd(totals.cpl) : "—"}
        />
        <StatCard label={t("insights.kpi.hold")} value={formatUsd(totals?.hold)} />
        <StatCard
          label={t("insights.kpi.leads")}
          value={formatCount(leadsTotal)}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          label={t("insights.kpi.delivered")}
          value={formatCount(deliveredTotal)}
          icon={<Package className="w-4 h-4" />}
        />
      </div>

      <YbCard variant="elevated">
        <YbCardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <YbCardTitle className="text-base sm:text-lg">
            {t("insights.trend.title")}
          </YbCardTitle>
          <div className="inline-flex self-start sm:self-auto rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 gap-0.5">
            {TREND_METRICS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMetric(option)}
                // "hold" has no daily series in the local API yet.
                disabled={option === "hold"}
                className={`text-[11px] px-2.5 py-1 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  option === metric
                    ? "bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 shadow-sm font-medium"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {t(`insights.trend.${option}`)}
              </button>
            ))}
          </div>
        </YbCardHeader>
        <div>
          {trendLoading ? (
            <div className="py-12 flex items-center justify-center">
              <YbSpinner size="md" />
            </div>
          ) : trend.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              {t("insights.trend.empty")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart
                data={trend}
                margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="finTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  className="text-gray-600 dark:text-gray-400"
                  tickFormatter={(value: string) => value.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  width={56}
                  className="text-gray-600 dark:text-gray-400"
                />
                <Tooltip
                  formatter={(value) => {
                    const n = Number(value) || 0;
                    return [
                      metric === "leads" ? formatCount(n) : formatUsd(n),
                      t(`insights.trend.${metric}`),
                    ];
                  }}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#finTrend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </YbCard>

      <YbCard variant="elevated">
        <YbCardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <YbCardTitle className="text-base sm:text-lg">
              {t("insights.breakdown.title")}
            </YbCardTitle>
            {isCapped ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {t("insights.breakdown.capped", {
                  shown: shownCount,
                  total: breakdownTotal ?? 0,
                })}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {adAccounts.length >= 2 ? (
              <select
                aria-label={t("insights.breakdown.account_filter")}
                value={accountFilter}
                onChange={(e) => setAccountSel(e.target.value)}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              >
                <option value="">{t("insights.breakdown.all_accounts")}</option>
                {adAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name || account.id}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("insights.breakdown.search")}
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              />
            </div>
          </div>
        </YbCardHeader>
        <div>
          {breakdownLoading ? (
            <div className="py-12 flex items-center justify-center">
              <YbSpinner size="md" />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-12 text-center">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-4">
                {t("insights.breakdown.empty_hint")}
              </p>
              <YbButton
                variant="primary"
                size="sm"
                onClick={() => router.push("/dashboard/integrations")}
              >
                {t("insights.breakdown.empty")}
              </YbButton>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
                    <th
                      role="columnheader"
                      aria-sort="none"
                      className="py-2.5 px-3 font-medium"
                    >
                      {t("insights.breakdown.cols.campaign")}
                    </th>
                    <SortableTh
                      sortKey="leads"
                      label={t("insights.breakdown.cols.leads")}
                      sort={sort}
                      onSort={toggleSort}
                    />
                    <th
                      role="columnheader"
                      aria-sort="none"
                      className="py-2.5 px-3 font-medium text-right"
                    >
                      {t("insights.breakdown.cols.accepted")}
                    </th>
                    <th
                      role="columnheader"
                      aria-sort="none"
                      className="py-2.5 px-3 font-medium text-right"
                    >
                      {t("insights.breakdown.cols.delivered")}
                    </th>
                    <SortableTh
                      sortKey="spend"
                      label={t("insights.breakdown.cols.spend")}
                      sort={sort}
                      onSort={toggleSort}
                    />
                    <th
                      role="columnheader"
                      aria-sort="none"
                      className="py-2.5 px-3 font-medium text-right"
                    >
                      {t("insights.breakdown.cols.revenue")}
                    </th>
                    <SortableTh
                      sortKey="cpl"
                      label={t("insights.breakdown.cols.cpl")}
                      sort={sort}
                      onSort={toggleSort}
                    />
                    <SortableTh
                      sortKey="roas"
                      label={t("insights.breakdown.cols.roas")}
                      sort={sort}
                      onSort={toggleSort}
                    />
                    <SortableTh
                      sortKey="profit"
                      label={t("insights.breakdown.cols.profit")}
                      sort={sort}
                      onSort={toggleSort}
                    />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredRows.map((row) => {
                    const level = row.unconnected
                      ? "ok"
                      : (row.expense_level ??
                        (row.is_expensive ? "over" : "ok"));
                    return (
                      <tr
                        key={row.campaign_id}
                        className={`transition-colors ${
                          level === "over"
                            ? "bg-rose-50/60 dark:bg-rose-900/15 hover:bg-rose-50 dark:hover:bg-rose-900/25"
                            : level === "warn"
                              ? "bg-amber-50/60 dark:bg-amber-900/15 hover:bg-amber-50 dark:hover:bg-amber-900/25"
                              : "hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                        }`}
                      >
                        <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-gray-100 max-w-[240px]">
                          <div className="flex items-center gap-1.5 truncate">
                            {row.health && !row.unconnected ? (
                              <span
                                aria-label={t(
                                  `insights.breakdown.health.${row.health}`,
                                )}
                                title={
                                  row.break_even_cpl !== null &&
                                  row.break_even_cpl !== undefined
                                    ? t("insights.breakdown.health.break_even", {
                                        value: formatUsd(row.break_even_cpl),
                                      })
                                    : undefined
                                }
                                className={cn(
                                  "inline-block w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0",
                                  row.health === "green" &&
                                    "bg-emerald-500 dark:bg-emerald-400",
                                  row.health === "amber" &&
                                    "bg-amber-500 dark:bg-amber-400",
                                  row.health === "red" &&
                                    "bg-rose-500 dark:bg-rose-400",
                                )}
                              />
                            ) : null}
                            {level === "over" ? (
                              <AlertTriangle
                                className="w-3.5 h-3.5 text-rose-500 flex-shrink-0"
                                aria-label={t("insights.breakdown.expensive")}
                              />
                            ) : level === "warn" ? (
                              <span title={t("insights.breakdown.warning_hint")}>
                                <AlertTriangle
                                  className="w-3.5 h-3.5 text-amber-500 flex-shrink-0"
                                  aria-label={t("insights.breakdown.warning")}
                                />
                              </span>
                            ) : null}
                            <span className="truncate">{row.campaign_name}</span>
                            {row.is_new ? (
                              <YbBadge
                                variant="info"
                                size="sm"
                                className="flex-shrink-0"
                              >
                                {t("insights.breakdown.cols.new")}
                              </YbBadge>
                            ) : null}
                            {row.unconnected ? (
                              <YbBadge
                                variant="default"
                                size="sm"
                                className="flex-shrink-0"
                              >
                                {t("insights.breakdown.badges.unconnected")}
                              </YbBadge>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                          {formatCount(row.leads)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-green-600 dark:text-green-400">
                          {formatCount(row.accepted)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCount(row.delivered)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                          {formatUsd(row.spend)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                          {row.revenue != null ? formatUsd(row.revenue) : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-end">
                            <span>
                              {row.cpl === null ? "—" : formatUsd(row.cpl)}
                            </span>
                            {row.break_even_cpl !== null &&
                            row.break_even_cpl !== undefined ? (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                {t("insights.breakdown.health.be_inline", {
                                  value: formatUsd(row.break_even_cpl),
                                })}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right tabular-nums font-medium ${
                            typeof row.roas === "number"
                              ? row.roas < 1
                                ? "text-rose-500"
                                : "text-gray-700 dark:text-gray-300"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {typeof row.roas === "number"
                            ? `${row.roas.toFixed(2)}×`
                            : "—"}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right tabular-nums font-semibold ${
                            typeof row.profit === "number"
                              ? row.profit < 0
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-emerald-600 dark:text-emerald-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {typeof row.profit === "number"
                            ? formatUsd(row.profit)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </YbCard>

      {platforms.length > 0 ? (
        <YbCard variant="elevated">
          <YbCardHeader>
            <YbCardTitle className="text-base sm:text-lg">
              {t("insights.platforms.title")}
            </YbCardTitle>
          </YbCardHeader>
          <div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2.5 px-3 font-medium">
                      {t("insights.platforms.cols.platform")}
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      {t("insights.platforms.cols.leads")}
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      {t("insights.platforms.cols.delivered")}
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      {t("insights.platforms.cols.delivery_rate")}
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      {t("insights.platforms.cols.revenue")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {platforms.map((platform) => {
                    // delivery_rate is not exposed by the local platform
                    // endpoint — derive it from delivered / leads.
                    const deliveryRate =
                      platform.leads > 0
                        ? Math.round(
                            (platform.delivered / platform.leads) * 100,
                          )
                        : null;
                    return (
                      <tr
                        key={platform.platform}
                        className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-gray-100">
                          {platform.platform}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                          {formatCount(platform.leads)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCount(platform.delivered)}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-gray-500 dark:text-gray-400">
                          {deliveryRate !== null ? `${deliveryRate}%` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-gray-700 dark:text-gray-300">
                          {formatUsd(platform.revenue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </YbCard>
      ) : null}

      <FinanceSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  invertChange,
  tone = "default",
  icon,
  meterPct,
  hint,
}: {
  label: string;
  value: string;
  change?: number;
  invertChange?: boolean;
  tone?: "default" | "emerald" | "rose";
  icon?: ReactNode;
  meterPct?: number | null;
  hint?: string;
}) {
  const valueClass =
    tone === "emerald"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "rose"
        ? "text-rose-600 dark:text-rose-400"
        : "text-gray-900 dark:text-gray-100";
  const meterLevel =
    typeof meterPct === "number"
      ? meterPct < 50
        ? "danger"
        : meterPct < 70
          ? "warning"
          : "success"
      : null;
  return (
    <YbCard variant="default">
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
          {icon}
          <span className="truncate">{label}</span>
          {hint ? (
            <YbTooltip content={hint}>
              <button
                type="button"
                aria-label={hint}
                className="inline-flex flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </YbTooltip>
          ) : null}
        </div>
        <p className={`text-base sm:text-lg font-bold tabular-nums ${valueClass}`}>
          {value}
        </p>
        {typeof change === "number" ? (
          <ChangePct pct={change} invert={invertChange} />
        ) : null}
        {meterLevel === null ? null : (
          <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              data-testid="delivery-rate-meter"
              className={`h-full rounded-full transition-all duration-300 ${meterBarClass(meterLevel)}`}
              style={{ width: `${clampPct(meterPct)}%` }}
            />
          </div>
        )}
      </div>
    </YbCard>
  );
}

function ChangePct({ pct, invert }: { pct: number; invert?: boolean }) {
  const positive = pct >= 0;
  const good = invert ? !positive : positive;
  return (
    <div
      className={`mt-1 flex items-center gap-0.5 text-[11px] font-medium ${
        good
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-500 dark:text-rose-400"
      }`}
    >
      {positive ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {Math.abs(pct).toFixed(1)}%
    </div>
  );
}

function SortableTh({
  sortKey,
  label,
  sort,
  onSort,
}: {
  sortKey: SortKey;
  label: string;
  sort: SortState | null;
  onSort: (key: SortKey) => void;
}) {
  const active = sort?.key === sortKey;
  return (
    <th
      role="columnheader"
      aria-sort={active ? (sort?.dir === "asc" ? "ascending" : "descending") : "none"}
      tabIndex={0}
      onClick={() => onSort(sortKey)}
      onKeyDown={(e: KeyboardEvent<HTMLTableCellElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSort(sortKey);
        }
      }}
      className={cn(
        "py-2.5 px-3 font-medium text-right cursor-pointer select-none transition-colors",
        active
          ? "text-primary-600 dark:text-primary-400"
          : "hover:text-gray-600 dark:hover:text-gray-300",
      )}
    >
      {label}
      {active ? (sort?.dir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );
}
