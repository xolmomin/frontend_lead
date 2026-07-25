"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { formatSum } from "@/lib/money";
import { usePlan } from "@/hooks/use-stats";
import { useBalance } from "@/hooks/use-billing";
import { navItems } from "./nav-items";

// Static placeholder widget data — the fallback while `/balance` and `/plan`
// are unavailable (loading, error, or billing not deployed yet → 404).
const PLACEHOLDER_BALANCE = "25 000";
const PLACEHOLDER_PLAN = {
  name: "Biznes",
  used: 3367,
  limit: 10000,
  daysLeft: 14 as number | null,
};

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tDashboard = useTranslations("dashboard");
  const pathname = usePathname();
  const planQuery = usePlan();
  const balanceQuery = useBalance();

  // Graceful fallback: while loading, on error, or before billing exists
  // (`/balance` 404 → data === null) keep the static widget content.
  const balance = balanceQuery.data
    ? (formatSum(balanceQuery.data.balance) ?? PLACEHOLDER_BALANCE)
    : PLACEHOLDER_BALANCE;

  // Graceful fallback: while loading, on error, or before billing exists
  // (`/plan` 404 → data === null) keep the static widget content.
  const plan = planQuery.data
    ? {
        name: planQuery.data.plan_name,
        used: planQuery.data.leads_used,
        limit: planQuery.data.lead_limit,
        daysLeft: daysUntil(planQuery.data.period_ends_at),
      }
    : PLACEHOLDER_PLAN;

  const usagePercent =
    plan.limit > 0
      ? Math.min(100, Math.round((plan.used / plan.limit) * 100))
      : 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Link
          href="/dashboard"
          className="text-lg font-bold text-primary"
          onClick={onNavigate}
        >
          {tCommon("appName")}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <HugeiconsIcon icon={item.icon} className="size-4 shrink-0" />
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-3 border-t p-4">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">{tCommon("balance")}</p>
          <p className="text-lg font-semibold">
            {balance} {tCommon("sum")}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{tCommon("plan")}</p>
            {plan.daysLeft != null && (
              <p className="text-xs text-muted-foreground">
                {tDashboard("daysLeft", { days: plan.daysLeft })}
              </p>
            )}
          </div>
          <p className="text-sm font-semibold">{plan.name}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {plan.used.toLocaleString()} / {plan.limit.toLocaleString()} (
            {usagePercent}%)
          </p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
      <SidebarContent />
    </aside>
  );
}
