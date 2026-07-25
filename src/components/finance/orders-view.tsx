"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatSum } from "@/lib/money";
import { formatDateTime, formatRelativeTime } from "@/lib/relative-time";
import { presetRange, type DateRangePreset } from "@/lib/date-range";
import type { Order, OrderStatus } from "@/lib/api/orders";
import { useOrders, useOrdersSummary } from "@/hooks/use-orders";
import { DateRangeTabs } from "@/components/finance/date-range-tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_FILTERS: (OrderStatus | "")[] = [
  "",
  "pending",
  "accepted",
  "delivered",
  "cancelled",
  "archived",
];

const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  pending:
    "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  accepted: "border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  delivered:
    "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  cancelled: "border-red-600/30 bg-red-500/10 text-red-700 dark:text-red-400",
  archived: "border-border bg-muted text-muted-foreground",
};

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

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations("orders.status");
  return (
    <Badge variant="outline" className={cn(STATUS_BADGE_CLASSES[status])}>
      {t(status)}
    </Badge>
  );
}

function SummaryChip({
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

function OrderRow({ order, locale }: { order: Order; locale: string }) {
  const tCommon = useTranslations("common");
  const payout = formatSum(order.payout);

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">
        {order.external_id || String(order.id)}
      </TableCell>
      <TableCell className="max-w-56">
        <span className="block truncate" title={order.campaign ?? undefined}>
          {order.campaign || <span className="text-muted-foreground">—</span>}
        </span>
      </TableCell>
      <TableCell>
        <OrderStatusBadge status={order.status} />
      </TableCell>
      <TableCell className="whitespace-nowrap tabular-nums">
        {payout !== null ? `${payout} ${tCommon("sum")}` : "—"}
      </TableCell>
      <TableCell
        className="whitespace-nowrap text-muted-foreground"
        title={formatDateTime(order.created_at, locale) ?? undefined}
      >
        {formatRelativeTime(order.created_at, locale) ?? "—"}
      </TableCell>
    </TableRow>
  );
}

export function OrdersView() {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [preset, setPreset] = useState<DateRangePreset>("last30");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [page, setPage] = useState(1);
  const [perPageGuess, setPerPageGuess] = useState<number | null>(null);

  const range = useMemo(() => presetRange(preset), [preset]);

  const summaryQuery = useOrdersSummary(range);
  const ordersQuery = useOrders({ ...range, status, page });

  const summary = summaryQuery.data;
  const orders = ordersQuery.data?.items ?? [];
  const total = ordersQuery.data?.total ?? 0;

  // Infer server page size from the first full page.
  if (
    ordersQuery.data &&
    page === 1 &&
    orders.length > 0 &&
    perPageGuess !== orders.length &&
    orders.length < total
  ) {
    setPerPageGuess(orders.length);
  }
  const perPage = perPageGuess ?? Math.max(orders.length, 1);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function resetPaging() {
    setPage(1);
    setPerPageGuess(null);
  }

  const payoutTotal = formatSum(summary?.payout_total);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <DateRangeTabs
          value={preset}
          onChange={(next) => {
            setPreset(next);
            resetPaging();
          }}
        />
      </div>

      {summaryQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <SummaryChip label={t("summary.total")} value={String(summary.total)} />
          <SummaryChip
            label={t("summary.pending")}
            value={String(summary.pending)}
            className="text-amber-700 dark:text-amber-400"
          />
          <SummaryChip
            label={t("summary.accepted")}
            value={String(summary.accepted)}
            className="text-sky-700 dark:text-sky-400"
          />
          <SummaryChip
            label={t("summary.delivered")}
            value={String(summary.delivered)}
            className="text-emerald-700 dark:text-emerald-400"
          />
          <SummaryChip
            label={t("summary.cancelled")}
            value={String(summary.cancelled)}
            className="text-red-700 dark:text-red-400"
          />
          <SummaryChip
            label={t("summary.payout")}
            value={
              payoutTotal !== null ? `${payoutTotal} ${tCommon("sum")}` : "—"
            }
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <Tabs
          value={status === "" ? "all" : status}
          onValueChange={(value) => {
            setStatus(value === "all" ? "" : (value as OrderStatus));
            resetPaging();
          }}
        >
          <TabsList className="max-w-full overflow-x-auto">
            {STATUS_FILTERS.map((filter) => (
              <TabsTrigger key={filter || "all"} value={filter || "all"}>
                {t(`filters.${filter || "all"}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {ordersQuery.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-10" />
            ))}
          </div>
        ) : ordersQuery.isError ? (
          <LoadErrorState onRetry={() => ordersQuery.refetch()} />
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.id")}</TableHead>
                  <TableHead>{t("columns.campaign")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead>{t("columns.payout")}</TableHead>
                  <TableHead>{t("columns.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <OrderRow key={order.id} order={order} locale={locale} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {t("total", { count: total })}
          </span>
          {total > perPage && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {t("pageInfo", { page, pages: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || ordersQuery.isFetching}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                {t("prev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || ordersQuery.isFetching}
                onClick={() => setPage((value) => value + 1)}
              >
                {t("next")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
