"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Key, Plus, Save, Trash2 } from "lucide-react";
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from "@/hooks/use-api-keys";
import type { ApiKey } from "@/lib/api/api-keys";
import { copyToClipboard } from "@/lib/clipboard";
import { formatDateTime } from "@/lib/relative-time";
import { YbButton } from "@/components/yb/button";
import { YbCard, YbCardHeader, YbCardTitle } from "@/components/yb/card";
import { YbDataTable, type YbColumn } from "@/components/yb/data-table";
import { YbModal } from "@/components/yb/modal";
import { YbSpinner } from "@/components/yb/spinner";
import { YbTooltip } from "@/components/yb/tooltip";
import { ConfirmModal } from "@/components/dashboard/confirm-modal";

export function ApiKeysView() {
  const t = useTranslations("apiKeys");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const addFormId = useId();

  const keysQuery = useApiKeys();
  const createMutation = useCreateApiKey();
  const deleteMutation = useDeleteApiKey();

  const keys = useMemo(() => keysQuery.data ?? [], [keysQuery.data]);
  const loading = keysQuery.isLoading;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: "", website: "" });
  // The full key is returned exactly once by the create endpoint; keep the
  // values around for this session so show/copy keep working.
  const [fullKeys, setFullKeys] = useState<Record<string, string>>({});

  const openAdd = () => {
    setForm({ name: "", website: "" });
    setIsAddOpen(true);
  };

  const openDelete = (key: ApiKey) => {
    setDeletingKey(key);
    setIsDeleteOpen(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.website) {
      toast.error(t("messages.fillAllFields"));
      return;
    }
    createMutation.mutate(
      { name: form.name, site: form.website },
      {
        onSuccess: (created) => {
          if (created.key) {
            setFullKeys((prev) => ({
              ...prev,
              [String(created.id)]: created.key,
            }));
          }
          toast.success(t("messages.added"));
          setIsAddOpen(false);
        },
        onError: () => toast.error(tCommon("messages.error")),
      },
    );
  };

  const handleDelete = () => {
    if (!deletingKey) return;
    deleteMutation.mutate(deletingKey.id, {
      onSuccess: () => {
        toast.success(t("messages.deleted"));
        setIsDeleteOpen(false);
        setDeletingKey(null);
      },
      onError: () => toast.error(tCommon("messages.error")),
    });
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = useCallback(
    async (value: string) => {
      const ok = await copyToClipboard(value);
      if (ok) toast.success(t("messages.copied"));
      else toast.error(tCommon("errors.copyFailed"));
    },
    [t, tCommon],
  );

  const maskKey = (key: string) =>
    key.length <= 8 ? key : key.substring(0, 8) + "***";

  const keyValue = useCallback(
    (row: ApiKey) => fullKeys[String(row.id)] ?? row.key_masked,
    [fullKeys],
  );

  const columns = useMemo<YbColumn<ApiKey>[]>(
    () => [
      {
        key: "name",
        header: t("table.name"),
        accessor: (row) => (
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
          </div>
        ),
        searchable: true,
        sortable: true,
      },
      {
        key: "website",
        header: t("table.website"),
        accessor: (row) => (
          <span className="text-sm text-foreground/80">{row.site}</span>
        ),
        sortable: true,
      },
      {
        key: "key",
        header: t("table.key"),
        accessor: (row) => {
          const isVisible = visibleKeys.has(String(row.id));
          const value = keyValue(row);
          return (
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 bg-muted text-xs font-mono rounded border border-input">
                {isVisible ? value : maskKey(value)}
              </code>
              <div className="flex items-center gap-1">
                <YbTooltip
                  content={t(isVisible ? "actions.hide" : "actions.show")}
                >
                  <button
                    onClick={() => toggleKeyVisibility(String(row.id))}
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                    aria-label={t(isVisible ? "actions.hide" : "actions.show")}
                  >
                    {isVisible ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </YbTooltip>
                <YbTooltip content={t("actions.copy")}>
                  <button
                    onClick={() => handleCopy(value)}
                    className="p-1.5 hover:bg-muted rounded transition-colors"
                    aria-label={t("actions.copy")}
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </YbTooltip>
              </div>
            </div>
          );
        },
      },
      {
        key: "created_at",
        header: t("table.createdAt"),
        accessor: (row) => (
          <span className="text-sm text-muted-foreground">
            {formatDateTime(row.created_at, locale) ?? "—"}
          </span>
        ),
        sortable: true,
      },
      {
        key: "actions",
        header: t("table.actions"),
        accessor: (row) => (
          <div className="flex items-center gap-2">
            <YbTooltip content={t("actions.delete")}>
              <YbButton
                variant="danger"
                size="sm"
                onClick={() => openDelete(row)}
                className="px-2.5"
              >
                <Trash2 className="w-4 h-4" />
              </YbButton>
            </YbTooltip>
          </div>
        ),
      },
    ],
    [t, visibleKeys, handleCopy, keyValue, locale],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="t-h2 text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <YbButton
          variant="primary"
          onClick={openAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {t("addNew")}
        </YbButton>
      </div>

      <YbCard>
        <YbCardHeader>
          <YbCardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            {t("card.title")} ({keys.length})
          </YbCardTitle>
        </YbCardHeader>
        <div>
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <YbSpinner className="w-12 h-12 text-primary mb-4" />
              <p className="text-muted-foreground">{t("loading.keys")}</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Key className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="t-h4 text-foreground mb-2">{t("empty.title")}</h3>
              <p className="text-muted-foreground mb-6">
                {t("empty.description")}
              </p>
              <YbButton
                variant="primary"
                onClick={openAdd}
                leftIcon={<Plus className="w-5 h-5" />}
                className="mx-auto"
              >
                {t("empty.addFirst")}
              </YbButton>
            </div>
          ) : (
            <YbDataTable
              density="compact"
              data={keys}
              columns={columns}
              searchPlaceholder={t("search.placeholder")}
              defaultPageSize={25}
              emptyMessage={t("search.emptyResult")}
            />
          )}
        </div>
      </YbCard>

      <YbModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t("modal.addTitle")}
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label
              htmlFor={`${addFormId}-name`}
              className="block text-sm font-medium text-foreground/80 mb-2"
            >
              {t("modal.name")}
            </label>
            <input
              id={`${addFormId}-name`}
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t("modal.namePlaceholder")}
              className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>
          <div>
            <label
              htmlFor={`${addFormId}-website`}
              className="block text-sm font-medium text-foreground/80 mb-2"
            >
              {t("modal.website")}
            </label>
            <input
              id={`${addFormId}-website`}
              type="text"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder={t("modal.websiteSelect")}
              className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <YbButton
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              className="flex-1"
              disabled={createMutation.isPending}
            >
              {t("modal.cancel")}
            </YbButton>
            <YbButton
              type="submit"
              variant="primary"
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
              className="flex-1"
              leftIcon={<Save className="w-4 h-4" />}
            >
              {t("modal.save")}
            </YbButton>
          </div>
        </form>
      </YbModal>

      {deletingKey && (
        <ConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setDeletingKey(null);
          }}
          onConfirm={handleDelete}
          title={t("deleteDialog.title")}
          message={t("deleteDialog.message")}
          confirmText={t("deleteDialog.confirm")}
          cancelText={t("deleteDialog.cancel")}
          type="danger"
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
