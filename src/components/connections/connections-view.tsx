"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  MoreVerticalIcon,
  PencilEdit01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { ApiError } from "@/lib/api";
import type { DeliveryConnection, DeliveryType } from "@/lib/api/integrations";
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
import { FacebookSourcesSection } from "@/components/connections/facebook-sources";
import { deliveryTypeMeta } from "@/components/integrations/meta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DELIVERY_TYPES: DeliveryType[] = [
  "telegram",
  "sheets",
  "bitrix24",
  "amocrm",
  "cpa",
  "webhook",
];

function ConnectionDialog({
  open,
  onOpenChange,
  connection,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set — edit mode. */
  connection?: DeliveryConnection;
}) {
  const t = useTranslations("connections.delivery");
  const tConfig = useTranslations("connections.config");
  const tToasts = useTranslations("integrations.toasts");
  const tCommon = useTranslations("common");

  const [type, setType] = useState<DeliveryType>(connection?.type ?? "telegram");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateDeliveryConnection();
  const updateMutation = useUpdateDeliveryConnection();
  const pending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();

    const nextErrors: Record<string, string> = {};
    if (!name) nextErrors.name = t("nameRequired");
    const parsed = parseConnectionConfig(formData, type, (key) => tConfig(key));
    if (!parsed.ok) Object.assign(nextErrors, parsed.errors);
    if (Object.keys(nextErrors).length > 0 || !parsed.ok) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    const callbacks = {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(tToasts("saved"));
      },
      onError: () => toast.error(tToasts("error")),
    };

    if (connection) {
      updateMutation.mutate(
        { id: connection.id, payload: { name, type, config: parsed.config } },
        callbacks,
      );
    } else {
      createMutation.mutate({ name, type, config: parsed.config }, callbacks);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {connection ? t("editTitle") : t("addTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="connection-name">{t("name")}</Label>
            <Input
              id="connection-name"
              name="name"
              defaultValue={connection?.name ?? ""}
              placeholder={t("namePlaceholder")}
              autoComplete="off"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("type")}</Label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as DeliveryType);
                setErrors({});
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELIVERY_TYPES.map((deliveryType) => (
                  <SelectItem key={deliveryType} value={deliveryType}>
                    {deliveryTypeMeta[deliveryType].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ConnectionConfigFields
            key={type}
            type={type}
            defaults={connection?.type === type ? connection?.config : undefined}
            errors={errors}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConnectionsView() {
  const t = useTranslations("connections");
  const tToasts = useTranslations("integrations.toasts");
  const tIntegrations = useTranslations("integrations");
  const tCommon = useTranslations("common");

  const connectionsQuery = useDeliveryConnections();
  const deleteMutation = useDeleteDeliveryConnection();

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DeliveryConnection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryConnection | null>(
    null,
  );

  const connections = connectionsQuery.data ?? [];

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(tToasts("deleted"));
      },
      onError: (error) => {
        setDeleteTarget(null);
        toast.error(
          error instanceof ApiError && error.status === 409
            ? t("delivery.inUse")
            : tToasts("error"),
        );
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <FacebookSourcesSection />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">{t("delivery.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("delivery.description")}
            </p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <HugeiconsIcon icon={PlusSignIcon} data-icon="inline-start" />
            {t("delivery.add")}
          </Button>
        </div>

        {connectionsQuery.isLoading && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-xl" />
            ))}
          </div>
        )}

        {connectionsQuery.isError && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
            <p className="text-sm text-muted-foreground">{tCommon("error")}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => connectionsQuery.refetch()}
            >
              {tIntegrations("retry")}
            </Button>
          </div>
        )}

        {connectionsQuery.isSuccess && connections.length === 0 && (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            {t("delivery.empty")}
          </div>
        )}

        {connections.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {connections.map((connection) => {
              const meta =
                deliveryTypeMeta[connection.type] ?? deliveryTypeMeta.webhook;
              return (
                <Card key={connection.id} className="py-4">
                  <CardContent className="flex items-start gap-3 px-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <HugeiconsIcon icon={meta.icon} className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{connection.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {meta.label}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t("delivery.edit")}
                        >
                          <HugeiconsIcon icon={MoreVerticalIcon} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditTarget(connection)}
                        >
                          <HugeiconsIcon icon={PencilEdit01Icon} />
                          {t("delivery.edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(connection)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} />
                          {t("delivery.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {addOpen && (
        <ConnectionDialog open={addOpen} onOpenChange={setAddOpen} />
      )}
      {editTarget && (
        <ConnectionDialog
          key={String(editTarget.id)}
          open={editTarget !== null}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          connection={editTarget}
        />
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delivery.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delivery.deleteDescription", {
                name: deleteTarget?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {t("delivery.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
