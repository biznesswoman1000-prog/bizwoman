//frontend/src/hooks/useProducts.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { Product, Pagination } from "@/types";
import { apiGet, getApiError } from "@/lib/api";

interface ProductFilters {
  search?: string;

  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  tags?: string[];
  sort?: "random" | "newest" | "price_asc" | "price_desc" | "popular" | "name"; // ✅ Added "random"
  page?: number;
  limit?: number;
}

interface UseProductsReturn {
  products: Product[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProducts(filters: ProductFilters = {}): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, v]) => v !== undefined && v !== "" && v !== null,
        ),
      );
      const res = await apiGet<{
        success: boolean;
        data: { products: Product[]; pagination: Pagination };
      }>("/products", params);
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, pagination, isLoading, error, refetch: fetchProducts };
}

export function useProduct(idOrSlug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idOrSlug) return;
    setIsLoading(true);
    apiGet<{ success: boolean; data: { product: Product } }>(
      `/products/${idOrSlug}`,
    )
      .then((res) => setProduct(res.data.product))
      .catch((err) => setError(getApiError(err)))
      .finally(() => setIsLoading(false));
  }, [idOrSlug]);

  return { product, isLoading, error };
}

export function useFeaturedProducts(limit = 8) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiGet<{ success: boolean; data: { products: Product[] } }>(
      "/products/featured",
    )
      .then((res) => setProducts(res.data.products.slice(0, limit)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { products, isLoading };
}

export function useNewArrivals(limit = 8) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiGet<{ success: boolean; data: { products: Product[] } }>(
      "/products/new-arrivals",
    )
      .then((res) => setProducts(res.data.products.slice(0, limit)))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { products, isLoading };
}
