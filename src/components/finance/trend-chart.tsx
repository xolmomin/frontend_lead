"use client";

/**
 * The finance trend area chart. Split into its own module so recharts is
 * fetched only when the insights page actually renders a chart, instead of
 * riding along in the route's initial chunk.
 */

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinanceDailyPoint } from "@/lib/api/finance";
import { formatCount, formatUsd } from "./finance-window";

export default function TrendChart({
  data,
  metric,
  metricLabel,
}: {
  data: FinanceDailyPoint[];
  metric: string;
  /** Already-translated series name for the tooltip. */
  metricLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
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
            return [metric === "leads" ? formatCount(n) : formatUsd(n), metricLabel];
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
  );
}
