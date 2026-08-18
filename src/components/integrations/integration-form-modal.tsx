"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Check, Copy } from "lucide-react";
import {
  webhookIncomingUrl,
  type DeliveryType,
  type Integration,
} from "@/lib/api/integrations";
import {
  useCreateDeliveryConnection,
  useCreateIntegration,
  useDeliveryConnections,
  useFolders,
  useUpdateIntegration,
} from "@/hooks/use-integrations";
import {
  useFacebookConnections,
  useFacebookForms,
  useFacebookPages,
  useSubscribeFacebookPage,
} from "@/hooks/use-facebook";
import {
  ConnectionConfigFields,
  parseConnectionConfig,
} from "@/components/connections/connection-config-fields";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { YbButton } from "@/components/yb/button";
import { YbModal } from "@/components/yb/modal";
import { ConfirmModal } from "@/components/dashboard/confirm-modal";
import {
  SearchSelect,
  type SearchSelectGroup,
} from "@/components/integrations/search-select";
import { usePlatformCatalog } from "@/components/integrations/platform-favorites-modal";

const TYPE_LABELS: Record<DeliveryType, string> = {
  telegram: "Telegram",
  sheets: "Google Sheets",
  bitrix24: "Bitrix24",
  amocrm: "amoCRM",
  cpa: "CPA",
  webhook: "Webhook",
};

export interface IntegrationPrefill {
  name?: string;
  folderId?: string;
  deliveryConnectionId?: string;
}

function SectionHeading({
  step,
  children,
}: {
  step: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className="text-base sm:t-h4 text-foreground flex items-center gap-2">
      <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs sm:text-sm font-bold">
        {step}
      </span>
      {children}
    </h3>
  );
}

const SECTION_CLASS =
  "space-y-4 p-4 sm:p-5 bg-muted/50 rounded-xl sm:rounded-2xl border border-border";

/**
 * Add/edit integration modal, ported from the production add-scenario modal:
 * step indicator + source / basic settings / destination sections in a single
 * scroll form. Wired to the local stage-2 API (delivery connections instead of
 * the production per-platform configs).
 */
export function IntegrationFormModal({
  isOpen,
  mode,
  integration = null,
  prefill = null,
  defaultFolderId = null,
  onClose,
}: {
  isOpen: boolean;
  mode: "create" | "edit";
  integration?: Integration | null;
  prefill?: IntegrationPrefill | null;
  defaultFolderId?: string | null;
  onClose: () => void;
}) {
  const t = useTranslations("integrations");
  const tConfig = useTranslations("connections.config");
  const tConnGroups = useTranslations("connections.groups");
  const nameId = useId();
  const webhookUrlId = useId();

  const [sourceType, setSourceType] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState("");
  const [selectedForm, setSelectedForm] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [folderId, setFolderId] = useState("all");
  const [destination, setDestination] = useState("");
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});
  const [showUnsaved, setShowUnsaved] = useState(false);

  const foldersQuery = useFolders();
  const connectionsQuery = useDeliveryConnections();
  const fbConnectionsQuery = useFacebookConnections();
  const { allPlatforms, favoritePlatforms } = usePlatformCatalog();

  const isFacebookSource = sourceType !== "" && sourceType !== "webhook";
  const pagesQuery = useFacebookPages(isFacebookSource ? sourceType : "");
  const formsQuery = useFacebookForms(
    isFacebookSource ? sourceType : "",
    selectedPage,
  );
  const subscribePage = useSubscribeFacebookPage();

  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const createConnection = useCreateDeliveryConnection();
  const submitting =
    createIntegration.isPending ||
    updateIntegration.isPending ||
    createConnection.isPending;

  // Populate / reset state when the modal opens (render-time adjustment).
  const openKey = isOpen ? `${mode}:${integration?.id ?? "new"}` : null;
  const [prevOpenKey, setPrevOpenKey] = useState<string | null>(null);
  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);
    if (openKey !== null) {
      if (mode === "edit" && integration) {
        setSourceType(integration.source_type);
        setName(integration.name);
        setFolderId(
          integration.folder_id != null ? String(integration.folder_id) : "all",
        );
        setDestination(
          integration.delivery_connection
            ? `conn:${integration.delivery_connection.id}`
            : "",
        );
      } else {
        setSourceType("");
        setName(prefill?.name ?? "");
        setFolderId(prefill?.folderId ?? defaultFolderId ?? "all");
        setDestination(
          prefill?.deliveryConnectionId
            ? `conn:${prefill.deliveryConnectionId}`
            : "",
        );
      }
      setSelectedPage("");
      setSelectedForm("");
      setNameError(null);
      setConfigErrors({});
    }
  }

  const dirty =
    mode === "create"
      ? sourceType !== "" || name.trim() !== "" || destination !== ""
      : !!integration &&
        (name !== integration.name ||
          folderId !==
            (integration.folder_id != null
              ? String(integration.folder_id)
              : "all") ||
          destination !==
            (integration.delivery_connection
              ? `conn:${integration.delivery_connection.id}`
              : ""));

  const requestClose = useCallback(() => {
    if (submitting) return;
    if (dirty) setShowUnsaved(true);
    else onClose();
  }, [dirty, submitting, onClose]);

  const validateName = useCallback(
    (value: string): string | null => {
      if (!value.trim()) return t("validation.nameRequired");
      if (value.trim().length < 3) return t("validation.nameMinLength");
      return null;
    },
    [t],
  );

  // --- Options ---

  const sourceOptions = useMemo(() => {
    if (mode === "edit" && integration) {
      return [
        {
          value: integration.source_type,
          label:
            integration.source_type === "webhook"
              ? "Webhook"
              : t("card.sourceFacebook"),
        },
      ];
    }
    return [
      ...(fbConnectionsQuery.data ?? []).map((connection) => ({
        value: String(connection.id),
        label: `${connection.name} (Facebook)`,
      })),
      { value: "webhook", label: "Webhook" },
    ];
  }, [mode, integration, fbConnectionsQuery.data, t]);

  const destinationGroups = useMemo<SearchSelectGroup[]>(() => {
    const groups: SearchSelectGroup[] = [];
    const connections = connectionsQuery.data ?? [];
    if (connections.length > 0) {
      groups.push({
        label: tConnGroups("destinations_title"),
        options: connections.map((connection) => ({
          value: `conn:${connection.id}`,
          label: `${connection.name} — ${TYPE_LABELS[connection.type] ?? connection.type}`,
        })),
      });
    }
    if (mode === "create") {
      const visible =
        favoritePlatforms.length > 0
          ? allPlatforms.filter((platform) =>
              favoritePlatforms.includes(platform.value),
            )
          : allPlatforms;
      const byGroup = new Map<string, typeof visible>();
      for (const platform of visible) {
        const list = byGroup.get(platform.group) ?? [];
        list.push(platform);
        byGroup.set(platform.group, list);
      }
      for (const [label, platforms] of byGroup) {
        groups.push({
          label,
          options: platforms.map((platform) => ({
            value: `new:${platform.value}`,
            label: `+ ${platform.label}`,
          })),
        });
      }
    }
    return groups;
  }, [
    connectionsQuery.data,
    mode,
    allPlatforms,
    favoritePlatforms,
    tConnGroups,
  ]);

  const folderOptions = useMemo(
    () => [
      { value: "all", label: t("folders.all") },
      ...(foldersQuery.data ?? []).map((folder) => ({
        value: String(folder.id),
        label: folder.name,
      })),
    ],
    [foldersQuery.data, t],
  );

  const newType: DeliveryType | null = destination.startsWith("new:")
    ? (destination.slice(4) as DeliveryType)
    : null;

  const stepStatus = {
    source:
      sourceType === "webhook" ||
      (isFacebookSource && !!selectedPage && !!selectedForm) ||
      (mode === "edit" && sourceType !== ""),
    settings: !!name.trim(),
    destination: !!destination,
  };

  const steps = [
    { key: "source" as const, label: t("form.step1"), icon: "1" },
    { key: "settings" as const, label: t("basicSettings"), icon: "2" },
    { key: "destination" as const, label: t("form.step3"), icon: "3" },
  ];

  const onSelectPage = (pageId: string) => {
    setSelectedPage(pageId);
    setSelectedForm("");
    if (pageId && isFacebookSource) {
      subscribePage.mutate(
        { connectionId: sourceType, pageId },
        { onError: () => undefined },
      );
    }
  };

  const onSelectForm = (formId: string) => {
    setSelectedForm(formId);
    const form = (formsQuery.data ?? []).find(
      (item) => String(item.id) === formId,
    );
    const account = (fbConnectionsQuery.data ?? []).find(
      (item) => String(item.id) === sourceType,
    );
    if (form && !name.trim()) {
      setName(account ? `${form.name} (${account.name})` : form.name);
      toast.success(t("toast.formFieldsLoaded"));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (mode === "create" && !sourceType) {
      toast.error(t("toast.selectSource"));
      return;
    }
    if (mode === "create" && isFacebookSource) {
      if (!selectedPage) {
        toast.error(t("toast.selectPage"));
        return;
      }
      if (!selectedForm) {
        toast.error(t("toast.selectForm"));
        return;
      }
    }
    if (!destination) {
      toast.error(t("toast.selectDestination"));
      return;
    }
    const nameValidation = validateName(name);
    if (nameValidation) {
      setNameError(nameValidation);
      toast.error(t("toast.enterName"));
      return;
    }

    try {
      let deliveryConnectionId: string | number;
      if (newType) {
        const parsed = parseConnectionConfig(formData, newType, (key) =>
          tConfig(key),
        );
        if (!parsed.ok) {
          setConfigErrors(parsed.errors);
          return;
        }
        setConfigErrors({});
        const connection = await createConnection.mutateAsync({
          name: name.trim(),
          type: newType,
          config: parsed.config,
        });
        deliveryConnectionId = connection.id;
      } else {
        deliveryConnectionId = destination.slice(5);
      }

      if (mode === "edit" && integration) {
        await updateIntegration.mutateAsync({
          id: integration.id,
          payload: {
            name: name.trim(),
            delivery_connection_id: deliveryConnectionId,
            folder_id: folderId === "all" ? null : folderId,
          },
        });
        toast.success(t("toast.updateSuccess"));
      } else {
        await createIntegration.mutateAsync({
          name: name.trim(),
          source_type: isFacebookSource ? "facebook" : "webhook",
          ...(isFacebookSource
            ? {
                source_config: {
                  connection_id: sourceType,
                  page_id: selectedPage,
                  form_id: selectedForm,
                },
              }
            : {}),
          delivery_connection_id: deliveryConnectionId,
          folder_id: folderId === "all" ? null : folderId,
        });
        toast.success(t("toast.createSuccess"));
      }
      onClose();
    } catch {
      // apiFetch surfaces errors globally
    }
  };

  const webhookUrl =
    mode === "edit" && integration?.webhook_token
      ? webhookIncomingUrl(integration.webhook_token)
      : null;

  return (
    <>
      <YbModal
        isOpen={isOpen}
        onClose={requestClose}
        title={t(mode === "edit" ? "modal.editTitle" : "modal.addTitle")}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Step indicator */}
          <div className="flex items-center w-full mb-6">
            {steps.map((step, index) => (
              <div
                key={step.key}
                className="flex items-center flex-1 last:flex-none"
              >
                <div className="flex flex-col items-center min-w-[50px] sm:min-w-[60px]">
                  <div
                    className={cn(
                      "w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm sm:text-base font-bold transition-all duration-300",
                      stepStatus[step.key]
                        ? "bg-success text-white shadow-lg shadow-green-500/30"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {stepStatus[step.key] ? (
                      <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs mt-1.5 text-muted-foreground text-center font-medium">
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 rounded-full mx-2 sm:mx-3 transition-all duration-300",
                      stepStatus[step.key] ? "bg-success" : "bg-muted",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: source */}
          <div className={SECTION_CLASS}>
            <SectionHeading step="1">
              {t("form.stepSourceTitle")}
            </SectionHeading>
            <SearchSelect
              label={t("form.source")}
              value={sourceType}
              onChange={(value) => {
                setSourceType(value);
                setSelectedPage("");
                setSelectedForm("");
              }}
              options={sourceOptions}
              placeholder={t("form.sourcePlaceholder")}
              searchPlaceholder={t("form.sourceSearch")}
              required
              disabled={mode === "edit"}
            />
            {isFacebookSource && mode === "create" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <SearchSelect
                  label={t("form.page")}
                  value={selectedPage}
                  onChange={onSelectPage}
                  options={(pagesQuery.data ?? []).map((page) => ({
                    value: String(page.id),
                    label: page.name,
                  }))}
                  placeholder={t("form.pagePlaceholder")}
                  searchPlaceholder={t("form.pageSearch")}
                  required
                />
                <SearchSelect
                  label={t("form.formSelect")}
                  value={selectedForm}
                  onChange={onSelectForm}
                  options={(formsQuery.data ?? [])
                    .filter((form) => form.status !== "ARCHIVED")
                    .map((form) => ({
                      value: String(form.id),
                      label: form.name,
                    }))}
                  placeholder={t("form.formPlaceholder")}
                  searchPlaceholder={t("form.formSearch")}
                  required
                  disabled={!selectedPage}
                />
              </div>
            )}
            {sourceType === "webhook" && (
              <div className="space-y-3 sm:space-y-4">
                {webhookUrl && (
                  <div>
                    <label
                      htmlFor={webhookUrlId}
                      className="block text-sm font-medium text-foreground/80 mb-2"
                    >
                      {t("form.webhookUrl")}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        id={webhookUrlId}
                        type="text"
                        value={webhookUrl}
                        readOnly
                        className="flex-1 px-3 sm:px-4 py-3 sm:py-2 border border-input rounded-xl sm:rounded-lg bg-muted text-foreground text-sm touch-manipulation"
                      />
                      <YbButton
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          if (await copyToClipboard(webhookUrl)) {
                            toast.success(t("toast.webhookCopied"));
                          }
                        }}
                        className="h-12 sm:h-auto touch-manipulation"
                        leftIcon={<Copy className="w-4 h-4" />}
                      >
                        {t("form.webhookCopy")}
                      </YbButton>
                    </div>
                  </div>
                )}
                <div className="p-3 sm:p-4 bg-warning-muted border border-warning/40 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-warning">
                        {webhookUrl
                          ? t("webhook.sendDataHint")
                          : t("form.webhookInfo")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: basic settings */}
          {(sourceType || mode === "edit") && (
            <div className={SECTION_CLASS}>
              <SectionHeading step="2">{t("basicSettings")}</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor={nameId}
                    className="block text-sm font-medium text-foreground/80 mb-2"
                  >
                    {t("form.name")} <span className="text-destructive">*</span>
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (nameError) {
                        setNameError(validateName(event.target.value));
                      }
                    }}
                    onBlur={() => setNameError(validateName(name))}
                    placeholder={t("form.namePlaceholder")}
                    className={cn(
                      "w-full px-3 sm:px-4 py-3 sm:py-2.5 border rounded-xl sm:rounded-lg bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-base sm:text-sm touch-manipulation transition-colors",
                      nameError
                        ? "border-destructive focus-visible:ring-destructive"
                        : "border-input",
                    )}
                    required
                  />
                  {nameError && (
                    <p className="mt-1.5 text-sm text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {nameError}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <SearchSelect
                    label={t("form.folder")}
                    value={folderId}
                    onChange={setFolderId}
                    options={folderOptions}
                    placeholder={t("form.folderPlaceholder")}
                    searchPlaceholder={t("form.folderSearch")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: destination */}
          {(sourceType || mode === "edit") && (
            <div className={SECTION_CLASS}>
              <SectionHeading step="3">{t("form.step3Title")}</SectionHeading>
              <SearchSelect
                label={t("form.destination")}
                value={destination}
                onChange={(value) => {
                  setDestination(value);
                  setConfigErrors({});
                }}
                groups={destinationGroups}
                placeholder={t("form.destinationPlaceholder")}
                searchPlaceholder={t("form.destinationSearch")}
                required
              />
              {newType && (
                <div className="space-y-3">
                  <ConnectionConfigFields
                    key={newType}
                    type={newType}
                    errors={configErrors}
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-2">
            <YbButton
              type="button"
              variant="outline"
              onClick={requestClose}
              className="flex-1"
              disabled={submitting}
            >
              {t("modal.cancel")}
            </YbButton>
            <YbButton
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting}
              className="flex-1"
            >
              {t(mode === "edit" ? "modal.save" : "modal.add")}
            </YbButton>
          </div>
        </form>
      </YbModal>
      <ConfirmModal
        isOpen={showUnsaved}
        onClose={() => setShowUnsaved(false)}
        onConfirm={() => {
          setShowUnsaved(false);
          onClose();
        }}
        title={t("modal.unsavedTitle")}
        message={t("modal.unsavedMessage")}
        confirmText={t("modal.unsavedConfirm")}
        cancelText={t("modal.unsavedKeepEditing")}
        type="warning"
      />
    </>
  );
}
