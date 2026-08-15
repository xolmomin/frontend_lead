"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mail, Send } from "lucide-react";

// Evaluated once at module load rather than on every render: computing it
// during render can disagree between the server HTML and the client hydration
// when a build/session straddles New Year.
const CURRENT_YEAR = new Date().getFullYear();

const QUICK_LINKS = [
  { key: "features", href: "#features", isAnchor: true },
  { key: "howItWorks", href: "#how", isAnchor: true },
  { key: "pricing", href: "#pricing", isAnchor: true },
  { key: "register", href: "/register", isAnchor: false },
  { key: "login", href: "/login", isAnchor: false },
] as const;

const LEGAL_LINKS = [
  { key: "privacy", href: "/privacy-policy" },
  { key: "terms", href: "/terms-of-service" },
  { key: "dataDeletion", href: "/data-deletion" },
] as const;

export function MarketingFooter() {
  const t = useTranslations("landing");
  const scrollTo = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-gray-900 dark:bg-slate-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="https://cdn.lidlar.uz/static/logo.png"
                alt="Lidlar Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <span className="text-lg font-bold text-white">Lidlar</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) =>
                link.isAnchor ? (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      onClick={(event) => scrollTo(event, link.href)}
                      className="text-sm text-gray-400 hover:text-white transition-colors min-h-[44px] inline-flex items-center"
                    >
                      {t(`nav.${link.key}`)}
                    </a>
                  </li>
                ) : (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors min-h-[44px] inline-flex items-center"
                    >
                      {t(`nav.${link.key}`)}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors min-h-[44px] inline-flex items-center"
                  >
                    {t(`footer.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {t("footer.contact")}
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://t.me/ReklamaManagerUz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-white transition-colors min-h-[44px] inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  {t("footer.adminContact")}
                </a>
              </li>
              <li>
                <a
                  href="mailto:lidlar.uz@gmail.com"
                  className="text-sm text-gray-400 hover:text-white transition-colors min-h-[44px] inline-flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  lidlar.uz@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <p className="text-sm text-gray-500">
              {t("footer.copyright", { year: CURRENT_YEAR })}
            </p>
            <p className="text-xs text-gray-600">{t("footer.operator")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
