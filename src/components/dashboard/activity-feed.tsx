"use client";

import { useLocale, useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Facebook02Icon,
  InformationCircleIcon,
  Link01Icon,
  PlugSocketIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatRelativeTime } from "@/lib/relative-time";
import { useRecentActivity } from "@/hooks/use-stats";

type IconType = typeof InformationCircleIcon;

/** Map free-form activity types to an icon + accent by keyword. */
function activityMeta(type: string): { icon: IconType; className: string } {
  const value = type.toLowerCase();
  if (value.includes("deliver"))
    return {
      icon: CheckmarkCircle02Icon,
      className: "text-emerald-700 dark:text-emerald-400",
    };
  if (value.includes("fail") || value.includes("error"))
    return { icon: AlertCircleIcon, className: "text-destructive" };
  if (value.includes("facebook"))
    return { icon: Facebook02Icon, className: "text-muted-foreground" };
  if (value.includes("lead"))
    return { icon: UserAdd01Icon, className: "text-muted-foreground" };
  if (value.includes("integration"))
    return { icon: PlugSocketIcon, className: "text-muted-foreground" };
  if (value.includes("connection") || value.includes("delivery"))
    return { icon: Link01Icon, className: "text-muted-foreground" };
  return { icon: InformationCircleIcon, className: "text-muted-foreground" };
}

/**
 * Recent activity feed. Hides itself entirely when the endpoint is not
 * available yet (404 → `data === null`).
 */
export function ActivityFeed() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const activityQuery = useRecentActivity(10);

  if (activityQuery.data === null) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("activityTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {activityQuery.isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        )}
        {activityQuery.isError && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
            <p className="text-sm text-muted-foreground">{t("loadError")}</p>
            <Button variant="outline" onClick={() => activityQuery.refetch()}>
              {t("retry")}
            </Button>
          </div>
        )}
        {activityQuery.data &&
          (activityQuery.data.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed py-10">
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {activityQuery.data.map((item) => {
                const meta = activityMeta(item.type);
                return (
                  <li key={item.id} className="flex items-start gap-3">
                    <HugeiconsIcon
                      icon={meta.icon}
                      className={cn("mt-0.5 size-4 shrink-0", meta.className)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm break-words">{item.message}</p>
                      <p
                        className="text-xs text-muted-foreground"
                        title={
                          formatDateTime(item.created_at, locale) ?? undefined
                        }
                      >
                        {formatRelativeTime(item.created_at, locale)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ))}
      </CardContent>
    </Card>
  );
}
