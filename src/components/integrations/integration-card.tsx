"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { InboxIcon, TimeQuarterPassIcon } from "@hugeicons/core-free-icons";
import type { Integration } from "@/lib/api/integrations";
import { formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import {
  DeliveryTypeLabel,
  IntegrationStatusBadge,
  sourceTypeMeta,
} from "@/components/integrations/meta";
import { IntegrationActionsMenu } from "@/components/integrations/integration-actions-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export function IntegrationCard({
  integration,
  selected,
  onSelectedChange,
}: {
  integration: Integration;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
}) {
  const t = useTranslations("integrations.card");
  const locale = useLocale();

  const source = sourceTypeMeta[integration.source_type] ?? sourceTypeMeta.webhook;
  const lastLead = formatRelativeTime(integration.last_lead_at, locale);
  const pending = integration.pending_leads ?? 0;

  return (
    <Card
      className={cn(
        "gap-3 py-4 transition-colors",
        selected && "border-primary/50 bg-primary/5",
      )}
    >
      <CardHeader className="flex flex-row items-start gap-2 px-4">
        <Checkbox
          checked={selected}
          onCheckedChange={(value) => onSelectedChange(value === true)}
          className="mt-0.5"
          aria-label={integration.name}
        />
        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/integrations/${integration.id}`}
            className="block truncate text-sm font-semibold hover:text-primary hover:underline"
          >
            {integration.name}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <IntegrationStatusBadge status={integration.status} />
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <HugeiconsIcon icon={source.icon} className="size-3.5" />
              {source.label}
            </span>
          </div>
        </div>
        <IntegrationActionsMenu integration={integration} showOpenDetail />
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{t("receiver")}</span>
          {integration.delivery_connection ? (
            <DeliveryTypeLabel
              type={integration.delivery_connection.type}
              className="max-w-[60%] truncate font-medium"
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
        {integration.delivery_connection && (
          <p className="-mt-2 truncate text-right text-xs text-muted-foreground">
            {integration.delivery_connection.name}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border bg-muted/40 px-2.5 py-2">
            <p className="text-[0.625rem] text-muted-foreground">
              {t("todayLeads")}
            </p>
            <p className="text-sm font-semibold tabular-nums">
              {integration.today_leads ?? 0}
            </p>
          </div>
          <div
            className={cn(
              "rounded-md border px-2.5 py-2",
              pending > 0
                ? "border-amber-600/30 bg-amber-500/10"
                : "bg-muted/40",
            )}
          >
            <p
              className={cn(
                "flex items-center gap-1 text-[0.625rem]",
                pending > 0
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            >
              <HugeiconsIcon icon={InboxIcon} className="size-3" />
              {t("pendingLeads")}
            </p>
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                pending > 0 && "text-amber-700 dark:text-amber-400",
              )}
            >
              {pending}
            </p>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={TimeQuarterPassIcon} className="size-3.5" />
          {lastLead ? `${t("lastLead")}: ${lastLead}` : t("never")}
        </p>
      </CardContent>
    </Card>
  );
}
