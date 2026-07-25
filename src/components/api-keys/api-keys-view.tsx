"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Copy01Icon,
  Delete02Icon,
  Key01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { copyToClipboard } from "@/lib/clipboard";
import { formatDateTime, formatRelativeTime } from "@/lib/relative-time";
import type { ApiKey, ApiKeyWithSecret } from "@/lib/api/api-keys";
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from "@/hooks/use-api-keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function LoadErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("dashboard");
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
      <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      <Button variant="outline" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}

function CreateApiKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("apiKeys.createDialog");
  const tToasts = useTranslations("apiKeys.toasts");
  const tCommon = useTranslations("common");
  const mutation = useCreateApiKey();

  const [formError, setFormError] = useState<string | null>(null);
  // Once set, the dialog switches to the one-time full-key reveal state.
  const [created, setCreated] = useState<ApiKeyWithSecret | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const site = String(form.get("site") ?? "").trim();

    if (!name) {
      setFormError(t("nameRequired"));
      return;
    }
    if (!site) {
      setFormError(t("siteRequired"));
      return;
    }
    setFormError(null);

    mutation.mutate(
      { name, site },
      {
        onSuccess: (data) => setCreated(data),
        onError: () => toast.error(tToasts("error")),
      },
    );
  }

  async function handleCopy() {
    if (!created) return;
    const ok = await copyToClipboard(created.key);
    if (ok) toast.success(t("copied"));
    else toast.error(t("copyFailed"));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("createdTitle")}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2 rounded-lg border border-amber-600/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                <HugeiconsIcon
                  icon={Alert02Icon}
                  className="mt-0.5 size-4 shrink-0"
                />
                <p>{t("onceWarning")}</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3">
                <code className="min-w-0 flex-1 font-mono text-sm break-all">
                  {created.key}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("copy")}
                  onClick={handleCopy}
                >
                  <HugeiconsIcon icon={Copy01Icon} className="size-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                {t("done")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
              noValidate
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="api-key-name">{t("name")}</Label>
                <Input
                  id="api-key-name"
                  name="name"
                  placeholder={t("namePlaceholder")}
                  autoComplete="off"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="api-key-site">{t("site")}</Label>
                <Input
                  id="api-key-site"
                  name="site"
                  placeholder={t("sitePlaceholder")}
                  autoComplete="off"
                />
              </div>
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? t("creating") : t("create")}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteApiKeyDialog({
  apiKey,
  open,
  onOpenChange,
}: {
  apiKey: ApiKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("apiKeys.deleteDialog");
  const tToasts = useTranslations("apiKeys.toasts");
  const tCommon = useTranslations("common");
  const mutation = useDeleteApiKey();

  function handleDelete() {
    mutation.mutate(apiKey.id, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(tToasts("deleted"));
      },
      onError: () => {
        onOpenChange(false);
        toast.error(tToasts("error"));
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("description", { name: apiKey.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={mutation.isPending}>
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ApiKeysView() {
  const t = useTranslations("apiKeys");
  const locale = useLocale();
  const keysQuery = useApiKeys();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<ApiKey | null>(null);

  const keys = keysQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          {t("create")}
        </Button>
      </div>

      <Card>
        <CardContent>
          {keysQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : keysQuery.isError ? (
            <LoadErrorState onRetry={() => keysQuery.refetch()} />
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <HugeiconsIcon
                icon={Key01Icon}
                className="size-10 text-muted-foreground/50"
              />
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
              <Button variant="outline" onClick={() => setCreateOpen(true)}>
                {t("create")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colName")}</TableHead>
                    <TableHead>{t("colSite")}</TableHead>
                    <TableHead>{t("colKey")}</TableHead>
                    <TableHead>{t("colCreated")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">
                        {apiKey.name}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {apiKey.site}
                      </TableCell>
                      <TableCell>
                        <code className="font-mono text-sm">
                          {apiKey.key_masked}
                        </code>
                      </TableCell>
                      <TableCell
                        className="whitespace-nowrap"
                        title={formatDateTime(apiKey.created_at, locale) ?? ""}
                      >
                        {formatRelativeTime(apiKey.created_at, locale) ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("delete")}
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(apiKey)}
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              className="size-4"
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {createOpen && (
        <CreateApiKeyDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}
      {deleting && (
        <DeleteApiKeyDialog
          apiKey={deleting}
          open
          onOpenChange={(open) => {
            if (!open) setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
