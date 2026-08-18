"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";

/**
 * light → dark → system cycle. Shared by the marketing navbar and the
 * dashboard header, which each carried their own near-identical copy.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  // Before hydration `theme` is unknown; render the system icon either way so
  // the server and client markup agree.
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
        "relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg transition-colors duration-200",
        "hover:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
      <span className="relative block h-6 w-6">
        <Sun
          className={cn(
            "absolute inset-0 h-6 w-6 text-warning transition-all duration-300",
            current === "light"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0",
          )}
          aria-hidden="true"
        />
        <Moon
          className={cn(
            "absolute inset-0 h-6 w-6 text-info transition-all duration-300",
            current === "dark"
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0",
          )}
          aria-hidden="true"
        />
        <Monitor
          className={cn(
            "absolute inset-0 h-6 w-6 text-muted-foreground transition-all duration-300",
            current === "system"
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0",
          )}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
