"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";
import { ApiError, oauthCallback, type RedirectProvider } from "@/lib/api";

function isRedirectProvider(value: unknown): value is RedirectProvider {
  return value === "google" || value === "facebook" || value === "telegram";
}

function isPhoneRequiredError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    typeof err.data === "object" &&
    err.data !== null &&
    (err.data as { detail?: unknown }).detail === "telegram_phone_required"
  );
}

export function OAuthCallbackView() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const [callbackFailed, setCallbackFailed] = useState(false);
  const [phoneRequired, setPhoneRequired] = useState(false);
  const started = useRef(false);

  const provider = params.provider;
  const code = search.get("code");
  const state = search.get("state");
  const valid =
    isRedirectProvider(provider) && !search.get("error") && !!code && !!state;

  useEffect(() => {
    if (!valid || started.current) return;
    started.current = true;
    oauthCallback(provider as RedirectProvider, code as string, state as string)
      .then(() => router.replace("/dashboard"))
      .catch((err) => {
        setPhoneRequired(isPhoneRequiredError(err));
        setCallbackFailed(true);
      });
  }, [valid, provider, code, state, router]);

  const failed = callbackFailed || !valid;

  return (
    <div className="glass w-full max-w-md rounded-xl border border-border p-8 text-center shadow-lg">
      {failed ? (
        <>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <HugeiconsIcon icon={AlertCircleIcon} size={26} />
          </div>
          <h1 className="text-lg font-semibold text-foreground">
            {phoneRequired
              ? t("errors.telegramPhoneRequired")
              : t("errors.oauthFailed")}
          </h1>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            {t("loginLink")}
          </Link>
        </>
      ) : (
        <>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HugeiconsIcon
              icon={Loading03Icon}
              size={26}
              className="animate-spin"
            />
          </div>
          <p className="text-sm text-muted-foreground">{t("oauthConnecting")}</p>
        </>
      )}
    </div>
  );
}

/** Shown while useSearchParams() suspends — a blank card mid-OAuth reads as a hang. */
export function OAuthCallbackPending() {
  return (
    <div className="glass w-full max-w-md rounded-xl border border-border p-8 text-center shadow-lg">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <HugeiconsIcon icon={Loading03Icon} size={26} className="animate-spin" />
      </div>
      <div className="mx-auto h-4 w-40 animate-pulse rounded bg-muted" />
    </div>
  );
}
