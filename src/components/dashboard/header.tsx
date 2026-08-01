"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Bell, Menu, Monitor, Moon, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";
import { useUser } from "@/hooks/use-user";
import { LanguageSwitcher } from "@/components/auth/language-switcher";
import { SidebarContent } from "./sidebar";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ThemeToggle() {
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const current = mounted ? (theme ?? "system") : "system";

  function cycle() {
    setTheme(
      current === "light" ? "dark" : current === "dark" ? "system" : "light",
    );
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className="relative p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      aria-label={t(
        current === "light"
          ? "theme.switchToDark"
          : current === "dark"
            ? "theme.switchToSystem"
            : "theme.switchToLight",
      )}
      title={t("theme.current", { name: t(`theme.${current}`) })}
    >
      <div className="relative w-6 h-6">
        <Sun
          className={cn(
            "absolute inset-0 w-6 h-6 text-yellow-500 transition-all duration-300",
            current === "light"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0",
          )}
          aria-hidden="true"
        />
        <Moon
          className={cn(
            "absolute inset-0 w-6 h-6 text-blue-500 transition-all duration-300",
            current === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0",
          )}
          aria-hidden="true"
        />
        <Monitor
          className={cn(
            "absolute inset-0 w-6 h-6 text-gray-600 dark:text-gray-300 transition-all duration-300",
            current === "system"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0",
          )}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

function NotificationsBell() {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
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
        className="relative p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={t("notifications")}
      >
        <Bell className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>
      {open && (
        <div
          ref={panelRef}
          className="fixed md:absolute top-[68px] md:top-auto right-2 md:right-0 left-2 md:left-auto md:mt-2 md:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {t("notifications")}
            </h3>
          </div>
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
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
      <aside className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 shadow-xl animate-in slide-in-from-left duration-200 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Menyuni yopish"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        <SidebarContent onNavigate={onClose} />
      </aside>
    </div>
  );
}

export function DashboardHeader() {
  const t = useTranslations("common");
  const router = useRouter();
  const { data: user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = user?.full_name || user?.email || "";

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="h-full px-4 md:px-6 flex items-center justify-between gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
          aria-label="Menyuni ochish"
        >
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>
        <div className="hidden md:block flex-1" />
        <div className="flex items-center gap-2">
          <a
            href="tg://resolve?domain=YuboramanUz"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Telegram kanal"
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
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={t("settings")}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center overflow-hidden">
              <span className="text-sm font-bold text-white">
                {displayName ? initials(displayName) : "U"}
              </span>
            </div>
            <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
              {displayName}
            </span>
          </button>
        </div>
      </div>
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
