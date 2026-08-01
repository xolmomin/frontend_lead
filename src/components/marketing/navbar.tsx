"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Button } from "./button";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "@/components/auth/language-switcher";

const NAV_LINKS = [
  { key: "features", href: "#features" },
  { key: "pricing", href: "#pricing" },
  { key: "howItWorks", href: "#how" },
] as const;

export function MarketingNavbar() {
  const t = useTranslations("landing");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (menuOpen) {
      const scrollbar =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbar}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      requestAnimationFrame(() => firstLinkRef.current?.focus());
    } else {
      menuButtonRef.current?.focus();
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, closeMenu]);

  const scrollTo = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    closeMenu();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <span data-nosnippet="true">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg"
        >
          {t("nav.skipToMain")}
        </a>
      </span>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled || menuOpen ? "glass-strong" : "glass"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://cdn.yuboraman.uz/static/logo2.png"
                alt="Yuboraman.uz"
                className="h-8 w-auto"
              />
            </Link>
            <nav
              aria-label={t("nav.mainNav")}
              data-nosnippet="true"
              className="hidden md:flex items-center gap-6"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={(event) => scrollTo(event, link.href)}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {t(`nav.${link.key}`)}
                </a>
              ))}
            </nav>
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              <Link href="/login">
                <Button variant="outline" size="sm">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  {t("nav.register")}
                </Button>
              </Link>
            </div>
            <button
              ref={menuButtonRef}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={t(menuOpen ? "nav.closeMenu" : "nav.openMenu")}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X
                  className="w-6 h-6 text-gray-700 dark:text-gray-300"
                  aria-hidden="true"
                />
              ) : (
                <Menu
                  className="w-6 h-6 text-gray-700 dark:text-gray-300"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div className="md:hidden fixed top-16 left-0 right-0 bottom-0 z-50 overflow-y-auto animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl" />
            <div className="absolute top-10 -left-20 w-64 h-64 bg-primary-400/15 dark:bg-primary-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 -right-20 w-72 h-72 bg-secondary-400/15 dark:bg-secondary-400/10 rounded-full blur-3xl" />
            <div className="relative flex flex-col items-center justify-center min-h-full px-6 py-8">
              <nav
                aria-label={t("nav.mobileNav")}
                data-nosnippet="true"
                className="flex flex-col items-center gap-2 w-full max-w-xs"
              >
                {NAV_LINKS.map((link, index) => (
                  <a
                    key={link.key}
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={link.href}
                    onClick={(event) => scrollTo(event, link.href)}
                    className="w-full text-center text-lg font-semibold text-gray-800 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-all py-3.5 px-4 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 min-h-[48px] flex items-center justify-center animate-in fade-in slide-in-from-left-5 duration-300 fill-mode-both"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {t(`nav.${link.key}`)}
                  </a>
                ))}
              </nav>
              <div className="w-12 h-0.5 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 my-6 animate-in fade-in zoom-in-50 duration-300 fill-mode-both delay-200" />
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-full glass animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both delay-300">
                <LanguageSwitcher />
                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
                <ThemeToggle />
              </div>
              <div
                className="flex flex-col items-center gap-3 w-full max-w-xs mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300 fill-mode-both"
                style={{ animationDelay: "400ms" }}
              >
                <Link href="/login" className="w-full" onClick={closeMenu}>
                  <Button variant="outline" size="lg" className="w-full">
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link href="/register" className="w-full" onClick={closeMenu}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full shadow-glow-sm"
                  >
                    {t("nav.register")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
