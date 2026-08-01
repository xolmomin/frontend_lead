"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  Clock,
  TrendingUp,
} from "lucide-react";
import { getStatsChart, type ChartPoint } from "@/lib/api/stats";
import { YbCard, YbCardHeader, YbCardTitle } from "@/components/yb/card";

const SUCCESS_COLOR = "#10b981";
const ERROR_COLOR = "#f87171";
const CURRENT_COLOR = "#6366f1";

const PERIODS = ["hourly", "weekly", "daily", "monthly", "yearly"] as const;
type Period = (typeof PERIODS)[number];

// Local `/stats/chart` query parameters per production tab.
const PERIOD_QUERY: Record<Period, { period: string; days: number }> = {
  hourly: { period: "hourly", days: 1 },
  weekly: { period: "daily", days: 7 },
  daily: { period: "daily", days: 30 },
  monthly: { period: "monthly", days: 365 },
  yearly: { period: "yearly", days: 1825 },
};

const MONTHS_FULL: Record<string, string[]> = {
  uz: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"],
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const MONTHS_SHORT: Record<string, string[]> = {
  uz: ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"],
  ru: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

type Translate = (key: string, values?: Record<string, string | number | Date>) => string;

interface AreaPoint {
  date: string;
  total: number;
  errors: number;
  success: number;
  label: string;
  tooltipLabel?: string;
  isCurrent?: boolean;
  isToday?: boolean;
  hour?: string;
}

function pointTotal(p: ChartPoint): number {
  return (p.delivered ?? 0) + (p.failed ?? 0);
}

function hourLabel(date: string, index: number): string {
  if (/^\d{1,2}$/.test(date)) return date.padStart(2, "0");
  const isoMatch = date.match(/[T ](\d{2})/);
  if (isoMatch) return isoMatch[1];
  return String(index).padStart(2, "0");
}

function PeriodIcon({ period }: { period: Period }) {
  if (period === "hourly")
    return <Clock className="w-4 h-4" aria-hidden="true" />;
  if (period === "weekly")
    return <TrendingUp className="w-4 h-4" aria-hidden="true" />;
  if (period === "daily")
    return <CalendarDays className="w-4 h-4" aria-hidden="true" />;
  if (period === "monthly")
    return <CalendarRange className="w-4 h-4" aria-hidden="true" />;
  return <BarChart3 className="w-4 h-4" aria-hidden="true" />;
}

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
        <>
          {active === "hourly" && (
            <HourlyChart data={data} lang={locale} t={t} />
          )}
          {active === "weekly" && (
            <DailyChart
              data={data}
              lang={locale}
              t={t}
              titleKey="charts.weekly.title"
            />
          )}
          {active === "daily" && <DailyChart data={data} lang={locale} t={t} />}
          {active === "monthly" && (
            <MonthlyChart data={data} lang={locale} t={t} />
          )}
          {active === "yearly" && <YearlyChart data={data} t={t} />}
        </>
      ) : null}
    </div>
  );
}

function MonthlyChart({
  data,
  lang,
  t,
}: {
  data: ChartPoint[];
  lang: string;
  t: Translate;
}) {
  const monthsFull = MONTHS_FULL[lang] ?? MONTHS_FULL.en;
  const monthsShort = MONTHS_SHORT[lang] ?? MONTHS_SHORT.en;
  const byMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of data) {
      const key = p.date.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + pointTotal(p));
    }
    return map;
  }, [data]);
  const year =
    data.length > 0
      ? data[0].date.slice(0, 4)
      : String(new Date().getFullYear());
  const currentMonth = new Date().getMonth();
  const chartData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const key = `${year}-${String(i + 1).padStart(2, "0")}`;
        return {
          month: key,
          total: byMonth.get(key) ?? 0,
          label: monthsShort[i] ?? key,
          tooltipLabel: monthsFull[i] ?? key,
          isCurrent: i === currentMonth,
        };
      }),
    [byMonth, monthsFull, monthsShort, year, currentMonth],
  );
  const total = useMemo(
    () => data.reduce((acc, p) => acc + pointTotal(p), 0),
    [data],
  );
  const isEmpty = total === 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <YbCard variant="elevated">
        <YbCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <YbCardTitle className="text-base sm:text-xl">
                {t("charts.monthly.title", { year })}
              </YbCardTitle>
            </div>
            <TotalSummary total={total} t={t} />
          </div>
        </YbCardHeader>
        <div>
          {isEmpty ? (
            <ChartEmpty
              icon={<BarChart3 className="w-10 h-10" />}
              message={t("charts.empty")}
            />
          ) : (
            <div className="h-72 sm:h-80 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-gray-200 dark:stroke-gray-700"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={(props: {
                      x?: number | string;
                      y?: number | string;
                      payload?: { value?: unknown };
                    }) => {
                      const value = String(props.payload?.value ?? "");
                      const idx = chartData.findIndex((d) => d.label === value);
                      const isCurrent = idx >= 0 && chartData[idx].isCurrent;
                      return (
                        <text
                          x={props.x}
                          y={Number(props.y) + 14}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={isCurrent ? 700 : 400}
                          fill={isCurrent ? CURRENT_COLOR : "currentColor"}
                          className={
                            isCurrent
                              ? ""
                              : "text-gray-600 dark:text-gray-400 fill-current"
                          }
                        >
                          {value}
                        </text>
                      );
                    }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    height={28}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-gray-600 dark:text-gray-400"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={36}
                  />
                  <Tooltip
                    content={<SimpleTooltip t={t} />}
                    cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.isCurrent ? CURRENT_COLOR : SUCCESS_COLOR}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </YbCard>
    </div>
  );
}

function YearlyChart({ data, t }: { data: ChartPoint[]; t: Translate }) {
  const currentYear = new Date().getFullYear();
  const chartData = useMemo(() => {
    const map = new Map<number, number>();
    for (const p of data) {
      const year = parseInt(p.date.slice(0, 4), 10);
      if (!Number.isNaN(year)) map.set(year, (map.get(year) ?? 0) + pointTotal(p));
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, total]) => ({
        year,
        total,
        label: String(year),
        tooltipLabel: String(year),
        isCurrent: year === currentYear,
      }));
  }, [data, currentYear]);
  const total = useMemo(
    () => data.reduce((acc, p) => acc + pointTotal(p), 0),
    [data],
  );
  const isEmpty = chartData.length === 0 || total === 0;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <YbCard variant="elevated">
        <YbCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <YbCardTitle className="text-base sm:text-xl">
                {t("charts.yearly.title")}
              </YbCardTitle>
            </div>
            <TotalSummary total={total} t={t} />
          </div>
        </YbCardHeader>
        <div>
          {isEmpty ? (
            <ChartEmpty
              icon={<BarChart3 className="w-10 h-10" />}
              message={t("charts.empty")}
            />
          ) : (
            <div className="h-72 sm:h-80 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-gray-200 dark:stroke-gray-700"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={(props: {
                      x?: number | string;
                      y?: number | string;
                      payload?: { value?: unknown };
                    }) => {
                      const value = String(props.payload?.value ?? "");
                      const idx = chartData.findIndex((d) => d.label === value);
                      const isCurrent = idx >= 0 && chartData[idx].isCurrent;
                      return (
                        <text
                          x={props.x}
                          y={Number(props.y) + 14}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={isCurrent ? 700 : 400}
                          fill={isCurrent ? CURRENT_COLOR : "currentColor"}
                          className={
                            isCurrent
                              ? ""
                              : "text-gray-600 dark:text-gray-400 fill-current"
                          }
                        >
                          {value}
                        </text>
                      );
                    }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    height={28}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-gray-600 dark:text-gray-400"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={36}
                  />
                  <Tooltip
                    content={<SimpleTooltip t={t} />}
                    cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={72}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.isCurrent ? CURRENT_COLOR : SUCCESS_COLOR}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </YbCard>
    </div>
  );
}

function HourlyChart({
  data,
  lang,
  t,
}: {
  data: ChartPoint[];
  lang: string;
  t: Translate;
}) {
  const currentHourKey = String(new Date().getHours()).padStart(2, "0");
  const chartData = useMemo<AreaPoint[]>(
    () =>
      data.map((p, i) => {
        const hour = hourLabel(p.date, i);
        const total = pointTotal(p);
        return {
          date: p.date,
          hour,
          total,
          errors: p.failed ?? 0,
          success: Math.max(0, total - (p.failed ?? 0)),
          label: hour,
          tooltipLabel: `${hour}:00`,
          isCurrent: hour === currentHourKey,
        };
      }),
    [data, currentHourKey],
  );
  const total = useMemo(
    () => chartData.reduce((acc, p) => acc + p.total, 0),
    [chartData],
  );
  const errors = useMemo(
    () => chartData.reduce((acc, p) => acc + p.errors, 0),
    [chartData],
  );
  const isEmpty = total === 0;
  const peak = useMemo(() => {
    if (isEmpty) return null;
    let best: { hour: string; total: number } = { hour: "", total: -1 };
    for (const p of chartData) {
      if (p.total > best.total) best = { hour: p.hour ?? "", total: p.total };
    }
    return best.total > 0 ? best : null;
  }, [chartData, isEmpty]);
  const todayLabel = useMemo(() => {
    const now = new Date();
    const months = MONTHS_FULL[lang] ?? MONTHS_FULL.en;
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }, [lang]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <YbCard variant="elevated">
        <YbCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <YbCardTitle className="text-base sm:text-xl">
                  {t("charts.hourly.title")}
                </YbCardTitle>
                {todayLabel && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {todayLabel}
                  </p>
                )}
              </div>
            </div>
            <TotalSummary total={total} errors={errors} t={t} />
          </div>
        </YbCardHeader>
        <div>
          {isEmpty ? (
            <ChartEmpty
              icon={<Clock className="w-10 h-10" />}
              message={t("charts.hourly.empty")}
            />
          ) : (
            <>
              <div className="h-64 sm:h-72 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="hourlySuccessGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={SUCCESS_COLOR}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor={SUCCESS_COLOR}
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient
                        id="hourlyErrorGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={ERROR_COLOR}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor={ERROR_COLOR}
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-gray-200 dark:stroke-gray-700"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={(props: {
                        x?: number | string;
                        y?: number | string;
                        payload?: { value?: unknown };
                      }) => {
                        const value = String(props.payload?.value ?? "");
                        const idx = chartData.findIndex(
                          (d) => d.label === value,
                        );
                        const isCurrent = idx >= 0 && chartData[idx].isCurrent;
                        return (
                          <text
                            x={props.x}
                            y={Number(props.y) + 14}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight={isCurrent ? 700 : 400}
                            fill={isCurrent ? CURRENT_COLOR : "currentColor"}
                            className={
                              isCurrent
                                ? ""
                                : "text-gray-600 dark:text-gray-400 fill-current"
                            }
                          >
                            {value}
                          </text>
                        );
                      }}
                      axisLine={false}
                      tickLine={false}
                      interval={1}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "currentColor" }}
                      className="text-gray-600 dark:text-gray-400"
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      width={36}
                    />
                    <Tooltip
                      content={
                        <AreaTooltip t={t} currentHourKey={currentHourKey} />
                      }
                      cursor={{ stroke: CURRENT_COLOR, strokeOpacity: 0.3 }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                      formatter={(value) =>
                        t(
                          value === "success"
                            ? "charts.legend.success"
                            : "charts.legend.errors",
                        )
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="success"
                      stroke={SUCCESS_COLOR}
                      strokeWidth={2}
                      fill="url(#hourlySuccessGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="errors"
                      stroke={ERROR_COLOR}
                      strokeWidth={2}
                      fill="url(#hourlyErrorGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {peak && (
                <div className="mt-3 px-1 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("charts.hourly.peakLabel")}
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {peak.hour}:00 — {peak.total.toLocaleString()}{" "}
                    {t("charts.hourly.peakUnit")}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </YbCard>
    </div>
  );
}

function DailyChart({
  data,
  lang,
  t,
  titleKey = "charts.daily.title",
}: {
  data: ChartPoint[];
  lang: string;
  t: Translate;
  titleKey?: string;
}) {
  const todayKey = data.length > 0 ? data[data.length - 1].date : null;
  const chartData = useMemo<AreaPoint[]>(
    () =>
      data.map((p) => {
        const day = parseInt(p.date.split("-")[2], 10);
        const total = pointTotal(p);
        return {
          date: p.date,
          total,
          errors: p.failed ?? 0,
          success: Math.max(0, total - (p.failed ?? 0)),
          label: String(day),
          isToday: p.date === todayKey,
        };
      }),
    [data, todayKey],
  );
  const total = useMemo(
    () => chartData.reduce((acc, p) => acc + p.total, 0),
    [chartData],
  );
  const errors = useMemo(
    () => chartData.reduce((acc, p) => acc + p.errors, 0),
    [chartData],
  );
  const isEmpty = total === 0;
  const monthLabel = useMemo(() => {
    if (data.length === 0) return "";
    const [year, month] = data[0].date.split("-");
    const idx = parseInt(month, 10) - 1;
    return `${(MONTHS_FULL[lang] ?? MONTHS_FULL.en)[idx] ?? month} ${year}`;
  }, [data, lang]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <YbCard variant="elevated">
        <YbCardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <YbCardTitle className="text-base sm:text-xl">
                  {t(titleKey)}
                </YbCardTitle>
                {monthLabel && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {monthLabel}
                  </p>
                )}
              </div>
            </div>
            <TotalSummary total={total} errors={errors} t={t} />
          </div>
        </YbCardHeader>
        <div>
          {isEmpty ? (
            <ChartEmpty
              icon={<CalendarDays className="w-10 h-10" />}
              message={t("charts.empty")}
            />
          ) : (
            <div className="h-64 sm:h-72 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="successGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={SUCCESS_COLOR}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor={SUCCESS_COLOR}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                    <linearGradient
                      id="errorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={ERROR_COLOR}
                        stopOpacity={0.4}
                      />
                      <stop
                        offset="100%"
                        stopColor={ERROR_COLOR}
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-gray-200 dark:stroke-gray-700"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={(props: {
                      x?: number | string;
                      y?: number | string;
                      payload?: { value?: unknown };
                    }) => {
                      const value = String(props.payload?.value ?? "");
                      const idx = chartData.findIndex((d) => d.label === value);
                      const isToday = idx >= 0 && chartData[idx].isToday;
                      return (
                        <text
                          x={props.x}
                          y={Number(props.y) + 14}
                          textAnchor="middle"
                          fontSize={11}
                          fontWeight={isToday ? 700 : 400}
                          fill={isToday ? CURRENT_COLOR : "currentColor"}
                          className={
                            isToday
                              ? ""
                              : "text-gray-600 dark:text-gray-400 fill-current"
                          }
                        >
                          {value}
                        </text>
                      );
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-gray-600 dark:text-gray-400"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={36}
                  />
                  <Tooltip
                    content={<AreaTooltip t={t} dailyTodayKey={todayKey} />}
                    cursor={{ stroke: CURRENT_COLOR, strokeOpacity: 0.3 }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    formatter={(value) =>
                      t(
                        value === "success"
                          ? "charts.legend.success"
                          : "charts.legend.errors",
                      )
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="success"
                    stroke={SUCCESS_COLOR}
                    strokeWidth={2}
                    fill="url(#successGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    stroke={ERROR_COLOR}
                    strokeWidth={2}
                    fill="url(#errorGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </YbCard>
    </div>
  );
}

function TotalSummary({
  total,
  errors,
  t,
}: {
  total: number;
  errors?: number;
  t: Translate;
}) {
  const hasErrors = errors !== undefined && errors > 0;
  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      <div className="text-right">
        <p className="text-base sm:text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
          {total.toLocaleString()}
        </p>
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          {t("charts.summary.total")}
        </p>
      </div>
      {hasErrors && (
        <div className="border-l border-gray-200 dark:border-gray-700 pl-1.5 sm:pl-3">
          <p className="text-base sm:text-xl font-bold text-red-500 leading-tight flex items-center justify-center gap-1">
            <span>{errors!.toLocaleString()}</span>
          </p>
          <p className="text-[10px] sm:text-xs text-red-500/80 text-center">
            {t("charts.summary.errors")}
          </p>
        </div>
      )}
    </div>
  );
}

interface TooltipPayloadEntry {
  payload?: AreaPoint & { month?: string };
}

function SimpleTooltip({
  active,
  payload,
  t,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  t: Translate;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  if (!point) return null;
  const total = point.total ?? 0;
  return (
    <div className="rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
        {point.tooltipLabel ?? point.label}
      </p>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-600 dark:text-gray-400">
            {t("charts.tooltip.total")}
          </span>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function AreaTooltip({
  active,
  payload,
  t,
  currentHourKey,
  dailyTodayKey,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  t: Translate;
  currentHourKey?: string;
  dailyTodayKey?: string | null;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  if (!point) return null;
  const isCurrentHour = !!currentHourKey && point.hour === currentHourKey;
  const isToday = !!dailyTodayKey && point.date === dailyTodayKey;
  const total = point.total ?? 0;
  const errors = point.errors ?? 0;
  const success = Math.max(0, total - errors);
  return (
    <div className="rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
        {point.tooltipLabel ?? point.label}
        {(isCurrentHour || isToday) && (
          <span className="ml-2 text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
            ({t(isCurrentHour ? "charts.hourly.now" : "charts.today")})
          </span>
        )}
      </p>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: SUCCESS_COLOR }}
            />
            {t("charts.legend.success")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {success.toLocaleString()}
          </span>
        </div>
        {errors > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ERROR_COLOR }}
              />
              {t("charts.legend.errors")}
            </span>
            <span className="font-semibold text-red-500">
              {errors.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 pt-1 mt-1 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400">
            {t("charts.tooltip.total")}
          </span>
          <span className="font-bold text-gray-900 dark:text-gray-100">
            {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function ChartEmpty({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="h-64 sm:h-72 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
      <div className="opacity-50 mb-3">{icon}</div>
      <p className="text-sm text-center max-w-xs">{message}</p>
    </div>
  );
}

const SKELETON_BARS = [35, 55, 78, 62, 45, 70, 88, 50, 32, 60, 75, 48];

function ChartSkeleton({ icon, tall = false }: { icon: ReactNode; tall?: boolean }) {
  return (
    <YbCard variant="elevated">
      <YbCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600">
              {icon}
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-28 sm:w-36 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
            </div>
          </div>
          <div className="h-8 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
      </YbCardHeader>
      <div>
        <div
          className={`${tall ? "h-72 sm:h-80" : "h-64 sm:h-72"} flex items-end gap-1.5 sm:gap-2 pb-4 pr-2`}
        >
          {SKELETON_BARS.map((height, index) => (
            <div
              key={index}
              className="flex-1 rounded-t bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-800/40 animate-pulse"
              style={{ height: `${height}%`, animationDelay: `${index * 70}ms` }}
            />
          ))}
        </div>
      </div>
    </YbCard>
  );
}
