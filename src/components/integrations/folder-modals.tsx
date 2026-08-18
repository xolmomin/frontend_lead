"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import type { Folder } from "@/lib/api/integrations";
import { cn } from "@/lib/utils";
import { YbButton } from "@/components/yb/button";
import { YbModal } from "@/components/yb/modal";
import { ConfirmModal } from "@/components/dashboard/confirm-modal";

const NAME_MAX = 50;
const NAME_WARN = NAME_MAX - 10;

function FolderForm({
  initialName = "",
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
  onDirtyChange,
}: {
  initialName?: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const t = useTranslations("integrations");
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  const counterId = `${fieldId}-counter`;
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-seed the field when a different folder is loaded (render-time adjust).
  const [prevInitialName, setPrevInitialName] = useState(initialName);
  if (initialName !== prevInitialName) {
    setPrevInitialName(initialName);
    setName(initialName);
    setError(null);
  }

  useEffect(() => {
    onDirtyChange?.(name !== initialName);
  }, [name, initialName, onDirtyChange]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const validate = useCallback(
    (value: string): string | null => {
      if (!value.trim()) return t("folders.errorRequired");
      if (value.trim().length > NAME_MAX) return t("folders.errorTooLong");
      return null;
    },
    [t],
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validate(name);
    if (validation) {
      setError(validation);
      return;
    }
    onSubmit(name.trim());
  };

  const length = name.length;
  const counterColor =
    length >= NAME_MAX
      ? "text-destructive font-semibold"
      : length >= NAME_WARN
        ? "text-warning"
        : "text-muted-foreground";

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <div className="flex items-baseline justify-between gap-3 mb-1.5">
          <label
            htmlFor={fieldId}
            className="block text-sm font-medium text-foreground/80"
          >
            {t("folders.nameLabel")}
            <span aria-hidden="true" className="ml-0.5 text-destructive">
              *
            </span>
          </label>
          <span
            id={counterId}
            className={cn(
              "text-xs tabular-nums transition-colors",
              counterColor,
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {length}/{NAME_MAX}
          </span>
        </div>
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          maxLength={NAME_MAX}
          placeholder={t("folders.namePlaceholder")}
          disabled={submitting}
          autoComplete="off"
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={cn(error && errorId, counterId)}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError(validate(event.target.value));
          }}
          onBlur={() => setError(validate(name))}
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200",
            "bg-card text-foreground",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
            error
              ? "border-destructive focus:border-destructive focus-visible:ring-destructive"
              : "border-input focus-visible:border-primary focus-visible:ring-ring",
            submitting && "opacity-50 cursor-not-allowed",
          )}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <YbButton
          type="button"
          variant="outline"
          onClick={onCancel}
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
          leftIcon={<Save className="w-4 h-4" />}
        >
          {submitLabel}
        </YbButton>
      </div>
    </form>
  );
}

/** Add/edit/delete folder modals with unsaved-changes guard (`vt` in the prod chunk). */
export function FolderModals({
  showAddModal,
  onCloseAddModal,
  onSubmitAdd,
  submittingAdd,
  showEditModal,
  onCloseEditModal,
  onSubmitEdit,
  editingFolder,
  submittingEdit,
  showDeleteDialog,
  onCloseDeleteDialog,
  onConfirmDelete,
  folderToDelete,
  deleting,
}: {
  showAddModal: boolean;
  onCloseAddModal: () => void;
  onSubmitAdd: (name: string) => void;
  submittingAdd: boolean;
  showEditModal: boolean;
  onCloseEditModal: () => void;
  onSubmitEdit: (name: string) => void;
  editingFolder: Folder | null;
  submittingEdit: boolean;
  showDeleteDialog: boolean;
  onCloseDeleteDialog: () => void;
  onConfirmDelete: () => void;
  folderToDelete: Folder | null;
  deleting: boolean;
}) {
  const t = useTranslations("integrations");
  const [addDirty, setAddDirty] = useState(false);
  const [editDirty, setEditDirty] = useState(false);
  const [unsavedFor, setUnsavedFor] = useState<"add" | "edit" | null>(null);

  const requestCloseAdd = useCallback(() => {
    if (submittingAdd) return;
    if (addDirty) setUnsavedFor("add");
    else onCloseAddModal();
  }, [addDirty, submittingAdd, onCloseAddModal]);

  const requestCloseEdit = useCallback(() => {
    if (submittingEdit) return;
    if (editDirty) setUnsavedFor("edit");
    else onCloseEditModal();
  }, [editDirty, submittingEdit, onCloseEditModal]);

  const confirmUnsaved = useCallback(() => {
    const which = unsavedFor;
    setUnsavedFor(null);
    if (which === "add") onCloseAddModal();
    else if (which === "edit") onCloseEditModal();
  }, [unsavedFor, onCloseAddModal, onCloseEditModal]);

  return (
    <>
      <YbModal
        isOpen={showAddModal}
        onClose={requestCloseAdd}
        title={t("modal.addFolderTitle")}
      >
        <FolderForm
          initialName=""
          onSubmit={onSubmitAdd}
          onCancel={requestCloseAdd}
          submitting={submittingAdd}
          submitLabel={t("modal.save")}
          onDirtyChange={setAddDirty}
        />
      </YbModal>
      <YbModal
        isOpen={showEditModal}
        onClose={requestCloseEdit}
        title={t("modal.editFolderTitle")}
      >
        <FolderForm
          initialName={editingFolder?.name ?? ""}
          onSubmit={onSubmitEdit}
          onCancel={requestCloseEdit}
          submitting={submittingEdit}
          submitLabel={t("modal.save")}
          onDirtyChange={setEditDirty}
        />
      </YbModal>
      <ConfirmModal
        isOpen={unsavedFor !== null}
        onClose={() => setUnsavedFor(null)}
        onConfirm={confirmUnsaved}
        title={t("modal.unsavedTitle")}
        message={t("modal.unsavedMessage")}
        confirmText={t("modal.unsavedConfirm")}
        cancelText={t("modal.unsavedKeepEditing")}
        type="warning"
      />
      {folderToDelete && (
        <ConfirmModal
          isOpen={showDeleteDialog}
          onClose={onCloseDeleteDialog}
          onConfirm={onConfirmDelete}
          title={t("modal.deleteFolderTitle")}
          message={t("modal.deleteFolderMessage", {
            name: folderToDelete.name,
          })}
          confirmText={t("modal.confirmDelete")}
          cancelText={t("modal.cancel")}
          type="danger"
          loading={deleting}
        />
      )}
    </>
  );
}
