"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Inbox, ShoppingCart } from "lucide-react";
import type { OrderStatus } from "@/lib/api/orders";
import { useOrders } from "@/hooks/use-orders";
import { YbButton } from "@/components/yb/button";
import { YbCard, YbCardHeader, YbCardTitle } from "@/components/yb/card";
import { YbSpinner } from "@/components/yb/spinner";
import {
  FINANCE_WINDOWS,
  financeWindowRange,
  formatUsd,
  type FinanceWindow,
} from "@/components/finance/finance-window";

const STATUSES: OrderStatus[] = [
  "pending",
  "accepted",
  "delivered",
  "cancelled",
  "archived",
];

/**
 * The production API accepts page_size; the local /orders endpoint uses a
 * fixed server-side page size that matches production's 20.
 */
const PAGE_SIZE = 20;

const STATUS_CLASSES: Record<OrderStatus, string> = {
  pending: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  accepted: "bg-success-muted text-success dark:text-success",
  delivered: "bg-success-muted text-success dark:text-success",
  cancelled: "bg-destructive-muted text-destructive dark:text-destructive",
  archived: "bg-muted text-muted-foreground",
};

export function OrdersView() {
  const t = useTranslations("finance");
  const [windowSel, setWindowSel] = useState<FinanceWindow>("30d");
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [page, setPage] = useState(1);

  const range = useMemo(() => financeWindowRange(windowSel), [windowSel]);
  const ordersQuery = useOrders({ ...range, status: status ?? "", page });

  const loading = ordersQuery.isFetching;
  const result = ordersQuery.data;
  const orders = result?.items ?? [];
  const total = result?.total ?? 0;
  const fromIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toIndex = Math.min(page * PAGE_SIZE, total);
  const hasNext = page * PAGE_SIZE < total;

  const withPageReset = (update: () => void) => {
    update();
    setPage(1);
  };

  const statusLabel = (value: OrderStatus): string =>
    STATUSES.includes(value) ? t(`orders.status.${value}`) : value;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-success-muted flex-shrink-0">
            <ShoppingCart className="w-5 h-5 text-success" />
          </div>
          <div className="min-w-0">
            <h1 className="t-h3 text-foreground">{t("orders.title")}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {t("orders.subtitle")}
            </p>
          </div>
        </div>
        <div className="inline-flex rounded-lg bg-muted p-0.5 gap-0.5 flex-shrink-0 self-start sm:self-auto">
          {FINANCE_WINDOWS.map((window) => (
            <button
              key={window}
              type="button"
              onClick={() => withPageReset(() => setWindowSel(window))}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                window === windowSel
                  ? "bg-card text-primary shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(`insights.window.${window}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={status === null}
          onClick={() => withPageReset(() => setStatus(null))}
        >
          {t("orders.status_all")}
        </FilterChip>
        {STATUSES.map((value) => (
          <FilterChip
            key={value}
            active={status === value}
            onClick={() => withPageReset(() => setStatus(value))}
          >
            {t(`orders.status.${value}`)}
          </FilterChip>
        ))}
      </div>

      <YbCard variant="elevated">
        <YbCardHeader className="flex flex-row items-center justify-between">
          <YbCardTitle className="text-base sm:text-lg">
            {t("orders.title")}
          </YbCardTitle>
          {total > 0 ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("orders.page_info", {
                from: fromIndex,
                to: toIndex,
                total,
              })}
            </span>
          ) : null}
        </YbCardHeader>
        <div>
          {loading && !result ? (
            <div className="py-12 flex items-center justify-center">
              <YbSpinner size="md" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center">
              <Inbox className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {t("orders.empty")}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                      <th className="py-2.5 px-3 font-medium">
                        {t("orders.cols.order_id")}
                      </th>
                      <th className="py-2.5 px-3 font-medium">
                        {t("orders.cols.campaign")}
                      </th>
                      <th className="py-2.5 px-3 font-medium">
                        {t("orders.cols.status")}
                      </th>
                      <th className="py-2.5 px-3 font-medium text-right">
                        {t("orders.cols.payout")}
                      </th>
                      <th className="py-2.5 px-3 font-medium text-right">
                        {t("orders.cols.date")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((order, index) => (
                      <tr
                        key={`${order.id ?? "na"}-${index}`}
                        className="hover:bg-muted/60 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono text-xs text-foreground/80">
                          {order.external_id || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-foreground/80 max-w-[200px] truncate">
                          {order.campaign || "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              STATUS_CLASSES[order.status] ||
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {statusLabel(order.status)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-medium">
                          {order.status === "delivered" ? (
                            <span className="text-success">
                              {formatUsd(order.payout)}
                            </span>
                          ) : order.status === "accepted" ? (
                            <span
                              className="text-warning"
                              title={t("orders.payout_hold")}
                            >
                              {formatUsd(order.payout)}
                            </span>
                          ) : (
                            <span
                              className="text-muted-foreground/70"
                              title={t("orders.payout_none")}
                            >
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                          {order.created_at
                            ? order.created_at.slice(0, 10)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
                <YbButton
                  variant="secondary"
                  size="sm"
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  {t("orders.prev")}
                </YbButton>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {page}
                </span>
                <YbButton
                  variant="secondary"
                  size="sm"
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  disabled={!hasNext || loading}
                  onClick={() => setPage((value) => value + 1)}
                >
                  {t("orders.next")}
                </YbButton>
              </div>
            </>
          )}
        </div>
      </YbCard>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? "bg-primary border-primary text-white"
          : "bg-card border-border text-foreground/75 hover:border-primary/60"
      }`}
    >
      {children}
    </button>
  );
}
