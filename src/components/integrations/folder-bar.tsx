"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Folder01Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { ApiError } from "@/lib/api";
import type { Folder } from "@/lib/api/integrations";
import {
  useCreateFolder,
  useDeleteFolder,
  useRenameFolder,
} from "@/hooks/use-integrations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function FolderNameDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  defaultName = "",
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  defaultName?: string;
  pending: boolean;
  onSubmit: (name: string) => void;
}) {
  const t = useTranslations("integrations.folders");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") ?? "").trim();
    if (!name) {
      setError(t("nameRequired"));
      return;
    }
    setError(null);
    onSubmit(name);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="folder-name">{t("namePlaceholder")}</Label>
            <Input
              id="folder-name"
              name="name"
              defaultValue={defaultName}
              placeholder={t("namePlaceholder")}
              autoComplete="off"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function FolderBar({
  folders,
  loading,
  activeId,
  onChange,
}: {
  folders: Folder[];
  loading: boolean;
  activeId: string | null;
  onChange: (id: string | null) => void;
}) {
  const t = useTranslations("integrations.folders");
  const tToasts = useTranslations("integrations.toasts");
  const tCommon = useTranslations("common");

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Folder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);

  const createMutation = useCreateFolder();
  const renameMutation = useRenameFolder();
  const deleteMutation = useDeleteFolder();

  function handleCreate(name: string) {
    createMutation.mutate(name, {
      onSuccess: () => {
        setCreateOpen(false);
        toast.success(tToasts("saved"));
      },
      onError: () => toast.error(tToasts("error")),
    });
  }

  function handleRename(name: string) {
    if (!renameTarget) return;
    renameMutation.mutate(
      { id: renameTarget.id, name },
      {
        onSuccess: () => {
          setRenameTarget(null);
          toast.success(tToasts("saved"));
        },
        onError: () => toast.error(tToasts("error")),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        if (activeId === String(target.id)) onChange(null);
        setDeleteTarget(null);
        toast.success(tToasts("deleted"));
      },
      onError: (error) => {
        setDeleteTarget(null);
        toast.error(
          error instanceof ApiError && error.status === 409
            ? t("notEmpty")
            : tToasts("error"),
        );
      },
    });
  }

  const chipClass = (active: boolean) =>
    cn(
      "flex h-7 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
      active
        ? "border-primary/40 bg-primary/10 text-primary"
        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        className={chipClass(activeId === null)}
        onClick={() => onChange(null)}
      >
        {t("all")}
      </button>

      {loading && folders.length === 0 && (
        <>
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
        </>
      )}

      {folders.map((folder) => {
        const active = activeId === String(folder.id);
        return (
          <div
            key={folder.id}
            className={cn(chipClass(active), "cursor-pointer pr-1")}
            onClick={() => onChange(String(folder.id))}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter") onChange(String(folder.id));
            }}
          >
            <HugeiconsIcon icon={Folder01Icon} className="size-3.5" />
            {folder.name}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  onClick={(event) => event.stopPropagation()}
                  aria-label={t("rename")}
                >
                  <HugeiconsIcon icon={MoreVerticalIcon} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                onClick={(event) => event.stopPropagation()}
              >
                <DropdownMenuItem onClick={() => setRenameTarget(folder)}>
                  <HugeiconsIcon icon={PencilEdit01Icon} />
                  {t("rename")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteTarget(folder)}
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                  {t("delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}

      <button
        type="button"
        className={cn(chipClass(false), "border-dashed")}
        onClick={() => setCreateOpen(true)}
      >
        <HugeiconsIcon icon={PlusSignIcon} className="size-3.5" />
        {t("new")}
      </button>

      <FolderNameDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t("createTitle")}
        submitLabel={t("create")}
        pending={createMutation.isPending}
        onSubmit={handleCreate}
      />

      <FolderNameDialog
        key={renameTarget ? String(renameTarget.id) : "rename"}
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
        title={t("renameTitle")}
        submitLabel={t("rename")}
        defaultName={renameTarget?.name ?? ""}
        pending={renameMutation.isPending}
        onSubmit={handleRename}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
