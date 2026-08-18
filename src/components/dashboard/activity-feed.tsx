"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  PauseCircle,
  RefreshCw,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecentActivity } from "@/hooks/use-stats";
import type { ActivityItem } from "@/lib/api/stats";
import { YbCard, YbCardHeader, YbCardTitle } from "@/components/yb/card";
import { YbSkeleton } from "@/components/yb/skeleton";

type Translate = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

export function ActivityFeed() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const activityQuery = useRecentActivity();
  const items = activityQuery.data ?? null;
  const loading = activityQuery.isLoading;

  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <YbCard variant="elevated" className="h-full flex flex-col">
        <YbCardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-2 rounded-lg bg-primary/12 flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <YbCardTitle className="text-base sm:text-xl">
                  {t("activity.title")}
                </YbCardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("activity.subtitle")}
                </p>
              </div>
            </div>
            {items && items.length > 0 && (
              <button
                type="button"
                onClick={() => router.push("/dashboard/integrations")}
                className="text-xs sm:text-sm font-medium text-primary hover:underline flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {t("activity.viewAll")}
              </button>
            )}
          </div>
        </YbCardHeader>
        <div className="flex-1">
          {loading ? (
            <div className="space-y-3 py-2" role="status" aria-busy="true">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <YbSkeleton className="h-8 w-8 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <YbSkeleton className="h-3.5 w-3/5" />
                    <YbSkeleton className="h-3 w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : !items || items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground/70">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm max-w-xs mx-auto">{t("activity.empty")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border -mt-2">
              {items.map((item) => (
                <ActivityRow
                  key={String(item.id)}
                  item={item}
                  lang={locale}
                  t={t}
                />
              ))}
            </ul>
          )}
        </div>
      </YbCard>
    </div>
  );
}

function ActivityRow({
  item,
  lang,
  t,
}: {
  item: ActivityItem;
  lang: string;
  t: Translate;
}) {
  const type = item.type?.toLowerCase() ?? "";
  const statusKey = type.includes("error")
    ? "errorHard"
    : type.includes("pause")
      ? "paused"
      : "success";
  const config: Record<
    string,
    { Icon: LucideIcon; color: string; bg: string; label: string }
  > = {
    success: {
      Icon: CheckCircle2,
      color: "text-success dark:text-success",
      bg: "bg-success-muted",
      label: t("activity.statusSuccess"),
    },
    errorHard: {
      Icon: XCircle,
      color: "text-destructive dark:text-destructive",
      bg: "bg-destructive-muted",
      label: t("activity.statusErrorDelivery"),
    },
    errorTemporary: {
      Icon: RefreshCw,
      color: "text-warning",
      bg: "bg-warning-muted",
      label: t("activity.statusErrorTemporary"),
    },
    paused: {
      Icon: PauseCircle,
      color: "text-warning dark:text-warning",
      bg: "bg-warning-muted",
      label: t("activity.statusPaused"),
    },
  };
  const entry = config[statusKey];
  const Icon = entry.Icon;
  const title = item.message ? item.message : t("activity.leadNoIntegration");
  const timeText = relativeTime(new Date(item.created_at), lang, t);

  return (
    <li>
      <div
        className={cn(
          "w-full flex items-center gap-3 p-2 sm:p-3 rounded-lg transition-colors text-left",
          "hover:bg-muted",
        )}
      >
        <span
          className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0",
            entry.bg,
          )}
          aria-hidden="true"
        >
          <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5", entry.color)} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">
            {title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {entry.label} · {timeText}
          </p>
        </div>
        <ChevronRight
          className="w-4 h-4 text-muted-foreground/70 flex-shrink-0"
          aria-hidden="true"
        />
      </div>
    </li>
  );
}

function relativeTime(date: Date, _lang: string, t: Translate): string {
  const time = date.getTime();
  if (Number.isNaN(time)) return "";
  const diff = Date.now() - time;
  if (diff < 60_000) return t("activity.timeJustNow");
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return t("activity.timeMinutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("activity.timeHoursAgo", { count: hours });
  return t("activity.timeDaysAgo", { count: Math.floor(hours / 24) });
}
