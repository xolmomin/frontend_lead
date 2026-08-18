"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Rss,
  Search,
  Send,
  Sheet,
  Trash2,
  Webhook,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeliveryConnection, DeliveryType } from "@/lib/api/integrations";
import type { FacebookConnection } from "@/lib/api/facebook";
import {
  useDeleteFacebookConnection,
  useFacebookConnections,
  useStartFacebookOAuth,
} from "@/hooks/use-facebook";
import {
  useCreateDeliveryConnection,
  useDeleteDeliveryConnection,
  useDeliveryConnections,
  useUpdateDeliveryConnection,
} from "@/hooks/use-integrations";
import {
  ConnectionConfigFields,
  parseConnectionConfig,
} from "@/components/connections/connection-config-fields";
import { YbCard, YbCardHeader, YbCardTitle } from "@/components/yb/card";
import { YbButton } from "@/components/yb/button";
import { YbInput } from "@/components/yb/input";
import { YbModal } from "@/components/yb/modal";
import { YbTooltip } from "@/components/yb/tooltip";
import { YbDataTable, type YbColumn } from "@/components/yb/data-table";
import { ConfirmModal } from "@/components/dashboard/confirm-modal";

const MAX_CONNECTIONS = 100;

// --- Row model: facebook connections (sources) + delivery connections
// (destinations) unified for the production table layout. ---

type SourceKind =
  | "facebook"
  | "google"
  | "bitrix24"
  | "amocrm"
  | "telegram"
  | "webhook"
  | "cpa";

interface Row {
  id: string;
  source: SourceKind;
  name: string;
  identifier: string | null;
  /** `true` — ok, `false` — failed, `null` — untested. */
  ok: boolean | null;
  created_at: string | null;
  facebook?: FacebookConnection;
  delivery?: DeliveryConnection;
}

const DELIVERY_FAMILY: Record<string, "crm" | "sheets" | "telegram"> = {
  bitrix24: "crm",
  amocrm: "crm",
  webhook: "crm",
  google: "sheets",
  telegram: "telegram",
};

const FAMILY_ORDER = ["crm", "sheets", "telegram"] as const;

function FacebookMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        d="M15.9 12.7h-2.6v7h-3v-7h-1.6v-2.6h1.6V8.4c0-1.9 1-3.1 3.2-3.1h2.2v2.6h-1.5c-.7 0-.9.3-.9 1v1.2h2.9l-.3 2.6z"
        fill="#fff"
      />
    </svg>
  );
}

function Bitrix24Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#0BBBEF" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        fill="#005893"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
      >
        24
      </text>
    </svg>
  );
}

function sourceMeta(
  source: SourceKind,
  t: ReturnType<typeof useTranslations<"connections">>,
): {
  Mark: (props: { className?: string }) => ReactNode;
  label: string;
  badgeBg: string;
  badgeText: string;
} {
  switch (source) {
    case "facebook":
      return {
        Mark: FacebookMark,
        label: t("sources.facebook"),
        badgeBg:
          "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
        badgeText: "text-blue-700 dark:text-blue-300",
      };
    case "google":
      return {
        Mark: ({ className }) => (
          <Sheet className={cn("text-destructive", className)} />
        ),
        label: t("sources.google"),
        badgeBg: "bg-destructive-muted border-destructive/40",
        badgeText: "text-destructive",
      };
    case "bitrix24":
      return {
        Mark: Bitrix24Mark,
        label: t("sources.bitrix24"),
        badgeBg:
          "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800",
        badgeText: "text-sky-700 dark:text-sky-300",
      };
    case "amocrm":
      return {
        Mark: ({ className }) => (
          <Building2
            className={cn("text-violet-600 dark:text-violet-400", className)}
          />
        ),
        label: t("sources.amocrm"),
        badgeBg:
          "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800",
        badgeText: "text-violet-700 dark:text-violet-300",
      };
    case "telegram":
      return {
        Mark: ({ className }) => (
          <Send className={cn("text-cyan-600 dark:text-cyan-400", className)} />
        ),
        label: t("sources.telegram"),
        badgeBg:
          "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800",
        badgeText: "text-cyan-700 dark:text-cyan-300",
      };
    case "cpa":
      return {
        Mark: ({ className }) => (
          <BarChart3 className={cn("text-success", className)} />
        ),
        label: "CPA",
        badgeBg: "bg-success-muted border-success/40",
        badgeText: "text-success",
      };
    default:
      return {
        Mark: ({ className }) => (
          <Webhook className={cn("text-muted-foreground", className)} />
        ),
        label: "Webhook",
        badgeBg: "bg-muted/60 border-border",
        badgeText: "text-foreground/80",
      };
  }
}

function deliveryIdentifier(connection: DeliveryConnection): string | null {
  const config = connection.config ?? {};
  const candidates = [
    "chat_id",
    "spreadsheet_id",
    "webhook_url",
    "subdomain",
    "url",
  ];
  for (const key of candidates) {
    const value = config[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

// --- Delivery connection add/edit modal ---

const PLATFORM_TITLE_KEY: Record<DeliveryType, string> = {
  telegram: "add_modal.telegram.title",
  sheets: "add_modal.google.title",
  bitrix24: "add_modal.bitrix24.title",
  amocrm: "add_modal.amocrm.title",
  cpa: "add_modal.section_cpa",
  webhook: "add_modal.auth.webhook",
};

function DeliveryConnectionModal({
  isOpen,
  type,
  connection,
  onClose,
  onBack,
  nested,
}: {
  isOpen: boolean;
  type: DeliveryType;
  connection: DeliveryConnection | null;
  onClose: () => void;
  onBack?: () => void;
  nested?: boolean;
}) {
  const t = useTranslations("connections");
  const tIntegrations = useTranslations("integrations");
  const tConfig = useTranslations("connections.config");
  const tCommon = useTranslations("common");

  const createMutation = useCreateDeliveryConnection();
  const updateMutation = useUpdateDeliveryConnection();
  const saving = createMutation.isPending || updateMutation.isPending;

  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();

    const nextErrors: Record<string, string> = {};
    if (!name) {
      nextErrors.name = tIntegrations("cpa_account_modal.errors.name_required");
    }
    const parsed = parseConnectionConfig(formData, type, (key) => tConfig(key));
    if (!parsed.ok) Object.assign(nextErrors, parsed.errors);
    if (Object.keys(nextErrors).length > 0 || !parsed.ok) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    if (connection) {
      updateMutation.mutate(
        {
          id: connection.id,
          payload: { name, type, config: parsed.config },
        },
        {
          onSuccess: () => {
            toast.success(tCommon("messages.success"));
            onClose();
          },
          onError: () => toast.error(tCommon("messages.error")),
        },
      );
    } else {
      createMutation.mutate(
        { name, type, config: parsed.config },
        {
          onSuccess: () => {
            toast.success(t("toast.connected"));
            onClose();
          },
          onError: () => toast.error(tCommon("messages.error")),
        },
      );
    }
  }

  return (
    <YbModal
      isOpen={isOpen}
      onClose={onClose}
      onBack={onBack}
      nested={nested}
      title={
        connection
          ? tIntegrations("crm_accounts.edit")
          : t(PLATFORM_TITLE_KEY[type])
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <YbInput
          name="name"
          label={tIntegrations("cpa_account_modal.name_label")}
          placeholder={tIntegrations("cpa_account_modal.name_placeholder")}
          defaultValue={connection?.name ?? ""}
          autoComplete="off"
          required
          maxLength={100}
          error={errors.name}
        />
        <ConnectionConfigFields
          key={type}
          type={type}
          defaults={connection?.config}
          errors={errors}
        />
        <div className="mt-4 p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground">
          {t("add_modal.security_note")}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <YbButton type="button" variant="ghost" onClick={onClose}>
            {tCommon("actions.cancel")}
          </YbButton>
          <YbButton type="submit" loading={saving}>
            {tCommon("actions.save")}
          </YbButton>
        </div>
      </form>
    </YbModal>
  );
}

// --- Add-profile modal (production platform picker) ---

interface PlatformCardDef {
  id: string;
  icon: ReactNode;
  authBadgeColor: string;
  hoverBorder: string;
  title: string;
  description: string;
  authType: string;
  onClick: () => void;
}

function AddProfileModal({
  isOpen,
  onClose,
  onSelectFacebook,
  onSelectDelivery,
  disabled = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectFacebook: () => void;
  onSelectDelivery: (type: DeliveryType) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("connections");
  const [search, setSearch] = useState("");

  const accounts = useMemo<PlatformCardDef[]>(
    () => [
      {
        id: "facebook",
        icon: <FacebookMark className="w-7 h-7" />,
        authBadgeColor:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        hoverBorder: "hover:border-blue-400 dark:hover:border-blue-500",
        title: t("add_modal.facebook.title"),
        description: t("add_modal.facebook.description"),
        authType: t("add_modal.auth.oauth"),
        onClick: onSelectFacebook,
      },
      {
        id: "google",
        icon: <Sheet className="w-7 h-7 text-destructive" />,
        authBadgeColor:
          "bg-destructive-muted text-destructive dark:text-destructive",
        hoverBorder: "hover:border-destructive dark:hover:border-destructive",
        title: t("add_modal.google.title"),
        description: t("add_modal.google.description"),
        authType: t("add_modal.auth.oauth"),
        onClick: () => onSelectDelivery("sheets"),
      },
      {
        id: "bitrix24",
        icon: <Bitrix24Mark className="w-7 h-7" />,
        authBadgeColor:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        hoverBorder: "hover:border-orange-400 dark:hover:border-orange-500",
        title: t("add_modal.bitrix24.title"),
        description: t("add_modal.bitrix24.description"),
        authType: t("add_modal.auth.webhook"),
        onClick: () => onSelectDelivery("bitrix24"),
      },
      {
        id: "amocrm",
        icon: <Building2 className="w-7 h-7 text-violet-600" />,
        authBadgeColor:
          "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
        hoverBorder: "hover:border-violet-400 dark:hover:border-violet-500",
        title: t("add_modal.amocrm.title"),
        description: t("add_modal.amocrm.description"),
        authType: t("add_modal.auth.token"),
        onClick: () => onSelectDelivery("amocrm"),
      },
      {
        id: "telegram",
        icon: <Send className="w-7 h-7 text-cyan-600" />,
        authBadgeColor:
          "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
        hoverBorder: "hover:border-cyan-400 dark:hover:border-cyan-500",
        title: t("add_modal.telegram.title"),
        description: t("add_modal.telegram.description"),
        authType: t("add_modal.auth.bot_token"),
        onClick: () => onSelectDelivery("telegram"),
      },
      {
        id: "webhook",
        icon: <Webhook className="w-7 h-7 text-foreground/75" />,
        authBadgeColor: "bg-muted text-foreground/80",
        hoverBorder: "hover:border-input",
        title: "Webhook",
        description: t("add_modal.auth.webhook"),
        authType: t("add_modal.auth.webhook"),
        onClick: () => onSelectDelivery("webhook"),
      },
    ],
    [t, onSelectFacebook, onSelectDelivery],
  );

  const cpa = useMemo<PlatformCardDef[]>(
    () =>
      [
        {
          slug: "100k",
          name: "100k.uz",
          description:
            "CPA natijalari (qabul / yetkazilgan / foyda) hisoboti uchun ulash",
        },
        {
          slug: "sotuvchi",
          name: "Sotuvchi",
          description:
            "CPA natijalari (sotildi / yetkazilgan / foyda) hisoboti uchun ulash",
        },
      ].map((platform) => ({
        id: `cpa_${platform.slug}`,
        icon: <BarChart3 className="w-6 h-6 text-success" />,
        authBadgeColor: "bg-success-muted text-success dark:text-success",
        hoverBorder: "hover:border-success",
        title: platform.name,
        description: platform.description,
        authType: t("add_modal.auth.phone_password"),
        onClick: () => onSelectDelivery("cpa"),
      })),
    [t, onSelectDelivery],
  );

  const renderCard = (card: PlatformCardDef) => (
    <button
      key={card.id}
      type="button"
      onClick={() => {
        if (!disabled) card.onClick();
      }}
      disabled={disabled}
      aria-disabled={disabled}
      className={cn(
        "group flex flex-col items-start gap-3 p-4 text-left",
        "border-2 border-border rounded-xl",
        "bg-card",
        "transition-all duration-150",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        !disabled && [
          card.hoverBorder,
          "hover:shadow-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background",
          "cursor-pointer",
        ],
      )}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="shrink-0 h-12 w-12 rounded-lg flex items-center justify-center bg-card border border-border">
          {card.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {card.title}
          </h3>
          <span
            className={cn(
              "inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium",
              card.authBadgeColor,
            )}
          >
            {card.authType}
          </span>
        </div>
        <ArrowRight
          className={cn(
            "w-5 h-5 shrink-0 text-muted-foreground transition-transform",
            !disabled && "group-hover:translate-x-1",
          )}
          aria-hidden="true"
        />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {card.description}
      </p>
    </button>
  );

  const query = search.trim().toLowerCase();
  const matches = (card: PlatformCardDef) =>
    !query ||
    card.title.toLowerCase().includes(query) ||
    card.description.toLowerCase().includes(query) ||
    card.authType.toLowerCase().includes(query);
  const filteredAccounts = accounts.filter(matches);
  const filteredCpa = cpa.filter(matches);
  const total = filteredAccounts.length + filteredCpa.length;

  return (
    <YbModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("add_modal.title")}
      size="lg"
    >
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          {t("add_modal.subtitle")}
        </p>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("add_modal.search_placeholder")}
            aria-label={t("add_modal.search_placeholder")}
            className="w-full pl-9 pr-9 py-2 text-sm bg-card border border-input rounded-lg focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-ring focus:border-transparent outline-none transition-all text-foreground placeholder:text-muted-foreground"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              aria-label={t("add_modal.search_clear")}
            >
              <XCircle className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
        {query && total === 0 && (
          <div className="py-10 text-center">
            <Search
              className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-foreground/80">
              {t("add_modal.no_results")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("add_modal.no_results_hint")}
            </p>
          </div>
        )}
        {filteredAccounts.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t("add_modal.section_accounts")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAccounts.map(renderCard)}
            </div>
          </div>
        )}
        {filteredCpa.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t("add_modal.section_cpa")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredCpa.map(renderCard)}
            </div>
          </div>
        )}
        <div className="mt-4 p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground">
          {t("add_modal.security_note")}
        </div>
      </div>
    </YbModal>
  );
}

// --- Page ---

export function ConnectionsView() {
  const t = useTranslations("connections");
  const tIntegrations = useTranslations("integrations");
  const locale = useLocale();

  const facebookQuery = useFacebookConnections();
  const deliveryQuery = useDeliveryConnections();
  const startOAuth = useStartFacebookOAuth();
  const deleteFacebook = useDeleteFacebookConnection();
  const deleteDelivery = useDeleteDeliveryConnection();

  const [addOpen, setAddOpen] = useState(false);
  const [deliveryModal, setDeliveryModal] = useState<{
    type: DeliveryType;
    connection: DeliveryConnection | null;
    fromAdd: boolean;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [destinationSearch, setDestinationSearch] = useState("");

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      date,
    );
  };

  const sourceRows = useMemo<Row[]>(
    () =>
      (facebookQuery.data ?? []).map((connection) => ({
        id: `fb-${connection.id}`,
        source: "facebook" as const,
        name: connection.name,
        identifier: connection.fb_user_id,
        ok: connection.status === "active" ? true : false,
        created_at: connection.created_at,
        facebook: connection,
      })),
    [facebookQuery.data],
  );

  const { destinationRows, cpaRows } = useMemo(() => {
    const destinations: Row[] = [];
    const cpaList: Row[] = [];
    for (const connection of deliveryQuery.data ?? []) {
      const source: SourceKind =
        connection.type === "sheets" ? "google" : connection.type;
      const row: Row = {
        id: `dc-${connection.id}`,
        source,
        name: connection.name,
        identifier: deliveryIdentifier(connection),
        ok: null,
        created_at: null,
        delivery: connection,
      };
      if (connection.type === "cpa") cpaList.push(row);
      else destinations.push(row);
    }
    return { destinationRows: destinations, cpaRows: cpaList };
  }, [deliveryQuery.data]);

  const total = sourceRows.length + destinationRows.length + cpaRows.length;
  const loading =
    (facebookQuery.isLoading || deliveryQuery.isLoading) && total === 0;

  const destinationGroups = useMemo(() => {
    const query = destinationSearch.trim().toLowerCase();
    const groups: Record<(typeof FAMILY_ORDER)[number], Row[]> = {
      crm: [],
      sheets: [],
      telegram: [],
    };
    for (const row of destinationRows) {
      if (
        query &&
        !row.name.toLowerCase().includes(query) &&
        !(row.identifier ?? "").toLowerCase().includes(query) &&
        !row.source.toLowerCase().includes(query)
      ) {
        continue;
      }
      const family = DELIVERY_FAMILY[row.source];
      if (family) groups[family].push(row);
    }
    return groups;
  }, [destinationRows, destinationSearch]);

  const filteredDestinationCount =
    destinationGroups.crm.length +
    destinationGroups.sheets.length +
    destinationGroups.telegram.length;
  const hasDestinationSearch = destinationSearch.trim().length > 0;

  const handleFacebookConnect = () => {
    toast.info(t("toast.oauthOpening"), {
      description: t("toast.redirecting"),
    });
    startOAuth.mutate(undefined, {
      onError: () => toast.error(t("toast.oauthError")),
    });
  };

  const handleDelete = () => {
    const target = deleteTarget;
    if (!target) return;
    const options = {
      onSuccess: () => {
        toast.success(t("toast.deleted"));
        setDeleteTarget(null);
      },
      onError: () => setDeleteTarget(null),
    };
    if (target.facebook) deleteFacebook.mutate(target.facebook.id, options);
    else if (target.delivery)
      deleteDelivery.mutate(target.delivery.id, options);
  };

  // --- Columns ---

  const sourceColumn = useMemo<YbColumn<Row>>(
    () => ({
      key: "source",
      header: t("table.source"),
      sortable: true,
      searchValue: (row) => sourceMeta(row.source, t).label,
      accessor: (row) => {
        const meta = sourceMeta(row.source, t);
        return (
          <div
            className={cn(
              "inline-flex items-center gap-2 px-2.5 py-1 rounded-full border",
              meta.badgeBg,
            )}
          >
            <div className="w-4 h-4 shrink-0 flex items-center justify-center">
              <meta.Mark className="w-4 h-4" />
            </div>
            <span className={cn("text-xs font-semibold", meta.badgeText)}>
              {meta.label}
            </span>
          </div>
        );
      },
    }),
    [t],
  );

  const nameColumn = useMemo<YbColumn<Row>>(
    () => ({
      key: "name",
      header: t("table.name"),
      sortable: true,
      searchValue: (row) => `${row.name} ${row.identifier ?? ""}`,
      accessor: (row) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-medium text-foreground truncate">{row.name}</p>
          </div>
          {row.identifier && (
            <p className="text-xs text-muted-foreground truncate">
              {row.identifier}
            </p>
          )}
        </div>
      ),
    }),
    [t],
  );

  const groupedNameColumn = useMemo<YbColumn<Row>>(
    () => ({
      key: "name",
      header: t("table.name"),
      sortable: true,
      searchValue: (row) => `${row.name} ${row.identifier ?? ""}`,
      accessor: (row) => {
        const meta = sourceMeta(row.source, t);
        return (
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className="shrink-0 w-5 h-5 mt-0.5 rounded-md flex items-center justify-center bg-card border border-border"
              aria-hidden="true"
            >
              <meta.Mark className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {row.name}
                </p>
              </div>
              {row.identifier && (
                <p className="text-xs text-muted-foreground truncate">
                  {row.identifier}
                </p>
              )}
            </div>
          </div>
        );
      },
    }),
    [t],
  );

  const statusColumn = useMemo<YbColumn<Row>>(
    () => ({
      key: "status",
      header: t("table.status"),
      sortable: true,
      searchValue: (row) =>
        row.ok === true
          ? t("status.ok")
          : row.ok === false
            ? t("status.failed")
            : t("status.untested"),
      accessor: (row) => (
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            {row.ok === true && (
              <>
                <CheckCircle2
                  className="w-4 h-4 shrink-0 text-success"
                  aria-hidden="true"
                />
                <span className="sr-only">{t("status.ok")}:</span>
              </>
            )}
            {row.ok === false && (
              <>
                <XCircle
                  className="w-4 h-4 shrink-0 text-destructive"
                  aria-hidden="true"
                />
                <span className="sr-only">{t("status.failed")}:</span>
              </>
            )}
            {row.ok === null && (
              <span
                className="w-2 h-2 shrink-0 rounded-full bg-muted-foreground/30"
                aria-hidden="true"
              />
            )}
            <span className="text-sm text-foreground/80">
              {row.ok === true
                ? t("status.ok")
                : row.ok === false
                  ? t("status.failed")
                  : t("status.untested")}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {t("table.connectedShort")}: {formatDate(row.created_at)}
          </span>
        </div>
      ),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, locale],
  );

  const actionsColumn = useMemo<YbColumn<Row>>(
    () => ({
      key: "actions",
      header: t("table.actions"),
      sortable: false,
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          {row.delivery && (
            <YbTooltip content={tIntegrations("crm_accounts.edit")}>
              <YbButton
                variant="outline"
                size="sm"
                onClick={() =>
                  setDeliveryModal({
                    type: row.delivery!.type,
                    connection: row.delivery!,
                    fromAdd: false,
                  })
                }
                className="px-2"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </YbButton>
            </YbTooltip>
          )}
          <YbTooltip content={t("tooltips.delete")}>
            <YbButton
              variant="danger"
              size="sm"
              onClick={() => setDeleteTarget(row)}
              disabled={deleteFacebook.isPending || deleteDelivery.isPending}
              className="px-2"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </YbButton>
          </YbTooltip>
        </div>
      ),
    }),
    [t, tIntegrations, deleteFacebook.isPending, deleteDelivery.isPending],
  );

  const sourceColumns = useMemo(
    () => [sourceColumn, nameColumn, statusColumn, actionsColumn],
    [sourceColumn, nameColumn, statusColumn, actionsColumn],
  );
  const destinationColumns = useMemo(
    () => [groupedNameColumn, statusColumn, actionsColumn],
    [groupedNameColumn, statusColumn, actionsColumn],
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
          onClick={() => setAddOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={total >= MAX_CONNECTIONS}
          aria-haspopup="dialog"
        >
          {t("addButton")}
        </YbButton>
      </div>

      {total >= MAX_CONNECTIONS && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <YbCard className="border-l-4 border-l-amber-500 bg-warning-muted py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <p className="text-sm text-warning">{t("limit.reached")}</p>
            </div>
          </YbCard>
        </div>
      )}

      {loading ? (
        <YbCard>
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary mb-4 animate-spin" />
            <p className="text-muted-foreground">{t("loadingProfiles")}</p>
          </div>
        </YbCard>
      ) : total === 0 ? (
        <YbCard>
          <div className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="t-h4 text-foreground mb-2">{t("noProfiles")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("noProfilesDescription")}
            </p>
            <YbButton
              variant="primary"
              onClick={() => setAddOpen(true)}
              leftIcon={<Plus className="w-5 h-5" />}
            >
              {t("addFirstProfile")}
            </YbButton>
          </div>
        </YbCard>
      ) : (
        <>
          {/* Lead sources */}
          <YbCard>
            <YbCardHeader>
              <div className="flex items-center gap-2">
                <Rss
                  className="w-5 h-5 text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                />
                <YbCardTitle>
                  {t("groups.sources_title")} ({sourceRows.length})
                </YbCardTitle>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t("groups.sources_subtitle")}
              </p>
            </YbCardHeader>
            {sourceRows.length === 0 ? (
              <div className="py-10 text-center">
                <Rss
                  className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50"
                  aria-hidden="true"
                />
                <h3 className="text-base font-semibold text-foreground mb-1.5">
                  {t("groups.sources_empty_title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  {t("groups.sources_empty_desc")}
                </p>
                <YbButton
                  variant="outline"
                  size="sm"
                  onClick={() => setAddOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                  disabled={total >= MAX_CONNECTIONS}
                >
                  {t("addButton")}
                </YbButton>
              </div>
            ) : (
              <YbDataTable
                data={sourceRows}
                columns={sourceColumns}
                searchPlaceholder={t("searchPlaceholder")}
                defaultPageSize={25}
                emptyMessage={t("emptyMessage")}
              />
            )}
          </YbCard>

          {/* Lead destinations */}
          <YbCard>
            <YbCardHeader>
              <div className="flex items-center gap-2">
                <Send
                  className="w-5 h-5 text-cyan-600 dark:text-cyan-400"
                  aria-hidden="true"
                />
                <YbCardTitle>
                  {t("groups.destinations_title")} ({destinationRows.length})
                </YbCardTitle>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {t("groups.destinations_subtitle")}
              </p>
            </YbCardHeader>
            {destinationRows.length === 0 ? (
              <div className="py-10 text-center">
                <Send
                  className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50"
                  aria-hidden="true"
                />
                <h3 className="text-base font-semibold text-foreground mb-1.5">
                  {t("groups.destinations_empty_title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  {t("groups.destinations_empty_desc")}
                </p>
                <YbButton
                  variant="outline"
                  size="sm"
                  onClick={() => setAddOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                  disabled={total >= MAX_CONNECTIONS}
                >
                  {t("addButton")}
                </YbButton>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={destinationSearch}
                    onChange={(e) => setDestinationSearch(e.target.value)}
                    placeholder={t("destinations_search.placeholder")}
                    aria-label={t("destinations_search.placeholder")}
                    className="w-full pl-9 pr-9 py-2 text-sm bg-card border border-input rounded-lg focus-visible:ring-2 focus-visible:ring-ring dark:focus-visible:ring-ring focus:border-transparent outline-none transition-all text-foreground placeholder:text-muted-foreground"
                  />
                  {destinationSearch && (
                    <button
                      type="button"
                      onClick={() => setDestinationSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                      aria-label={t("destinations_search.clear")}
                    >
                      <XCircle className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                {hasDestinationSearch && filteredDestinationCount === 0 ? (
                  <div className="py-10 text-center">
                    <Search
                      className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-medium text-foreground/80">
                      {t("destinations_search.no_results")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("destinations_search.no_results_hint")}
                    </p>
                  </div>
                ) : (
                  FAMILY_ORDER.map((family) => {
                    const rows = destinationGroups[family];
                    if (rows.length === 0) return null;
                    return (
                      <section
                        key={family}
                        aria-labelledby={`dest-family-${family}-title`}
                        className="border border-border rounded-xl overflow-hidden"
                      >
                        <header className="px-4 py-2.5 bg-muted/50 border-b border-border">
                          <h3
                            id={`dest-family-${family}-title`}
                            className="text-sm font-semibold text-foreground"
                          >
                            {t(`groups.family_${family}_title`)}{" "}
                            <span className="text-muted-foreground font-normal">
                              ({rows.length})
                            </span>
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t(`groups.family_${family}_subtitle`)}
                          </p>
                        </header>
                        <div className="p-4">
                          <YbDataTable
                            data={rows}
                            columns={destinationColumns}
                            defaultPageSize={100}
                            emptyMessage={t("emptyMessage")}
                            showSearch={false}
                            showPagination={false}
                            className="space-y-0"
                          />
                        </div>
                      </section>
                    );
                  })
                )}
              </div>
            )}
          </YbCard>
        </>
      )}

      {/* CPA sites */}
      <YbCard variant="elevated">
        <YbCardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-2 rounded-lg bg-success-muted flex-shrink-0">
                <BarChart3
                  className="w-5 h-5 text-success"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <YbCardTitle className="text-base sm:text-lg">
                  {t("cpa.title")}
                </YbCardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("cpa.subtitle")}
                </p>
              </div>
            </div>
            <YbButton
              variant="outline"
              size="sm"
              onClick={() =>
                setDeliveryModal({
                  type: "cpa",
                  connection: null,
                  fromAdd: false,
                })
              }
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              {t("cpa.add")}
            </YbButton>
          </div>
        </YbCardHeader>
        {deliveryQuery.isLoading && cpaRows.length === 0 ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : cpaRows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("cpa.empty")}
          </div>
        ) : (
          <ul className="space-y-2">
            {cpaRows.map((row) => (
              <li
                key={row.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {row.name}
                    </p>
                    <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-success-muted text-success border border-success/40">
                      CPA
                    </span>
                  </div>
                  {row.identifier && (
                    <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                      {row.identifier}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setDeliveryModal({
                      type: "cpa",
                      connection: row.delivery ?? null,
                      fromAdd: false,
                    })
                  }
                  aria-label={tIntegrations("crm_accounts.edit")}
                  title={tIntegrations("crm_accounts.edit")}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-sky-500 text-sky-600 hover:bg-sky-50 dark:border-sky-400 dark:text-sky-400 dark:hover:bg-sky-900/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(row)}
                  aria-label={t("cpa.delete")}
                  title={t("cpa.delete")}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-destructive text-destructive hover:bg-destructive-muted dark:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </YbCard>

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={t("delete.title")}
          message={t("delete.message", { name: deleteTarget.name })}
          confirmText={t("delete.confirm")}
          cancelText={t("delete.cancel")}
          type="danger"
          loading={deleteFacebook.isPending || deleteDelivery.isPending}
        />
      )}

      {/* Add profile picker */}
      <AddProfileModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSelectFacebook={() => {
          setAddOpen(false);
          handleFacebookConnect();
        }}
        onSelectDelivery={(type) =>
          setDeliveryModal({ type, connection: null, fromAdd: true })
        }
        disabled={total >= MAX_CONNECTIONS}
      />

      {/* Delivery connection add/edit */}
      {deliveryModal && (
        <DeliveryConnectionModal
          key={
            deliveryModal.connection
              ? String(deliveryModal.connection.id)
              : `new-${deliveryModal.type}`
          }
          isOpen
          type={deliveryModal.type}
          connection={deliveryModal.connection}
          onClose={() => {
            setDeliveryModal(null);
            setAddOpen(false);
          }}
          onBack={
            deliveryModal.fromAdd ? () => setDeliveryModal(null) : undefined
          }
          nested={deliveryModal.fromAdd}
        />
      )}
    </div>
  );
}
