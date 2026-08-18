"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  FileText,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import type { Integration, Lead, LeadStatus } from "@/lib/api/integrations";
import { useIntegrationLeads } from "@/hooks/use-integrations";
import { cn } from "@/lib/utils";
import { YbButton } from "@/components/yb/button";
import { YbModal } from "@/components/yb/modal";
import { Tip } from "@/components/integrations/tip";
import { Pagination } from "@/components/integrations/pagination";

const PAGE_SIZE = 25;

/** Map local lead statuses onto the production history status palette. */
const STATUS_STYLE: Record<
  LeadStatus,
  { className: string; key: "new" | "success" | "processing" | "error" }
> = {
  pending: {
    className: "bg-warning-muted text-warning",
    key: "new",
  },
  delivered: {
    className: "bg-success-muted text-success",
    key: "success",
  },
  paused_hold: {
    className: "bg-info-muted text-info",
    key: "processing",
  },
  failed: {
    className: "bg-destructive-muted text-destructive",
    key: "error",
  },
};

function LeadStatusPill({ status }: { status: LeadStatus }) {
  const t = useTranslations("integrations");
  const style = STATUS_STYLE[status] ?? {
    className: "bg-muted text-foreground/80",
    key: "unknown" as const,
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        style.className,
      )}
    >
      {t(`history.status.${style.key}`)}
    </span>
  );
}

function LeadDetailModal({
  isOpen,
  onClose,
  lead,
}: {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}) {
  const t = useTranslations("integrations");
  const raw =
    lead?.raw != null
      ? JSON.stringify(lead.raw, null, 2)
      : t("history.detail.noData");
  return (
    <YbModal
      isOpen={isOpen}
      onClose={onClose}
      onBack={onClose}
      nested
      title={t("history.detail.title")}
      size="lg"
    >
      {lead && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-border bg-muted/40">
              <p className="text-xs text-muted-foreground mb-1">
                {t("history.detail.status")}
              </p>
              <LeadStatusPill status={lead.status} />
            </div>
            <div className="p-3 rounded-xl border border-border bg-muted/40">
              <p className="text-xs text-muted-foreground mb-1">
                {t("history.detail.createdAt")}
              </p>
              <p className="text-sm font-medium text-foreground">
                {new Date(lead.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" aria-hidden="true" />
              {t("history.detail.leadData")}
            </h4>
            <pre className="max-h-64 overflow-auto rounded-xl border border-border bg-muted p-3 text-xs text-foreground">
              {raw}
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle
                className="w-4 h-4 text-warning"
                aria-hidden="true"
              />
              {t("history.detail.logMessage")}
            </h4>
            <p
              className={cn(
                "rounded-xl border p-3 text-xs",
                lead.last_error
                  ? "border-destructive/40 bg-destructive-muted text-destructive"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              {lead.last_error ?? t("history.detail.noLog")}
            </p>
          </div>
        </div>
      )}
    </YbModal>
  );
}

/** Lead history modal (`FormHistoryModal` in production), on local leads API. */
export function LeadHistoryModal({
  isOpen,
  onClose,
  target,
}: {
  isOpen: boolean;
  onClose: () => void;
  target: Integration | null;
}) {
  const t = useTranslations("integrations");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Reset filters each time the modal opens for a target (render-time adjust).
  const openKey = isOpen ? String(target?.id ?? "") : null;
  const [prevOpenKey, setPrevOpenKey] = useState(openKey);
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    if (openKey !== null) {
      setPage(1);
      setErrorsOnly(false);
    }
  }

  const leadsQuery = useIntegrationLeads(target ? String(target.id) : "", {
    status: errorsOnly ? "failed" : "",
    page,
  });
  const items = leadsQuery.data?.items ?? [];
  const totalCount = leadsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const loading = leadsQuery.isLoading && isOpen && !!target;
  const refreshing = leadsQuery.isFetching && !leadsQuery.isLoading;

  const openDetail = (lead: Lead) => {
    setDetailLead(lead);
    setDetailOpen(true);
  };

  return (
    <>
      <YbModal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        title={
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl gradient-primary-diagonal flex items-center justify-center flex-shrink-0">
              <FileText
                className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:t-h4 text-foreground truncate">
                {target?.name || t("history.title")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                {t("history.subtitle")}
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-4 sm:space-y-6">
          {loading ? (
            <div className="py-8 sm:py-12 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary mb-3 sm:mb-4 animate-spin" />
              <p className="text-sm text-muted-foreground">
                {t("history.loading")}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorsOnly((current) => !current);
                    setPage(1);
                  }}
                  aria-pressed={errorsOnly}
                  className={cn(
                    "sm:ml-auto inline-flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full border transition-all",
                    errorsOnly
                      ? "bg-destructive text-white border-destructive shadow-sm"
                      : "bg-white text-muted-foreground border-border hover:border-destructive/40 hover:bg-destructive-muted",
                  )}
                >
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                  {t("history.errorsOnly")}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                <h3 className="text-sm sm:t-h4 text-foreground flex items-center gap-2">
                  <Users
                    className="w-4 h-4 sm:w-5 sm:h-5 text-primary"
                    aria-hidden="true"
                  />
                  {t("history.recentLeads")}
                  {totalCount > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      ({totalCount})
                    </span>
                  )}
                </h3>
                <Tip content={t("history.refreshTooltip")}>
                  <YbButton
                    variant="outline"
                    size="sm"
                    onClick={() => leadsQuery.refetch()}
                    disabled={refreshing}
                    className="p-2"
                    aria-label={t("history.refreshTooltip")}
                  >
                    {refreshing ? (
                      <Loader2
                        className="w-4 h-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <RefreshCw className="w-4 h-4" aria-hidden="true" />
                    )}
                  </YbButton>
                </Tip>
              </div>
              {items.length === 0 ? (
                <div className="py-8 sm:py-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-muted flex items-center justify-center">
                    <AlertTriangle
                      className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("history.noLeads")}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                          >
                            #
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                          >
                            {t("history.table.status")}
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                          >
                            {t("history.table.time")}
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-2 text-center text-xs font-medium text-muted-foreground"
                          >
                            {t("history.table.details")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {items.map((lead, index) => (
                          <tr
                            key={lead.id}
                            className="hover:bg-muted transition-colors"
                          >
                            <td className="px-3 py-2.5 text-xs sm:text-sm text-foreground/80">
                              {(page - 1) * PAGE_SIZE + index + 1}
                            </td>
                            <td className="px-3 py-2.5">
                              <LeadStatusPill status={lead.status} />
                            </td>
                            <td className="px-3 py-2.5 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(lead.created_at).toLocaleString(
                                undefined,
                                {
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Tip content={t("history.detailTooltip")}>
                                <YbButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDetail(lead)}
                                  className="p-1.5 text-primary hover:bg-primary/10"
                                  aria-label={t("history.detailTooltip")}
                                >
                                  <FileText
                                    className="w-4 h-4"
                                    aria-hidden="true"
                                  />
                                </YbButton>
                              </Tip>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    page={page}
                    pageSize={PAGE_SIZE}
                    totalCount={totalCount}
                    totalPages={totalPages}
                    onPageChange={(next) => {
                      if (next >= 1 && next <= totalPages) setPage(next);
                    }}
                    onPageSizeChange={() => undefined}
                    pageSizeOptions={[PAGE_SIZE]}
                    className="pt-2"
                  />
                </>
              )}
            </>
          )}
        </div>
      </YbModal>
      <LeadDetailModal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        lead={detailLead}
      />
    </>
  );
}
