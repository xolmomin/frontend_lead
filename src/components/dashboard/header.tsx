"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, ChevronRight, Menu, X } from "lucide-react";
import { initials } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { LanguageSwitcher } from "@/components/auth/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { navItems, type NavItem } from "./nav-items";
import { SidebarContent } from "./sidebar";

function NotificationsBell() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    const id = requestAnimationFrame(() =>
      document.addEventListener("click", onClick),
    );
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-lg hover:bg-muted transition-colors"
        aria-label={t("notifications")}
      >
        <Bell className="w-6 h-6 text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
      </button>
      {open && (
        <div
          ref={panelRef}
          className="fixed md:absolute top-[68px] md:top-auto right-2 md:right-0 left-2 md:left-auto md:mt-2 md:w-80 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">
              {t("notifications")}
            </h3>
          </div>
          <div className="p-4 text-center text-muted-foreground">
            {t("noNotifications")}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in duration-150"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 left-0 w-72 bg-card shadow-xl animate-in slide-in-from-left duration-200 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Menyuni yopish"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        <SidebarContent onNavigate={onClose} />
      </aside>
    </div>
  );
}

/**
 * Longest matching nav path wins, so `/dashboard/finance/orders` resolves to
 * the Orders child rather than the Finance parent. Returns the parent too, so
 * nested pages can render a two-level trail.
 */
function trailFor(pathname: string): NavItem[] {
  let best: NavItem[] = [];
  for (const item of navItems) {
    for (const candidate of [
      [item],
      ...(item.children ?? []).map((child) => [item, child]),
    ]) {
      const leaf = candidate[candidate.length - 1];
      if (!leaf.path) continue;
      const matches =
        leaf.path === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(leaf.path);
      if (matches && leaf.path.length >= (best.at(-1)?.path?.length ?? 0)) {
        best = candidate;
      }
    }
  }
  return best;
}

function Breadcrumb() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const trail = trailFor(pathname);
  if (trail.length === 0) return null;

  return (
    <nav
      aria-label={t("breadcrumb")}
      className="hidden min-w-0 flex-1 md:block"
    >
      <ol className="flex items-center gap-1.5 text-sm">
        {trail.map((item, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={item.id} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <ChevronRight
                  className="h-4 w-4 flex-shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <span
                className={
                  last
                    ? "truncate font-semibold text-foreground"
                    : "truncate text-muted-foreground"
                }
                aria-current={last ? "page" : undefined}
              >
                {t(`menu.${item.id}`)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function DashboardHeader() {
  const t = useTranslations("common");
  const tNav = useTranslations("navigation");
  const router = useRouter();
  const { data: user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = user?.full_name || user?.email || "";

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-muted touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={tNav("openMenu")}
        >
          <Menu className="w-6 h-6 text-foreground/80" />
        </button>
        <Breadcrumb />
        <div className="flex items-center gap-2">
          <a
            href="tg://resolve?domain=LidlarUz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={tNav("telegramChannel")}
            aria-label={tNav("telegramChannel")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-[#26A5E4]"
            >
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>
          <NotificationsBell />
          <ThemeToggle />
          <LanguageSwitcher />
          <button
            onClick={() => router.push("/dashboard/settings")}
            className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={t("settings")}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden">
              <span className="text-sm font-bold text-white">
                {displayName ? initials(displayName) : "U"}
              </span>
            </div>
            <span className="hidden md:inline text-sm font-medium text-foreground/80">
              {displayName}
            </span>
          </button>
        </div>
      </div>
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
