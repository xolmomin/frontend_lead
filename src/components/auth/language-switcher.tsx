"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { TranslateIcon } from "@hugeicons/core-free-icons";
import { locales, type Locale } from "@/i18n/config";
import { setLocaleCookie } from "@/i18n/set-locale";

const LABELS: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
};

export function LanguageSwitcher() {
  const active = useLocale() as Locale;
  const router = useRouter();

  const next = locales.find((l) => l !== active) ?? active;

  function toggle() {
    setLocaleCookie(next);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={LABELS[next]}
      aria-label={LABELS[next]}
      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-input bg-card/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <HugeiconsIcon icon={TranslateIcon} size={16} strokeWidth={1.8} />
      <span className="uppercase">{active}</span>
    </button>
  );
}
