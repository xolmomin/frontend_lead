"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface YbSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface YbSelectGroup {
  label: string;
  options: YbSelectOption[];
}

export interface YbSelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: YbSelectOption[];
  groups?: YbSelectGroup[];
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  ariaLabel?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function YbSelect({
  value,
  onChange,
  options = [],
  groups = [],
  placeholder,
  searchPlaceholder,
  label,
  ariaLabel,
  error,
  disabled = false,
  required = false,
  className,
  emptyMessage,
}: YbSelectProps) {
  const t = useTranslations("common");
  const labelId = useId();
  const resolvedPlaceholder = placeholder ?? t("select.placeholder");
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? t("select.searchPlaceholder");
  const resolvedEmpty = emptyMessage ?? t("select.noResults");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [dropDirection, setDropDirection] = useState<"top" | "bottom">(
    "bottom",
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const closeSelect = useCallback(() => {
    setOpen(false);
    setSearch("");
    setHighlighted(0);
  }, []);

  const updateDirection = useCallback(() => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    setDropDirection(below < 300 && above > below ? "top" : "bottom");
  }, []);

  const deferredSearch = useDeferredValue(search);
  const allOptions = useMemo(
    () => [...options, ...groups.flatMap((g) => g.options)],
    [options, groups],
  );
  const filtered = useMemo(
    () =>
      deferredSearch
        ? allOptions.filter((o) =>
            o.label.toLowerCase().includes(deferredSearch.toLowerCase()),
          )
        : allOptions,
    [allOptions, deferredSearch],
  );
  const selected = allOptions.find((o) => o.value === value);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeSelect();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [closeSelect]);

  useEffect(() => {
    if (open) updateDirection();
  }, [open, updateDirection]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (open && filtered[highlighted]) {
          if (!filtered[highlighted].disabled) {
            onChange(filtered[highlighted].value);
            closeSelect();
          }
        } else {
          setOpen(true);
        }
        break;
      case "Escape":
        closeSelect();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (open) {
          setHighlighted((i) => (i < filtered.length - 1 ? i + 1 : i));
        } else {
          setOpen(true);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlighted((i) => (i > 0 ? i - 1 : i));
        break;
    }
  };

  const select = (v: string, isDisabled?: boolean) => {
    if (isDisabled) return;
    onChange(v);
    closeSelect();
  };

  const renderOption = (option: YbSelectOption, index: number) => {
    const isSelected = option.value === value;
    const isHighlighted = index === highlighted;
    const isDisabled = !!option.disabled;
    return (
      <div
        key={option.value}
        role="option"
        aria-selected={isSelected}
        aria-disabled={isDisabled}
        onClick={() => select(option.value, isDisabled)}
        onMouseEnter={() => !isDisabled && setHighlighted(index)}
        className={cn(
          "flex items-center justify-between px-3 py-2.5 transition-colors",
          isDisabled
            ? "cursor-not-allowed opacity-50"
            : [
                "cursor-pointer",
                isSelected && "bg-primary-50 dark:bg-primary-900/20",
                isHighlighted && !isSelected && "bg-gray-100 dark:bg-gray-700",
                !isSelected &&
                  !isHighlighted &&
                  "hover:bg-gray-50 dark:hover:bg-gray-800",
              ],
        )}
      >
        <span
          className={cn(
            "text-sm",
            isSelected
              ? "font-medium text-primary-700 dark:text-primary-300"
              : "text-gray-900 dark:text-gray-100",
          )}
        >
          {option.label}
        </span>
        {isSelected && (
          <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        )}
      </div>
    );
  };

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      {label && (
        <label
          id={labelId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && (open ? closeSelect() : setOpen(true))}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label && ariaLabel ? ariaLabel : undefined}
        className={cn(
          "w-full px-4 py-2.5 flex items-center justify-between",
          "border rounded-lg transition-all",
          "bg-white dark:bg-gray-800",
          "text-gray-900 dark:text-gray-100",
          "focus:outline-none focus:ring-2 focus:ring-primary-500",
          open && "ring-2 ring-primary-500",
          error && "border-red-500 focus:ring-red-500",
          !error && "border-gray-300 dark:border-gray-600",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900",
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate text-left text-sm",
            !selected && "text-gray-500 dark:text-gray-400",
          )}
        >
          {selected ? selected.label : resolvedPlaceholder}
        </span>
        <ChevronDown
          className={cn(
            "ml-2 h-5 w-5 shrink-0 text-gray-400 transition-transform",
            open && "transform rotate-180",
          )}
        />
      </button>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {open && (
        <div
          className={cn(
            "absolute z-50 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden",
            "animate-in fade-in duration-150",
            dropDirection === "bottom"
              ? "mt-2 top-full slide-in-from-top-2"
              : "mb-2 bottom-full slide-in-from-bottom-2",
          )}
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlighted(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={resolvedSearchPlaceholder}
                className="w-full pl-10 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {search && (
                <button
                  type="button"
                  aria-label={t("actions.reset")}
                  onClick={() => {
                    setSearch("");
                    setHighlighted(0);
                    searchRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <X className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto" role="listbox">
            {filtered.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {resolvedEmpty}
              </div>
            ) : (
              <div>
                {deferredSearch
                  ? filtered.map((o, i) => renderOption(o, i))
                  : groups.length > 0
                    ? groups.map((group, gi) => (
                        <div key={gi}>
                          {group.label !== "" && (
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                              {group.label}
                            </div>
                          )}
                          {group.options.map((o, oi) => {
                            const flatIndex = groups
                              .slice(0, gi)
                              .reduce((acc, g) => acc + g.options.length, oi);
                            return renderOption(o, flatIndex);
                          })}
                        </div>
                      ))
                    : filtered.map((o, i) => renderOption(o, i))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
