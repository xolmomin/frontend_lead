import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowRight02Icon,
  Facebook02Icon,
  GoogleSheetIcon,
  SentIcon,
  TelegramIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FeedStatus = "delivered" | "retrying" | "queued";

const FEED_ROWS: Array<{
  name: string;
  route: string;
  status: FeedStatus;
  time: { key: "timeNow" | "timeSec" | "timeMin"; n?: number };
}> = [
  { name: "Dilnoza A.", route: "Lead Ads → Telegram", status: "delivered", time: { key: "timeNow" } },
  { name: "Jasur T.", route: "Lead Ads → Bitrix24", status: "delivered", time: { key: "timeSec", n: 12 } },
  { name: "Malika R.", route: "Lead Ads → Google Sheets", status: "retrying", time: { key: "timeSec", n: 40 } },
  { name: "Bekzod S.", route: "Lead Ads → amoCRM", status: "queued", time: { key: "timeMin", n: 1 } },
  { name: "Nilufar K.", route: "Lead Ads → Telegram", status: "delivered", time: { key: "timeMin", n: 2 } },
];

function FlowNode({
  icon,
  label,
  emphasized,
}: {
  icon: typeof SentIcon;
  label: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl border bg-background",
          emphasized && "border-primary/50 bg-primary text-primary-foreground shadow-md shadow-primary/25",
        )}
      >
        <HugeiconsIcon icon={icon} className="size-5" />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function DashConnector() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 8"
      className="h-2 w-10 shrink-0 text-primary/60 sm:w-12"
    >
      <line
        x1="0"
        y1="4"
        x2="48"
        y2="4"
        stroke="currentColor"
        strokeWidth="2"
        className="mk-dash"
      />
    </svg>
  );
}

async function RelayCard() {
  const t = await getTranslations("marketing.relay");

  const statusStyles: Record<FeedStatus, string> = {
    delivered: "bg-primary/10 text-primary",
    retrying: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    queued: "bg-muted text-muted-foreground",
  };

  const statusLabel: Record<FeedStatus, string> = {
    delivered: t("delivered"),
    retrying: t("retrying"),
    queued: t("queued"),
  };

  return (
    <div className="relative mk-rise" style={{ animationDelay: "250ms" }}>
      <div
        aria-hidden
        className="absolute -inset-8 -z-10 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            {t("title")}
          </p>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-primary">
            {t("live")}
          </span>
        </div>

        <div className="flex items-center justify-center gap-1 border-b bg-muted/30 px-4 py-4 sm:gap-2">
          <FlowNode icon={Facebook02Icon} label={t("source")} />
          <DashConnector />
          <FlowNode icon={SentIcon} label={t("router")} emphasized />
          <DashConnector />
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex items-center -space-x-2">
              <span className="flex size-10 items-center justify-center rounded-xl border bg-background">
                <HugeiconsIcon icon={TelegramIcon} className="size-5" />
              </span>
              <span className="flex size-10 items-center justify-center rounded-xl border bg-background">
                <HugeiconsIcon icon={GoogleSheetIcon} className="size-5" />
              </span>
              <span className="flex size-10 items-center justify-center rounded-xl border bg-background font-mono text-[10px] font-semibold">
                B24
              </span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("dest")}
            </span>
          </div>
        </div>

        <ul className="divide-y">
          {FEED_ROWS.map((row, index) => (
            <li
              key={row.name}
              className="flex items-center gap-3 px-4 py-2.5 mk-rise"
              style={{ animationDelay: `${350 + index * 120}ms` }}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-semibold text-muted-foreground">
                {row.name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {row.name}
                </span>
                <span className="block truncate font-mono text-[10px] text-muted-foreground">
                  {row.route}
                </span>
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  statusStyles[row.status],
                )}
              >
                {row.status === "delivered" && (
                  <HugeiconsIcon icon={Tick02Icon} className="size-3" />
                )}
                {statusLabel[row.status]}
              </span>
              <span className="hidden w-16 text-right font-mono text-[10px] text-muted-foreground sm:block">
                {row.time.n === undefined
                  ? t(row.time.key)
                  : t(row.time.key, { n: row.time.n })}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{t("today")}</span>
          <span>{t("rate")}</span>
        </div>
      </div>
    </div>
  );
}

export async function Hero() {
  const t = await getTranslations("marketing");

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="mk-grid-bg absolute inset-0 -z-10" />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
        <div className="flex flex-col gap-6">
          <p
            className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary mk-rise"
            style={{ animationDelay: "0ms" }}
          >
            <span aria-hidden className="size-1.5 rounded-[2px] bg-primary" />
            {t("heroEyebrow")}
          </p>
          <h1
            className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl mk-rise"
            style={{ animationDelay: "80ms" }}
          >
            {t.rich("heroTitle", {
              hl: (chunks) => (
                <span className="rounded-md bg-primary/10 px-1.5 text-primary">
                  {chunks}
                </span>
              ),
            })}
          </h1>
          <p
            className="max-w-xl text-lg text-muted-foreground mk-rise"
            style={{ animationDelay: "160ms" }}
          >
            {t("heroSubtitle")}
          </p>
          <div
            className="flex flex-wrap items-center gap-3 mk-rise"
            style={{ animationDelay: "240ms" }}
          >
            <Button asChild size="lg">
              <Link href="/register">
                {t("ctaRegister")}
                <HugeiconsIcon icon={ArrowRight02Icon} className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#qanday-ishlaydi">
                {t("ctaHow")}
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
              </a>
            </Button>
          </div>
          <dl
            className="mt-4 grid max-w-md grid-cols-3 gap-4 border-t pt-6 mk-rise"
            style={{ animationDelay: "320ms" }}
          >
            {(["speed", "integrations", "support"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <dd className="font-mono text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {t(`heroStats.${key}.value`)}
                </dd>
                <dt className="text-xs text-muted-foreground">
                  {t(`heroStats.${key}.label`)}
                </dt>
              </div>
            ))}
          </dl>
        </div>

        <RelayCard />
      </div>
    </section>
  );
}
