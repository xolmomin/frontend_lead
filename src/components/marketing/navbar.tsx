"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LanguageSquareIcon,
  Menu01Icon,
  Moon02Icon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import { locales, type Locale } from "@/i18n/config";
import { setLocaleCookie } from "@/i18n/set-locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "./logo";

const NAV_LINKS = [
  { href: "#qanday-ishlaydi", key: "how" },
  { href: "#integratsiyalar", key: "integrations" },
  { href: "#xizmatlar", key: "services" },
  { href: "#tariflar", key: "pricing" },
  { href: "#faq", key: "faq" },
] as const;

const localeLabels: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
};

function ThemeToggle() {
  const t = useTranslations("common");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("theme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <HugeiconsIcon icon={Moon02Icon} className="size-5 dark:hidden" />
      <HugeiconsIcon icon={Sun01Icon} className="hidden size-5 dark:block" />
    </Button>
  );
}

function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  function changeLocale(next: Locale) {
    setLocaleCookie(next);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("language")}>
          <HugeiconsIcon icon={LanguageSquareIcon} className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => changeLocale(l)}
            className={l === locale ? "font-semibold text-primary" : undefined}
          >
            {localeLabels[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MarketingNavbar() {
  const t = useTranslations("marketing");
  const tCommon = useTranslations("common");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label={tCommon("appName")}>
          <Logo />
        </Link>

        <nav className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.key}>
                <a
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {t(`nav.${link.key}`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
          <div aria-hidden className="mx-2 hidden h-5 w-px bg-border sm:block" />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/login">{t("ctaLogin")}</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/register">{t("ctaRegister")}</Link>
          </Button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label={tCommon("appName")}
              >
                <HugeiconsIcon icon={Menu01Icon} className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">{tCommon("appName")}</SheetTitle>
              <div className="flex h-full flex-col gap-6 p-6">
                <Logo />
                <nav className="flex flex-col gap-1">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.key}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {t(`nav.${link.key}`)}
                    </a>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                  <Button asChild variant="outline">
                    <Link href="/login">{t("ctaLogin")}</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">{t("ctaRegister")}</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
