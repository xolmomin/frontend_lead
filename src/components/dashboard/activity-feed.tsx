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
import { YbSpinner } from "@/components/yb/spinner";

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
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="min-w-0">
                <YbCardTitle className="text-base sm:text-xl">
                  {t("activity.title")}
                </YbCardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t("activity.subtitle")}
                </p>
              </div>
            </div>
            {items && items.length > 0 && (
              <button
                type="button"
                onClick={() => router.push("/dashboard/integrations")}
                className="text-xs sm:text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                {t("activity.viewAll")}
              </button>
            )}
          </div>
        </YbCardHeader>
        <div className="flex-1">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <YbSpinner size="md" />
            </div>
          ) : !items || items.length === 0 ? (
            <div className="py-12 text-center text-gray-400 dark:text-gray-600">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm max-w-xs mx-auto">{t("activity.empty")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800 -mt-2">
              {items.map((item) => (
                <ActivityRow key={String(item.id)} item={item} lang={locale} t={t} />
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
      color: "text-emerald-500 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      label: t("activity.statusSuccess"),
    },
    errorHard: {
      Icon: XCircle,
      color: "text-red-500 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      label: t("activity.statusErrorDelivery"),
    },
    errorTemporary: {
      Icon: RefreshCw,
      color: "text-orange-500 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      label: t("activity.statusErrorTemporary"),
    },
    paused: {
      Icon: PauseCircle,
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      label: t("activity.statusPaused"),
    },
  };
  const entry = config[statusKey];
  const Icon = entry.Icon;
  const title = item.message
    ? item.message
    : t("activity.leadNoIntegration");
  const timeText = relativeTime(new Date(item.created_at), lang, t);

  return (
    <li>
      <div
        className={cn(
          "w-full flex items-center gap-3 p-2 sm:p-3 rounded-lg transition-colors text-left",
          "hover:bg-gray-50 dark:hover:bg-gray-800/50",
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
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {title}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {entry.label} · {timeText}
          </p>
        </div>
        <ChevronRight
          className="w-4 h-4 text-gray-400 dark:text-gray-600 flex-shrink-0"
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
