"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ExternalLink, X, Zap } from "lucide-react";
import { useStatsByIntegration } from "@/hooks/use-stats";
import type { IntegrationStat } from "@/lib/api/stats";
import { YbCard, YbCardHeader, YbCardTitle } from "@/components/yb/card";
import { YbSkeleton } from "@/components/yb/skeleton";

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
              <div className="p-2 rounded-lg bg-primary/12 flex-shrink-0">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <YbCardTitle className="text-base sm:text-xl">
                  {t("integrationPerf.title")}
                </YbCardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("integrationPerf.subtitle")}
                </p>
              </div>
            </div>
            <div className="inline-flex rounded-lg bg-muted p-0.5 gap-0.5 flex-shrink-0 self-start sm:self-auto">
              {WINDOWS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWindow(w)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    w === window
                      ? "bg-card text-primary shadow-sm font-medium"
                      : "text-muted-foreground hover:text-foreground"
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
            <div className="space-y-3 py-2" role="status" aria-busy="true">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <YbSkeleton className="h-8 w-8 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <YbSkeleton className="h-3.5 w-1/2" />
                    <YbSkeleton className="h-3 w-1/4" />
                  </div>
                  <YbSkeleton className="h-4 w-10 shrink-0" />
                </div>
              ))}
            </div>
          ) : !items || items.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground/70">
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
    <li className="rounded-xl border border-border/70 bg-muted/40 overflow-hidden">
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
        className="p-3 cursor-pointer transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold text-foreground truncate"
              title={name}
            >
              {name}
            </p>
            <div className="flex items-center gap-2 text-[11px] mt-0.5 tabular-nums font-medium">
              <span className="inline-flex items-center gap-1 text-success">
                <Check className="h-3 w-3" aria-hidden="true" />
                {delivered.toLocaleString()}
              </span>
              {errors > 0 && (
                <>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <X className="h-3 w-3" aria-hidden="true" />
                    {errors.toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p
              className={`text-lg font-bold tabular-nums leading-none ${
                needsAttention ? "text-destructive" : "text-foreground"
              }`}
            >
              {percent}%
            </p>
            {needsAttention ? (
              <p className="text-[9px] uppercase tracking-widest font-bold mt-1 text-destructive flex items-center gap-0.5 justify-end">
                <AlertTriangle className="w-2.5 h-2.5" aria-hidden="true" />
                {t("integrationPerf.attention")}
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
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
              className="w-7 h-7 flex cursor-pointer items-center justify-center rounded-lg border border-primary text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </li>
  );
}
