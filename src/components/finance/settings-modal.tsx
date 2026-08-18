"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { YbButton } from "@/components/yb/button";
import { YbModal } from "@/components/yb/modal";
import { YbSwitch } from "@/components/yb/switch";

/**
 * Production "Finance settings" modal (rate override + alert thresholds +
 * Telegram toggles), ported 1:1 from lidlar.uz.
 *
 * The local API has no /finance/settings endpoint yet, so the form is a
 * UI shell: fields are editable locally but nothing is loaded or persisted and
 * the save button stays disabled (production disables it while settings are
 * unavailable, so the markup is identical). The CBU-rate banner is omitted for
 * the same reason — production hides it when the rate is unknown.
 */
export function FinanceSettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("finance");
  const [manualRate, setManualRate] = useState("");
  const [alertCpl, setAlertCpl] = useState("");
  const [alertRoas, setAlertRoas] = useState("");
  const [cplAlerts, setCplAlerts] = useState(true);
  const [pnlAlerts, setPnlAlerts] = useState(true);
  const [pnlDigest, setPnlDigest] = useState(true);

  return (
    <YbModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("settings.title")}
      size="md"
    >
      <div className="space-y-5">
        <div className="divide-y divide-border">
          <NumberRow
            label={t("settings.rate_label")}
            hint={t("settings.rate_hint")}
            value={manualRate}
            onChange={setManualRate}
            placeholder="—"
            step="0.01"
            suffix="UZS"
          />
          <NumberRow
            label={t("settings.alert_cpl")}
            hint={t("settings.alert_cpl_hint")}
            value={alertCpl}
            onChange={setAlertCpl}
            placeholder="—"
            step="0.01"
            suffix="$"
          />
          <NumberRow
            label={t("settings.alert_roas")}
            hint={t("settings.alert_roas_hint")}
            value={alertRoas}
            onChange={setAlertRoas}
            placeholder="1.0"
            step="0.1"
            suffix="×"
          />
          <ToggleRow
            label={t("settings.cpl_alerts")}
            hint={t("settings.cpl_alerts_hint")}
            checked={cplAlerts}
            onChange={setCplAlerts}
          />
          <ToggleRow
            label={t("settings.pnl_alerts")}
            hint={t("settings.pnl_alerts_hint")}
            checked={pnlAlerts}
            onChange={setPnlAlerts}
          />
          <ToggleRow
            label={t("settings.pnl_digest")}
            hint={t("settings.pnl_digest_hint")}
            checked={pnlDigest}
            onChange={setPnlDigest}
          />
        </div>
        <div className="flex justify-end border-t border-border pt-4">
          {/* Save stays disabled until the settings API exists locally. */}
          <YbButton variant="primary" size="sm" disabled>
            {t("settings.save")}
          </YbButton>
        </div>
      </div>
    </YbModal>
  );
}

function NumberRow({
  label,
  hint,
  value,
  onChange,
  placeholder,
  step,
  suffix,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  step?: string;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 sm:flex-1">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
        {hint ? (
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="relative w-full sm:w-40 sm:flex-shrink-0">
        <input
          id={id}
          type="number"
          min="0"
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-card py-2 pl-3 pr-11 text-sm tabular-nums text-foreground focus:border-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 sm:flex-1">
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        {hint ? (
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="sm:flex-shrink-0">
        <YbSwitch
          aria-label={label}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
