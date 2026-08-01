"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl" | "full";

const SIZES: Record<Size, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-full",
};

export interface YbModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: Size;
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  onBack?: () => void;
  nested?: boolean;
}

export const YbModal = memo(function YbModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnEscape = true,
  closeOnBackdrop = true,
  onBack,
  nested = false,
}: YbModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const t = useTranslations("common");
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeOnEscape]);

  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length > 0) focusables[0].focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", trap);
    return () => panel.removeEventListener("keydown", trap);
  }, [isOpen]);

  const onBackdrop = useCallback(() => {
    if (closeOnBackdrop) onCloseRef.current();
  }, [closeOnBackdrop]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 animate-in fade-in duration-150",
          nested
            ? "bg-black/70 backdrop-blur-md z-[52]"
            : "bg-black/50 backdrop-blur-sm z-[50]",
        )}
        onClick={onBackdrop}
      />
      <div
        className={cn(
          "fixed inset-0 overflow-y-auto",
          nested ? "z-[53]" : "z-[51]",
        )}
      >
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            className={cn(
              "relative w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200",
              SIZES[size],
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || showCloseButton || onBack) && (
              <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    aria-label={t("actions.back")}
                    className="flex-shrink-0 -ml-1 p-2.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                {title && (
                  <div
                    id={titleId}
                    className={cn(
                      "min-w-0 flex-1 text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100",
                      typeof title === "string" && "truncate",
                    )}
                  >
                    {title}
                  </div>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    aria-label={t("actions.close")}
                    className="flex-shrink-0 ml-auto p-2.5 sm:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            <div className="px-4 sm:px-6 py-4">{children}</div>
          </div>
        </div>
      </div>
    </>
  );
});
