"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  PartyPopper,
  Plug,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSetupStatus } from "@/hooks/use-stats";
import { YbButton } from "@/components/yb/button";
import { YbCard } from "@/components/yb/card";

export function SetupChecklist() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const statusQuery = useSetupStatus();
  const status = statusQuery.data;

  if (!status) return null;

  const hasConnection = status.has_delivery_connection;
  const hasScenario = status.has_integration;
  const isComplete = hasConnection && hasScenario;
  // Production hides the card entirely once setup is complete.
  if (isComplete) return null;

  const activeStep = hasConnection ? (hasScenario ? null : 2) : 1;

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
      <YbCard
        variant="elevated"
        padding="none"
        className={cn(
          "relative overflow-hidden border-l-4",
          isComplete ? "border-l-emerald-500" : "border-l-primary-500",
        )}
      >
        <div className="p-4 sm:p-6">
          {isComplete ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-success-muted flex items-center justify-center flex-shrink-0">
                <PartyPopper className="w-6 h-6 sm:w-7 sm:h-7 text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:t-h3 text-foreground">
                  {t("onboarding.completedTitle")}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t("onboarding.completedDescription")}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg sm:t-h3 text-foreground">
                  {t("onboarding.title")}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t("onboarding.subtitle")}
                </p>
              </div>
              <ul className="space-y-2">
                <SetupStep
                  done={hasConnection}
                  active={activeStep === 1}
                  icon={<Plug className="w-4 h-4" />}
                  label={t("onboarding.step1")}
                  ctaLabel={t("onboarding.step1Cta")}
                  onCta={() => router.push("/dashboard/connections")}
                />
                <SetupStep
                  done={hasScenario}
                  active={activeStep === 2}
                  icon={<Workflow className="w-4 h-4" />}
                  label={t("onboarding.step2")}
                  ctaLabel={t("onboarding.step2Cta")}
                  onCta={() =>
                    router.push("/dashboard/integrations?action=new")
                  }
                />
              </ul>
            </div>
          )}
        </div>
      </YbCard>
    </div>
  );
}

function SetupStep({
  done,
  active,
  icon,
  label,
  ctaLabel,
  onCta,
}: {
  done: boolean;
  active: boolean;
  icon: ReactNode;
  label: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 p-2.5 rounded-lg transition-colors",
        done
          ? "bg-success-muted/50"
          : active
            ? "bg-primary/8 ring-1 ring-primary-200 dark:ring-primary-800"
            : "bg-muted/50",
      )}
    >
      <span
        className={cn(
          "flex-shrink-0",
          done
            ? "text-success"
            : active
              ? " text-primary"
              : "text-muted-foreground",
        )}
        aria-hidden="true"
      >
        {done ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </span>
      <span
        className={cn(
          "flex items-center gap-2 flex-1 min-w-0 text-sm",
          done
            ? "text-muted-foreground line-through"
            : "text-foreground font-medium",
        )}
      >
        <span
          aria-hidden="true"
          className={cn("flex-shrink-0", done ? "opacity-50" : "")}
        >
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </span>
      {!done && active && (
        <YbButton
          size="sm"
          variant="primary"
          onClick={onCta}
          rightIcon={<ArrowRight className="w-3 h-3" />}
          className="flex-shrink-0"
        >
          {ctaLabel}
        </YbButton>
      )}
    </li>
  );
}
