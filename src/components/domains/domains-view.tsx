"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Globe02Icon,
  InformationCircleIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { formatSum } from "@/lib/money";
import { formatDateTime, formatRelativeTime } from "@/lib/relative-time";
import type { DomainSearchResult, DomainStatus } from "@/lib/api/domains";
import {
  useDomainSearch,
  useDomains,
  usePurchaseDomain,
} from "@/hooks/use-domains";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const STATUS_CLASSES: Record<DomainStatus, string> = {
  active:
    "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  pending:
    "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  expired: "border-destructive/30 bg-destructive/10 text-destructive",
};

function DomainStatusBadge({ status }: { status: DomainStatus }) {
  const t = useTranslations("domains.status");
  const known = status in STATUS_CLASSES;
  return (
    <Badge
      variant="outline"
      className={cn(known ? STATUS_CLASSES[status] : undefined)}
    >
      {known ? t(status) : status}
    </Badge>
  );
}

function PurchaseDialog({
  result,
  open,
  onOpenChange,
}: {
  result: DomainSearchResult;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("domains.purchaseDialog");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const mutation = usePurchaseDomain();

  const price = formatSum(result.price);

  function handlePurchase() {
    mutation.mutate(result.name, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(t("success", { name: result.name }));
      },
      onError: (error) => {
        onOpenChange(false);
        if (error instanceof ApiError && error.status === 402) {
          toast.error(t("insufficientBalance"), {
            action: {
              label: t("topUp"),
              onClick: () => router.push("/dashboard/balance"),
            },
          });
        } else {
          toast.error(t("error"));
        }
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("title", { name: result.name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("description", {
              price: price !== null ? `${price} ${tCommon("sum")}` : "—",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePurchase}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t("purchasing") : t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SearchSection() {
  const t = useTranslations("domains.search");
  const tCommon = useTranslations("common");

  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [purchasing, setPurchasing] = useState<DomainSearchResult | null>(null);

  const searchQuery = useDomainSearch(query);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = input.trim().toLowerCase();
    if (value) setQuery(value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t("placeholder")}
            autoComplete="off"
            className="max-w-sm"
          />
          <Button type="submit" disabled={searchQuery.isFetching}>
            <HugeiconsIcon icon={Search01Icon} className="size-4" />
            {t("button")}
          </Button>
        </form>

        {query.length === 0 ? null : searchQuery.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : searchQuery.isError ? (
          <LoadErrorState onRetry={() => searchQuery.refetch()} />
        ) : (searchQuery.data ?? []).length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("noResults")}
          </p>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {(searchQuery.data ?? []).map((result) => {
              const price = formatSum(result.price);
              return (
                <li
                  key={result.name}
                  className="flex flex-wrap items-center justify-between gap-3 p-3"
                >
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={Globe02Icon}
                      className="size-4 text-muted-foreground"
                    />
                    <span className="font-medium">{result.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm whitespace-nowrap text-muted-foreground">
                      {price !== null ? `${price} ${tCommon("sum")}` : "—"}
                    </span>
                    {result.available ? (
                      <Button size="sm" onClick={() => setPurchasing(result)}>
                        {t("buy")}
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        {t("taken")}
                      </Badge>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      {purchasing && (
        <PurchaseDialog
          result={purchasing}
          open
          onOpenChange={(open) => {
            if (!open) setPurchasing(null);
          }}
        />
      )}
    </Card>
  );
}

function OwnedDomainsSection() {
  const t = useTranslations("domains.owned");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const domainsQuery = useDomains();

  const domains = domainsQuery.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {domainsQuery.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : domainsQuery.isError ? (
          <LoadErrorState onRetry={() => domainsQuery.refetch()} />
        ) : domains.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("colName")}</TableHead>
                  <TableHead>{t("colStatus")}</TableHead>
                  <TableHead>{t("colPrice")}</TableHead>
                  <TableHead>{t("colExpires")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => {
                  const price = formatSum(domain.price);
                  return (
                    <TableRow key={domain.id}>
                      <TableCell className="font-medium">
                        {domain.name}
                      </TableCell>
                      <TableCell>
                        <DomainStatusBadge status={domain.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {price !== null
                          ? `${price} ${tCommon("sum")}`
                          : "—"}
                      </TableCell>
                      <TableCell
                        className="whitespace-nowrap"
                        title={formatDateTime(domain.expires_at, locale) ?? ""}
                      >
                        {domain.expires_at ? (
                          <span>
                            {formatRelativeTime(domain.expires_at, locale)}
                            <span className="text-muted-foreground">
                              {" "}
                              · {formatDateTime(domain.expires_at, locale)}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DomainsView() {
  const t = useTranslations("domains");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <SearchSection />
      <OwnedDomainsSection />

      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
        <HugeiconsIcon
          icon={InformationCircleIcon}
          className="mt-0.5 size-5 shrink-0 text-muted-foreground"
        />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{t("info.title")}</p>
          <p className="text-sm text-muted-foreground">{t("info.body")}</p>
        </div>
      </div>
    </div>
  );
}
