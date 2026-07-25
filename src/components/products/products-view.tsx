"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Package01Icon,
  PencilEdit01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { formatSum } from "@/lib/money";
import type { Product } from "@/lib/api/products";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/use-products";
import { useDeliveryConnections } from "@/hooks/use-integrations";
import { deliveryTypeMeta } from "@/components/integrations/meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const NO_CONNECTION = "__none__";

function LoadErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("dashboard");
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
      <p className="text-sm text-muted-foreground">{t("loadError")}</p>
      <Button variant="outline" onClick={onRetry}>
        {t("retry")}
      </Button>
    </div>
  );
}

function ProductStatusBadge({ status }: { status: Product["status"] }) {
  const t = useTranslations("products.status");
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active"
          ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      )}
    >
      {status === "active" ? t("active") : t("inactive")}
    </Badge>
  );
}

function ProductFormDialog({
  product,
  open,
  onOpenChange,
}: {
  /** `null` — create mode. */
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("products.form");
  const tToasts = useTranslations("products.toasts");
  const tCommon = useTranslations("common");

  const { data: connections = [] } = useDeliveryConnections();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [formError, setFormError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string>(
    product?.delivery_connection
      ? String(product.delivery_connection.id)
      : NO_CONNECTION,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const stream = String(form.get("stream") ?? "").trim();
    const domain = String(form.get("domain") ?? "").trim();
    const price = Number(String(form.get("price") ?? "").replace(/\s+/g, ""));

    if (!name) {
      setFormError(t("nameRequired"));
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setFormError(t("priceInvalid"));
      return;
    }
    setFormError(null);

    const payload = {
      name,
      price,
      stream: stream || null,
      domain: domain || null,
      delivery_connection_id:
        connectionId === NO_CONNECTION ? null : connectionId,
    };

    const options = {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(tToasts("saved"));
      },
      onError: () => toast.error(tToasts("error")),
    };
    if (product) {
      updateMutation.mutate({ id: product.id, payload }, options);
    } else {
      createMutation.mutate(payload, options);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {product ? t("editTitle") : t("createTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-name">{t("name")}</Label>
            <Input
              id="product-name"
              name="name"
              defaultValue={product?.name ?? ""}
              placeholder={t("namePlaceholder")}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-stream">{t("stream")}</Label>
            <Input
              id="product-stream"
              name="stream"
              defaultValue={product?.stream ?? ""}
              placeholder={t("streamPlaceholder")}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-price">{t("price")}</Label>
            <Input
              id="product-price"
              name="price"
              type="number"
              min={0}
              step="any"
              inputMode="numeric"
              defaultValue={product ? String(product.price) : ""}
              placeholder={t("pricePlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("receiver")}</Label>
            <Select value={connectionId} onValueChange={setConnectionId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CONNECTION}>
                  {t("noReceiver")}
                </SelectItem>
                {connections.map((connection) => (
                  <SelectItem key={connection.id} value={String(connection.id)}>
                    {connection.name} —{" "}
                    {deliveryTypeMeta[connection.type]?.label ?? connection.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="product-domain">{t("domain")}</Label>
            <Input
              id="product-domain"
              name="domain"
              defaultValue={product?.domain ?? ""}
              placeholder={t("domainPlaceholder")}
              autoComplete="off"
            />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProductDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("products.deleteDialog");
  const tToasts = useTranslations("products.toasts");
  const tCommon = useTranslations("common");
  const mutation = useDeleteProduct();

  function handleDelete() {
    mutation.mutate(product.id, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(tToasts("deleted"));
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
            {t("description", { name: product.name })}
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

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");
  const tToasts = useTranslations("products.toasts");
  const updateMutation = useUpdateProduct();

  function handleToggle(checked: boolean) {
    updateMutation.mutate(
      {
        id: product.id,
        payload: { status: checked ? "active" : "inactive" },
      },
      { onError: () => toast.error(tToasts("error")) },
    );
  }

  const price = formatSum(product.price);

  return (
    <TableRow>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>
        {product.stream ? (
          <Badge variant="outline">{product.stream}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {price !== null ? `${price} ${tCommon("sum")}` : "—"}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {product.delivery_connection ? (
          <span>
            {product.delivery_connection.name}
            <span className="text-muted-foreground">
              {" "}
              ·{" "}
              {deliveryTypeMeta[product.delivery_connection.type]?.label ??
                product.delivery_connection.type}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {product.domain || <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={product.status === "active"}
            disabled={updateMutation.isPending}
            aria-label={t("toggleStatus")}
            onCheckedChange={handleToggle}
          />
          <ProductStatusBadge status={product.status} />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("edit")}
            onClick={onEdit}
          >
            <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("delete")}
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ProductsView() {
  const t = useTranslations("products");
  const productsQuery = useProducts();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const products = productsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
          {t("create")}
        </Button>
      </div>

      <Card>
        <CardContent>
          {productsQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : productsQuery.isError ? (
            <LoadErrorState onRetry={() => productsQuery.refetch()} />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <HugeiconsIcon
                icon={Package01Icon}
                className="size-10 text-muted-foreground/50"
              />
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
              <Button variant="outline" onClick={() => setCreateOpen(true)}>
                {t("create")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colName")}</TableHead>
                    <TableHead>{t("colStream")}</TableHead>
                    <TableHead>{t("colPrice")}</TableHead>
                    <TableHead>{t("colReceiver")}</TableHead>
                    <TableHead>{t("colDomain")}</TableHead>
                    <TableHead>{t("colStatus")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onEdit={() => setEditing(product)}
                      onDelete={() => setDeleting(product)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {createOpen && (
        <ProductFormDialog
          product={null}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
      {editing && (
        <ProductFormDialog
          key={String(editing.id)}
          product={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      )}
      {deleting && (
        <DeleteProductDialog
          product={deleting}
          open
          onOpenChange={(open) => {
            if (!open) setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
