"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Building2,
  Clock,
  Copy,
  FileSpreadsheet,
  FileText,
  Globe,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Send,
  Target,
  Trash2,
} from "lucide-react";
import type { DeliveryType, Integration } from "@/lib/api/integrations";
import { formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import { YbBadge } from "@/components/yb/badge";
import { YbButton } from "@/components/yb/button";
import { Tip } from "@/components/integrations/tip";

function FacebookGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const DEST_META: Record<
  DeliveryType,
  { icon: typeof Globe; color: string; label: string }
> = {
  telegram: { icon: Send, color: "text-sky-500", label: "Telegram" },
  bitrix24: {
    icon: Building2,
    color: "text-blue-600 dark:text-blue-400",
    label: "Bitrix24",
  },
  amocrm: { icon: Target, color: "text-orange-500", label: "amoCRM" },
  sheets: {
    icon: FileSpreadsheet,
    color: "text-success",
    label: "Google Sheets",
  },
  cpa: { icon: Globe, color: "text-purple-500", label: "CPA" },
  webhook: {
    icon: Globe,
    color: "text-muted-foreground",
    label: "Webhook",
  },
};

function plural(
  t: ReturnType<typeof useTranslations<"integrations">>,
  key: string,
  count: number,
) {
  return t(`${key}_${count === 1 ? "one" : "other"}`, { count });
}

function MenuItem({
  icon,
  label,
  onSelect,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  onSelect: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
        danger
          ? "text-destructive hover:bg-destructive-muted dark:text-destructive"
          : "text-foreground/80 hover:bg-muted",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

/** Production integration row card (`rt` in the prod chunk). */
export function IntegrationRowCard({
  integration,
  onPauseToggle,
  onSendPaused,
  onEdit,
  onDuplicate,
  onHistory,
  onDelete,
}: {
  integration: Integration;
  onPauseToggle: (integration: Integration) => void;
  onSendPaused: (integration: Integration) => void;
  onEdit: (integration: Integration) => void;
  onDuplicate: (integration: Integration) => void;
  onHistory: (integration: Integration) => void;
  onDelete: (integration: Integration) => void;
}) {
  const t = useTranslations("integrations");
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const isPaused = integration.status === "paused";
  const destType = integration.delivery_connection?.type;
  const isTelegramDest = destType === "telegram";
  const isWebhookSource = integration.source_type === "webhook";
  const todayLeads = integration.today_leads ?? 0;
  const pausedLeads = integration.pending_leads ?? 0;

  const status = isPaused ? "paused" : "active";
  const badgeVariant = status === "paused" ? "default" : "success";
  const dotColor = status === "paused" ? "bg-muted-foreground" : "bg-success";

  const destMeta = destType ? DEST_META[destType] : undefined;
  const DestIcon = destMeta?.icon ?? Globe;
  const destColor = destMeta?.color ?? "text-purple-500";
  const destLabel =
    destType === "webhook"
      ? t("card.destWebhook")
      : (destMeta?.label ?? integration.delivery_connection?.name ?? "—");

  const select = (handler: (integration: Integration) => void) => {
    setMenuOpen(false);
    handler(integration);
  };

  return (
    <div className="relative rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary-300 dark:hover:border-primary-700">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 sm:flex-nowrap sm:gap-x-3">
        <YbBadge
          variant={badgeVariant}
          size="sm"
          className="order-1 shrink-0 gap-1.5"
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", dotColor)}
            aria-hidden="true"
          />
          {t(`status.${status}`)}
        </YbBadge>
        <p className="order-3 w-full min-w-0 break-words line-clamp-2 font-medium text-foreground sm:order-2 sm:w-auto sm:flex-1 sm:line-clamp-none sm:truncate">
          {integration.name}
        </p>
        <div className="order-2 ml-auto flex shrink-0 items-center gap-1 sm:order-3 sm:ml-0">
          <div className="flex items-center gap-1">
            {!isTelegramDest && (
              <Tip content={t(isPaused ? "actions.start" : "actions.stop")}>
                <YbButton
                  variant="outline"
                  size="sm"
                  onClick={() => onPauseToggle(integration)}
                  aria-label={t(isPaused ? "actions.start" : "actions.stop")}
                  className={cn(
                    "px-2.5",
                    isPaused
                      ? "border-success text-success hover:bg-success-muted dark:text-success"
                      : "border-warning/60 text-warning hover:bg-warning-muted",
                  )}
                >
                  {isPaused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </YbButton>
              </Tip>
            )}
            <Tip content={t("actions.editAction")}>
              <YbButton
                variant="outline"
                size="sm"
                onClick={() => onEdit(integration)}
                aria-label={t("actions.editAction")}
                className="px-2.5 border-primary text-primary hover:bg-primary/10"
              >
                <Pencil className="h-4 w-4" />
              </YbButton>
            </Tip>
            {!isTelegramDest && (
              <Tip content={t("actions.sendPaused")}>
                <YbButton
                  variant="outline"
                  size="sm"
                  onClick={() => onSendPaused(integration)}
                  aria-label={t("actions.sendPaused")}
                  className="px-2.5 border-info/60 text-info hover:bg-info-muted"
                >
                  <Send className="h-4 w-4" />
                </YbButton>
              </Tip>
            )}
          </div>
          <div className="relative" ref={menuRef}>
            <YbButton
              variant="outline"
              size="sm"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label={t("card.more")}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="px-2.5"
            >
              <MoreVertical className="h-4 w-4" />
            </YbButton>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg"
              >
                <MenuItem
                  icon={<Copy className="h-4 w-4 text-muted-foreground" />}
                  label={t("actions.duplicate")}
                  onSelect={() => select(onDuplicate)}
                />
                <MenuItem
                  icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                  label={t("actions.history")}
                  onSelect={() => select(onHistory)}
                />
                <div className="my-1 border-t border-border" />
                <MenuItem
                  icon={<Trash2 className="h-4 w-4" />}
                  label={t("actions.deleteAction")}
                  onSelect={() => select(onDelete)}
                  danger
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {isWebhookSource ? (
            <Globe className="h-4 w-4 text-muted-foreground" />
          ) : (
            <FacebookGlyph className="h-4 w-4 text-[#1877F2]" />
          )}
          {t(isWebhookSource ? "card.sourceWebhook" : "card.sourceFacebook")}
        </span>
        <svg
          className="h-4 w-4 shrink-0 text-muted-foreground/50"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
          <DestIcon className={cn("h-4 w-4", destColor)} />
          {destLabel}
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2.5 text-xs text-muted-foreground">
        {todayLeads > 0 || integration.last_lead_at ? (
          <>
            <span className="font-medium text-foreground/80">
              {t("card.statToday", { count: todayLeads })}
            </span>
            {integration.last_lead_at && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {formatRelativeTime(integration.last_lead_at, locale)}
              </span>
            )}
          </>
        ) : (
          <span>{t("card.statNoLeads")}</span>
        )}
        {pausedLeads > 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-info">
            <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            {plural(t, "card.statPaused", pausedLeads)}
          </span>
        )}
      </div>
    </div>
  );
}

/** Loading skeleton for a row card (`at` in the prod chunk). */
export function IntegrationRowSkeleton() {
  const block = "animate-pulse rounded bg-muted";
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <span className={cn(block, "h-[22px] w-16 rounded-full")} />
          <span className={cn(block, "h-4 w-2/5")} />
        </div>
        <div className="flex gap-1">
          <span className={cn(block, "h-8 w-9")} />
          <span className={cn(block, "h-8 w-9")} />
          <span className={cn(block, "h-8 w-9")} />
        </div>
      </div>
      <span className={cn(block, "mt-3 block h-4 w-[55%]")} />
      <span className={cn(block, "mt-2.5 block h-4 w-[45%]")} />
    </div>
  );
}
