"use client";

import { create } from "zustand";
import { Product } from "@/types";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

export interface WishlistItem {
  id: string;
  productId: string;
  wishlistId: string;
  createdAt: string;
  product: Product;
}

interface WishlistStore {
  items: WishlistItem[];
  productIds: Set<string>;
  itemCount: number;
  isLoading: boolean;

  fetchWishlist: () => Promise<void>;
  toggleItem: (productId: string) => Promise<"added" | "removed">;
  removeItem: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  items: [],
  productIds: new Set(),
  itemCount: 0,
  isLoading: false,

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const res = await apiGet<{
        success: boolean;
        data: {
          items: WishlistItem[];
          productIds: string[];
          itemCount: number;
        };
      }>("/wishlist");
      const { items, productIds, itemCount } = res.data;
      set({
        items: items ?? [],
        productIds: new Set(productIds ?? []),
        itemCount: itemCount ?? 0,
      });
    } catch {
      set({ items: [], productIds: new Set(), itemCount: 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleItem: async (productId: string) => {
    // Optimistic update — update UI immediately
    const prevIds = get().productIds;
    const prevItems = get().items;
    const isIn = prevIds.has(productId);
    const nextIds = new Set(prevIds);
    isIn ? nextIds.delete(productId) : nextIds.add(productId);
    set({ productIds: nextIds, itemCount: nextIds.size });

    try {
      const res = await apiPost<{
        success: boolean;
        data: {
          action: "added" | "removed";
          productIds: string[];
          itemCount: number;
        };
      }>(`/wishlist/${productId}`);

      const { action, productIds, itemCount } = res.data;

      // ✅ FIX: Set productIds from API response first, THEN fetch full items
      // Don't let fetchWishlist race against this set()
      set({ productIds: new Set(productIds), itemCount });

      if (action === "added") {
        // Fetch full item data for the wishlist page (non-blocking)
        // Use a separate async call that won't overwrite productIds optimistically
        apiGet<{
          success: boolean;
          data: {
            items: WishlistItem[];
            productIds: string[];
            itemCount: number;
          };
        }>("/wishlist")
          .then((r) => {
            // ✅ Only update items + itemCount, NOT productIds (already correct from API)
            set({ items: r.data.items ?? [] });
          })
          .catch(() => {});
      } else {
        // For removal, update items list immediately without fetching
        set({ items: prevItems.filter((i) => i.productId !== productId) });
      }

      return action;
    } catch {
      // Revert optimistic update on failure
      set({ productIds: prevIds, itemCount: prevIds.size, items: prevItems });
      return isIn ? "removed" : "added";
    }
  },

  removeItem: async (productId: string) => {
    const prevIds = get().productIds;
    const prevItems = get().items;
    const nextIds = new Set(prevIds);
    nextIds.delete(productId);
    set({
      productIds: nextIds,
      itemCount: nextIds.size,
      items: prevItems.filter((i) => i.productId !== productId),
    });
    try {
      await apiDelete(`/wishlist/${productId}`);
    } catch {
      set({ productIds: prevIds, itemCount: prevIds.size, items: prevItems });
    }
  },

  clearWishlist: async () => {
    const prev = {
      items: get().items,
      productIds: get().productIds,
      itemCount: get().itemCount,
    };
    set({ items: [], productIds: new Set(), itemCount: 0 });
    try {
      await apiDelete("/wishlist");
    } catch {
      set(prev);
    }
  },

  isInWishlist: (productId: string) => get().productIds.has(productId),
}));

// Selectors
export const useWishlistCount = () => useWishlistStore((s) => s.itemCount);
export const useWishlistIds = () => useWishlistStore((s) => s.productIds);
