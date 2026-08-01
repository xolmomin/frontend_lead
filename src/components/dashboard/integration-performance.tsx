"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, Zap } from "lucide-react";
import { useStatsByIntegration } from "@/hooks/use-stats";
import type { IntegrationStat } from "@/lib/api/stats";
import { YbCard, YbCardHeader, YbCardTitle } from "@/components/yb/card";
import { YbSpinner } from "@/components/yb/spinner";

const WINDOWS = ["today", "week", "month"] as const;
type Window = (typeof WINDOWS)[number];

const ATTENTION_THRESHOLD = 0.8;

type Translate = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

export function IntegrationPerformance() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [window, setWindow] = useState<Window>("week");
  const statsQuery = useStatsByIntegration(window);
  const items = statsQuery.data;
  const loading = statsQuery.isLoading;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <YbCard variant="elevated">
        <YbCardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <YbCardTitle className="text-base sm:text-xl">
                  {t("integrationPerf.title")}
                </YbCardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t("integrationPerf.subtitle")}
                </p>
              </div>
            </div>
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 gap-0.5 flex-shrink-0 self-start sm:self-auto">
              {WINDOWS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWindow(w)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    w === window
                      ? "bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-300 shadow-sm font-medium"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  {t(`integrationPerf.window.${w}`)}
                </button>
              ))}
            </div>
          </div>
        </YbCardHeader>
        <div>
          {loading ? (
            <div className="py-10 flex items-center justify-center">
              <YbSpinner size="md" />
            </div>
          ) : !items || items.length === 0 ? (
            <div className="py-10 text-center text-gray-400 dark:text-gray-600">
              <Zap className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm max-w-xs mx-auto">
                {t("integrationPerf.empty")}
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {items.map((item) => (
                <PerformanceRow
                  key={String(item.integration_id)}
                  item={item}
                  t={t}
                  onNavigate={() => router.push("/dashboard/integrations")}
                />
              ))}
            </ul>
          )}
        </div>
      </YbCard>
    </div>
  );
}

function PerformanceRow({
  item,
  t,
  onNavigate,
}: {
  item: IntegrationStat;
  t: Translate;
  onNavigate: () => void;
}) {
  const errors = item.failed;
  const delivered = Math.max(0, item.total - errors);
  const ratio = item.total > 0 ? delivered / item.total : 1;
  const percent = Math.round(ratio * 100);
  const needsAttention = item.total > 0 && ratio < ATTENTION_THRESHOLD;
  const name = item.name || t("integrationPerf.unknown");
  const gradient =
    ratio >= 0.9
      ? "from-emerald-400 to-emerald-600"
      : ratio >= 0.5
        ? "from-amber-400 to-amber-500"
        : "from-rose-400 to-rose-500";

  return (
    <li className="rounded-xl border border-gray-200/70 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/30 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={onNavigate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onNavigate();
          }
        }}
        title={t("integrationPerf.openIntegration")}
        className="p-3 cursor-pointer transition-colors hover:bg-gray-100/70 dark:hover:bg-gray-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate"
              title={name}
            >
              {name}
            </p>
            <div className="flex items-center gap-2 text-[11px] mt-0.5 tabular-nums font-medium">
              <span className="text-emerald-600 dark:text-emerald-400">
                ✓ {delivered.toLocaleString()}
              </span>
              {errors > 0 && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="text-rose-500">
                    ✗ {errors.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p
              className={`text-lg font-bold tabular-nums leading-none ${
                needsAttention
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {percent}%
            </p>
            {needsAttention ? (
              <p className="text-[9px] uppercase tracking-widest font-bold mt-1 text-rose-600 dark:text-rose-400 flex items-center gap-0.5 justify-end">
                <AlertTriangle className="w-2.5 h-2.5" aria-hidden="true" />
                {t("integrationPerf.attention")}
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 tabular-nums">
                {item.total.toLocaleString()} {t("integrationPerf.leads")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate();
              }}
              aria-label={t("integrationPerf.openIntegration")}
              title={t("integrationPerf.openIntegration")}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-sky-500 text-sky-600 hover:bg-sky-50 dark:border-sky-400 dark:text-sky-400 dark:hover:bg-sky-900/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </li>
  );
}
