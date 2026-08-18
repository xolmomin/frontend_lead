"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Search, X } from "lucide-react";
import type { DeliveryType } from "@/lib/api/integrations";
import { cn } from "@/lib/utils";
import { YbButton } from "@/components/yb/button";
import { YbModal } from "@/components/yb/modal";

export interface PlatformOption {
  value: DeliveryType;
  label: string;
  group: string;
}

const FAVORITES_STORAGE_KEY = "integrations:favorite-platforms";

/** Local catalog of destination platforms (the backend's delivery types). */
export function usePlatformCatalog(): {
  allPlatforms: PlatformOption[];
  favoritePlatforms: string[];
  saveFavorites: (values: string[]) => void;
} {
  const t = useTranslations("integrations");
  const allPlatforms = useMemo<PlatformOption[]>(
    () => [
      { value: "telegram", label: "Telegram", group: t("groups.special") },
      { value: "sheets", label: "Google Sheets", group: t("groups.special") },
      { value: "webhook", label: "Webhook", group: t("groups.special") },
      { value: "bitrix24", label: "Bitrix24", group: t("groups.crm") },
      { value: "amocrm", label: "amoCRM", group: t("groups.crm") },
      { value: "cpa", label: "CPA", group: t("groups.cpaWithoutKey") },
    ],
    [t],
  );
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const saveFavorites = (values: string[]) => {
    setFavorites(values);
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(values),
      );
    } catch {
      // storage may be unavailable
    }
  };
  return { allPlatforms, favoritePlatforms: favorites, saveFavorites };
}

/** Platform favorites picker (`Et` in the prod chunk). */
export function PlatformFavoritesModal({
  isOpen,
  onClose,
  allPlatforms,
  favoritePlatforms,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  allPlatforms: PlatformOption[];
  favoritePlatforms: string[];
  onSave: (values: string[]) => void;
}) {
  const t = useTranslations("integrations");
  const tCommon = useTranslations("common");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Re-seed selection each time the modal opens (render-time state adjustment).
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setSelected(new Set(favoritePlatforms));
      setSearch("");
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, PlatformOption[]>();
    for (const platform of allPlatforms) {
      const list = map.get(platform.group) ?? [];
      list.push(platform);
      map.set(platform.group, list);
    }
    return Array.from(map.entries()).map(([groupName, platforms]) => ({
      groupName,
      platforms,
    }));
  }, [allPlatforms]);

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const query = search.toLowerCase().trim();
    return grouped
      .map((group) => ({
        ...group,
        platforms: group.platforms.filter(
          (platform) =>
            platform.label.toLowerCase().includes(query) ||
            platform.value.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.platforms.length > 0);
  }, [grouped, search]);

  const toggle = (value: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleGroup = (platforms: PlatformOption[]) => {
    const allChecked = platforms.every((platform) =>
      selected.has(platform.value),
    );
    setSelected((current) => {
      const next = new Set(current);
      if (allChecked)
        platforms.forEach((platform) => next.delete(platform.value));
      else platforms.forEach((platform) => next.add(platform.value));
      return next;
    });
  };

  const save = () => {
    onSave(Array.from(selected));
    onClose();
  };

  return (
    <YbModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("platforms.favorites.title")}
      size="lg"
    >
      <div className="flex flex-col max-h-[70vh]">
        <p className="text-sm text-muted-foreground mb-4">
          {t("platforms.favorites.subtitle")}
        </p>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("platforms.favorites.search")}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm",
              "border-input",
              "bg-card",
              "text-foreground",
              "placeholder:text-muted-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary",
              "outline-none transition-colors",
            )}
          />
          {search && (
            <button
              type="button"
              aria-label={tCommon("actions.reset")}
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-muted-foreground">
            {t("platforms.favorites.selected", { count: selected.size })}
          </span>
        </div>
        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {filtered.map((group) => {
            const allChecked = group.platforms.every((platform) =>
              selected.has(platform.value),
            );
            return (
              <div
                key={group.groupName}
                className="animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {group.groupName}
                  </h4>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.platforms)}
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded transition-colors",
                      allChecked
                        ? "text-primary hover:bg-primary/10"
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {t("platforms.favorites.selectAll")}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.platforms.map((platform) => {
                    const isChecked = selected.has(platform.value);
                    return (
                      <button
                        key={platform.value}
                        type="button"
                        onClick={() => toggle(platform.value)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                          isChecked
                            ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
                            : "border-border bg-card hover:bg-muted hover:border-input",
                        )}
                      >
                        <div
                          className={cn(
                            "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors",
                            isChecked
                              ? "bg-primary dark:bg-primary"
                              : "border-2 border-input",
                          )}
                        >
                          {isChecked && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium flex-1 truncate",
                            isChecked
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {platform.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {t("emptyMessage")}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <YbButton variant="outline" onClick={onClose}>
            {t("platforms.favorites.cancel")}
          </YbButton>
          <YbButton variant="primary" onClick={save}>
            {t("platforms.favorites.save")}
          </YbButton>
        </div>
      </div>
    </YbModal>
  );
}
