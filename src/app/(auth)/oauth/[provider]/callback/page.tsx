"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";
import { oauthCallback, type RedirectProvider } from "@/lib/api";

function isRedirectProvider(value: unknown): value is RedirectProvider {
  return value === "google" || value === "facebook";
}

function OAuthCallback() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const [callbackFailed, setCallbackFailed] = useState(false);
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
      .catch(() => setCallbackFailed(true));
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
            {t("errors.oauthFailed")}
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

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <OAuthCallback />
    </Suspense>
  );
}
