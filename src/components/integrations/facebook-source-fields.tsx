"use client";

import { useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  LinkSquare02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import {
  useFacebookConnections,
  useFacebookForms,
  useFacebookPages,
  useSubscribeFacebookPage,
} from "@/hooks/use-facebook";
import { FacebookConnectionStatusBadge } from "@/components/connections/facebook-sources";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function LoadFailed({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("integrations");
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-dashed px-3 py-2">
      <span className="text-sm text-muted-foreground">{t("loadError")}</span>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}

/**
 * Facebook sub-selection of wizard step 1: connection -> page -> form.
 * Subscribes the picked page to the leadgen webhook automatically
 * (fire-and-forget; a failure is surfaced but does not block the wizard).
 */
export function FacebookSourceFields({
  connectionId,
  pageId,
  formId,
  onConnectionChange,
  onPageChange,
  onFormChange,
}: {
  connectionId: string;
  pageId: string;
  formId: string;
  onConnectionChange: (value: string) => void;
  onPageChange: (value: string) => void;
  onFormChange: (value: string) => void;
}) {
  const t = useTranslations("integrations.wizard.facebook");

  const connectionsQuery = useFacebookConnections();
  const pagesQuery = useFacebookPages(connectionId);
  const formsQuery = useFacebookForms(connectionId, pageId);

  const subscribeMutation = useSubscribeFacebookPage();
  const subscribed = useRef(new Set<string>());

  const connections = connectionsQuery.data ?? [];
  const pages = pagesQuery.data ?? [];
  const forms = formsQuery.data ?? [];

  function handlePagePick(value: string) {
    onPageChange(value);
    const key = `${connectionId}:${value}`;
    if (subscribed.current.has(key)) return;
    subscribed.current.add(key);
    subscribeMutation.mutate(
      { connectionId, pageId: value },
      {
        onError: () => {
          subscribed.current.delete(key);
          toast.error(t("subscribeError"));
        },
      },
    );
  }

  if (connectionsQuery.isError) {
    return <LoadFailed onRetry={() => connectionsQuery.refetch()} />;
  }

  if (connectionsQuery.isSuccess && connections.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-4">
          <p className="text-sm text-muted-foreground">{t("noConnections")}</p>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/dashboard/connections">
              <HugeiconsIcon icon={LinkSquare02Icon} data-icon="inline-start" />
              {t("connectCta")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>{t("connection")}</Label>
        <Select
          value={connectionId}
          onValueChange={onConnectionChange}
          disabled={connectionsQuery.isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                connectionsQuery.isLoading
                  ? t("loading")
                  : t("selectConnection")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {connections.map((connection) => (
              <SelectItem key={connection.id} value={String(connection.id)}>
                <span className="flex items-center gap-2">
                  {connection.name}
                  {connection.status === "error" && (
                    <FacebookConnectionStatusBadge status="error" />
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {connectionId !== "" && (
        <div className="flex flex-col gap-2">
          <Label>{t("page")}</Label>
          {pagesQuery.isError ? (
            <LoadFailed onRetry={() => pagesQuery.refetch()} />
          ) : pagesQuery.isSuccess && pages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noPages")}</p>
          ) : (
            <Select
              value={pageId}
              onValueChange={handlePagePick}
              disabled={pagesQuery.isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    pagesQuery.isLoading ? t("loading") : t("selectPage")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {pages.map((page) => (
                  <SelectItem key={page.id} value={String(page.id)}>
                    {page.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {subscribeMutation.isPending && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon
                icon={Loading03Icon}
                className="size-3.5 animate-spin"
              />
              {t("subscribing")}
            </p>
          )}
          {subscribeMutation.isSuccess && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                className="size-3.5"
              />
              {t("subscribed")}
            </p>
          )}
        </div>
      )}

      {connectionId !== "" && pageId !== "" && (
        <div className="flex flex-col gap-2">
          <Label>{t("form")}</Label>
          {formsQuery.isError ? (
            <LoadFailed onRetry={() => formsQuery.refetch()} />
          ) : formsQuery.isSuccess && forms.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noForms")}</p>
          ) : (
            <Select
              value={formId}
              onValueChange={onFormChange}
              disabled={formsQuery.isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    formsQuery.isLoading ? t("loading") : t("selectForm")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={String(form.id)}>
                    {form.name}
                    {form.status ? ` — ${form.status}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}
