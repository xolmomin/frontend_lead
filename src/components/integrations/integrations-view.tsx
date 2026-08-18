"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Folder as FolderIcon,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import type {
  Folder,
  Integration,
  IntegrationAction,
} from "@/lib/api/integrations";
import {
  useBulkIntegrationAction,
  useCreateFolder,
  useDeleteFolder,
  useDeleteIntegration,
  useFolders,
  useIntegrationAction,
  useIntegrations,
  useRenameFolder,
} from "@/hooks/use-integrations";
import { cn } from "@/lib/utils";
import { YbButton } from "@/components/yb/button";
import { YbCard } from "@/components/yb/card";
import { ConfirmModal } from "@/components/dashboard/confirm-modal";
import { Tip } from "@/components/integrations/tip";
import { SearchSelect } from "@/components/integrations/search-select";
import { FoldersSidebar } from "@/components/integrations/folders-sidebar";
import { FolderModals } from "@/components/integrations/folder-modals";
import {
  IntegrationRowCard,
  IntegrationRowSkeleton,
} from "@/components/integrations/integration-row-card";
import { Pagination } from "@/components/integrations/pagination";
import {
  PlatformFavoritesModal,
  usePlatformCatalog,
} from "@/components/integrations/platform-favorites-modal";
import { PauseScheduleModal } from "@/components/integrations/pause-schedule-modal";
import { LeadHistoryModal } from "@/components/integrations/lead-history-modal";
import {
  IntegrationFormModal,
  type IntegrationPrefill,
} from "@/components/integrations/integration-form-modal";

function plural(
  t: ReturnType<typeof useTranslations<"integrations">>,
  key: string,
  count: number,
) {
  return t(`${key}_${count === 1 ? "one" : "other"}`, { count });
}

type PauseTarget =
  { type: "single"; integration: Integration } | { type: "bulk" };

export function IntegrationsView() {
  const t = useTranslations("integrations");
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Filters / pagination ---
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // --- Data ---
  const foldersQuery = useFolders();
  const folders = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data]);
  const integrationsQuery = useIntegrations({
    folderId: selectedFolder,
    search,
  });
  // Unfiltered list: folder counts + bulk-action scope (search is ignored, as
  // in production).
  const allQuery = useIntegrations({ folderId: null, search: "" });

  const integrations = useMemo(
    () => integrationsQuery.data ?? [],
    [integrationsQuery.data],
  );
  const allIntegrations = useMemo(() => allQuery.data ?? [], [allQuery.data]);
  // The selected folder's slice of the unfiltered list. Derived rather than
  // fetched: allQuery already carries folder_id on every row, and a third
  // concurrent GET /integrations for the same screen buys nothing.
  const scopeIntegrations = useMemo(
    () =>
      selectedFolder === null
        ? allIntegrations
        : allIntegrations.filter(
            (integration) =>
              String(integration.folder_id) === String(selectedFolder),
          ),
    [allIntegrations, selectedFolder],
  );

  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const integration of allIntegrations) {
      if (integration.folder_id == null) continue;
      const key = String(integration.folder_id);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [allIntegrations]);

  const totalAll = allIntegrations.length;
  const totalPaused = useMemo(
    () =>
      scopeIntegrations.reduce(
        (sum, integration) => sum + (integration.pending_leads ?? 0),
        0,
      ),
    [scopeIntegrations],
  );
  const totalNonTelegram = useMemo(
    () =>
      scopeIntegrations.filter(
        (integration) => integration.delivery_connection?.type !== "telegram",
      ).length,
    [scopeIntegrations],
  );

  const loading = integrationsQuery.isLoading || foldersQuery.isLoading;
  const totalCount = integrations.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pageItems = useMemo(
    () => integrations.slice((page - 1) * pageSize, page * pageSize),
    [integrations, page, pageSize],
  );

  // Reset to the first page when the filters change (render-time adjustment).
  const filterKey = `${selectedFolder ?? ""}|${search}|${pageSize}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  // --- Mutations ---
  const runAction = useIntegrationAction();
  const runBulk = useBulkIntegrationAction();
  const deleteIntegration = useDeleteIntegration();
  const createFolder = useCreateFolder();
  const renameFolder = useRenameFolder();
  const deleteFolder = useDeleteFolder();

  // --- Modal state ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPrefill, setAddPrefill] = useState<IntegrationPrefill | null>(null);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Integration | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [toDelete, setToDelete] = useState<Integration | null>(null);
  const [pauseTarget, setPauseTarget] = useState<PauseTarget | null>(null);
  const [pendingBulk, setPendingBulk] = useState<Exclude<
    IntegrationAction,
    "pause"
  > | null>(null);
  const [bulkLoading, setBulkLoading] = useState<IntegrationAction | null>(
    null,
  );
  const [showFavorites, setShowFavorites] = useState(false);

  // Folder modal state
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [showEditFolder, setShowEditFolder] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [showDeleteFolder, setShowDeleteFolder] = useState(false);

  const { allPlatforms, favoritePlatforms, saveFavorites } =
    usePlatformCatalog();

  // Deep links from the (restyled) subpages: ?new=1 opens the add modal,
  // ?edit=<id> opens the edit modal. State is consumed during render; the
  // URL cleanup runs in an effect (external sync only).
  const wantsNew = searchParams.get("new");
  const wantsEdit = searchParams.get("edit");
  const deepLinkKey = wantsNew
    ? "new"
    : wantsEdit && allQuery.isSuccess
      ? `edit:${wantsEdit}`
      : null;
  const [consumedDeepLink, setConsumedDeepLink] = useState<string | null>(null);
  if (deepLinkKey !== null && consumedDeepLink !== deepLinkKey) {
    setConsumedDeepLink(deepLinkKey);
    if (wantsNew) {
      setAddPrefill(null);
      setShowAddModal(true);
    } else if (wantsEdit) {
      const target = allIntegrations.find(
        (integration) => String(integration.id) === wantsEdit,
      );
      if (target) setEditing(target);
    }
  }
  useEffect(() => {
    if (consumedDeepLink !== null) {
      router.replace("/dashboard/integrations", { scroll: false });
    }
  }, [consumedDeepLink, router]);

  // --- Handlers ---

  const applySearch = useCallback(() => {
    setSearch(searchInput.trim());
  }, [searchInput]);

  const openAddModal = useCallback(() => {
    setAddPrefill(null);
    setShowAddModal(true);
  }, []);

  const handlePauseClick = useCallback(
    (integration: Integration) => {
      if (integration.status === "paused") {
        runAction.mutate(
          { id: integration.id, action: "start" },
          { onSuccess: () => toast.success(t("toast.resumedSuccess")) },
        );
      } else {
        setPauseTarget({ type: "single", integration });
      }
    },
    [runAction, t],
  );

  const handlePauseConfirm = useCallback(() => {
    if (!pauseTarget) return;
    if (pauseTarget.type === "bulk") {
      setBulkLoading("pause");
      runBulk.mutate(
        {
          ids: scopeIntegrations.map((integration) => integration.id),
          action: "pause",
        },
        {
          onSuccess: () => toast.success(t("toast.bulk.pauseSuccess")),
          onSettled: () => {
            setBulkLoading(null);
            setPauseTarget(null);
          },
        },
      );
    } else {
      runAction.mutate(
        { id: pauseTarget.integration.id, action: "pause" },
        {
          onSuccess: () => toast.success(t("toast.pausedSuccess")),
          onSettled: () => setPauseTarget(null),
        },
      );
    }
  }, [pauseTarget, runAction, runBulk, scopeIntegrations, t]);

  const handleSendPaused = useCallback(
    (integration: Integration) => {
      runAction.mutate(
        { id: integration.id, action: "send" },
        { onSuccess: () => toast.success(t("toast.sendPausedSuccess")) },
      );
    },
    [runAction, t],
  );

  const handleDuplicate = useCallback((integration: Integration) => {
    setAddPrefill({
      name: integration.name,
      folderId:
        integration.folder_id != null ? String(integration.folder_id) : "all",
      deliveryConnectionId: integration.delivery_connection
        ? String(integration.delivery_connection.id)
        : undefined,
    });
    setShowAddModal(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!toDelete) return;
    deleteIntegration.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success(t("toast.deleteSuccess"));
        setToDelete(null);
      },
    });
  }, [toDelete, deleteIntegration, t]);

  const handleBulkConfirm = useCallback(() => {
    if (!pendingBulk) return;
    const action = pendingBulk;
    setBulkLoading(action);
    setPendingBulk(null);
    runBulk.mutate(
      {
        ids: scopeIntegrations.map((integration) => integration.id),
        action,
      },
      {
        onSuccess: () => toast.success(t(`toast.bulk.${action}Success`)),
        onSettled: () => setBulkLoading(null),
      },
    );
  }, [pendingBulk, runBulk, scopeIntegrations, t]);

  // Folder handlers
  const handleSubmitAddFolder = useCallback(
    (name: string) => {
      createFolder.mutate(name, {
        onSuccess: () => {
          toast.success(t("toast.folderCreateSuccess"));
          setShowAddFolder(false);
        },
      });
    },
    [createFolder, t],
  );

  const handleSubmitEditFolder = useCallback(
    (name: string) => {
      if (!editingFolder) return;
      renameFolder.mutate(
        { id: editingFolder.id, name },
        {
          onSuccess: () => {
            toast.success(t("toast.folderUpdateSuccess"));
            setShowEditFolder(false);
            setEditingFolder(null);
          },
        },
      );
    },
    [editingFolder, renameFolder, t],
  );

  const handleConfirmDeleteFolder = useCallback(() => {
    if (!folderToDelete) return;
    deleteFolder.mutate(folderToDelete.id, {
      onSuccess: () => {
        toast.success(t("toast.folderDeleteSuccess"));
        setShowDeleteFolder(false);
        if (selectedFolder === String(folderToDelete.id)) {
          setSelectedFolder(null);
        }
        setFolderToDelete(null);
      },
    });
  }, [folderToDelete, deleteFolder, selectedFolder, t]);

  // --- Derived UI helpers ---

  const selectedFolderData = selectedFolder
    ? folders.find((folder) => String(folder.id) === selectedFolder)
    : undefined;
  const selectedFolderCount = selectedFolder
    ? (folderCounts.get(selectedFolder) ?? 0)
    : totalAll;

  const scopeNote = useMemo(() => {
    const base = selectedFolderData
      ? t("bulkActions.scopeFolderNote", {
          folder: selectedFolderData.name,
          count: selectedFolderCount,
        })
      : t("bulkActions.scopeAllNote", { count: totalAll });
    return search.trim()
      ? `${base}\n${t("bulkActions.searchIgnoredNote")}`
      : base;
  }, [selectedFolderData, selectedFolderCount, totalAll, search, t]);

  const bulkButton = (
    action: Exclude<IntegrationAction, "pause">,
    tooltipKey: string,
    labelKey: string,
    colorClass: string,
    icon: React.ReactNode,
  ) => (
    <Tip content={t(tooltipKey)}>
      <YbButton
        variant="outline"
        size="sm"
        onClick={() => setPendingBulk(action)}
        disabled={bulkLoading !== null}
        className={cn(
          "w-full sm:w-auto h-9 text-xs sm:text-sm whitespace-nowrap",
          colorClass,
        )}
        leftIcon={icon}
        loading={bulkLoading === action}
      >
        {t(labelKey)}
      </YbButton>
    </Tip>
  );

  const emptyState = totalCount === 0 && !search;

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-4rem)] gap-4 lg:gap-6 p-4 lg:p-0">
      <FoldersSidebar
        folders={folders}
        folderCounts={folderCounts}
        selectedFolder={selectedFolder}
        loading={foldersQuery.isLoading}
        collapsed={sidebarCollapsed}
        totalCount={totalAll}
        onSelectFolder={setSelectedFolder}
        onAddFolder={() => setShowAddFolder(true)}
        onEditFolder={(folder) => {
          setEditingFolder(folder);
          setShowEditFolder(true);
        }}
        onDeleteFolder={(folder) => {
          setFolderToDelete(folder);
          setShowDeleteFolder(true);
        }}
        onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
      />

      <div className="flex-1 space-y-4 lg:space-y-6 overflow-auto">
        {/* Mobile folder picker */}
        <div className="lg:hidden">
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <SearchSelect
                label={t("folders.select")}
                value={selectedFolder ?? "all"}
                onChange={(value) =>
                  setSelectedFolder(value === "all" ? null : value)
                }
                options={[
                  {
                    value: "all",
                    label: `${t("folders.all")} (${totalAll})`,
                  },
                  ...folders.map((folder) => ({
                    value: String(folder.id),
                    label: folder.name,
                  })),
                ]}
                placeholder={t("folders.selectPlaceholder")}
                searchPlaceholder={t("folders.selectSearch")}
              />
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {selectedFolderData && (
                <>
                  <Tip content={t("folders.edit")}>
                    <YbButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingFolder(selectedFolderData);
                        setShowEditFolder(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </YbButton>
                  </Tip>
                  <Tip content={t("folders.delete")}>
                    <YbButton
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setFolderToDelete(selectedFolderData);
                        setShowDeleteFolder(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </YbButton>
                  </Tip>
                </>
              )}
              <Tip content={t("folders.add")}>
                <YbButton
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddFolder(true)}
                >
                  <Plus className="w-4 h-4" />
                </YbButton>
              </Tip>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="t-h2 text-foreground mb-2">
              {selectedFolderData ? selectedFolderData.name : t("title")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {selectedFolderData
                ? plural(t, "folders.scenarioCount", selectedFolderCount)
                : t("subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Tip content={t("platforms.favorites.button")}>
              <YbButton
                variant="outline"
                size="sm"
                onClick={() => setShowFavorites(true)}
                className="px-2.5"
              >
                <Star className="w-4 h-4" aria-hidden="true" />
              </YbButton>
            </Tip>
            <YbButton
              variant="primary"
              onClick={openAddModal}
              leftIcon={<Plus className="w-5 h-5" />}
              className="flex-1 sm:flex-none"
            >
              <span className="sm:inline">{t("addNew")}</span>
            </YbButton>
          </div>
        </div>

        {/* Bulk actions */}
        {integrations.length > 0 && totalNonTelegram > 0 && (
          <div className="space-y-2 rounded-lg border border-border bg-muted p-2">
            <div className="flex items-center gap-2 px-1">
              <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">
                {t("bulkActions.label")}:
              </span>
              {totalPaused > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-info">
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  {plural(t, "bulkActions.pausedTotal", totalPaused)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <Tip content={t("bulkActions.pauseAllTooltip")}>
                <YbButton
                  variant="outline"
                  size="sm"
                  onClick={() => setPauseTarget({ type: "bulk" })}
                  disabled={bulkLoading !== null}
                  className="w-full sm:w-auto h-9 text-xs sm:text-sm whitespace-nowrap border-warning/60 text-warning hover:bg-warning-muted"
                  leftIcon={<Pause className="w-4 h-4" />}
                >
                  {t("bulkActions.pause")}
                </YbButton>
              </Tip>
              {bulkButton(
                "start",
                "bulkActions.startAllTooltip",
                "bulkActions.start",
                "border-success text-success hover:bg-success-muted dark:text-success",
                <Play className="w-4 h-4" />,
              )}
              {bulkButton(
                "send",
                "bulkActions.sendAllTooltip",
                "bulkActions.send",
                "border-info/60 text-info hover:bg-info-muted",
                <Send className="w-4 h-4" />,
              )}
              {bulkButton(
                "reset",
                "bulkActions.resetTooltip",
                "bulkActions.reset",
                "border-destructive text-destructive hover:bg-destructive-muted dark:text-destructive",
                <Trash2 className="w-4 h-4" />,
              )}
            </div>
          </div>
        )}

        {/* List */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <YbCard>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <IntegrationRowSkeleton key={index} />
                ))}
              </div>
            ) : emptyState ? (
              <div className="py-16 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 flex items-center justify-center">
                  <FolderIcon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="t-h4 text-foreground mb-2">{t("emptyTitle")}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {t("emptyDescription")}
                </p>
                <YbButton
                  variant="primary"
                  onClick={openAddModal}
                  leftIcon={<Plus className="w-5 h-5" />}
                  className="mx-auto"
                >
                  {t("addFirstIntegration")}
                </YbButton>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          applySearch();
                        }
                      }}
                      placeholder={t("searchPlaceholder")}
                      // Placeholder text is not an accessible name.
                      aria-label={t("searchPlaceholder")}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring dark:focus:border-primary-400 outline-none transition-colors"
                    />
                  </div>
                  <YbButton
                    variant="outline"
                    onClick={applySearch}
                    className="px-3 shrink-0"
                  >
                    <Search className="w-4 h-4" />
                  </YbButton>
                </div>
                {integrations.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t("emptyMessage")}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pageItems.map((integration) => (
                      <IntegrationRowCard
                        key={integration.id}
                        integration={integration}
                        onPauseToggle={handlePauseClick}
                        onSendPaused={handleSendPaused}
                        onEdit={setEditing}
                        onDuplicate={handleDuplicate}
                        onHistory={(target) => {
                          setHistoryTarget(target);
                          setShowHistory(true);
                        }}
                        onDelete={setToDelete}
                      />
                    ))}
                  </div>
                )}
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  totalCount={totalCount}
                  totalPages={totalPages}
                  onPageChange={(next) => {
                    if (next >= 1 && next <= totalPages) setPage(next);
                  }}
                  onPageSizeChange={setPageSize}
                  className="mt-4 pt-3 border-t border-border"
                />
              </>
            )}
          </YbCard>
        </div>
      </div>

      {/* Folder modals */}
      <FolderModals
        showAddModal={showAddFolder}
        onCloseAddModal={() => setShowAddFolder(false)}
        onSubmitAdd={handleSubmitAddFolder}
        submittingAdd={createFolder.isPending}
        showEditModal={showEditFolder}
        onCloseEditModal={() => {
          setShowEditFolder(false);
          setEditingFolder(null);
        }}
        onSubmitEdit={handleSubmitEditFolder}
        editingFolder={editingFolder}
        submittingEdit={renameFolder.isPending}
        showDeleteDialog={showDeleteFolder}
        onCloseDeleteDialog={() => {
          setShowDeleteFolder(false);
          setFolderToDelete(null);
        }}
        onConfirmDelete={handleConfirmDeleteFolder}
        folderToDelete={folderToDelete}
        deleting={deleteFolder.isPending}
      />

      {/* Delete integration */}
      {toDelete && (
        <ConfirmModal
          isOpen={toDelete !== null}
          onClose={() => setToDelete(null)}
          onConfirm={handleConfirmDelete}
          title={t("modal.deleteTitle")}
          message={t("modal.deleteMessage", { name: toDelete.name })}
          confirmText={t("modal.confirmDelete")}
          cancelText={t("modal.cancel")}
          type="danger"
          loading={deleteIntegration.isPending}
        />
      )}

      {/* Bulk start/send/reset confirm */}
      <ConfirmModal
        isOpen={pendingBulk !== null}
        onClose={() => setPendingBulk(null)}
        onConfirm={handleBulkConfirm}
        title={t(
          pendingBulk === "start"
            ? "bulkActions.startAllTooltip"
            : pendingBulk === "send"
              ? "bulkActions.sendAllTooltip"
              : "bulkActions.resetTooltip",
        )}
        message={`${t(
          pendingBulk === "start"
            ? "toast.bulk.startConfirm"
            : pendingBulk === "send"
              ? "toast.bulk.sendConfirm"
              : "toast.bulk.resetConfirm",
        )}\n\n${scopeNote}`}
        confirmText={t(
          pendingBulk === "reset"
            ? "bulkActions.reset"
            : pendingBulk === "send"
              ? "bulkActions.send"
              : "bulkActions.start",
        )}
        type={pendingBulk === "reset" ? "danger" : "warning"}
        loading={bulkLoading !== null}
      />

      {/* Pause (schedule shell) modal */}
      <PauseScheduleModal
        isOpen={pauseTarget !== null}
        onClose={() => setPauseTarget(null)}
        onConfirm={handlePauseConfirm}
        loading={runAction.isPending || bulkLoading === "pause"}
        isBulk={pauseTarget?.type === "bulk"}
        scenarioName={
          pauseTarget?.type === "single"
            ? pauseTarget.integration.name
            : undefined
        }
        scopeNote={scopeNote}
      />

      {/* Add / edit integration */}
      <IntegrationFormModal
        isOpen={showAddModal}
        mode="create"
        prefill={addPrefill}
        defaultFolderId={selectedFolder}
        onClose={() => {
          setShowAddModal(false);
          setAddPrefill(null);
        }}
      />
      <IntegrationFormModal
        isOpen={editing !== null}
        mode="edit"
        integration={editing}
        onClose={() => setEditing(null)}
      />

      {/* Lead history */}
      <LeadHistoryModal
        isOpen={showHistory}
        onClose={() => {
          setShowHistory(false);
          setHistoryTarget(null);
        }}
        target={historyTarget}
      />

      {/* Platform favorites */}
      <PlatformFavoritesModal
        isOpen={showFavorites}
        onClose={() => setShowFavorites(false)}
        allPlatforms={allPlatforms}
        favoritePlatforms={favoritePlatforms}
        onSave={(values) => {
          saveFavorites(values);
          toast.success(t("platforms.favorites.saved"));
        }}
      />
    </div>
  );
}
