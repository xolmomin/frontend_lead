"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSetupStatus } from "@/hooks/use-stats";
import type { SetupStatus } from "@/lib/api/stats";

interface Step {
  key: "setupChannel" | "setupIntegration" | "setupFacebook" | "setupFirstLead";
  href: string;
  done: (status: SetupStatus) => boolean;
  optional?: boolean;
}

const STEPS: Step[] = [
  {
    key: "setupChannel",
    href: "/dashboard/connections",
    done: (s) => s.has_delivery_connection,
  },
  {
    key: "setupIntegration",
    href: "/dashboard/integrations/new",
    done: (s) => s.has_integration,
  },
  {
    key: "setupFacebook",
    href: "/dashboard/connections",
    done: (s) => s.has_facebook_connection,
    optional: true,
  },
  {
    key: "setupFirstLead",
    href: "/dashboard/integrations",
    done: (s) => s.has_lead,
  },
];

/**
 * Onboarding checklist. Renders nothing while loading, on error, or when all
 * steps are complete.
 */
export function SetupChecklist() {
  const t = useTranslations("dashboard");
  const setupQuery = useSetupStatus();

  const status = setupQuery.data;
  if (!status) return null;
  if (STEPS.every((step) => step.done(status))) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("setupTitle")}</CardTitle>
        <CardDescription>{t("setupSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1">
          {STEPS.map((step) => {
            const done = step.done(status);
            return (
              <li key={step.key}>
                <Link
                  href={step.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                    done
                      ? "text-muted-foreground"
                      : "font-medium hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {done ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="size-5 shrink-0 text-primary"
                    />
                  ) : (
                    <span className="size-5 shrink-0 rounded-full border-2 border-muted-foreground/40" />
                  )}
                  <span className={cn(done && "line-through")}>
                    {t(step.key)}
                    {step.optional && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        ({t("optional")})
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
