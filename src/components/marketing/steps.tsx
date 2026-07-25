import { getTranslations } from "next-intl/server";
import { SectionHeader } from "./section-header";

const STEPS = ["s1", "s2", "s3", "s4"] as const;

export async function Steps() {
  const t = await getTranslations("marketing.steps");

  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 bg-background font-mono text-sm font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {index < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="hidden flex-1 border-t border-dashed border-primary/40 lg:block"
                  />
                )}
              </div>
              <h3 className="font-semibold">{t(`${step}.title`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`${step}.desc`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
