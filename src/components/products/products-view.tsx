"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check,
  Copy,
  ExternalLink,
  Package,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSum } from "@/lib/money";
import type { Product } from "@/lib/api/products";
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "@/hooks/use-products";
import { useDomains } from "@/hooks/use-domains";
import { useDeliveryConnections } from "@/hooks/use-integrations";
import { YbCard } from "@/components/yb/card";
import { YbButton } from "@/components/yb/button";
import { YbBadge } from "@/components/yb/badge";
import { YbInput } from "@/components/yb/input";
import { YbModal } from "@/components/yb/modal";
import { YbSelect } from "@/components/yb/select";
import { YbDataTable, type YbColumn } from "@/components/yb/data-table";
import { ConfirmModal } from "@/components/dashboard/confirm-modal";

function formatSom(value: string | number | null | undefined): string {
  const formatted = formatSum(value);
  return formatted === null ? "—" : `${formatted} so'm`;
}

/** Production-style toggle row (raw peer-checkbox markup). */
function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer- focus-visible:ring-ring dark:peer- focus-visible:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-input after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
      </label>
    </div>
  );
}

function ProductModal({
  isOpen,
  onClose,
  editingProduct,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
}) {
  const t = useTranslations("products");
  const tCommon = useTranslations("common");

  const domainsQuery = useDomains();
  const connectionsQuery = useDeliveryConnections();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const saving = createMutation.isPending || updateMutation.isPending;

  const [name, setName] = useState(editingProduct?.name ?? "");
  const [price, setPrice] = useState(
    editingProduct ? String(editingProduct.price) : "",
  );
  const [stream, setStream] = useState(editingProduct?.stream ?? "");
  const [domain, setDomain] = useState(editingProduct?.domain ?? "");
  const [connectionId, setConnectionId] = useState(
    editingProduct?.delivery_connection
      ? String(editingProduct.delivery_connection.id)
      : "",
  );
  const [isActive, setIsActive] = useState(
    editingProduct ? editingProduct.status === "active" : true,
  );

  const domainOptions = useMemo(
    () =>
      (domainsQuery.data ?? []).map((d) => ({ value: d.name, label: d.name })),
    [domainsQuery.data],
  );
  const connectionOptions = useMemo(
    () =>
      (connectionsQuery.data ?? []).map((c) => ({
        value: String(c.id),
        label: c.name,
      })),
    [connectionsQuery.data],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (!name.trim()) {
      toast.error(t("toast.nameRequired"));
      return;
    }
    const parsedPrice = Number(price.replace(/\s+/g, ""));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error(t("toast.priceInvalid"));
      return;
    }

    const payload = {
      name: name.trim(),
      price: parsedPrice,
      stream: stream.trim() || null,
      domain: domain || null,
      delivery_connection_id: connectionId || null,
    };

    if (editingProduct) {
      updateMutation.mutate(
        {
          id: editingProduct.id,
          payload: {
            ...payload,
            status: isActive ? ("active" as const) : ("inactive" as const),
          },
        },
        {
          onSuccess: () => {
            toast.success(t("toast.updated"));
            onClose();
          },
          onError: () => toast.error(tCommon("messages.error")),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(t("toast.created"));
          onClose();
        },
        onError: () => toast.error(tCommon("messages.error")),
      });
    }
  }

  return (
    <YbModal
      isOpen={isOpen}
      onClose={onClose}
      title={t(editingProduct ? "modal.edit" : "modal.add")}
      size="lg"
    >
      <form
        id="product-form"
        onSubmit={handleSubmit}
        className={cn(
          "space-y-6",
          editingProduct && "max-h-[70vh] overflow-y-auto pr-1",
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <YbSelect
            label={t("modal.domain")}
            value={domain}
            onChange={setDomain}
            options={domainOptions}
            placeholder={t("modal.domainPlaceholder")}
          />
          <YbSelect
            label={t("modal.website")}
            value={connectionId}
            onChange={setConnectionId}
            options={connectionOptions}
            placeholder={t("modal.websitePlaceholder")}
          />
        </div>
        <YbInput
          label={t("modal.name")}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("modal.namePlaceholder")}
        />
        <YbInput
          label={t("modal.price")}
          required
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder={t("modal.pricePlaceholder")}
        />
        <YbInput
          label={t("modal.stream")}
          value={stream}
          onChange={(e) => setStream(e.target.value)}
          placeholder={t("modal.streamPlaceholder")}
        />
        <ToggleRow
          title={t("modal.active")}
          description={t("modal.activeDescription")}
          checked={isActive}
          onChange={setIsActive}
        />
      </form>
      <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-border">
        <YbButton type="button" variant="ghost" onClick={onClose}>
          {t("modal.cancel")}
        </YbButton>
        <YbButton
          type="submit"
          form="product-form"
          loading={saving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          {t(editingProduct ? "modal.save" : "modal.add")}
        </YbButton>
      </div>
    </YbModal>
  );
}

export function ProductsView() {
  const t = useTranslations("products");

  const productsQuery = useProducts();
  const deleteMutation = useDeleteProduct();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [copiedId, setCopiedId] = useState<Product["id"] | null>(null);

  const products = productsQuery.data ?? [];

  const openAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const copyStream = useCallback(
    async (product: Product) => {
      if (!product.stream) return;
      const url = product.domain
        ? `https://${product.domain}/stream/${product.stream}/`
        : product.stream;
      try {
        await navigator.clipboard.writeText(url);
        setCopiedId(product.id);
        toast.success(t("toast.copied"));
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        toast.error(t("toast.copyError"));
      }
    },
    [t],
  );

  const handleDelete = () => {
    if (!deletingProduct) return;
    deleteMutation.mutate(deletingProduct.id, {
      onSuccess: () => {
        toast.success(t("toast.deleted"));
        setDeletingProduct(null);
      },
      onError: () => setDeletingProduct(null),
    });
  };

  const columns = useMemo<YbColumn<Product>[]>(
    () => [
      {
        key: "index",
        header: t("table.index"),
        accessor: (_row, index) => (index ?? 0) + 1,
        sortable: false,
        className: "w-16",
      },
      {
        key: "name",
        header: t("table.name"),
        sortable: true,
        searchValue: (row) => row.name,
        accessor: (row) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">{row.name}</p>
            </div>
          </div>
        ),
      },
      {
        key: "stream",
        header: t("table.stream"),
        sortable: false,
        searchValue: (row) => row.stream ?? "",
        accessor: (row) =>
          row.stream ? (
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 bg-muted rounded text-sm">
                {row.stream}
              </code>
              <button
                onClick={() => copyStream(row)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                title={t("tooltips.copy")}
              >
                {copiedId === row.id ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "price",
        numeric: true,
        header: t("table.price"),
        sortable: true,
        searchValue: (row) => String(row.price),
        accessor: (row) => (
          <span className="font-medium">{formatSom(row.price)}</span>
        ),
      },
      {
        key: "website",
        header: t("table.website"),
        sortable: false,
        searchValue: (row) => row.delivery_connection?.name ?? "",
        accessor: (row) =>
          row.delivery_connection ? (
            <YbBadge variant="default" size="sm">
              {row.delivery_connection.name}
            </YbBadge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "domain",
        header: t("table.domain"),
        sortable: false,
        searchValue: (row) => row.domain ?? "",
        accessor: (row) =>
          row.domain ? (
            <a
              href={
                row.stream
                  ? `https://${row.domain}/stream/${row.stream}/`
                  : `https://${row.domain}/`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:text-primary"
            >
              {row.domain}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        key: "status",
        header: t("table.status"),
        sortable: false,
        accessor: (row) => (
          <YbBadge
            variant={row.status === "active" ? "success" : "danger"}
            size="sm"
          >
            {row.status === "active"
              ? t("status.active")
              : t("status.inactive")}
          </YbBadge>
        ),
      },
      {
        key: "actions",
        header: t("table.actions"),
        sortable: false,
        className: "w-40",
        accessor: (row) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setEditingProduct(row);
                setModalOpen(true);
              }}
              className="p-2 rounded-lg hover:bg-info-muted text-info transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t("tooltips.edit")}
              aria-label={t("tooltips.edit")}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingProduct(row)}
              className="p-2 rounded-lg hover:bg-destructive-muted text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={t("tooltips.delete")}
              aria-label={t("tooltips.delete")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [copiedId, t, copyStream],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="t-h2 text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <YbButton onClick={openAdd} leftIcon={<Plus className="w-4 h-4" />}>
          {t("addButton")}
        </YbButton>
      </div>

      <YbCard>
        <YbDataTable
          data={products}
          columns={columns}
          loading={productsQuery.isLoading}
          searchPlaceholder={t("searchPlaceholder")}
          emptyMessage={t("emptyMessage")}
        />
      </YbCard>

      {modalOpen && (
        <ProductModal
          key={editingProduct ? String(editingProduct.id) : "new"}
          isOpen={modalOpen}
          onClose={closeModal}
          editingProduct={editingProduct}
        />
      )}

      <ConfirmModal
        isOpen={deletingProduct !== null}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDelete}
        title={t("delete.title")}
        message={t("delete.message", { name: deletingProduct?.name ?? "" })}
        confirmText={t("delete.confirm")}
        cancelText={t("delete.cancel")}
        type="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
