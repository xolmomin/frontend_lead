"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { YbModal } from "@/components/yb/modal";

type ModalType = "info" | "warning" | "danger" | "success";

const ICON_BG: Record<ModalType, string> = {
  info: "bg-info-muted text-info",
  warning: "bg-warning-muted text-warning",
  danger: "bg-destructive-muted text-destructive",
  success: "bg-success-muted text-success",
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ModalType;
  loading?: boolean;
}

/**
 * Built on YbModal so it inherits the focus trap, Escape handling, body scroll
 * lock and aria wiring — it used to hand-roll a bare role="dialog" with none of
 * those, which mattered because this is the logout confirmation.
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = "info",
  loading = false,
}: ConfirmModalProps) {
  const t = useTranslations("common");
  const titleId = useId();

  const Icon =
    type === "success" ? CheckCircle2 : type === "info" ? Info : AlertTriangle;

  return (
    <YbModal
      isOpen={isOpen}
      // While the confirmed action is in flight the dialog must stay put.
      onClose={loading ? () => {} : onClose}
      showCloseButton={false}
      closeOnEscape={!loading}
      closeOnBackdrop={!loading}
      size="sm"
      labelledBy={titleId}
      bare
    >
      <div className="p-6">
        <div
          className={cn(
            "inline-flex items-center justify-center w-12 h-12 rounded-full mb-4",
            ICON_BG[type],
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        <h3 id={titleId} className="t-h4 text-foreground mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border-2 border-input text-foreground/80 font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            {cancelText ?? t("actions.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2",
              type === "danger"
                ? "bg-destructive hover:bg-destructive"
                : "bg-primary hover:bg-primary/90",
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText ?? t("actions.confirm")}
          </button>
        </div>
      </div>
    </YbModal>
  );
}
