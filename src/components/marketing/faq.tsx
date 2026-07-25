import { getTranslations } from "next-intl/server";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { SectionHeader } from "./section-header";

const QUESTIONS = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"] as const;

export async function Faq() {
  const t = await getTranslations("marketing.faq");

  return (
    <section id="faq" className="mk-anchor">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <SectionHeader
            eyebrow={t("eyebrow")}
            title={t("title")}
            subtitle={t("subtitle")}
          />

          <div className="flex flex-col gap-3">
            {QUESTIONS.map((q) => (
              <details
                key={q}
                className="group rounded-xl border bg-card px-5 transition-colors open:border-primary/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                  {t(`${q}.q`)}
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="pb-4 text-sm text-muted-foreground">
                  {t(`${q}.a`)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
