"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowLeft01Icon,
  Loading03Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import {
  useCompleteFacebookOAuth,
  useStartFacebookOAuth,
} from "@/hooks/use-facebook";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function PendingView() {
  const t = useTranslations("connections.facebook");
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <HugeiconsIcon
        icon={Loading03Icon}
        className="size-8 animate-spin text-primary"
      />
      <p className="font-semibold">{t("callbackTitle")}</p>
      <p className="text-sm text-muted-foreground">
        {t("callbackDescription")}
      </p>
    </div>
  );
}

function ErrorView({ message }: { message: string | null }) {
  const t = useTranslations("connections.facebook");
  const tToasts = useTranslations("integrations.toasts");
  const startOAuth = useStartFacebookOAuth();

  return (
    <div className="mx-auto w-full max-w-md py-10">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <HugeiconsIcon
            icon={Alert02Icon}
            className="size-8 text-destructive"
          />
          <p className="font-semibold">{t("callbackErrorTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {message ?? t("callbackErrorDescription")}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/connections">
                <HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
                {t("backToConnections")}
              </Link>
            </Button>
            <Button
              disabled={startOAuth.isPending}
              onClick={() =>
                startOAuth.mutate(undefined, {
                  onError: () => toast.error(tToasts("error")),
                })
              }
            >
              <HugeiconsIcon icon={RefreshIcon} data-icon="inline-start" />
              {t("callbackRetry")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CallbackContent() {
  const t = useTranslations("connections.facebook");
  const router = useRouter();
  const searchParams = useSearchParams();
  const completeOAuth = useCompleteFacebookOAuth();
  const fired = useRef(false);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  // Facebook appends these when the user cancels the dialog or an error occurs.
  const fbError = searchParams.get("error");
  const fbErrorDescription = searchParams.get("error_description");

  const paramsInvalid = fbError !== null || !code || !state;

  useEffect(() => {
    if (!code || !state || fbError !== null || fired.current) return;
    fired.current = true;
    completeOAuth.mutate(
      { code, state },
      {
        onSuccess: () => {
          toast.success(t("callbackSuccess"));
          router.replace("/dashboard/connections");
        },
      },
    );
  }, [code, state, fbError, completeOAuth, router, t]);

  if (fbError) {
    return <ErrorView message={fbErrorDescription} />;
  }
  if (paramsInvalid) {
    return <ErrorView message={null} />;
  }
  if (completeOAuth.isError) {
    const error = completeOAuth.error;
    const detail =
      error instanceof ApiError &&
      error.data &&
      typeof error.data === "object" &&
      typeof (error.data as { detail?: unknown }).detail === "string"
        ? (error.data as { detail: string }).detail
        : null;
    return <ErrorView message={detail} />;
  }
  return <PendingView />;
}

export default function FacebookCallbackPage() {
  return (
    <Suspense fallback={<PendingView />}>
      <CallbackContent />
    </Suspense>
  );
}
