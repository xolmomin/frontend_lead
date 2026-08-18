"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { YbCard } from "@/components/yb/card";
import { YbSpinner } from "@/components/yb/spinner";

const MONTHS: Record<string, string[]> = {
  uz: [
    "yanvar",
    "fevral",
    "mart",
    "aprel",
    "may",
    "iyun",
    "iyul",
    "avgust",
    "sentabr",
    "oktabr",
    "noyabr",
    "dekabr",
  ],
  ru: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};

export interface PlanSummary {
  planName: string;
  totalLeads: number | null;
  usedLeads: number;
  remainingLeads: number | null;
  expiryDate: Date | null;
  isUnlimited: boolean;
}

function formatExpiry(date: Date, lang: string): string {
  const day = date.getDate();
  const month = (MONTHS[lang] || MONTHS.en)[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const datePart =
    lang === "en" ? `${month} ${day}, ${year}` : `${day}-${month}, ${year}`;
  return `${datePart} · ${hours}:${minutes}`;
}

export function PlanCard({
  plan,
  loading,
  lang,
  planPercentage,
  isLowOnLeads,
  isExpiringSoon,
  onUpgrade,
  onTopUp,
}: {
  plan: PlanSummary | null;
  loading: boolean;
  lang: string;
  planPercentage: number;
  isLowOnLeads: boolean;
  isExpiringSoon: boolean;
  onUpgrade: () => void;
  onTopUp: () => void;
}) {
  const tCommon = useTranslations("common");
  const [now] = useState(() => Date.now());
  const isInactive = !!plan?.expiryDate && plan.expiryDate.getTime() <= now;

  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <YbCard variant="elevated" padding="none" className="h-full">
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <YbSpinner size="md" />
            </div>
          ) : plan ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-border">
              <PlanBlock
                plan={plan}
                planPercentage={planPercentage}
                isLowOnLeads={isLowOnLeads}
                isInactive={isInactive}
                onUpgrade={onUpgrade}
              />
              <div className="border-t sm:border-t-0 border-border">
                <ExpiryBlock
                  plan={plan}
                  lang={lang}
                  now={now}
                  isExpiringSoon={isExpiringSoon}
                  onTopUp={onTopUp}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              {tCommon("errors.loadFailed")}
            </div>
          )}
        </div>
      </YbCard>
    </div>
  );
}

function PlanBlock({
  plan,
  planPercentage,
  isLowOnLeads,
  isInactive,
  onUpgrade,
}: {
  plan: PlanSummary;
  planPercentage: number;
  isLowOnLeads: boolean;
  isInactive: boolean;
  onUpgrade: () => void;
}) {
  const t = useTranslations("dashboard");
  return (
    <div className="flex flex-col p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            isLowOnLeads
              ? "bg-orange-100 dark:bg-orange-900/30"
              : "bg-success-muted",
          )}
          aria-hidden="true"
        >
          {isLowOnLeads ? (
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-success" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            {t("plan.title")}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {t("plan.subtitle", { planName: plan.planName })}
          </p>
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="flex-shrink-0 whitespace-nowrap text-xl sm:t-h3 text-foreground leading-none">
          {plan.isUnlimited ? "∞" : plan.remainingLeads?.toLocaleString()}
          <span className="text-xs font-normal text-muted-foreground ml-1">
            {t("plan.leadsRemaining")}
          </span>
        </p>
        {!plan.isUnlimited && (
          <span className="text-xs text-muted-foreground tabular-nums min-w-0 truncate text-right">
            {plan.usedLeads.toLocaleString()}/
            {plan.totalLeads?.toLocaleString()} · {planPercentage.toFixed(0)}%{" "}
            {t("plan.used")}
          </span>
        )}
      </div>
      {plan.isUnlimited ? (
        <p className="text-xs text-success mt-2 mb-2">{t("plan.unlimited")}</p>
      ) : (
        <div className="mt-1.5 mb-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isLowOnLeads
                ? "bg-gradient-to-r from-orange-500 to-red-500"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600",
            )}
            style={{ width: `${planPercentage}%` }}
          />
        </div>
      )}
      <button
        type="button"
        onClick={onUpgrade}
        className={cn(
          "mt-auto w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900",
          isLowOnLeads || isInactive
            ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus-visible:ring-destructive"
            : "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus-visible:ring-ring",
        )}
      >
        <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
        {t(isInactive ? "plan.activateCta" : "plan.renewCta")}
        <ArrowRight className="w-3 h-3" aria-hidden="true" />
      </button>
    </div>
  );
}

function ExpiryBlock({
  plan,
  lang,
  now,
  isExpiringSoon,
  onTopUp,
}: {
  plan: PlanSummary;
  lang: string;
  now: number;
  isExpiringSoon: boolean;
  onTopUp: () => void;
}) {
  const t = useTranslations("dashboard");
  const hasExpiry = plan.expiryDate !== null;
  const diff = hasExpiry ? plan.expiryDate!.getTime() - now : Infinity;
  const isExpired = hasExpiry && diff <= 0;
  const daysLeft = Math.floor(diff / 86_400_000);
  const hoursLeft = Math.floor((diff % 86_400_000) / 3_600_000);
  const timeLeft = !hasExpiry
    ? "—"
    : isExpired
      ? t("expiry.expired")
      : daysLeft >= 1
        ? t("expiry.daysLeft", { count: daysLeft })
        : t("expiry.hoursLeft", { count: hoursLeft });
  const alarm = isExpiringSoon || isExpired;

  return (
    <div className="h-full flex flex-col p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            alarm ? "bg-destructive-muted" : "bg-info-muted",
          )}
          aria-hidden="true"
        >
          <Calendar
            className={cn("w-4 h-4", alarm ? "text-destructive" : "text-info")}
          />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
            {t("expiry.title")}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {hasExpiry ? formatExpiry(plan.expiryDate!, lang) : "—"}
          </p>
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <p
          className={cn(
            "text-xl sm:text-2xl font-bold leading-none",
            alarm ? "text-destructive" : "text-foreground",
          )}
        >
          {timeLeft}
        </p>
      </div>
      <button
        type="button"
        onClick={onTopUp}
        className={cn(
          "mt-auto w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900",
          alarm
            ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus-visible:ring-destructive"
            : "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus-visible:ring-ring",
        )}
      >
        <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
        {t("expiry.payCta")}
        <ArrowRight className="w-3 h-3" aria-hidden="true" />
      </button>
    </div>
  );
}
