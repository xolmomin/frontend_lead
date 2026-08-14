"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { YbModal } from "@/components/yb/modal";

type ModalType = "info" | "warning" | "danger" | "success";

const ICON_BG: Record<ModalType, string> = {
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  warning:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
  danger: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  success:
    "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
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
        <h3
          id={titleId}
          className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2"
        >
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
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
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary-600 hover:bg-primary-700",
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
