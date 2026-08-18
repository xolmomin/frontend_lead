"use client";

import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Info } from "lucide-react";
import type { PacingGoal } from "@/lib/api/pacing";
import { useCreatePacingGoal, useUpdatePacingGoal } from "@/hooks/use-pacing";
import { useIntegrations } from "@/hooks/use-integrations";
import { YbModal } from "@/components/yb/modal";
import { YbButton } from "@/components/yb/button";
import { YbInput } from "@/components/yb/input";
import { coverageNote, type PacingScopeType } from "@/components/pacing/pacing";
import { DeliverySection } from "@/components/pacing/delivery-section";

// Production scope-type order. fb_account / ad_account need the production
// `/lead-targets/scopes/` endpoint, which the local backend lacks — the
// options stay visible but disabled.
const SCOPE_TYPES: readonly PacingScopeType[] = [
  "account",
  "form",
  "fb_account",
  "ad_account",
];
const SUPPORTED_SCOPE_TYPES: readonly PacingScopeType[] = ["account", "form"];

// Validation messages are hardcoded (Uzbek) in the production bundle's zod
// schema rather than going through i18n; replicated verbatim.
const TARGET_NOT_INT = "Faqat musbat butun son";
const TARGET_MIN = "Maqsad kamida 1 ta bo'lishi kerak";
const TARGET_MAX = "Maqsad juda katta";
const SCOPE_REQUIRED = "Qamrov qiymatini tanlang";

const SELECT_CLASS =
  "w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground";
const READONLY_FIELD_CLASS =
  "w-full px-3 py-2 text-sm rounded-lg border border-border bg-muted text-foreground/80";
const LABEL_CLASS = "block text-xs font-medium text-foreground/75 mb-1";

export function GoalFormModal({
  goal,
  onClose,
}: {
  /** `null` — create mode. */
  goal: PacingGoal | null;
  onClose: () => void;
}) {
  const t = useTranslations("leadPacing");
  const scopeTypeId = useId();
  const scopeValueId = useId();
  const modeLabelId = useId();
  const isEdit = goal !== null;

  const createMutation = useCreatePacingGoal();
  const updateMutation = useUpdatePacingGoal();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [scopeType, setScopeType] = useState<PacingScopeType>("account");
  const [scopeId, setScopeId] = useState("");
  // The local API has no custom periods — the "custom" toggle is disabled, so
  // mode effectively stays "monthly".
  const [mode, setMode] = useState<"monthly" | "custom">("monthly");
  const [target, setTarget] = useState(isEdit ? String(goal.monthly_goal) : "");
  const [errors, setErrors] = useState<{ target?: string; scopeId?: string }>(
    {},
  );

  const integrationsQuery = useIntegrations({});
  const scopeOptions =
    scopeType === "form"
      ? (integrationsQuery.data ?? []).map((integration) => ({
          value: String(integration.id),
          label: integration.name,
        }))
      : [];
  const scopeOptionsLoading =
    scopeType === "form" && integrationsQuery.isLoading;
  const formCoverage = coverageNote(
    scopeType === "ad_account" ? "paid_only" : null,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const trimmed = target.trim();
    const next: { target?: string; scopeId?: string } = {};
    if (!/^\d+$/.test(trimmed)) next.target = TARGET_NOT_INT;
    else if (Number(trimmed) < 1) next.target = TARGET_MIN;
    else if (Number(trimmed) > 1e7) next.target = TARGET_MAX;
    if (!isEdit && scopeType !== "account" && !scopeId)
      next.scopeId = SCOPE_REQUIRED;
    setErrors(next);
    if (next.target || next.scopeId) return;

    // Production silently swallows save errors (global interceptor toasts);
    // mirrored here by only reacting to success.
    const options = {
      onSuccess: () => {
        toast.success(t("form.saved"));
        onClose();
      },
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: goal.id, payload: { monthly_goal: Number(trimmed) } },
        options,
      );
    } else {
      createMutation.mutate(
        {
          scope: scopeType === "account" ? "account" : "integration",
          ...(scopeType === "account" ? {} : { integration_id: scopeId }),
          monthly_goal: Number(trimmed),
        },
        options,
      );
    }
  }

  return (
    <YbModal
      isOpen
      onClose={onClose}
      title={t(isEdit ? "form.edit" : "form.title")}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {isEdit ? (
          <div>
            <p className={LABEL_CLASS}>{t("form.scopeType")}</p>
            <div className={READONLY_FIELD_CLASS}>
              {t(goal.scope === "account" ? "scope.account" : "scope.form")}
              {goal.scope === "account"
                ? ""
                : ` — ${goal.integration_name || goal.integration_id}`}
            </div>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor={scopeTypeId} className={LABEL_CLASS}>
                {t("form.scopeType")}
              </label>
              <select
                id={scopeTypeId}
                className={SELECT_CLASS}
                value={scopeType}
                onChange={(event) => {
                  setScopeType(event.target.value as PacingScopeType);
                  setScopeId("");
                }}
              >
                {SCOPE_TYPES.map((type) => (
                  <option
                    key={type}
                    value={type}
                    disabled={!SUPPORTED_SCOPE_TYPES.includes(type)}
                  >
                    {t(`scope.${type}`)}
                  </option>
                ))}
              </select>
            </div>
            {scopeType === "account" ? null : (
              <div className="space-y-3">
                <div>
                  <label htmlFor={scopeValueId} className={LABEL_CLASS}>
                    {t("form.scopeValue")}
                  </label>
                  <select
                    id={scopeValueId}
                    className={SELECT_CLASS}
                    value={scopeId}
                    onChange={(event) => setScopeId(event.target.value)}
                  >
                    <option value="">{t("form.scopeValuePlaceholder")}</option>
                    {scopeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {!scopeOptionsLoading && scopeOptions.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {t("form.scopeValueEmpty")}
                    </p>
                  ) : null}
                  {errors.scopeId ? (
                    <p className="text-[11px] text-destructive mt-1">
                      {errors.scopeId}
                    </p>
                  ) : null}
                </div>
                {formCoverage ? (
                  <p className="flex items-start gap-1 text-[11px] text-warning">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{t(`coverage.${formCoverage}`)}</span>
                  </p>
                ) : null}
              </div>
            )}
          </>
        )}

        {isEdit ? (
          <div>
            <p className={LABEL_CLASS}>{t("form.modeLabel")}</p>
            <div className={READONLY_FIELD_CLASS}>{t("mode.monthly")}</div>
          </div>
        ) : (
          <div>
            <p id={modeLabelId} className={LABEL_CLASS}>
              {t("form.modeLabel")}
            </p>
            <div
              role="group"
              aria-labelledby={modeLabelId}
              className="grid grid-cols-2 gap-2"
            >
              {(["monthly", "custom"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  // Custom periods need production-only API fields
                  // (period_start / period_end); disabled locally.
                  disabled={value === "custom"}
                  onClick={() => setMode(value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    mode === value
                      ? " border-primary bg-primary-50/10 text-primary font-medium"
                      : "border-border bg-card text-foreground/75"
                  }`}
                >
                  {t(`mode.${value}`)}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t(mode === "custom" ? "mode.customHint" : "mode.monthlyHint")}
            </p>
          </div>
        )}

        <YbInput
          label={t(mode === "custom" ? "form.targetCustom" : "form.target")}
          type="number"
          inputMode="numeric"
          placeholder="5000"
          error={errors.target}
          value={target}
          onChange={(event) => setTarget(event.target.value)}
        />

        {/* alert_threshold_pct is a production-only field; shown with its
            default (90) but disabled since the local API cannot store it. */}
        <YbInput
          label={t("form.threshold")}
          type="number"
          inputMode="numeric"
          placeholder="90"
          value="90"
          disabled
          readOnly
        />

        {mode === "monthly" ? (
          <label className="flex items-start gap-2 cursor-pointer">
            {/* is_recurring is production-only; local monthly goals always
                recur, so the checkbox is fixed on and disabled. */}
            <input
              type="checkbox"
              defaultChecked
              disabled
              className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-visible:ring-ring"
            />
            <span className="text-sm text-foreground/80">
              {t("form.recurring")}
              <span className="block text-[11px] text-muted-foreground">
                {t("form.recurringHint")}
              </span>
            </span>
          </label>
        ) : null}

        <DeliverySection />

        <div className="flex gap-3 pt-2">
          <YbButton
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            {t("form.cancel")}
          </YbButton>
          <YbButton
            type="submit"
            variant="primary"
            loading={isPending}
            className="flex-1"
          >
            {t("form.save")}
          </YbButton>
        </div>
      </form>
    </YbModal>
  );
}
