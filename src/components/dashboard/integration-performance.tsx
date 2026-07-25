"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
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
import { useStatsByIntegration } from "@/hooks/use-stats";

export function IntegrationPerformance() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const statsQuery = useStatsByIntegration("week");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("integrationPerformance")}</CardTitle>
        <CardDescription>{t("integrationPerformanceSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        {statsQuery.isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        )}
        {statsQuery.isError && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
            <p className="text-sm text-muted-foreground">{t("loadError")}</p>
            <Button variant="outline" onClick={() => statsQuery.refetch()}>
              {t("retry")}
            </Button>
          </div>
        )}
        {statsQuery.data &&
          (statsQuery.data.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed py-10">
              <p className="text-sm text-muted-foreground">{t("noData")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colIntegration")}</TableHead>
                    <TableHead className="text-right">{t("total")}</TableHead>
                    <TableHead className="text-right">
                      {t("delivered")}
                    </TableHead>
                    <TableHead className="text-right">{t("failed")}</TableHead>
                    <TableHead className="text-right">{t("pending")}</TableHead>
                    <TableHead className="w-32">{t("deliveredRate")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsQuery.data.map((row) => {
                    const rate =
                      row.total > 0
                        ? Math.round((row.delivered / row.total) * 100)
                        : 0;
                    return (
                      <TableRow key={row.integration_id}>
                        <TableCell className="max-w-48">
                          <Link
                            href={`/dashboard/integrations/${row.integration_id}`}
                            className="block truncate font-medium hover:text-primary hover:underline"
                          >
                            {row.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.total.toLocaleString(locale)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-emerald-700 dark:text-emerald-400">
                          {row.delivered.toLocaleString(locale)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-destructive">
                          {row.failed.toLocaleString(locale)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-amber-700 dark:text-amber-400">
                          {row.pending.toLocaleString(locale)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
                              role="progressbar"
                              aria-valuenow={rate}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={t("deliveredRate")}
                            >
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {rate}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
