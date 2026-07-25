import { getTranslations } from "next-intl/server";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon } from "@hugeicons/core-free-icons";
import { SectionHeader } from "./section-header";

const VIDEOS = [
  { key: "v1", duration: "4:12" },
  { key: "v2", duration: "6:45" },
  { key: "v3", duration: "5:20" },
] as const;

export async function Videos() {
  const t = await getTranslations("marketing.videos");

  return (
    <section>
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-3">
          {VIDEOS.map((video, index) => (
            <li
              key={video.key}
              className="group overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/40"
            >
              {/* CSS-only thumbnail placeholder */}
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-muted to-muted">
                <div
                  aria-hidden
                  className="absolute left-4 top-4 flex flex-col gap-1.5"
                >
                  <span className="h-1.5 w-20 rounded-full bg-foreground/10" />
                  <span className="h-1.5 w-12 rounded-full bg-foreground/10" />
                </div>
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-12 items-center justify-center rounded-full border bg-background/90 text-primary shadow-md transition-transform group-hover:scale-110">
                    <HugeiconsIcon icon={PlayIcon} className="size-5" />
                  </span>
                </span>
                <span className="absolute bottom-2 right-2 rounded-md border bg-background/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {video.duration}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  {t("lesson", { n: index + 1 })}
                </span>
                <h3 className="text-sm font-semibold">{t(video.key)}</h3>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
