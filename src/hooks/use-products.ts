"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  listProducts,
  productKeys,
  updateProduct,
  type CreateProductPayload,
  type Product,
  type UpdateProductPayload,
} from "@/lib/api/products";

function useInvalidate() {
  const queryClient = useQueryClient();
  return (...keys: readonly (readonly unknown[])[]) => {
    for (const key of keys) {
      void queryClient.invalidateQueries({ queryKey: key as unknown[] });
    }
  };
}

// --- Queries ---

export function useProducts() {
  return useQuery({ queryKey: productKeys.list, queryFn: listProducts });
}

// --- Mutations ---

export function useCreateProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProduct(payload),
    onSuccess: () => invalidate(productKeys.list),
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Product["id"];
      payload: UpdateProductPayload;
    }) => updateProduct(id, payload),
    onSuccess: () => invalidate(productKeys.list),
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: Product["id"]) => deleteProduct(id),
    onSuccess: () => invalidate(productKeys.list),
  });
}
