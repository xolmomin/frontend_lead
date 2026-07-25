"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowUp01Icon,
  Copy01Icon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import {
  webhookIncomingUrl,
  type IntegrationAction,
  type Lead,
  type LeadStatus,
} from "@/lib/api/integrations";
import { copyToClipboard } from "@/lib/clipboard";
import { formatDateTime, formatRelativeTime } from "@/lib/relative-time";
import {
  useIntegration,
  useIntegrationAction,
  useIntegrationLeads,
} from "@/hooks/use-integrations";
import {
  DeliveryTypeLabel,
  IntegrationStatusBadge,
  LeadStatusBadge,
  sourceTypeMeta,
} from "@/components/integrations/meta";
import { IntegrationActionsMenu } from "@/components/integrations/integration-actions-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_FILTERS: (LeadStatus | "")[] = [
  "",
  "pending",
  "delivered",
  "failed",
  "paused_hold",
];

function LeadRow({ lead, locale }: { lead: Lead; locale: string }) {
  const t = useTranslations("integrations.detail");
  const [expanded, setExpanded] = useState(false);

  return (
    <Fragment>
      <TableRow>
        <TableCell className="whitespace-nowrap text-muted-foreground">
          {formatDateTime(lead.created_at, locale) ?? "—"}
        </TableCell>
        <TableCell>
          <LeadStatusBadge status={lead.status} />
        </TableCell>
        <TableCell className="tabular-nums">{lead.retry_count ?? 0}</TableCell>
        <TableCell className="max-w-48">
          <span className="block truncate text-destructive" title={lead.last_error ?? undefined}>
            {lead.last_error ?? "—"}
          </span>
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((value) => !value)}
          >
            {t("showPayload")}
            <HugeiconsIcon
              icon={expanded ? ArrowUp01Icon : ArrowDown01Icon}
              data-icon="inline-end"
            />
          </Button>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5} className="bg-muted/30">
            <pre className="max-h-64 overflow-auto rounded-md p-2 font-mono text-xs">
              {JSON.stringify(lead.raw, null, 2)}
            </pre>
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}

export function IntegrationDetail({ id }: { id: string }) {
  const t = useTranslations("integrations.detail");
  const tCard = useTranslations("integrations.card");
  const tActions = useTranslations("integrations.actions");
  const tToasts = useTranslations("integrations.toasts");
  const tRoot = useTranslations("integrations");
  const locale = useLocale();
  const router = useRouter();

  const [status, setStatus] = useState<LeadStatus | "">("");
  const [page, setPage] = useState(1);
  const [perPageGuess, setPerPageGuess] = useState<number | null>(null);

  const integrationQuery = useIntegration(id);
  const leadsQuery = useIntegrationLeads(id, { status, page });
  const actionMutation = useIntegrationAction();

  const integration = integrationQuery.data;
  const leads = leadsQuery.data?.items ?? [];
  const total = leadsQuery.data?.total ?? 0;

  // Infer server page size from the first full page.
  if (
    leadsQuery.data &&
    page === 1 &&
    leads.length > 0 &&
    perPageGuess !== leads.length &&
    leads.length < total
  ) {
    setPerPageGuess(leads.length);
  }
  const perPage = perPageGuess ?? Math.max(leads.length, 1);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function runAction(action: IntegrationAction) {
    if (!integration) return;
    actionMutation.mutate(
      { id: integration.id, action },
      {
        onSuccess: () => toast.success(tToasts("actionDone")),
        onError: () => toast.error(tToasts("error")),
      },
    );
  }

  async function copyWebhook() {
    if (!integration?.webhook_token) return;
    const ok = await copyToClipboard(
      webhookIncomingUrl(integration.webhook_token),
    );
    if (ok) toast.success(tToasts("copied"));
    else toast.error(tToasts("error"));
  }

  if (integrationQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (integrationQuery.isError || !integration) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/integrations">
            <HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
            {t("back")}
          </Link>
        </Button>
        <p className="text-muted-foreground">{t("notFound")}</p>
      </div>
    );
  }

  const source =
    sourceTypeMeta[integration.source_type] ?? sourceTypeMeta.webhook;
  const lastLead = formatRelativeTime(integration.last_lead_at, locale);

  return (
    <div className="flex flex-col gap-5">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit -translate-x-2 text-muted-foreground"
        asChild
      >
        <Link href="/dashboard/integrations">
          <HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
          {t("back")}
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{integration.name}</h1>
            <IntegrationStatusBadge status={integration.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={source.icon} className="size-3.5" />
              {source.label}
            </span>
            {integration.delivery_connection && (
              <span className="inline-flex items-center gap-1">
                {tCard("receiver")}:
                <DeliveryTypeLabel type={integration.delivery_connection.type} />
                <span>({integration.delivery_connection.name})</span>
              </span>
            )}
            {lastLead && (
              <span>
                {tCard("lastLead")}: {lastLead}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {integration.status === "active" ? (
            <Button
              variant="outline"
              disabled={actionMutation.isPending}
              onClick={() => runAction("pause")}
            >
              <HugeiconsIcon icon={PauseIcon} data-icon="inline-start" />
              {tActions("pause")}
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={actionMutation.isPending}
              onClick={() => runAction("start")}
            >
              <HugeiconsIcon icon={PlayIcon} data-icon="inline-start" />
              {tActions("start")}
            </Button>
          )}
          <Button
            variant="outline"
            disabled={actionMutation.isPending}
            onClick={() => runAction("send")}
          >
            <HugeiconsIcon icon={SentIcon} data-icon="inline-start" />
            {tActions("send")}
          </Button>
          <Button
            variant="outline"
            className="hidden sm:inline-flex"
            disabled={actionMutation.isPending}
            onClick={() => runAction("reset")}
          >
            <HugeiconsIcon icon={RefreshIcon} data-icon="inline-start" />
            {tActions("reset")}
          </Button>
          <IntegrationActionsMenu
            integration={integration}
            onDeleted={() => router.push("/dashboard/integrations")}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="py-3">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">{tCard("todayLeads")}</p>
            <p className="text-xl font-bold tabular-nums">
              {integration.today_leads ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">
              {tCard("pendingLeads")}
            </p>
            <p
              className={
                (integration.pending_leads ?? 0) > 0
                  ? "text-xl font-bold text-amber-700 tabular-nums dark:text-amber-400"
                  : "text-xl font-bold tabular-nums"
              }
            >
              {integration.pending_leads ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-4">
            {integration.source_type === "facebook" ||
            !integration.webhook_token ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {tCard("source")}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm">
                  <HugeiconsIcon icon={source.icon} className="size-4" />
                  {t("facebookAutoNote")}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {t("webhookUrl")}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Input
                    readOnly
                    value={webhookIncomingUrl(integration.webhook_token)}
                    className="h-7 font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={copyWebhook}
                    aria-label={tActions("copyWebhook")}
                  >
                    <HugeiconsIcon icon={Copy01Icon} />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{t("leadsTitle")}</h2>
          <span className="text-xs text-muted-foreground">
            {t("total", { count: total })}
          </span>
        </div>

        <Tabs
          value={status === "" ? "all" : status}
          onValueChange={(value) => {
            setStatus(value === "all" ? "" : (value as LeadStatus));
            setPage(1);
            setPerPageGuess(null);
          }}
        >
          <TabsList className="max-w-full overflow-x-auto">
            {STATUS_FILTERS.map((filter) => (
              <TabsTrigger key={filter || "all"} value={filter || "all"}>
                {t(`filters.${filter || "all"}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {leadsQuery.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10" />
            ))}
          </div>
        ) : leadsQuery.isError ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
            <p className="text-sm text-muted-foreground">{tRoot("loadError")}</p>
            <Button variant="outline" size="sm" onClick={() => leadsQuery.refetch()}>
              {tRoot("retry")}
            </Button>
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.time")}</TableHead>
                  <TableHead>{t("columns.status")}</TableHead>
                  <TableHead>{t("columns.retry")}</TableHead>
                  <TableHead>{t("columns.error")}</TableHead>
                  <TableHead className="text-right">
                    {t("columns.payload")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} locale={locale} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {total > perPage && (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-muted-foreground">
              {t("pageInfo", { page, pages: totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || leadsQuery.isFetching}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              {t("prev")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || leadsQuery.isFetching}
              onClick={() => setPage((value) => value + 1)}
            >
              {t("next")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
