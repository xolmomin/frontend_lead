"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import {
  getOAuthProviders,
  getOAuthUrl,
  telegramCallback,
  type OAuthProviders,
  type RedirectProvider,
  type TelegramAuthPayload,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  GoogleIcon,
  TelegramIcon,
  FacebookIcon,
} from "@/components/auth/provider-icons";

const TELEGRAM_WIDGET_SRC = "https://telegram.org/js/telegram-widget.js?22";

interface TelegramLogin {
  auth: (
    opts: { bot_id: string; request_access?: string },
    cb: (user: TelegramAuthPayload | false) => void,
  ) => void;
}
declare global {
  interface Window {
    Telegram?: { Login?: TelegramLogin };
  }
}

function loadTelegramWidget(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Telegram?.Login) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TELEGRAM_WIDGET_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("tg")));
      return;
    }
    const script = document.createElement("script");
    script.src = TELEGRAM_WIDGET_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("tg"));
    document.head.appendChild(script);
  });
}

interface SocialAuthProps {
  onError: (message: string | null) => void;
  redirectTo?: string;
}

export function SocialAuth({ onError, redirectTo = "/dashboard" }: SocialAuthProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [providers, setProviders] = useState<OAuthProviders | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getOAuthProviders()
      .then((p) => active && setProviders(p))
      .catch(() => active && setProviders(null));
    return () => {
      active = false;
    };
  }, []);

  async function startRedirect(provider: RedirectProvider) {
    onError(null);
    setBusy(provider);
    try {
      window.location.assign(await getOAuthUrl(provider));
    } catch {
      onError(t("errors.oauthFailed"));
      setBusy(null);
    }
  }

  async function startTelegram(botId: number) {
    onError(null);
    setBusy("telegram");
    try {
      await loadTelegramWidget();
      window.Telegram?.Login?.auth(
        { bot_id: String(botId), request_access: "write" },
        (user) => {
          if (!user) {
            setBusy(null);
            return;
          }
          telegramCallback(user)
            .then(() => router.push(redirectTo))
            .catch(() => {
              onError(t("errors.oauthFailed"));
              setBusy(null);
            });
        },
      );
    } catch {
      onError(t("errors.oauthFailed"));
      setBusy(null);
    }
  }

  const telegramReady =
    !!providers?.telegram.enabled && providers.telegram.bot_id != null;

  const buttons: {
    key: string;
    name: string;
    icon: React.ReactNode;
    enabled: boolean;
    onClick: () => void;
  }[] = [
    {
      key: "telegram",
      name: "Telegram",
      icon: <TelegramIcon />,
      enabled: telegramReady,
      onClick: () =>
        providers?.telegram.bot_id != null &&
        startTelegram(providers.telegram.bot_id),
    },
    {
      key: "google",
      name: "Google",
      icon: <GoogleIcon />,
      enabled: !!providers?.google,
      onClick: () => startRedirect("google"),
    },
    {
      key: "facebook",
      name: "Facebook",
      icon: <FacebookIcon />,
      enabled: !!providers?.facebook,
      onClick: () => startRedirect("facebook"),
    },
  ];

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>{t("or")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {buttons.map((b) => {
        const loading = busy === b.key;
        const disabled = !b.enabled || busy !== null;
        return (
          <button
            key={b.key}
            type="button"
            disabled={disabled}
            onClick={b.onClick}
            title={b.enabled ? undefined : t("comingSoon")}
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-input bg-card text-sm font-medium text-foreground shadow-sm transition-colors",
              disabled
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:bg-accent",
            )}
          >
            {loading ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                size={18}
                className="animate-spin"
              />
            ) : (
              b.icon
            )}
            <span>{t("socialContinue", { provider: b.name })}</span>
          </button>
        );
      })}
    </div>
  );
}
