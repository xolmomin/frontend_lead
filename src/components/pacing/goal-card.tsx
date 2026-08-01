"use client";

import { useTranslations } from "next-intl";
import { Calendar, Info, Pencil, Trash2 } from "lucide-react";
import { YbCard } from "@/components/yb/card";
import { YbBadge } from "@/components/yb/badge";
import {
  clampPct,
  coverageNote,
  formatNumber,
  formatPeriodDay,
  pacingStatus,
  progressBarClass,
  type PacingCardData,
} from "@/components/pacing/pacing";

export function GoalCard({
  p,
  onEdit,
  onDelete,
}: {
  p: PacingCardData;
  onEdit: (p: PacingCardData) => void;
  onDelete: (p: PacingCardData) => void;
}) {
  const t = useTranslations("leadPacing");
  const status = pacingStatus(p);
  const coverage = coverageNote(p.coverage);

  return (
    <YbCard variant="default">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {p.scope_label || t(`scope.${p.scope_type}`)}
              </span>
              <YbBadge variant="secondary" size="sm">
                {t(`scope.${p.scope_type}`)}
              </YbBadge>
            </div>
            {p.mode === "custom" && p.period_start && p.period_end ? (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>
                  {formatPeriodDay(p.period_start)}–
                  {formatPeriodDay(p.period_end)} ·{" "}
                  {t("card.dayOfTotal", {
                    day: Math.min(p.day_of_month, p.days_in_month),
                    total: p.days_in_month,
                  })}
                </span>
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <YbBadge variant={status.variant} size="sm">
              {t(`status.${status.key}`)}
            </YbBadge>
            <button
              type="button"
              onClick={() => onEdit(p)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label={t("form.edit")}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(p)}
              className="p-1.5 text-gray-400 hover:text-red-600"
              aria-label={t("delete.action")}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2">
          <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
            {formatNumber(p.month_to_date)} / {formatNumber(p.target)}
          </p>
          <span className="text-sm font-medium text-gray-400">
            {p.plan_pct.toFixed(0)}%
          </span>
        </div>

        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressBarClass(status.variant)}`}
            style={{ width: `${clampPct(p.plan_pct)}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-gray-400">{t("kpi.today")}</p>
            <p className="font-semibold tabular-nums text-gray-700 dark:text-gray-200">
              {formatNumber(p.today)} / {formatNumber(p.fixed_daily)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">{t("kpi.projected")}</p>
            <p className="font-semibold tabular-nums text-gray-700 dark:text-gray-200">
              {p.projected_pct === null ? "—" : `${p.projected_pct.toFixed(0)}%`}
            </p>
          </div>
          <div>
            <p className="text-gray-400">{t("kpi.required")}</p>
            <p className="font-semibold tabular-nums text-gray-700 dark:text-gray-200">
              {p.is_complete || p.is_finished
                ? "—"
                : formatNumber(p.required_daily)}
            </p>
          </div>
        </div>

        {coverage ? (
          <p className="flex items-start gap-1 text-[11px] text-amber-600 dark:text-amber-400">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{t(`coverage.${coverage}`)}</span>
          </p>
        ) : null}
      </div>
    </YbCard>
  );
}
