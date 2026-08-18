"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Facebook02Icon,
  Loading03Icon,
  MoreVerticalIcon,
  RefreshIcon,
  TimeQuarterPassIcon,
} from "@hugeicons/core-free-icons";
import type { FacebookConnection } from "@/lib/api/facebook";
import {
  useDeleteFacebookConnection,
  useFacebookConnections,
  useStartFacebookOAuth,
} from "@/hooks/use-facebook";
import { formatRelativeTime } from "@/lib/relative-time";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function FacebookConnectionStatusBadge({
  status,
}: {
  status: FacebookConnection["status"];
}) {
  const t = useTranslations("connections.facebook");
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active"
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      {status === "active" ? t("statusActive") : t("statusError")}
    </Badge>
  );
}

function FacebookConnectionCard({
  connection,
  onDelete,
}: {
  connection: FacebookConnection;
  onDelete: (connection: FacebookConnection) => void;
}) {
  const t = useTranslations("connections.facebook");
  const tToasts = useTranslations("integrations.toasts");
  const locale = useLocale();
  const startOAuth = useStartFacebookOAuth();

  const tokenExpires = formatRelativeTime(connection.token_expires_at, locale);

  return (
    <Card className="py-4">
      <CardContent className="flex items-start gap-3 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <HugeiconsIcon icon={Facebook02Icon} className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{connection.name}</p>
            <FacebookConnectionStatusBadge status={connection.status} />
          </div>
          {connection.status === "error" && connection.error_message && (
            <p
              className="mt-1 text-xs text-destructive"
              title={connection.error_message}
            >
              {connection.error_message}
            </p>
          )}
          {tokenExpires && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <HugeiconsIcon icon={TimeQuarterPassIcon} className="size-3.5" />
              {t("tokenExpires", { time: tokenExpires })}
            </p>
          )}
          {connection.status === "error" && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={startOAuth.isPending}
              onClick={() =>
                startOAuth.mutate(undefined, {
                  onError: () => toast.error(tToasts("error")),
                })
              }
            >
              <HugeiconsIcon icon={RefreshIcon} data-icon="inline-start" />
              {t("reconnect")}
            </Button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t("delete")}>
              <HugeiconsIcon icon={MoreVerticalIcon} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(connection)}
            >
              <HugeiconsIcon icon={Delete02Icon} />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}

export function FacebookSourcesSection() {
  const t = useTranslations("connections");
  const tFb = useTranslations("connections.facebook");
  const tToasts = useTranslations("integrations.toasts");
  const tIntegrations = useTranslations("integrations");
  const tCommon = useTranslations("common");

  const connectionsQuery = useFacebookConnections();
  const startOAuth = useStartFacebookOAuth();
  const deleteMutation = useDeleteFacebookConnection();

  const [deleteTarget, setDeleteTarget] = useState<FacebookConnection | null>(
    null,
  );

  const connections = connectionsQuery.data ?? [];

  function connect() {
    startOAuth.mutate(undefined, {
      onError: () => toast.error(tToasts("error")),
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(tToasts("deleted"));
      },
      onError: () => {
        setDeleteTarget(null);
        toast.error(tToasts("error"));
      },
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t("sources.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("sources.description")}
          </p>
        </div>
        <Button disabled={startOAuth.isPending} onClick={connect}>
          {startOAuth.isPending ? (
            <HugeiconsIcon
              icon={Loading03Icon}
              className="animate-spin"
              data-icon="inline-start"
            />
          ) : (
            <HugeiconsIcon icon={Facebook02Icon} data-icon="inline-start" />
          )}
          {tFb("connect")}
        </Button>
      </div>

      {connectionsQuery.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {connectionsQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">{tCommon("error")}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => connectionsQuery.refetch()}
          >
            {tIntegrations("retry")}
          </Button>
        </div>
      )}

      {connectionsQuery.isSuccess && connections.length === 0 && (
        <Card className="max-w-md border-dashed py-4">
          <CardContent className="flex items-start gap-3 px-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <HugeiconsIcon
                icon={Facebook02Icon}
                className="size-5 text-muted-foreground"
              />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{t("sources.facebookTitle")}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("sources.facebookDescription")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {connections.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {connections.map((connection) => (
            <FacebookConnectionCard
              key={connection.id}
              connection={connection}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tFb("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tFb("deleteDescription", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {tFb("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
