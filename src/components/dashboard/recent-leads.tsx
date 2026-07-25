"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeadStatusBadge } from "@/components/integrations/meta";
import { formatDateTime, formatRelativeTime } from "@/lib/relative-time";
import { useRecentLeads } from "@/hooks/use-stats";
import type { RecentLead } from "@/lib/api/stats";

function integrationLabel(lead: RecentLead): string {
  if (lead.integration_name) return lead.integration_name;
  if (lead.integration_id != null) return `#${lead.integration_id}`;
  return "—";
}

export function RecentLeads() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const leadsQuery = useRecentLeads(10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recentLeads")}</CardTitle>
      </CardHeader>
      <CardContent>
        {leadsQuery.isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        )}
        {leadsQuery.isError && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
            <p className="text-sm text-muted-foreground">{t("loadError")}</p>
            <Button variant="outline" onClick={() => leadsQuery.refetch()}>
              {t("retry")}
            </Button>
          </div>
        )}
        {leadsQuery.data &&
          (leadsQuery.data.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed py-10">
              <p className="text-sm text-muted-foreground">{t("noLeads")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colTime")}</TableHead>
                    <TableHead>{t("colIntegration")}</TableHead>
                    <TableHead>{t("colStatus")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadsQuery.data.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell
                        className="whitespace-nowrap text-muted-foreground"
                        title={formatDateTime(lead.created_at, locale) ?? undefined}
                      >
                        {formatRelativeTime(lead.created_at, locale) ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-48 truncate font-medium">
                        {integrationLabel(lead)}
                      </TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
