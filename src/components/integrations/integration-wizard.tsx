"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Facebook02Icon,
  WebhookIcon,
} from "@hugeicons/core-free-icons";
import {
  webhookCurlSnippet,
  webhookIncomingUrl,
  type DeliveryType,
  type Integration,
  type SourceType,
} from "@/lib/api/integrations";
import { copyToClipboard } from "@/lib/clipboard";
import {
  useCreateDeliveryConnection,
  useCreateIntegration,
  useDeliveryConnections,
  useFolders,
} from "@/hooks/use-integrations";
import {
  ConnectionConfigFields,
  parseConnectionConfig,
} from "@/components/connections/connection-config-fields";
import { FacebookSourceFields } from "@/components/integrations/facebook-source-fields";
import { deliveryTypeMeta } from "@/components/integrations/meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const NO_FOLDER = "__none__";
const DELIVERY_TYPES: DeliveryType[] = [
  "telegram",
  "sheets",
  "bitrix24",
  "amocrm",
  "cpa",
  "webhook",
];

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const t = useTranslations("integrations.wizard.steps");
  const steps = [t("source"), t("details"), t("receiver")];
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, index) => {
        const number = index + 1;
        const state =
          number < step ? "done" : number === step ? "current" : "todo";
        return (
          <li key={label} className="flex items-center gap-2">
            {index > 0 && <span className="h-px w-6 bg-border" />}
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                state === "current" && "bg-primary text-primary-foreground",
                state === "done" && "bg-primary/15 text-primary",
                state === "todo" && "bg-muted text-muted-foreground",
              )}
            >
              {number}
            </span>
            <span
              className={cn(
                "hidden text-xs font-medium sm:inline",
                state === "current" ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const tToasts = useTranslations("integrations.toasts");
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        if (await copyToClipboard(text)) toast.success(tToasts("copied"));
        else toast.error(tToasts("error"));
      }}
    >
      <HugeiconsIcon icon={Copy01Icon} data-icon="inline-start" />
      {label}
    </Button>
  );
}

function SuccessView({ integration }: { integration: Integration }) {
  const t = useTranslations("integrations.wizard");
  const isFacebook = integration.source_type === "facebook";
  const url =
    !isFacebook && integration.webhook_token
      ? webhookIncomingUrl(integration.webhook_token)
      : null;
  const curl =
    !isFacebook && integration.webhook_token
      ? webhookCurlSnippet(integration.webhook_token)
      : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          className="size-10 text-emerald-600 dark:text-emerald-400"
        />
        <h2 className="text-lg font-semibold">{t("successTitle")}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {isFacebook ? t("successFacebookDescription") : t("successDescription")}
        </p>
      </div>

      {isFacebook && (
        <div className="flex items-center justify-center gap-2 rounded-md border bg-muted/40 px-4 py-3 text-sm">
          <HugeiconsIcon
            icon={Facebook02Icon}
            className="size-4 shrink-0 text-primary"
          />
          {t("facebookAutoNote")}
        </div>
      )}

      {url && (
        <div className="flex flex-col gap-2">
          <Label>{t("webhookUrl")}</Label>
          <div className="flex items-center gap-2">
            <Input readOnly value={url} className="font-mono text-xs" />
            <CopyButton text={url} label={t("copy")} />
          </div>
        </div>
      )}

      {curl && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>{t("testLead")}</Label>
            <CopyButton text={curl} label={t("copy")} />
          </div>
          <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">
            {curl}
          </pre>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" asChild>
          <Link href="/dashboard/integrations">{t("toList")}</Link>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/integrations/${integration.id}`}>
            {t("toDetail")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function IntegrationWizard() {
  const t = useTranslations("integrations.wizard");
  const tToasts = useTranslations("integrations.toasts");
  const tFolders = useTranslations("integrations.folders");
  const tDelivery = useTranslations("connections.delivery");
  const tEdit = useTranslations("integrations.editDialog");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sourceType, setSourceType] = useState<SourceType>("webhook");
  const [fbConnectionId, setFbConnectionId] = useState("");
  const [fbPageId, setFbPageId] = useState("");
  const [fbFormId, setFbFormId] = useState("");
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string>(NO_FOLDER);
  const [receiverMode, setReceiverMode] = useState<"existing" | "new">(
    "existing",
  );
  const [connectionId, setConnectionId] = useState<string>("");
  const [newType, setNewType] = useState<DeliveryType>("telegram");
  const [stepError, setStepError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Integration | null>(null);

  const { data: folders = [] } = useFolders();
  const connectionsQuery = useDeliveryConnections();
  const connections = connectionsQuery.data ?? [];

  const createConnection = useCreateDeliveryConnection();
  const createIntegration = useCreateIntegration();
  const pending = createConnection.isPending || createIntegration.isPending;

  const tConfig = useTranslations("connections.config");

  function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(t("nameRequired"));
      return;
    }
    setNameError(null);
    setStep(3);
  }

  async function submitReceiver(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStepError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    try {
      let deliveryConnectionId: string | number;

      if (receiverMode === "existing") {
        if (!connectionId) {
          setStepError(t("connectionRequired"));
          return;
        }
        deliveryConnectionId = connectionId;
      } else {
        const connectionName = String(formData.get("connection_name") ?? "").trim();
        const errors: Record<string, string> = {};
        if (!connectionName) errors.connection_name = tDelivery("nameRequired");
        const parsed = parseConnectionConfig(formData, newType, (key) =>
          tConfig(key),
        );
        if (!parsed.ok) Object.assign(errors, parsed.errors);
        if (Object.keys(errors).length > 0 || !parsed.ok) {
          setFieldErrors(errors);
          return;
        }
        const connection = await createConnection.mutateAsync({
          name: connectionName,
          type: newType,
          config: parsed.config,
        });
        deliveryConnectionId = connection.id;
      }

      const integration = await createIntegration.mutateAsync({
        name: name.trim(),
        source_type: sourceType,
        ...(sourceType === "facebook"
          ? {
              source_config: {
                connection_id: fbConnectionId,
                page_id: fbPageId,
                form_id: fbFormId,
              },
            }
          : {}),
        delivery_connection_id: deliveryConnectionId,
        folder_id: folderId === NO_FOLDER ? null : folderId,
      });
      setCreated(integration);
    } catch {
      toast.error(tToasts("error"));
    }
  }

  if (created) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <SuccessView integration={created} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -translate-x-2 text-muted-foreground"
          asChild
        >
          <Link href="/dashboard/integrations">
            <HugeiconsIcon icon={ArrowLeft01Icon} data-icon="inline-start" />
            {t("back")}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <Stepper step={step} />
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold">{t("sourceTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                sourceType === "webhook"
                  ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                  : "hover:bg-muted/50",
              )}
              onClick={() => {
                setSourceType("webhook");
                setSourceError(null);
                setStep(2);
              }}
            >
              <HugeiconsIcon icon={WebhookIcon} className="size-6 text-primary" />
              <p className="mt-2 font-semibold">Webhook</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("sourceWebhookDescription")}
              </p>
            </button>
            <button
              type="button"
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                sourceType === "facebook"
                  ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                  : "hover:bg-muted/50",
              )}
              onClick={() => {
                setSourceType("facebook");
                setSourceError(null);
              }}
            >
              <HugeiconsIcon
                icon={Facebook02Icon}
                className="size-6 text-primary"
              />
              <p className="mt-2 font-semibold">Facebook</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("sourceFacebookDescription")}
              </p>
            </button>
          </div>

          {sourceType === "facebook" && (
            <>
              <FacebookSourceFields
                connectionId={fbConnectionId}
                pageId={fbPageId}
                formId={fbFormId}
                onConnectionChange={(value) => {
                  setFbConnectionId(value);
                  setFbPageId("");
                  setFbFormId("");
                  setSourceError(null);
                }}
                onPageChange={(value) => {
                  setFbPageId(value);
                  setFbFormId("");
                  setSourceError(null);
                }}
                onFormChange={(value) => {
                  setFbFormId(value);
                  setSourceError(null);
                }}
              />
              {sourceError && (
                <p className="text-sm text-destructive">{sourceError}</p>
              )}
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    if (!fbConnectionId || !fbPageId || !fbFormId) {
                      setSourceError(t("facebook.selectionRequired"));
                      return;
                    }
                    setStep(2);
                  }}
                >
                  {t("next")}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {step === 2 && (
        <form onSubmit={submitDetails} className="flex flex-col gap-4" noValidate>
          <h2 className="font-semibold">{t("detailsTitle")}</h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="wizard-name">{tEdit("name")}</Label>
            <Input
              id="wizard-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
              autoComplete="off"
              autoFocus
            />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("folderOptional")}</Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_FOLDER}>{tFolders("noFolder")}</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={String(folder.id)}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              {t("back")}
            </Button>
            <Button type="submit">{t("next")}</Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={submitReceiver} className="flex flex-col gap-4" noValidate>
          <h2 className="font-semibold">{t("receiverTitle")}</h2>

          <Tabs
            value={receiverMode}
            onValueChange={(value) =>
              setReceiverMode(value as "existing" | "new")
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="existing" className="flex-1">
                {t("useExisting")}
              </TabsTrigger>
              <TabsTrigger value="new" className="flex-1">
                {t("createNew")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {receiverMode === "existing" && (
            <div className="flex flex-col gap-2">
              <Label>{t("selectConnection")}</Label>
              {connections.length === 0 && !connectionsQuery.isLoading ? (
                <Card>
                  <CardContent className="py-4 text-sm text-muted-foreground">
                    {t("noConnections")}
                  </CardContent>
                </Card>
              ) : (
                <Select value={connectionId} onValueChange={setConnectionId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectConnection")} />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((connection) => (
                      <SelectItem
                        key={connection.id}
                        value={String(connection.id)}
                      >
                        {connection.name} —{" "}
                        {deliveryTypeMeta[connection.type]?.label ??
                          connection.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {stepError && (
                <p className="text-sm text-destructive">{stepError}</p>
              )}
            </div>
          )}

          {receiverMode === "new" && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>{tDelivery("type")}</Label>
                <Select
                  value={newType}
                  onValueChange={(value) => {
                    setNewType(value as DeliveryType);
                    setFieldErrors({});
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELIVERY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {deliveryTypeMeta[type].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="connection_name">{tDelivery("name")}</Label>
                <Input
                  id="connection_name"
                  name="connection_name"
                  placeholder={tDelivery("namePlaceholder")}
                  autoComplete="off"
                />
                {fieldErrors.connection_name && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.connection_name}
                  </p>
                )}
              </div>
              <ConnectionConfigFields
                key={newType}
                type={newType}
                errors={fieldErrors}
              />
            </div>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>
              {t("back")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("creating") : t("create")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
