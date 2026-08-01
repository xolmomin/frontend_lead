"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { setLocaleCookie } from "@/i18n/set-locale";
import { UzFlag, RuFlag } from "@/components/auth/flags";

const LANGUAGES: {
  code: Locale;
  name: string;
  Flag: (props: { className?: string }) => React.ReactNode;
}[] = [
  { code: "uz", name: "O'zbekcha", Flag: UzFlag },
  { code: "ru", name: "Русский", Flag: RuFlag },
];

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const active = useLocale() as Locale;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === active) ?? LANGUAGES[0];
  const CurrentFlag = current.Flag;

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onMouseDown);
      return () => document.removeEventListener("mousedown", onMouseDown);
    }
  }, [open]);

  function selectLanguage(code: Locale) {
    setLocaleCookie(code);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
        title={t("language.switch")}
      >
        <span className="sm:hidden">
          <CurrentFlag className="w-6 h-4 rounded" />
        </span>
        <span className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <CurrentFlag className="w-6 h-4 rounded" />
          <span>{current.name}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-150">
          <div className="p-2">
            {LANGUAGES.map((lang) => {
              const Flag = lang.Flag;
              const selected = current.code === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => selectLanguage(lang.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    selected
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Flag className="w-6 h-4 rounded flex-shrink-0" />
                  <span className="font-medium">{lang.name}</span>
                  {selected && <Check className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
