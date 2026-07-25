"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Integration } from "@/lib/api/integrations";
import {
  useDeleteIntegration,
  useDeliveryConnections,
  useFolders,
  useUpdateIntegration,
} from "@/hooks/use-integrations";
import { deliveryTypeMeta } from "@/components/integrations/meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_FOLDER = "__none__";

export function EditIntegrationDialog({
  integration,
  open,
  onOpenChange,
}: {
  integration: Integration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("integrations.editDialog");
  const tFolders = useTranslations("integrations.folders");
  const tToasts = useTranslations("integrations.toasts");
  const tCommon = useTranslations("common");

  const { data: folders = [] } = useFolders();
  const { data: connections = [] } = useDeliveryConnections();
  const mutation = useUpdateIntegration();

  const [nameError, setNameError] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string>(
    integration.folder_id === null ? NO_FOLDER : String(integration.folder_id),
  );
  const [connectionId, setConnectionId] = useState<string>(
    integration.delivery_connection
      ? String(integration.delivery_connection.id)
      : "",
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") ?? "").trim();
    if (!name) {
      setNameError(t("nameRequired"));
      return;
    }
    setNameError(null);
    mutation.mutate(
      {
        id: integration.id,
        payload: {
          name,
          folder_id: folderId === NO_FOLDER ? null : folderId,
          ...(connectionId ? { delivery_connection_id: connectionId } : {}),
        },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          toast.success(tToasts("saved"));
        },
        onError: () => toast.error(tToasts("error")),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="integration-name">{t("name")}</Label>
            <Input
              id="integration-name"
              name="name"
              defaultValue={integration.name}
              autoComplete="off"
            />
            {nameError && <p className="text-sm text-destructive">{nameError}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("folder")}</Label>
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

          <div className="flex flex-col gap-2">
            <Label>{t("receiver")}</Label>
            <Select value={connectionId} onValueChange={setConnectionId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {connections.map((connection) => (
                  <SelectItem key={connection.id} value={String(connection.id)}>
                    {connection.name} — {deliveryTypeMeta[connection.type]?.label ?? connection.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteIntegrationDialog({
  integration,
  open,
  onOpenChange,
  onDeleted,
}: {
  integration: Integration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const t = useTranslations("integrations.deleteDialog");
  const tToasts = useTranslations("integrations.toasts");
  const tCommon = useTranslations("common");
  const mutation = useDeleteIntegration();

  function handleDelete() {
    mutation.mutate(integration.id, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(tToasts("deleted"));
        onDeleted?.();
      },
      onError: () => {
        onOpenChange(false);
        toast.error(tToasts("error"));
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("description", { name: integration.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={mutation.isPending}>
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
