"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { YbSkeletonRows } from "./skeleton";

const SEARCH_DEBOUNCE = 300;

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// --- Pagination ---

export interface YbPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  className?: string;
}

export function YbPagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  className,
}: YbPaginationProps) {
  const t = useTranslations("common");

  const pages = (): (number | "...")[] => {
    const out: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) out.push(i);
    } else if (currentPage <= 3) {
      out.push(1);
      for (let i = 2; i <= 4; i++) out.push(i);
      out.push("...");
      out.push(totalPages);
    } else if (currentPage >= totalPages - 2) {
      out.push(1);
      out.push("...");
      for (let i = totalPages - 3; i <= totalPages; i++) out.push(i);
    } else {
      out.push(1);
      out.push("...");
      for (let i = currentPage - 1; i <= currentPage + 1; i++) out.push(i);
      out.push("...");
      out.push(totalPages);
    }
    return out;
  };

  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * (itemsPerPage || 10) + 1;
  const to = Math.min(currentPage * (itemsPerPage || 10), totalItems || 0);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4",
        className,
      )}
    >
      {totalItems && itemsPerPage ? (
        <div className="text-sm text-foreground/80">
          {t("table.showing")} <span className="font-medium">{from}</span>{" "}
          {t("table.to")} <span className="font-medium">{to}</span>{" "}
          {t("table.of")} <span className="font-medium">{totalItems}</span>{" "}
          {t("table.results")}
        </div>
      ) : null}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title={currentPage === 1 ? undefined : t("pagination.previous")}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
            "border border-input",
            currentPage === 1
              ? "text-muted-foreground/70 cursor-not-allowed"
              : "text-foreground/80 hover:bg-primary/10 hover: border-primary",
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages().map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center w-9 h-9 text-muted-foreground"
              >
                ...
              </span>
            );
          }
          const isActive = page === currentPage;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              title={isActive ? undefined : t("pagination.goToPage", { page })}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                "border text-sm font-medium",
                isActive
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary-500/30"
                  : "border-input text-foreground/80 hover:bg-primary/10 hover: border-primary",
              )}
            >
              {page}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title={currentPage === totalPages ? undefined : t("pagination.next")}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
            "border border-input",
            currentPage === totalPages
              ? "text-muted-foreground/70 cursor-not-allowed"
              : "text-foreground/80 hover:bg-primary/10 hover: border-primary",
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// --- DataTable ---

export interface YbColumn<T> {
  key: string;
  header: ReactNode;
  accessor: (row: T, index?: number) => ReactNode;
  searchable?: boolean;
  searchValue?: (row: T) => string;
  sortable?: boolean;
  /** Right-aligns the column and switches it to tabular figures. */
  numeric?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface YbDataTableProps<T> {
  data: T[];
  columns: YbColumn<T>[];
  searchPlaceholder?: string;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
  showPagination?: boolean;
  showSearch?: boolean;
  /** Row height. `compact` suits long operational lists. */
  density?: "compact" | "comfortable";
  /** Keeps the header visible while a long table scrolls. */
  stickyHeader?: boolean;
}

// Numeric columns right-align by default so digits line up down the column.
function alignOf<T>(column: YbColumn<T>): "left" | "center" | "right" {
  return column.align ?? (column.numeric ? "right" : "left");
}

// Pull a searchable string out of whatever the accessor rendered.
function textOf(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (node && typeof node === "object" && "props" in node) {
    const props = (node as { props: { children?: unknown } }).props;
    return props.children !== undefined ? textOf(props.children) : "";
  }
  return "";
}

export function YbDataTable<T extends object>({
  data,
  columns,
  searchPlaceholder,
  defaultPageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  emptyMessage,
  loading = false,
  className,
  showPagination = true,
  showSearch = true,
  density = "comfortable",
  stickyHeader = false,
}: YbDataTableProps<T>) {
  const t = useTranslations("common");
  const cellPadding = density === "compact" ? "px-4 py-2.5" : "px-6 py-4";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);
  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE);

  const searched = useMemo(() => {
    if (!debouncedSearch.trim()) return data;
    const q = debouncedSearch.toLowerCase();
    return data.filter((row) =>
      columns
        .filter((c) => c.searchable !== false)
        .some((c) => {
          let value: string;
          if (c.searchValue) {
            value = c.searchValue(row);
          } else {
            const rendered = c.accessor(row);
            if (rendered == null) return false;
            value = textOf(rendered);
          }
          return value.toLowerCase().includes(q);
        }),
    );
  }, [data, debouncedSearch, columns]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return searched;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return searched;
    return [...searched].sort((a, b) => {
      const av = column.accessor(a);
      const bv = column.accessor(b);
      if (av == null) return 1;
      if (bv == null) return -1;
      const as = textOf(av) || String(av);
      const bs = textOf(bv) || String(bv);
      const an = parseFloat(as);
      const bn = parseFloat(bs);
      if (!isNaN(an) && !isNaN(bn)) {
        return sortDir === "asc" ? an - bn : bn - an;
      }
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
  }, [searched, sortKey, sortDir, columns]);

  const paged = useMemo(() => {
    if (!showPagination) return sorted;
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize, showPagination]);

  const totalPages = Math.ceil(sorted.length / pageSize);

  const toggleSort = (key: string) => {
    if (!columns.find((c) => c.key === key)?.sortable) return;
    if (sortKey === key) {
      if (sortDir === "asc") {
        setSortDir("desc");
      } else if (sortDir === "desc") {
        setSortKey(null);
        setSortDir(null);
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const sortIcon = (key: string) =>
    sortKey === key ? (
      sortDir === "asc" ? (
        <ChevronUp className="w-4 h-4 text-primary" />
      ) : (
        <ChevronDown className="w-4 h-4 text-primary" />
      )
    ) : (
      <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
    );

  return (
    <div className={cn("space-y-4", className)}>
      {(showSearch || showPagination) && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {showSearch && (
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => changeSearch(e.target.value)}
                placeholder={searchPlaceholder || t("search")}
                aria-label={searchPlaceholder || t("search")}
                className="w-full pl-10 pr-4 py-2.5 bg-card border border-input rounded-xl focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-ring focus:border-transparent outline-none transition-all"
              />
            </div>
          )}
          {showPagination && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {t("table.perPage")}
              </span>
              <select
                aria-label={t("table.perPage")}
                value={pageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
                className="px-3 py-2 bg-card border border-input rounded-lg focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-ring focus:border-transparent outline-none transition-all text-sm"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
      <div
        className={cn(
          "overflow-x-auto rounded-xl border border-border shadow-e1",
          stickyHeader && "max-h-[70vh] overflow-y-auto",
        )}
      >
        <table className="w-full">
          <thead
            className={cn(
              "bg-muted border-b border-border",
              stickyHeader && "sticky top-0 z-10",
            )}
          >
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => toggleSort(column.key)}
                  tabIndex={column.sortable === false ? undefined : 0}
                  role="columnheader"
                  aria-sort={
                    column.sortable !== false && sortKey === column.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  onKeyDown={
                    column.sortable === false
                      ? undefined
                      : (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleSort(column.key);
                          }
                        }
                  }
                  className={cn(
                    cellPadding,
                    "text-sm font-semibold text-foreground",
                    alignOf(column) === "right"
                      ? "text-right"
                      : alignOf(column) === "center"
                        ? "text-center"
                        : "text-left",
                    column.sortable !== false &&
                      "cursor-pointer select-none transition-colors hover:bg-muted-foreground/10",
                    column.className,
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2",
                      alignOf(column) === "right" && "justify-end",
                      alignOf(column) === "center" && "justify-center",
                    )}
                  >
                    <span>{column.header}</span>
                    {column.sortable !== false && sortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-6">
                  <YbSkeletonRows rows={5} columns={columns.length} />
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-muted-foreground text-lg">
                      {emptyMessage || t("table.noData")}
                    </span>
                    {search && (
                      <button
                        onClick={() => changeSearch("")}
                        className="cursor-pointer text-sm text-primary hover:underline"
                      >
                        {t("table.clearSearch")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, index) => {
                const record = row as { id?: unknown; pk?: unknown };
                const key = String(record.id ?? record.pk ?? index);
                return (
                  <tr key={key} className="transition-colors hover:bg-muted/70">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          cellPadding,
                          "text-sm text-foreground",
                          column.numeric && "t-numeric",
                          alignOf(column) === "right"
                            ? "text-right"
                            : alignOf(column) === "center"
                              ? "text-center"
                              : "text-left",
                          column.className,
                        )}
                      >
                        {column.accessor(row, (page - 1) * pageSize + index)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {showPagination && !loading && paged.length > 0 && (
        <YbPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          itemsPerPage={pageSize}
          totalItems={sorted.length}
        />
      )}
    </div>
  );
}
