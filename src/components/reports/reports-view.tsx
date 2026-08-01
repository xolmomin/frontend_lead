"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  BarChart3,
  Pause,
  Pencil,
  Play,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import {
  useCreateReport,
  useDeleteReport,
  useReports,
  useSendReportNow,
  useUpdateReport,
} from "@/hooks/use-reports";
import { useFacebookAdAccounts } from "@/hooks/use-facebook";
import type { Report, ReportFormat } from "@/lib/api/reports";
import { YbButton } from "@/components/yb/button";
import { YbCard } from "@/components/yb/card";
import { YbDataTable, type YbColumn } from "@/components/yb/data-table";
import { YbModal } from "@/components/yb/modal";
import { YbSelect } from "@/components/yb/select";
import { YbSpinner } from "@/components/yb/spinner";
import { YbTooltip } from "@/components/yb/tooltip";
import { ConfirmModal } from "@/components/dashboard/confirm-modal";

const DATE_PRESETS = [
  "yesterday",
  "today",
  "last_7d",
  "this_month",
  "last_month",
] as const;
type DatePreset = (typeof DATE_PRESETS)[number];

// i18n key suffix per preset (production `Ge` map).
const PRESET_KEYS: Record<DatePreset, string> = {
  yesterday: "yesterday",
  today: "today",
  last_7d: "last7d",
  this_month: "thisMonth",
  last_month: "lastMonth",
};

const SINGLE_DAY_PRESETS = new Set<DatePreset>(["today", "yesterday"]);

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  value: String(hour),
  label: `${String(hour).padStart(2, "0")}:00`,
}));

const DEFAULT_CAMPAIGNS_LIMIT = 5;

interface FormState {
  adAccountId: string;
  chatId: string;
  sendHour: string;
  period: DatePreset;
  format: ReportFormat;
}

const EMPTY_FORM: FormState = {
  adAccountId: "",
  chatId: "",
  sendHour: "",
  period: "yesterday",
  format: "short",
};

function hourFromSendTime(sendTime: string): string {
  const hour = parseInt(sendTime.split(":")[0] ?? "", 10);
  return Number.isNaN(hour) ? "" : String(hour);
}

function asPreset(period: string): DatePreset {
  return (DATE_PRESETS as readonly string[]).includes(period)
    ? (period as DatePreset)
    : "yesterday";
}

export function ReportsView() {
  const t = useTranslations("reports");

  const reportsQuery = useReports();
  const adAccountsQuery = useFacebookAdAccounts();
  const createMutation = useCreateReport();
  const updateMutation = useUpdateReport();
  const deleteMutation = useDeleteReport();
  const sendNowMutation = useSendReportNow();

  const reports = useMemo(() => reportsQuery.data ?? [], [reportsQuery.data]);
  const loading = reportsQuery.isLoading;
  const adAccounts = adAccountsQuery.data ?? [];

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [testingId, setTestingId] = useState<Report["id"] | null>(null);

  const saving = createMutation.isPending || updateMutation.isPending;
  const singleDay = SINGLE_DAY_PRESETS.has(form.period);
  const reportMode: string = singleDay
    ? form.format === "detailed"
      ? "detailed"
      : "summary"
    : "summary";

  const adAccountOptions = useMemo(
    () => adAccounts.map((a) => ({ value: a.id, label: a.name })),
    [adAccounts],
  );

  const resetForm = useCallback(() => setForm(EMPTY_FORM), []);

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = useCallback((report: Report) => {
    setSelectedReport(report);
    setForm({
      adAccountId: report.ad_account_id,
      chatId: report.chat_id ?? "",
      sendHour: hourFromSendTime(report.send_time),
      period: asPreset(report.period),
      format: report.format,
    });
    setIsEditOpen(true);
  }, []);

  const openDelete = useCallback((report: Report) => {
    setSelectedReport(report);
    setIsDeleteOpen(true);
  }, []);

  const canSubmitCreate = !!(form.adAccountId && form.chatId && form.sendHour !== "");
  const canSubmitEdit = !!(form.chatId && form.sendHour !== "");

  const handleCreate = () => {
    if (!canSubmitCreate) return;
    createMutation.mutate(
      {
        ad_account_id: form.adAccountId,
        chat_id: form.chatId,
        send_time: `${form.sendHour.padStart(2, "0")}:00`,
        period: form.period,
        campaigns_limit: DEFAULT_CAMPAIGNS_LIMIT,
        format: form.format,
      },
      {
        onSuccess: () => {
          toast.success(t("toast.createSuccess"));
          setIsCreateOpen(false);
          resetForm();
        },
        onError: () => toast.error(t("toast.error")),
      },
    );
  };

  const handleUpdate = () => {
    if (!selectedReport || !canSubmitEdit) return;
    updateMutation.mutate(
      {
        id: selectedReport.id,
        payload: {
          chat_id: form.chatId,
          send_time: `${form.sendHour.padStart(2, "0")}:00`,
          period: form.period,
          format: form.format,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("toast.updateSuccess"));
          setIsEditOpen(false);
          setSelectedReport(null);
        },
        onError: () => toast.error(t("toast.error")),
      },
    );
  };

  const handleDelete = () => {
    if (!selectedReport) return;
    deleteMutation.mutate(selectedReport.id, {
      onSuccess: () => {
        toast.success(t("toast.deleteSuccess"));
        setIsDeleteOpen(false);
        setSelectedReport(null);
      },
      onError: () => toast.error(t("toast.error")),
    });
  };

  const handleTest = useCallback(
    (report: Report) => {
      setTestingId(report.id);
      sendNowMutation.mutate(report.id, {
        onSuccess: () => toast.success(t("toast.testSuccess")),
        onError: () => toast.error(t("toast.testError")),
        onSettled: () => setTestingId(null),
      });
    },
    [sendNowMutation, t],
  );

  const handleToggleActive = useCallback(
    (report: Report) => {
      updateMutation.mutate(
        {
          id: report.id,
          payload: {
            status: report.status === "active" ? "paused" : "active",
          },
        },
        {
          onSuccess: () => toast.success(t("toast.updateSuccess")),
          onError: () => toast.error(t("toast.error")),
        },
      );
    },
    [updateMutation, t],
  );

  // Production `Zr` — one-line summary under the report name.
  const reportSummary = useCallback(
    (report: Report) => {
      const parts: string[] = [];
      parts.push(t(`list.${PRESET_KEYS[asPreset(report.period)]}`));
      if (report.campaigns_limit > 0) {
        parts.push(t("list.nCampaigns", { count: report.campaigns_limit }));
      } else {
        parts.push(t("list.allCampaigns"));
      }
      parts.push(
        t(report.format === "detailed" ? "list.modeDetailed" : "list.modeSummary"),
      );
      return parts.join(" · ");
    },
    [t],
  );

  const columns = useMemo<YbColumn<Report>[]>(
    () => [
      {
        key: "index",
        header: "#",
        accessor: (_row, index) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {(index || 0) + 1}
          </span>
        ),
        sortable: false,
      },
      {
        key: "ad_account_id",
        header: t("table.adAccount"),
        accessor: (row) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {row.ad_account_name || row.ad_account_id}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {reportSummary(row)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              {row.ad_account_id}
            </p>
          </div>
        ),
        sortable: true,
      },
      {
        key: "chat_id",
        header: t("table.chatId"),
        accessor: (row) => (
          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {row.chat_id ?? "—"}
          </span>
        ),
        sortable: false,
      },
      {
        key: "send_hour",
        header: t("table.sendHour"),
        accessor: (row) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {row.send_time}
          </span>
        ),
        sortable: true,
      },
      {
        key: "is_active",
        header: t("table.status"),
        accessor: (row) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              row.status === "active"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {row.status === "active" ? t("status.active") : t("status.inactive")}
          </span>
        ),
        sortable: true,
      },
      {
        key: "actions",
        header: t("table.actions"),
        accessor: (row) => {
          const isActive = row.status === "active";
          return (
            <div className="flex flex-wrap items-center gap-1 min-w-0">
              <YbTooltip content={t("actions.test")}>
                <YbButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleTest(row)}
                  disabled={testingId === row.id}
                  aria-label={t("actions.test")}
                  className="px-2.5 border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  {testingId === row.id ? (
                    <YbSpinner size="sm" className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" aria-hidden="true" />
                  )}
                </YbButton>
              </YbTooltip>
              <YbTooltip
                content={t(isActive ? "actions.deactivate" : "actions.activate")}
              >
                <YbButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(row)}
                  aria-label={t(
                    isActive ? "actions.deactivate" : "actions.activate",
                  )}
                  className={`px-2.5 ${
                    isActive
                      ? "border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-900/20"
                      : "border-green-500 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20"
                  }`}
                >
                  {isActive ? (
                    <Pause className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Play className="w-4 h-4" aria-hidden="true" />
                  )}
                </YbButton>
              </YbTooltip>
              <YbTooltip content={t("actions.edit")}>
                <YbButton
                  variant="outline"
                  size="sm"
                  onClick={() => openEdit(row)}
                  aria-label={t("actions.edit")}
                  className="px-2.5 border-purple-500 text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-900/20"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </YbButton>
              </YbTooltip>
              <YbTooltip content={t("actions.delete")}>
                <YbButton
                  variant="outline"
                  size="sm"
                  onClick={() => openDelete(row)}
                  aria-label={t("actions.delete")}
                  className="px-2.5 border-red-500 text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </YbButton>
              </YbTooltip>
            </div>
          );
        },
        sortable: false,
      },
    ],
    [t, testingId, handleTest, handleToggleActive, openEdit, openDelete, reportSummary],
  );

  const modalFields = (mode: "create" | "edit") => (
    <>
      {mode === "create" && (
        <YbSelect
          label={t("modal.adAccount")}
          value={form.adAccountId}
          onChange={(value) => setForm((f) => ({ ...f, adAccountId: value }))}
          options={adAccountOptions}
          placeholder={t(
            adAccountsQuery.isLoading
              ? "modal.adAccountLoading"
              : "modal.adAccountPlaceholder",
          )}
          disabled={adAccountsQuery.isLoading}
          required
        />
      )}

      <div>
        <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
          {t("modal.datePresetsLabel")}
        </span>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {t("modal.datePresetsHelp")}
        </p>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DATE_PRESETS.map((preset) => {
            const checked = form.period === preset;
            return (
              <label
                key={preset}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                  checked
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-400"
                    : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setForm((f) => ({ ...f, period: preset }))}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {t(`modal.${PRESET_KEYS[preset]}`)}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <YbSelect
          label={t("modal.reportMode")}
          value={reportMode}
          onChange={(value) =>
            setForm((f) => ({
              ...f,
              format: value === "detailed" ? "detailed" : "short",
            }))
          }
          options={[
            { value: "summary", label: t("modal.reportModeSummary") },
            { value: "detailed", label: t("modal.reportModeDetailed") },
          ]}
          disabled={!singleDay}
          required
        />
        {!singleDay && (
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic">
            ℹ️ {t("modal.reportModeNote")}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor={`report-chat-id-${mode}`}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {t("modal.chatId")}
        </label>
        <input
          id={`report-chat-id-${mode}`}
          type="text"
          inputMode="numeric"
          value={form.chatId}
          onChange={(e) => setForm((f) => ({ ...f, chatId: e.target.value }))}
          placeholder={t("modal.chatIdPlaceholder")}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          {t("modal.chatTopicHint")}
        </p>
      </div>

      <YbSelect
        label={t("modal.sendHour")}
        value={form.sendHour}
        onChange={(value) => setForm((f) => ({ ...f, sendHour: value }))}
        options={HOUR_OPTIONS}
        placeholder={t("modal.sendHourPlaceholder")}
        required
      />
    </>
  );

  return (
    <div className="space-y-4 lg:space-y-6 p-4 lg:p-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t("title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>
        <YbButton
          variant="primary"
          onClick={openCreate}
          leftIcon={<Plus className="w-5 h-5" aria-hidden="true" />}
          className="w-full sm:w-auto"
        >
          <span className="sm:inline">{t("addNew")}</span>
        </YbButton>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <YbCard>
          <div>
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <YbSpinner className="w-12 h-12 text-primary-600 dark:text-primary-400 mb-4" />
              </div>
            ) : reports.length === 0 ? (
              <div className="py-16 text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/20 dark:to-primary-800/20 flex items-center justify-center">
                  <BarChart3
                    className="w-10 h-10 text-primary-600 dark:text-primary-400"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {t("empty.title")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {t("empty.description")}
                </p>
                <YbButton
                  variant="primary"
                  onClick={openCreate}
                  leftIcon={<Plus className="w-5 h-5" aria-hidden="true" />}
                  className="mx-auto"
                >
                  {t("addNew")}
                </YbButton>
              </div>
            ) : (
              <YbDataTable
                data={reports}
                columns={columns}
                emptyMessage={t("empty.title")}
              />
            )}
          </div>
        </YbCard>
      </div>

      <YbModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        title={t("modal.addTitle")}
      >
        <div className="space-y-4">
          {modalFields("create")}
          <div className="flex gap-3 pt-2">
            <YbButton
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
              className="flex-1"
              disabled={saving}
            >
              {t("modal.cancel")}
            </YbButton>
            <YbButton
              variant="primary"
              onClick={handleCreate}
              loading={saving}
              disabled={!canSubmitCreate || saving}
              className="flex-1"
            >
              {t("modal.save")}
            </YbButton>
          </div>
        </div>
      </YbModal>

      <YbModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedReport(null);
        }}
        title={t("modal.editTitle")}
      >
        <div className="space-y-4">
          {modalFields("edit")}
          <div className="flex gap-3 pt-2">
            <YbButton
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedReport(null);
              }}
              className="flex-1"
              disabled={saving}
            >
              {t("modal.cancel")}
            </YbButton>
            <YbButton
              variant="primary"
              onClick={handleUpdate}
              loading={saving}
              disabled={!canSubmitEdit || saving}
              className="flex-1"
            >              
              {t("modal.save")}
            </YbButton>
          </div>
        </div>
      </YbModal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedReport(null);
        }}
        onConfirm={handleDelete}
        title={t("modal.deleteTitle")}
        message={t("modal.deleteMessage")}
        confirmText={t("modal.confirm")}
        cancelText={t("modal.cancel")}
        type="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
