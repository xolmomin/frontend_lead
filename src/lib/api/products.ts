/**
 * Stage-6 Products API layer.
 *
 * Every products endpoint path lives in this file so it can be adjusted in one
 * place when the backend contract changes.
 */
import { apiFetch } from "@/lib/api";
import type { DeliveryConnectionRef } from "@/lib/api/integrations";

// --- Types ---

export type ProductStatus = "active" | "inactive";

export interface Product {
  id: number | string;
  name: string;
  stream: string | null;
  price: string | number;
  delivery_connection: DeliveryConnectionRef | null;
  domain: string | null;
  status: ProductStatus;
  created_at: string;
}

export interface CreateProductPayload {
  name: string;
  stream?: string | null;
  price: number;
  delivery_connection_id?: DeliveryConnectionRef["id"] | null;
  domain?: string | null;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  status?: ProductStatus;
}

// Some list endpoints may return either a bare array or an `{items: []}`
// envelope; normalize both shapes.
function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { items?: unknown }).items)
  ) {
    return (data as { items: T[] }).items;
  }
  return [];
}

// --- Query keys ---

export const productKeys = {
  list: ["products"] as const,
};

// --- Fetchers ---

export async function listProducts(): Promise<Product[]> {
  return asList<Product>(await apiFetch<unknown>("/products"));
}

export function createProduct(payload: CreateProductPayload): Promise<Product> {
  return apiFetch<Product>("/products", { method: "POST", body: payload });
}

export function updateProduct(
  id: Product["id"],
  payload: UpdateProductPayload,
): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteProduct(id: Product["id"]): Promise<void> {
  return apiFetch<void>(`/products/${id}`, { method: "DELETE" });
}
