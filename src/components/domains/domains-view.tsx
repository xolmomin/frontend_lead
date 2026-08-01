"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Calendar,
  Loader2,
  Search,
  SearchX,
  Settings2,
  ShoppingCart,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSum } from "@/lib/money";
import { ApiError } from "@/lib/api";
import type { DomainSearchResult, OwnedDomain } from "@/lib/api/domains";
import {
  useDomainSearch,
  useDomains,
  usePurchaseDomain,
} from "@/hooks/use-domains";
import {
  YbCard,
  YbCardHeader,
  YbCardTitle,
} from "@/components/yb/card";
import { YbButton } from "@/components/yb/button";
import { YbBadge } from "@/components/yb/badge";
import { YbInput } from "@/components/yb/input";
import { YbModal } from "@/components/yb/modal";
import { YbTooltip } from "@/components/yb/tooltip";
import { YbDataTable, type YbColumn } from "@/components/yb/data-table";
import { ConfirmModal } from "@/components/dashboard/confirm-modal";

function formatSom(value: string | number | null | undefined): string {
  const formatted = formatSum(value);
  return formatted === null ? "—" : `${formatted} so'm`;
}

export function DomainsView() {
  const t = useTranslations("domains");
  const locale = useLocale();

  const domainsQuery = useDomains();
  const purchaseMutation = usePurchaseDomain();

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const searchQuery = useDomainSearch(searchTerm);
  const searching = searchTerm !== "" && searchQuery.isFetching;
  const hasSearched = searchTerm !== "" && !searchQuery.isFetching;

  const [detailsDomain, setDetailsDomain] = useState<OwnedDomain | null>(null);
  const [purchaseTarget, setPurchaseTarget] =
    useState<DomainSearchResult | null>(null);

  const domains = domainsQuery.data ?? [];
  const results = useMemo(
    () =>
      [...(searchQuery.data ?? [])].sort(
        (a, b) => Number(a.price) - Number(b.price),
      ),
    [searchQuery.data],
  );

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      date,
    );
  };

  const isExpired = (domain: OwnedDomain) =>
    domain.status === "expired" ||
    (domain.expires_at !== null && new Date(domain.expires_at) < new Date());

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = searchInput.trim().toLowerCase();
    if (!term) {
      toast.error(t("errors.emptySearch"));
      return;
    }
    setSearchTerm(term);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchInput("");
  };

  const handlePurchase = () => {
    if (!purchaseTarget) return;
    purchaseMutation.mutate(purchaseTarget.name, {
      onSuccess: () => {
        setPurchaseTarget(null);
        toast.success(t("success.purchased"));
        clearSearch();
      },
      onError: (error) => {
        setPurchaseTarget(null);
        const detail =
          error instanceof ApiError &&
          error.data &&
          typeof error.data === "object" &&
          "detail" in error.data
            ? String((error.data as { detail?: unknown }).detail ?? "")
            : "";
        toast.error(detail || t("status.error"));
      },
    });
  };

  const columns = useMemo<YbColumn<OwnedDomain>[]>(
    () => [
      {
        key: "domain",
        header: t("table.domain"),
        sortable: true,
        searchValue: (row) => row.name,
        accessor: (row) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {row.name}
            </span>
            {isExpired(row) && (
              <YbBadge variant="danger" size="sm">
                {t("status.expired")}
              </YbBadge>
            )}
          </div>
        ),
      },
      {
        key: "created_at",
        header: t("table.purchaseDate"),
        sortable: true,
        searchValue: (row) => formatDate(row.created_at),
        accessor: (row) => (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(row.created_at)}
            </span>
          </div>
        ),
      },
      {
        key: "expiration_date",
        header: t("table.expirationDate"),
        sortable: true,
        searchValue: (row) => formatDate(row.expires_at),
        accessor: (row) => {
          const expired = isExpired(row);
          return (
            <div className="flex items-center gap-2">
              <Calendar
                className={cn(
                  "w-4 h-4",
                  expired ? "text-red-500" : "text-gray-400",
                )}
              />
              <span
                className={cn(
                  "text-sm",
                  expired
                    ? "text-red-600 dark:text-red-400 font-semibold"
                    : "text-gray-600 dark:text-gray-400",
                )}
              >
                {formatDate(row.expires_at)}
              </span>
            </div>
          );
        },
      },
      {
        key: "status",
        header: t("table.status"),
        sortable: false,
        accessor: (row) =>
          isExpired(row) ? (
            <YbBadge variant="danger">{t("status.expired")}</YbBadge>
          ) : row.status === "active" ? (
            <YbBadge variant="success">{t("status.active")}</YbBadge>
          ) : row.status === "pending" ? (
            <YbBadge variant="warning">{t("status.pending")}</YbBadge>
          ) : (
            <YbBadge variant="default">{t("status.unknown")}</YbBadge>
          ),
      },
      {
        key: "actions",
        header: t("table.actions"),
        sortable: false,
        accessor: (row) => {
          const disabled = isExpired(row);
          return (
            <YbTooltip content={t("detailsTooltip")}>
              <YbButton
                variant="outline"
                size="sm"
                onClick={() => setDetailsDomain(row)}
                disabled={disabled}
                className={cn(
                  "px-2.5",
                  disabled && "opacity-50 cursor-not-allowed",
                )}
              >
                <Settings2 className="w-4 h-4" />
              </YbButton>
            </YbTooltip>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t("title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t("subtitle")}</p>
      </div>

      {/* Rules */}
      <YbCard className="border-l-4 border-l-primary-500">
        <YbCardHeader>
          <YbCardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {t("rules.title")}
          </YbCardTitle>
        </YbCardHeader>
        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
          {(["rule1", "rule2", "rule3"] as const).map((rule) => (
            <li key={rule} className="flex gap-3">
              <span className="text-primary-600 dark:text-primary-400 font-bold">
                •
              </span>
              <span>{t(`rules.${rule}`)}</span>
            </li>
          ))}
        </ul>
      </YbCard>

      {/* Search */}
      <YbCard>
        <YbCardHeader>
          <YbCardTitle>{t("searchTitle")}</YbCardTitle>
        </YbCardHeader>
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="flex-1">
            <YbInput
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={searching}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <YbButton
            type="submit"
            variant="primary"
            loading={searching}
            disabled={searching}
            leftIcon={<Search className="w-5 h-5" />}
          >
            {t(searching ? "searching" : "searchButton")}
          </YbButton>
        </form>

        {searching && (
          <div className="mt-8 py-16 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-4 border-primary-200 dark:border-primary-800 rounded-full animate-ping opacity-20" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-4 border-primary-300 dark:border-primary-700 rounded-full animate-pulse" />
              </div>
              <div className="relative w-16 h-16">
                <Loader2 className="w-16 h-16 text-primary-600 dark:text-primary-400 animate-spin" />
              </div>
            </div>
            <div className="mt-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t("searchingFrom")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                {t("searchingHint")}
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div
                  className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0s" }}
                />
                <div
                  className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}

        {!searching && hasSearched && results.length > 0 && (
          <div className="mt-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t("searchResults")} ({results.length})
              </h3>
              <YbButton variant="ghost" size="sm" onClick={clearSearch}>
                <X className="w-4 h-4 mr-1" />
                {t("clear")}
              </YbButton>
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    {[t("table.domain"), t("price"), t("status"), t("action")].map(
                      (header) => (
                        <th
                          key={header}
                          scope="col"
                          className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200"
                        >
                          {header}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                  {results.map((result) => (
                    <tr
                      key={result.name}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {result.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatSom(result.price)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {result.available ? (
                          <YbBadge variant="success">{t("available")}</YbBadge>
                        ) : (
                          <YbBadge variant="danger">{t("unavailable")}</YbBadge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {result.available ? (
                          <YbButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setPurchaseTarget(result)}
                            disabled={purchaseMutation.isPending}
                            loading={
                              purchaseMutation.isPending &&
                              purchaseTarget?.name === result.name
                            }
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            {purchaseMutation.isPending &&
                            purchaseTarget?.name === result.name
                              ? t("purchasing")
                              : t("purchase")}
                          </YbButton>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {t("purchased")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!searching && hasSearched && results.length === 0 && (
          <div className="mt-8 py-12 text-center animate-in fade-in duration-300">
            <SearchX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t("noResults")}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t("noResultsMessage", { term: searchTerm })}
            </p>
          </div>
        )}
      </YbCard>

      {/* My domains */}
      <YbCard>
        <YbCardHeader>
          <YbCardTitle>{t("myDomains")}</YbCardTitle>
        </YbCardHeader>
        {domainsQuery.isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary-600 dark:text-primary-400 mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">{t("loading")}</p>
          </div>
        ) : domains.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t("empty")}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t("emptyHint")}
            </p>
          </div>
        ) : (
          <YbDataTable
            data={domains}
            columns={columns}
            searchPlaceholder={t("searchPlaceholder")}
            defaultPageSize={25}
            emptyMessage={t("searchEmpty")}
          />
        )}
      </YbCard>

      {/* Details modal */}
      <YbModal
        isOpen={detailsDomain !== null}
        onClose={() => setDetailsDomain(null)}
        title={`${detailsDomain?.name ?? ""} - ${t("modal.title")}`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  {t("modal.domain")}:
                </span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {detailsDomain?.name}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  {t("modal.purchaseDate")}:
                </span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {detailsDomain && formatDate(detailsDomain.created_at)}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  {t("modal.expirationDate")}:
                </span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {detailsDomain && formatDate(detailsDomain.expires_at)}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  {t("modal.status")}:
                </span>
                <div className="mt-1">
                  {detailsDomain && isExpired(detailsDomain) ? (
                    <YbBadge variant="danger">{t("status.expired")}</YbBadge>
                  ) : (
                    <YbBadge variant="success">{t("status.active")}</YbBadge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <YbButton variant="outline" onClick={() => setDetailsDomain(null)}>
              {t("modal.cancel")}
            </YbButton>
          </div>
        </div>
      </YbModal>

      {/* Purchase confirm */}
      {purchaseTarget && (
        <ConfirmModal
          isOpen={purchaseTarget !== null}
          onClose={() => setPurchaseTarget(null)}
          onConfirm={handlePurchase}
          title={t("confirm.title")}
          message={t("confirm.message", {
            domain: purchaseTarget.name,
            price: formatSom(purchaseTarget.price),
          })}
          confirmText={t("confirm.confirm")}
          cancelText={t("confirm.cancel")}
          type="success"
          loading={purchaseMutation.isPending}
        />
      )}
    </div>
  );
}
