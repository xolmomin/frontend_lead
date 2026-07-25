"use client";

import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DollarCircleIcon,
  Facebook02Icon,
  GoogleSheetIcon,
  Database01Icon,
  TargetIcon,
  TelegramIcon,
  WebhookIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type {
  DeliveryType,
  IntegrationStatus,
  LeadStatus,
  SourceType,
} from "@/lib/api/integrations";

type IconType = typeof WebhookIcon;

/** Brand names — intentionally not translated. */
export const deliveryTypeMeta: Record<
  DeliveryType,
  { label: string; icon: IconType }
> = {
  telegram: { label: "Telegram", icon: TelegramIcon },
  sheets: { label: "Google Sheets", icon: GoogleSheetIcon },
  bitrix24: { label: "Bitrix24", icon: Database01Icon },
  amocrm: { label: "amoCRM", icon: TargetIcon },
  cpa: { label: "CPA", icon: DollarCircleIcon },
  webhook: { label: "Webhook", icon: WebhookIcon },
};

export const sourceTypeMeta: Record<
  SourceType,
  { label: string; icon: IconType }
> = {
  webhook: { label: "Webhook", icon: WebhookIcon },
  facebook: { label: "Facebook", icon: Facebook02Icon },
};

export function DeliveryTypeLabel({
  type,
  className,
}: {
  type: DeliveryType;
  className?: string;
}) {
  const meta = deliveryTypeMeta[type] ?? deliveryTypeMeta.webhook;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <HugeiconsIcon icon={meta.icon} className="size-3.5 shrink-0" />
      {meta.label}
    </span>
  );
}

export function IntegrationStatusBadge({
  status,
}: {
  status: IntegrationStatus;
}) {
  const t = useTranslations("integrations.status");
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active"
          ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      )}
    >
      {status === "active" ? t("active") : t("paused")}
    </Badge>
  );
}

const leadStatusClasses: Record<LeadStatus, string> = {
  pending:
    "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  delivered:
    "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  paused_hold: "border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const t = useTranslations("integrations.leadStatus");
  const known = status in leadStatusClasses;
  return (
    <Badge
      variant="outline"
      className={known ? leadStatusClasses[status] : undefined}
    >
      {known ? t(status) : status}
    </Badge>
  );
}
