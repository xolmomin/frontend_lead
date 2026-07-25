import { getTranslations } from "next-intl/server";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HeadsetIcon,
  Plug01Icon,
  Shield01Icon,
  Wrench01Icon,
} from "@hugeicons/core-free-icons";

const ITEMS = [
  { key: "integrations", icon: Plug01Icon },
  { key: "support", icon: HeadsetIcon },
  { key: "setup", icon: Wrench01Icon },
  { key: "security", icon: Shield01Icon },
] as const;

export async function TrustStrip() {
  const t = await getTranslations("marketing.trust");

  return (
    <section className="border-y bg-muted/30">
      <ul className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-x-8 gap-y-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <li key={item.key} className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HugeiconsIcon icon={item.icon} className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold">
                {t(`${item.key}.title`)}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t(`${item.key}.desc`)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
