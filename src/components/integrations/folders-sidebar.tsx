"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowDownAZ,
  ChevronLeft,
  ChevronRight,
  Clock,
  Folder as FolderIcon,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { Folder } from "@/lib/api/integrations";
import { cn } from "@/lib/utils";
import { YbButton } from "@/components/yb/button";
import { YbCard, YbCardHeader, YbCardTitle } from "@/components/yb/card";
import { YbSpinner } from "@/components/yb/spinner";
import { Tip } from "@/components/integrations/tip";

const SORT_STORAGE_KEY = "folders:sort-mode";
const SEARCH_THRESHOLD = 8;

type SortMode = "alpha" | "created";

function initialSortMode(): SortMode {
  if (typeof window === "undefined") return "created";
  try {
    return window.localStorage.getItem(SORT_STORAGE_KEY) === "alpha"
      ? "alpha"
      : "created";
  } catch {
    return "created";
  }
}

function CountBadge({ count, selected }: { count: number; selected: boolean }) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 text-xs font-medium rounded-full min-w-[1.5rem] text-center flex-shrink-0 tabular-nums",
        selected
          ? "bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-200"
          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
      )}
    >
      {count}
    </span>
  );
}

function AllFoldersItem({
  selected,
  count,
  onSelect,
  collapsed,
}: {
  selected: boolean;
  count: number;
  onSelect: () => void;
  collapsed: boolean;
}) {
  const t = useTranslations("integrations");
  const allLabel = t("folders.all");
  const fullLabel = `${allLabel} (${count})`;
  const itemClass = cn(
    "w-full flex items-center rounded-lg text-sm transition-colors border-l-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
    selected
      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium border-primary-500"
      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent",
  );

  if (collapsed) {
    return (
      <Tip content={fullLabel} position="right" className="w-full">
        <div role="listitem" className="w-full">
          <button
            type="button"
            onClick={onSelect}
            aria-label={fullLabel}
            aria-current={selected ? "page" : undefined}
            className={cn(itemClass, "justify-center px-2 py-2.5")}
          >
            <FolderIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </Tip>
    );
  }
  return (
    <div role="listitem">
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "page" : undefined}
        className={cn(itemClass, "justify-between gap-2 px-3 py-2.5")}
      >
        <span className="flex items-center gap-2 min-w-0">
          <FolderIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{allLabel}</span>
        </span>
        <CountBadge count={count} selected={selected} />
      </button>
    </div>
  );
}

function FolderItem({
  folder,
  count,
  selected,
  collapsed,
  onSelect,
  onEdit,
  onDelete,
}: {
  folder: Folder;
  count: number;
  selected: boolean;
  collapsed: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("integrations");
  const itemClass = cn(
    "rounded-lg text-sm transition-colors border-l-4",
    selected
      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-primary-500"
      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent",
  );

  if (collapsed) {
    return (
      <Tip content={`${folder.name} (${count})`} position="right" className="w-full">
        <div
          role="listitem"
          className={cn(itemClass, "flex w-full items-center justify-center px-2 py-2.5")}
        >
          <button
            type="button"
            onClick={onSelect}
            aria-label={`${folder.name} (${count})`}
            aria-current={selected ? "page" : undefined}
            className="flex items-center justify-center w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded"
          >
            <FolderIcon className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </Tip>
    );
  }
  return (
    <div
      role="listitem"
      className={cn(
        itemClass,
        "group flex items-center justify-between gap-2 px-3 py-2.5 animate-in fade-in slide-in-from-left-2 duration-200",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "page" : undefined}
        className="flex-1 flex items-center gap-2 text-left min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded -mx-1 px-1"
      >
        <FolderIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span className={cn("truncate", selected && "font-medium")}>
          {folder.name}
        </span>
      </button>
      <CountBadge count={count} selected={selected} />
      <div className="flex items-center gap-0.5 flex-shrink-0 transition-opacity opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
        <Tip content={t("actions.edit")}>
          <button
            type="button"
            aria-label={`${t("actions.edit")}: ${folder.name}`}
            onClick={onEdit}
            className="p-1 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
          >
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </Tip>
        <Tip content={t("actions.delete")}>
          <button
            type="button"
            aria-label={`${t("actions.delete")}: ${folder.name}`}
            onClick={onDelete}
            className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </Tip>
      </div>
    </div>
  );
}

function EmptyFolders({
  onAddFolder,
  collapsed,
}: {
  onAddFolder: () => void;
  collapsed: boolean;
}) {
  const t = useTranslations("integrations");
  if (collapsed) {
    return (
      <div className="p-2 flex justify-center">
        <Tip content={t("folders.emptyCTA")} position="right">
          <YbButton
            variant="ghost"
            size="sm"
            onClick={onAddFolder}
            aria-label={t("folders.emptyCTA")}
            className="px-2"
          >
            <Plus
              className="w-5 h-5 text-primary-500 dark:text-primary-400"
              aria-hidden="true"
            />
          </YbButton>
        </Tip>
      </div>
    );
  }
  return (
    <div className="px-4 py-8 text-center space-y-4">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
        <Plus
          className="w-7 h-7 text-primary-500 dark:text-primary-400"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t("folders.emptyTitle")}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          {t("folders.emptyDescription")}
        </p>
      </div>
      <YbButton
        variant="primary"
        size="sm"
        onClick={onAddFolder}
        leftIcon={<Plus className="w-4 h-4" />}
        className="w-full"
      >
        {t("folders.emptyCTA")}
      </YbButton>
    </div>
  );
}

/** Desktop folders sidebar (`ut` in the prod chunk). */
export function FoldersSidebar({
  folders,
  folderCounts,
  selectedFolder,
  loading,
  collapsed = false,
  totalCount,
  onSelectFolder,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
  onToggleCollapse,
}: {
  folders: Folder[];
  folderCounts: Map<string, number>;
  selectedFolder: string | null;
  loading: boolean;
  collapsed?: boolean;
  totalCount: number;
  onSelectFolder: (id: string | null) => void;
  onAddFolder: () => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onToggleCollapse?: () => void;
}) {
  const t = useTranslations("integrations");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>(initialSortMode);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(SORT_STORAGE_KEY, sortMode);
    } catch {
      // localStorage may be unavailable
    }
  }, [sortMode]);

  const visibleFolders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matched = query
      ? folders.filter((folder) => folder.name.toLowerCase().includes(query))
      : folders;
    return sortMode === "alpha"
      ? [...matched].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        )
      : matched;
  }, [folders, search, sortMode]);

  const isEmpty = folders.length === 0;
  const noSearchResults = !isEmpty && visibleFolders.length === 0;
  const showSearch = !collapsed && folders.length > SEARCH_THRESHOLD;
  const allLabel = t("folders.all");
  const allMatchesSearch =
    !search.trim() ||
    allLabel.toLowerCase().includes(search.trim().toLowerCase());

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key !== "n" && event.key !== "N") ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      onAddFolder();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onAddFolder]);

  const clearSearch = useCallback(() => {
    setSearch("");
    searchRef.current?.focus();
  }, []);

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:flex-col flex-shrink-0 h-full animate-in fade-in slide-in-from-left-4 duration-300 transition-[width]",
        collapsed ? "w-16" : "w-64",
      )}
      aria-label={t("folders.sidebarTitle")}
    >
      <YbCard className="flex flex-col h-full overflow-hidden p-0">
        <YbCardHeader
          className={cn(
            "flex-shrink-0 mb-0 px-4 py-3 border-b border-gray-200 dark:border-slate-700",
            collapsed && "px-2 py-2",
          )}
        >
          <div className="flex items-center justify-between">
            {!collapsed && (
              <YbCardTitle className="flex items-center gap-2 text-base">
                <FolderIcon className="w-5 h-5" aria-hidden="true" />
                {t("folders.sidebarTitle")}
              </YbCardTitle>
            )}
            <div className={cn("flex items-center gap-1", collapsed && "flex-col w-full")}>
              {!collapsed && !isEmpty && (
                <Tip
                  content={t(
                    sortMode === "alpha"
                      ? "folders.sortCreated"
                      : "folders.sortAlpha",
                  )}
                >
                  <YbButton
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setSortMode(sortMode === "alpha" ? "created" : "alpha")
                    }
                    className="px-2"
                    aria-label={t("folders.sortLabel")}
                    aria-pressed={sortMode === "alpha"}
                  >
                    {sortMode === "alpha" ? (
                      <ArrowDownAZ className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Clock className="w-4 h-4" aria-hidden="true" />
                    )}
                  </YbButton>
                </Tip>
              )}
              <Tip
                content={t("folders.addHotkey")}
                position={collapsed ? "right" : "top"}
              >
                <YbButton
                  variant="ghost"
                  size="sm"
                  onClick={onAddFolder}
                  className="px-2"
                  aria-label={t("folders.add")}
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </YbButton>
              </Tip>
              {onToggleCollapse && (
                <Tip
                  content={t(collapsed ? "folders.expand" : "folders.collapse")}
                  position={collapsed ? "right" : "top"}
                >
                  <YbButton
                    variant="ghost"
                    size="sm"
                    onClick={onToggleCollapse}
                    className="px-2"
                    aria-label={t(
                      collapsed ? "folders.expand" : "folders.collapse",
                    )}
                  >
                    {collapsed ? (
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    )}
                  </YbButton>
                </Tip>
              )}
            </div>
          </div>
        </YbCardHeader>
        <div className="flex-1 min-h-0 p-0 flex flex-col">
          {loading ? (
            <div
              className="flex-1 flex items-center justify-center py-8"
              role="status"
              aria-live="polite"
            >
              <YbSpinner size="lg" />
              <span className="sr-only">{t("loading")}</span>
            </div>
          ) : isEmpty ? (
            <div className="flex-1 overflow-y-auto">
              <EmptyFolders onAddFolder={onAddFolder} collapsed={collapsed} />
            </div>
          ) : (
            <div
              className={cn(
                "flex-1 min-h-0 flex flex-col",
                collapsed ? "p-1" : "p-2",
              )}
            >
              {showSearch && (
                <div className="flex-shrink-0 relative mb-2 px-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    ref={searchRef}
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("folders.sidebarSearchPlaceholder")}
                    aria-label={t("folders.sidebarSearchPlaceholder")}
                    className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label={t("modal.close")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                    >
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
              <div
                role="list"
                aria-label={t("folders.sidebarTitle")}
                className="flex-1 min-h-0 overflow-y-auto space-y-1 [scrollbar-gutter:stable]"
              >
                {allMatchesSearch && (
                  <AllFoldersItem
                    selected={selectedFolder === null}
                    count={totalCount}
                    onSelect={() => onSelectFolder(null)}
                    collapsed={collapsed}
                  />
                )}
                {noSearchResults && (
                  <p
                    className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400"
                    role="status"
                    aria-live="polite"
                  >
                    {t("folders.searchNoResults")}
                  </p>
                )}
                {visibleFolders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    count={folderCounts.get(String(folder.id)) ?? 0}
                    selected={selectedFolder === String(folder.id)}
                    collapsed={collapsed}
                    onSelect={() => onSelectFolder(String(folder.id))}
                    onEdit={() => onEditFolder(folder)}
                    onDelete={() => onDeleteFolder(folder)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </YbCard>
    </aside>
  );
}
