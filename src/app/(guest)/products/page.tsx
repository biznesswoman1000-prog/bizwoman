//frontend/src/app/(guest)/products/page.tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/customer/product-card";
import {
  ProductCardSkeleton,
  EmptyState,
  ErrorState,
} from "@/components/shared/loading-spinner";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";

const sortOptions = [
  { value: "random", label: "Random" }, // ✅ NEW: Random option
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Most Popular" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name A–Z" },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const { categories } = useCategories();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState(searchParams.get("sort") || "random"); // ✅ Default to random
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState(
    searchParams.get("categoryId") || "",
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [inStock, setInStock] = useState(
    searchParams.get("inStock") === "true",
  );
  const [page, setPage] = useState(1);

  const { products, pagination, isLoading, error, refetch } = useProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
    sort: sort as any,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    inStock: inStock || undefined,
    isFeatured: searchParams.get("isFeatured") === "true" || undefined,
    isNewArrival: searchParams.get("isNewArrival") === "true" || undefined,
    page,
    limit: 20,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryId("");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setSort("random"); // ✅ Reset to random
    setPage(1);
  };

  const hasActiveFilters =
    search || categoryId || minPrice || maxPrice || inStock;

  return (
    <div className="container py-8 lg:py-12">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-gray-900">
          All Products
        </h1>
        {pagination && (
          <p className="mt-1 text-sm text-gray-500">
            {pagination.total.toLocaleString()} products found
          </p>
        )}
      </div>

      {/* Search + sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </form>

        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 bg-white"
          >
            {sortOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-brand-300 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-brand-600" />
            )}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="mb-6 p-4 rounded-xl border border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-500 bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Min Price (₦)
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max Price (₦)
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="No limit"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  In Stock Only
                </span>
              </label>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  setPage(1);
                  setFiltersOpen(false);
                }}
                className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Apply
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:text-gray-700"
                  title="Clear filters"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {error ? (
        <ErrorState message={error} retry={refetch} />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xxl:grid-cols-5 gap-4 lg:gap-5">
            {isLoading
              ? Array.from({ length: 20 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))
              : products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>

          {!isLoading && products.length === 0 && (
            <EmptyState
              title="No products found"
              description="Try adjusting your filters or search query"
              action={
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium"
                >
                  Clear Filters
                </button>
              }
            />
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-brand-300 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-brand-300 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
