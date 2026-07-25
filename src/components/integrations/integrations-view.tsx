"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  PauseIcon,
  PlayIcon,
  PlugSocketIcon,
  PlusSignIcon,
  RefreshIcon,
  Search01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import type { Integration, IntegrationAction } from "@/lib/api/integrations";
import {
  useBulkIntegrationAction,
  useFolders,
  useIntegrations,
} from "@/hooks/use-integrations";
import { FolderBar } from "@/components/integrations/folder-bar";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

function CardSkeleton() {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex flex-row items-start gap-2 px-4">
        <Skeleton className="mt-0.5 size-4 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4">
        <Skeleton className="h-4 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

function MassActionBar({
  count,
  pending,
  onAction,
  onClear,
}: {
  count: number;
  pending: boolean;
  onAction: (action: IntegrationAction) => void;
  onClear: () => void;
}) {
  const t = useTranslations("integrations");

  const actions: { action: IntegrationAction; icon: typeof PauseIcon }[] = [
    { action: "pause", icon: PauseIcon },
    { action: "start", icon: PlayIcon },
    { action: "send", icon: SentIcon },
    { action: "reset", icon: RefreshIcon },
  ];

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-2 rounded-lg border bg-popover p-2 shadow-lg">
      <span className="px-2 text-xs font-medium">
        {t("selection.selected", { count })}
      </span>
      {actions.map(({ action, icon }) => (
        <Button
          key={action}
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => onAction(action)}
        >
          <HugeiconsIcon icon={icon} />
          {t(`actions.${action}`)}
        </Button>
      ))}
      <Button variant="ghost" size="sm" onClick={onClear}>
        <HugeiconsIcon icon={Cancel01Icon} />
        {t("selection.clear")}
      </Button>
    </div>
  );
}

export function IntegrationsView() {
  const t = useTranslations("integrations");

  const [folderId, setFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const foldersQuery = useFolders();
  const integrationsQuery = useIntegrations({
    folderId,
    search: debouncedSearch,
  });
  const bulkMutation = useBulkIntegrationAction();

  const integrations = useMemo(
    () => integrationsQuery.data ?? [],
    [integrationsQuery.data],
  );

  // Only integrations still present in the current list count as selected.
  const selectedVisible = useMemo(() => {
    const visible = new Set(integrations.map((item) => String(item.id)));
    return new Set([...selected].filter((id) => visible.has(id)));
  }, [integrations, selected]);

  function toggleSelected(integration: Integration, value: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (value) next.add(String(integration.id));
      else next.delete(String(integration.id));
      return next;
    });
  }

  function runBulk(action: IntegrationAction) {
    bulkMutation.mutate(
      { ids: [...selectedVisible], action },
      {
        onSuccess: () => {
          setSelected(new Set());
          toast.success(t("toasts.actionDone"));
        },
        onError: () => toast.error(t("toasts.error")),
      },
    );
  }

  const allSelected =
    integrations.length > 0 && selectedVisible.size === integrations.length;
  const isFiltered = folderId !== null || debouncedSearch !== "";
  const showEmptyState =
    integrationsQuery.isSuccess && integrations.length === 0 && !isFiltered;

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild>
          <Link href="/dashboard/integrations/new">
            <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
            {t("new")}
          </Link>
        </Button>
      </div>

      <FolderBar
        folders={foldersQuery.data ?? []}
        loading={foldersQuery.isLoading}
        activeId={folderId}
        onChange={(id) => {
          setFolderId(id);
          setSelected(new Set());
        }}
      />

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-8"
          />
        </div>
        {integrations.length > 0 && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(value) =>
                setSelected(
                  value === true
                    ? new Set(integrations.map((item) => String(item.id)))
                    : new Set(),
                )
              }
            />
            {t("folders.all")}
          </label>
        )}
      </div>

      {integrationsQuery.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      )}

      {integrationsQuery.isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("loadError")}</p>
          <Button
            variant="outline"
            onClick={() => integrationsQuery.refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      )}

      {showEmptyState && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HugeiconsIcon icon={PlugSocketIcon} className="size-6" />
          </div>
          <div>
            <p className="font-semibold">{t("empty.title")}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {t("empty.description")}
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/integrations/new">
              <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
              {t("empty.cta")}
            </Link>
          </Button>
        </div>
      )}

      {integrationsQuery.isSuccess &&
        integrations.length === 0 &&
        isFiltered && (
          <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
            {t("noResults")}
          </div>
        )}

      {integrations.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              selected={selectedVisible.has(String(integration.id))}
              onSelectedChange={(value) => toggleSelected(integration, value)}
            />
          ))}
        </div>
      )}

      {selectedVisible.size > 0 && (
        <MassActionBar
          count={selectedVisible.size}
          pending={bulkMutation.isPending}
          onAction={runBulk}
          onClear={() => setSelected(new Set())}
        />
      )}
    </div>
  );
}
