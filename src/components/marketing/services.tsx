import { getTranslations } from "next-intl/server";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Analytics01Icon,
  CursorMagicSelection02Icon,
  GlobeIcon,
  Plug01Icon,
  Shield01Icon,
  Target02Icon,
} from "@hugeicons/core-free-icons";
import { SectionHeader } from "./section-header";

const ITEMS = [
  { key: "leads", icon: Target02Icon },
  { key: "crm", icon: Plug01Icon },
  { key: "reports", icon: Analytics01Icon },
  { key: "pixel", icon: CursorMagicSelection02Icon },
  { key: "domains", icon: GlobeIcon },
  { key: "security", icon: Shield01Icon },
] as const;

export async function Services() {
  const t = await getTranslations("marketing.services");

  return (
    <section id="xizmatlar" className="mk-anchor">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <SectionHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <li
              key={item.key}
              className="group flex flex-col gap-4 rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <HugeiconsIcon icon={item.icon} className="size-5" />
              </span>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-semibold">{t(`${item.key}.title`)}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(`${item.key}.desc`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
