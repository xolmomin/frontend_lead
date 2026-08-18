"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_PAGE_SIZES = [10, 25, 50];

/** Port of the production shared pagination (progress bar + size pills + pager). */
export const Pagination = memo(function Pagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  className,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}) {
  const t = useTranslations("common.pagination");
  if (totalCount === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const progress = totalPages > 0 ? (page / totalPages) * 100 : 100;

  const pages = (): (number | "...")[] => {
    const list: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let index = 1; index <= totalPages; index++) list.push(index);
    } else {
      list.push(1);
      if (page > 3) list.push("...");
      for (
        let index = Math.max(2, page - 1);
        index <= Math.min(totalPages - 1, page + 1);
        index++
      ) {
        list.push(index);
      }
      if (page < totalPages - 2) list.push("...");
      list.push(totalPages);
    }
    return list;
  };

  const isFirst = page === 1;
  const isLast = page === totalPages;
  const navButton = (disabled: boolean) =>
    cn(
      "p-1.5 rounded-lg transition-all duration-200 min-w-[34px] min-h-[34px] flex items-center justify-center",
      disabled
        ? "opacity-30 cursor-not-allowed"
        : "hover:bg-muted active:scale-95",
    );

  return (
    <div className={cn("space-y-3", className)}>
      {totalPages > 1 && (
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            {pageSizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => size !== pageSize && onPageSizeChange(size)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200 min-h-[30px]",
                  size === pageSize
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={size === pageSize}
              >
                {size}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            <span className="font-medium text-foreground/80">
              {from}–{to}
            </span>{" "}
            / {totalCount.toLocaleString()}
          </span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onPageChange(1)}
              disabled={isFirst}
              className={navButton(isFirst)}
              aria-label={t("goToPage", { page: 1 })}
            >
              <ChevronsLeft
                className="w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={isFirst}
              className={navButton(isFirst)}
              aria-label={t("previous")}
            >
              <ChevronLeft
                className="w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
            <div className="flex items-center gap-0.5 mx-1">
              {pages().map((item, index) =>
                item === "..." ? (
                  <span
                    key={`dots-${index}`}
                    className="w-8 text-center text-muted-foreground text-xs"
                  >
                    ···
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onPageChange(item)}
                    className={cn(
                      "min-w-[34px] min-h-[34px] rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center",
                      item === page
                        ? "bg-primary text-white shadow-sm shadow-primary-600/30 scale-105"
                        : "text-muted-foreground hover:bg-muted active:scale-95",
                    )}
                    aria-label={t("goToPage", { page: item })}
                    aria-current={item === page ? "page" : undefined}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={isLast}
              className={navButton(isLast)}
              aria-label={t("next")}
            >
              <ChevronRight
                className="w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              disabled={isLast}
              className={navButton(isLast)}
              aria-label={t("goToPage", { page: totalPages })}
            >
              <ChevronsRight
                className="w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
