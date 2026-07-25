import { getTranslations } from "next-intl/server";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Facebook02Icon,
  InboxIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { SectionHeader } from "./section-header";
import { cn } from "@/lib/utils";

function Connector() {
  return (
    <div aria-hidden className="flex items-center justify-center self-stretch">
      {/* Horizontal on desktop */}
      <svg
        viewBox="0 0 64 12"
        className="hidden h-3 w-14 text-primary/60 lg:block"
      >
        <line
          x1="0"
          y1="6"
          x2="56"
          y2="6"
          stroke="currentColor"
          strokeWidth="2"
          className="mk-dash"
        />
        <path d="M56 1l6 5-6 5" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      {/* Vertical on mobile */}
      <svg
        viewBox="0 0 12 48"
        className="h-10 w-3 text-primary/60 lg:hidden"
      >
        <line
          x1="6"
          y1="0"
          x2="6"
          y2="40"
          stroke="currentColor"
          strokeWidth="2"
          className="mk-dash"
        />
        <path d="M1 40l5 6 5-6" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  );
}

export async function HowItWorks() {
  const t = await getTranslations("marketing.how");

  const nodes = [
    {
      key: "source",
      label: t("sourceLabel"),
      icon: Facebook02Icon,
      emphasized: false,
    },
    {
      key: "router",
      label: t("routerLabel"),
      icon: SentIcon,
      emphasized: true,
    },
    {
      key: "dest",
      label: t("destLabel"),
      icon: InboxIcon,
      emphasized: false,
    },
  ] as const;

  return (
    <section id="qanday-ishlaydi" className="mk-anchor">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="mt-12 flex flex-col items-center lg:grid lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
          {nodes.map((node, index) => (
            <div key={node.key} className="contents">
              {index > 0 && <Connector />}
              <div
                className={cn(
                  "flex w-full flex-col gap-3 rounded-2xl border bg-card p-6",
                  node.emphasized &&
                    "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl border bg-background",
                      node.emphasized &&
                        "border-primary/50 bg-primary text-primary-foreground",
                    )}
                  >
                    <HugeiconsIcon icon={node.icon} className="size-5" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {node.label}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{t(`${node.key}.title`)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(`${node.key}.desc`)}
                </p>
                {node.key === "router" && (
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {(["chipRetry", "chipQueue", "chipMap"] as const).map(
                      (chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-primary/30 bg-background px-2.5 py-0.5 font-mono text-[10px] font-medium text-primary"
                        >
                          {t(`router.${chip}`)}
                        </span>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
