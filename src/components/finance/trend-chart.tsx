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
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
      >
        <defs>
          <linearGradient id="finTrend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-border"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
          tickFormatter={(value: string) => value.slice(5)}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          width={56}
          className="text-muted-foreground"
        />
        <Tooltip
          formatter={(value) => {
            const n = Number(value) || 0;
            return [
              metric === "leads" ? formatCount(n) : formatUsd(n),
              metricLabel,
            ];
          }}
          cursor={{ stroke: "var(--chart-2)", strokeOpacity: 0.3 }}
          contentStyle={{
            fontSize: 12,
            borderRadius: 12,
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            boxShadow: "var(--elevation-2)",
          }}
          labelStyle={{ color: "var(--muted-foreground)" }}
        />
        <Area
          type="monotone"
          dataKey={metric}
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#finTrend)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
