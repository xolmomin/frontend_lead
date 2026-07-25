"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartLineData01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  PlusSignIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/relative-time";
import type { Report, ReportFormat } from "@/lib/api/reports";
import {
  useCreateReport,
  useDeleteReport,
  useReports,
  useSendReportNow,
  useUpdateReport,
} from "@/hooks/use-reports";
import { useFacebookAdAccounts } from "@/hooks/use-facebook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DEFAULT_PERIOD = "week";

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

function ReportStatusBadge({ status }: { status: Report["status"] }) {
  const t = useTranslations("reports.status");
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active"
          ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      )}
    >
      {status === "active" ? t("active") : t("paused")}
    </Badge>
  );
}

function ReportFormDialog({
  report,
  open,
  onOpenChange,
}: {
  /** `null` — create mode. */
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("reports.form");
  const tToasts = useTranslations("reports.toasts");
  const tCommon = useTranslations("common");

  const accountsQuery = useFacebookAdAccounts();
  const accounts = accountsQuery.data ?? [];
  const noAccounts =
    !accountsQuery.isLoading && (accountsQuery.isError || accounts.length === 0);

  const createMutation = useCreateReport();
  const updateMutation = useUpdateReport();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [formError, setFormError] = useState<string | null>(null);
  const [adAccountId, setAdAccountId] = useState<string>(
    report?.ad_account_id ?? "",
  );
  const [format, setFormat] = useState<ReportFormat>(report?.format ?? "short");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const form = new FormData(event.currentTarget);
    const chatId = String(form.get("chat_id") ?? "").trim();
    const sendTime = String(form.get("send_time") ?? "").trim();
    const campaignsLimit = Number(String(form.get("campaigns_limit") ?? ""));

    if (!adAccountId) {
      setFormError(t("adAccountRequired"));
      return;
    }
    if (!chatId) {
      setFormError(t("chatIdRequired"));
      return;
    }
    if (!sendTime) {
      setFormError(t("timeRequired"));
      return;
    }
    if (!Number.isInteger(campaignsLimit) || campaignsLimit < 1) {
      setFormError(t("limitInvalid"));
      return;
    }
    setFormError(null);

    const payload = {
      ad_account_id: adAccountId,
      chat_id: chatId,
      send_time: sendTime,
      period: report?.period ?? DEFAULT_PERIOD,
      campaigns_limit: campaignsLimit,
      format,
    };

    const options = {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(tToasts("saved"));
      },
      onError: () => toast.error(tToasts("error")),
    };
    if (report) {
      updateMutation.mutate({ id: report.id, payload }, options);
    } else {
      createMutation.mutate(payload, options);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{report ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label>{t("adAccount")}</Label>
            {noAccounts ? (
              <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                {t("noAccounts")}{" "}
                <Link
                  href="/dashboard/connections"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  {t("connectLink")}
                </Link>
              </p>
            ) : (
              <Select
                value={adAccountId || undefined}
                onValueChange={setAdAccountId}
                disabled={accountsQuery.isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      accountsQuery.isLoading
                        ? tCommon("loading")
                        : t("adAccountPlaceholder")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="report-chat-id">{t("chatId")}</Label>
            <Input
              id="report-chat-id"
              name="chat_id"
              defaultValue={report?.chat_id ?? ""}
              placeholder={t("chatIdPlaceholder")}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">{t("chatIdHint")}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="report-send-time">{t("time")}</Label>
              <Input
                id="report-send-time"
                name="send_time"
                type="time"
                defaultValue={report?.send_time ?? "09:00"}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="report-campaigns-limit">
                {t("campaignsLimit")}
              </Label>
              <Input
                id="report-campaigns-limit"
                name="campaigns_limit"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                defaultValue={report ? String(report.campaigns_limit) : "5"}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("format")}</Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as ReportFormat)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">{t("formatShort")}</SelectItem>
                <SelectItem value="detailed">{t("formatDetailed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending || noAccounts}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteReportDialog({
  report,
  open,
  onOpenChange,
}: {
  report: Report;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("reports.deleteDialog");
  const tToasts = useTranslations("reports.toasts");
  const tCommon = useTranslations("common");
  const mutation = useDeleteReport();

  function handleDelete() {
    mutation.mutate(report.id, {
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
            {t("description", {
              name: report.ad_account_name ?? report.ad_account_id,
            })}
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

function ReportRow({
  report,
  onEdit,
  onDelete,
}: {
  report: Report;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("reports");
  const tToasts = useTranslations("reports.toasts");
  const locale = useLocale();
  const updateMutation = useUpdateReport();
  const sendMutation = useSendReportNow();

  function handleToggle(checked: boolean) {
    updateMutation.mutate(
      { id: report.id, payload: { status: checked ? "active" : "paused" } },
      { onError: () => toast.error(tToasts("error")) },
    );
  }

  function handleSendNow() {
    sendMutation.mutate(report.id, {
      onSuccess: () => toast.success(tToasts("sent")),
      onError: () => toast.error(tToasts("error")),
    });
  }

  const lastSent = formatRelativeTime(report.last_sent_at, locale);
  const periodLabel =
    report.period === "week" ? t("period.week") : report.period;

  return (
    <TableRow>
      <TableCell className="font-medium">
        {report.ad_account_name || report.ad_account_id}
      </TableCell>
      <TableCell className="font-mono text-xs">{report.chat_id}</TableCell>
      <TableCell className="tabular-nums">{report.send_time}</TableCell>
      <TableCell>{periodLabel}</TableCell>
      <TableCell className="tabular-nums">{report.campaigns_limit}</TableCell>
      <TableCell>
        {report.format === "detailed"
          ? t("form.formatDetailed")
          : t("form.formatShort")}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={report.status === "active"}
            disabled={updateMutation.isPending}
            aria-label={t("toggleStatus")}
            onCheckedChange={handleToggle}
          />
          <ReportStatusBadge status={report.status} />
        </div>
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {lastSent ?? "—"}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={sendMutation.isPending}
            onClick={handleSendNow}
          >
            <HugeiconsIcon icon={SentIcon} data-icon="inline-start" />
            {t("sendNow")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("edit")}
            onClick={onEdit}
          >
            <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("delete")}
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ReportsView() {
  const t = useTranslations("reports");
  const reportsQuery = useReports();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState<Report | null>(null);

  const reports = reportsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          {t("create")}
        </Button>
      </div>

      <Card>
        <CardContent>
          {reportsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : reportsQuery.isError ? (
            <LoadErrorState onRetry={() => reportsQuery.refetch()} />
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <HugeiconsIcon
                icon={ChartLineData01Icon}
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
                    <TableHead>{t("columns.adAccount")}</TableHead>
                    <TableHead>{t("columns.chatId")}</TableHead>
                    <TableHead>{t("columns.time")}</TableHead>
                    <TableHead>{t("columns.period")}</TableHead>
                    <TableHead>{t("columns.campaigns")}</TableHead>
                    <TableHead>{t("columns.format")}</TableHead>
                    <TableHead>{t("columns.status")}</TableHead>
                    <TableHead>{t("columns.lastSent")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <ReportRow
                      key={report.id}
                      report={report}
                      onEdit={() => setEditing(report)}
                      onDelete={() => setDeleting(report)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {createOpen && (
        <ReportFormDialog
          report={null}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
      {editing && (
        <ReportFormDialog
          key={String(editing.id)}
          report={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}
      {deleting && (
        <DeleteReportDialog
          report={deleting}
          open
          onOpenChange={(open) => {
            if (!open) setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
