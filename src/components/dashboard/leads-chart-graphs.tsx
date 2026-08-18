"use client";

/**
 * Every recharts-backed graph. Loaded via next/dynamic from leads-chart.tsx so
 * the recharts runtime stays out of the dashboard's initial chunk — the stat
 * cards and setup checklist paint without waiting for it.
 */

import { useMemo, type ReactNode } from "react";
import { BarChart3, CalendarDays, Clock, TrendingUp } from "lucide-react";
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
import { YbCard, YbCardHeader, YbCardTitle } from "@/components/yb/card";
import type { ChartPoint } from "@/lib/api/stats";
import {
  CURRENT_COLOR,
  ERROR_COLOR,
  MONTHS_FULL,
  MONTHS_SHORT,
  SUCCESS_COLOR,
  hourLabel,
  pointTotal,
  type AreaPoint,
  type Period,
  type Translate,
} from "./leads-chart-shared";

/** Single entry point for the dynamic import — picks the graph for the tab. */
export default function PeriodChart({
  period,
  data,
  lang,
  t,
}: {
  period: Period;
  data: ChartPoint[];
  lang: string;
  t: Translate;
}) {
  switch (period) {
    case "hourly":
      return <HourlyChart data={data} lang={lang} t={t} />;
    case "weekly":
      return (
        <DailyChart
          data={data}
          lang={lang}
          t={t}
          titleKey="charts.weekly.title"
        />
      );
    case "daily":
      return <DailyChart data={data} lang={lang} t={t} />;
    case "monthly":
      return <MonthlyChart data={data} lang={lang} t={t} />;
    case "yearly":
      return <YearlyChart data={data} t={t} />;
  }
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
              <div className="p-2 rounded-lg bg-success-muted">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
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
                              : "text-muted-foreground fill-current"
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
                    className="text-muted-foreground"
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
      if (!Number.isNaN(year))
        map.set(year, (map.get(year) ?? 0) + pointTotal(p));
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
              <div className="p-2 rounded-lg bg-success-muted">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
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
                              : "text-muted-foreground fill-current"
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
                    className="text-muted-foreground"
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
              <div className="p-2 rounded-lg bg-primary/12">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
              </div>
              <div>
                <YbCardTitle className="text-base sm:text-xl">
                  {t("charts.hourly.title")}
                </YbCardTitle>
                {todayLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">
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
                                : "text-muted-foreground fill-current"
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
                      className="text-muted-foreground"
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
                  <span className="text-muted-foreground">
                    {t("charts.hourly.peakLabel")}
                  </span>
                  <span className="font-semibold text-warning">
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
              <div className="p-2 rounded-lg bg-primary/12">
                <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <YbCardTitle className="text-base sm:text-xl">
                  {t(titleKey)}
                </YbCardTitle>
                {monthLabel && (
                  <p className="text-xs text-muted-foreground mt-0.5">
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
                            isToday ? "" : "text-muted-foreground fill-current"
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
                    className="text-muted-foreground"
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
        <p className="text-base sm:t-h3 text-foreground leading-tight">
          {total.toLocaleString()}
        </p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">
          {t("charts.summary.total")}
        </p>
      </div>
      {hasErrors && (
        <div className="border-l border-border pl-1.5 sm:pl-3">
          <p className="text-base sm:text-xl font-bold text-destructive leading-tight flex items-center justify-center gap-1">
            <span>{errors!.toLocaleString()}</span>
          </p>
          <p className="text-[10px] sm:text-xs text-destructive/80 text-center">
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
    <div className="rounded-lg shadow-lg bg-card border border-border px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1.5">
        {point.tooltipLabel ?? point.label}
      </p>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">
            {t("charts.tooltip.total")}
          </span>
          <span className="font-bold text-foreground">
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
    <div className="rounded-lg shadow-lg bg-card border border-border px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1.5">
        {point.tooltipLabel ?? point.label}
        {(isCurrentHour || isToday) && (
          <span className="ml-2 text-[10px] font-normal text-primary">
            ({t(isCurrentHour ? "charts.hourly.now" : "charts.today")})
          </span>
        )}
      </p>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: SUCCESS_COLOR }}
            />
            {t("charts.legend.success")}
          </span>
          <span className="font-semibold text-foreground">
            {success.toLocaleString()}
          </span>
        </div>
        {errors > 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ERROR_COLOR }}
              />
              {t("charts.legend.errors")}
            </span>
            <span className="font-semibold text-destructive">
              {errors.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 pt-1 mt-1 border-t border-border">
          <span className="text-muted-foreground">
            {t("charts.tooltip.total")}
          </span>
          <span className="font-bold text-foreground">
            {total.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function ChartEmpty({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="h-64 sm:h-72 flex flex-col items-center justify-center text-muted-foreground/70">
      <div className="opacity-50 mb-3">{icon}</div>
      <p className="text-sm text-center max-w-xs">{message}</p>
    </div>
  );
}
