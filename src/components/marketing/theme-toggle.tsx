"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

/** Production light → dark → system cycle button (navbar), ported 1:1. */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();
  // Hydration-safe mounted check (server snapshot is always `false`).
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
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
      className={cn(
        "relative p-2 rounded-lg transition-all duration-200",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        className,
      )}
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
