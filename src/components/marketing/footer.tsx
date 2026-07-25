import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, TelegramIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";

const SECTION_LINKS = [
  { href: "#qanday-ishlaydi", key: "how" },
  { href: "#integratsiyalar", key: "integrations" },
  { href: "#xizmatlar", key: "services" },
  { href: "#tariflar", key: "pricing" },
  { href: "#faq", key: "faq" },
] as const;

export async function MarketingFooter() {
  const t = await getTranslations("marketing");

  const linkClass =
    "text-sm text-muted-foreground transition-colors hover:text-foreground";
  const headingClass =
    "font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground";

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="flex max-w-sm flex-col items-start gap-4">
            <Logo />
            <p className="text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
            <Button asChild variant="outline" size="sm">
              {/* Placeholder Telegram channel link */}
              <a
                href="https://t.me/yuboraman"
                target="_blank"
                rel="noopener noreferrer"
              >
                <HugeiconsIcon icon={TelegramIcon} className="size-4" />
                {t("footer.telegram")}
              </a>
            </Button>
          </div>

          <nav aria-label={t("footer.colSections")} className="flex flex-col gap-3">
            <h3 className={headingClass}>{t("footer.colSections")}</h3>
            {SECTION_LINKS.map((link) => (
              <a key={link.key} href={link.href} className={linkClass}>
                {t(`nav.${link.key}`)}
              </a>
            ))}
          </nav>

          <nav aria-label={t("footer.colPlatform")} className="flex flex-col gap-3">
            <h3 className={headingClass}>{t("footer.colPlatform")}</h3>
            <Link href="/login" className={linkClass}>
              {t("ctaLogin")}
            </Link>
            <Link href="/register" className={linkClass}>
              {t("ctaRegister")}
            </Link>
          </nav>

          <div className="flex flex-col gap-3">
            <h3 className={headingClass}>{t("footer.colContact")}</h3>
            <a
              href="https://t.me/yuboraman"
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkClass} flex items-center gap-2`}
            >
              <HugeiconsIcon icon={TelegramIcon} className="size-4" />
              {t("footer.supportChat")}
            </a>
            <a
              href={`mailto:${t("footer.email")}`}
              className={`${linkClass} flex items-center gap-2`}
            >
              <HugeiconsIcon icon={Mail01Icon} className="size-4" />
              {t("footer.email")}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.rights")}</p>
          <p className="font-mono uppercase tracking-wider">
            {t("footer.madeIn")}
          </p>
        </div>
      </div>
    </footer>
  );
}
