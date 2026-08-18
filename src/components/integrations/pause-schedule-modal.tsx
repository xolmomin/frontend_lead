"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HelpCircle, Pause, Play, Send } from "lucide-react";
import { YbButton } from "@/components/yb/button";
import { YbModal } from "@/components/yb/modal";

/**
 * Pause confirmation modal, ported from the production pause-schedule modal.
 * The local backend has no auto pause/start/send hour scheduling, so the
 * schedule selects are rendered as a disabled shell ("no schedule") and
 * confirming simply pauses the integration(s).
 */
export function PauseScheduleModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  isBulk,
  scenarioName,
  scopeNote,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  isBulk: boolean;
  scenarioName?: string;
  scopeNote?: string;
}) {
  const t = useTranslations("integrations.pauseSchedule");
  const [showHelp, setShowHelp] = useState(false);
  void scenarioName;

  const rows = [
    {
      key: "pause",
      icon: <Pause className="w-4 h-4 text-warning" aria-hidden="true" />,
      label: t("autoPauseLabel"),
      help: t("helpPauseShort"),
    },
    {
      key: "start",
      icon: <Play className="w-4 h-4 text-success" aria-hidden="true" />,
      label: t("autoStartLabel"),
      help: t("helpStartShort"),
    },
    {
      key: "send",
      icon: <Send className="w-4 h-4 text-info" aria-hidden="true" />,
      label: t("autoSendLabel"),
      help: t("helpSendShort"),
    },
  ];

  return (
    <YbModal
      isOpen={isOpen}
      onClose={onClose}
      title={isBulk ? t("titleBulk") : t("title")}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        {isBulk && scopeNote && (
          <p className="whitespace-pre-line rounded-lg bg-warning-muted border border-warning/40 px-3 py-2 text-xs text-warning">
            {scopeNote}
          </p>
        )}
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-xl border border-border"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                {row.icon}
                {row.label}
              </span>
              <select
                disabled
                className="px-3 py-1.5 text-sm rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed"
                aria-label={row.label}
              >
                <option>{t("noSchedule")}</option>
              </select>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowHelp((current) => !current)}
          aria-expanded={showHelp}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
          {t("helpToggle")}
        </button>
        {showHelp && (
          <ul className="space-y-1.5 rounded-lg bg-info-muted border border-info/30 px-3 py-2 text-xs text-info">
            {rows.map((row) => (
              <li key={row.key}>{row.help}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-3 pt-2">
          <YbButton
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            {t("cancel")}
          </YbButton>
          <YbButton
            type="button"
            variant="primary"
            onClick={onConfirm}
            loading={loading}
            className="flex-1"
          >
            {t("confirm")}
          </YbButton>
        </div>
      </div>
    </YbModal>
  );
}
