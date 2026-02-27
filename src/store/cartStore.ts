//frontend/src/store/cartStore.ts
"use client";

import { create } from "zustand";
import { CartItem, Product } from "@/types";
import { apiGet, apiPost, apiPut, apiDelete, getApiError } from "@/lib/api";

interface CartStore {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isLoading: boolean;
  isOpen: boolean;

  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const calcTotals = (items: CartItem[]) => ({
  subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
  itemCount: items.reduce((s, i) => s + i.quantity, 0),
});

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  subtotal: 0,
  itemCount: 0,
  isLoading: false,
  isOpen: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await apiGet<{
        success: boolean;
        data: {
          cart: { items: CartItem[] } | null;
          items: CartItem[];
          summary: { subtotal: number; itemCount: number };
        };
      }>("/cart");

      // ✅ Use the flattened response structure
      const { items, summary } = res.data;
      set({
        items: items || [],
        subtotal: summary?.subtotal || 0,
        itemCount: summary?.itemCount || 0,
      });
    } catch {
      // Silently fail — guest cart may not exist
      set({ items: [], subtotal: 0, itemCount: 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity) => {
    set({ isLoading: true });
    try {
      const res = await apiPost<{
        success: boolean;
        data: {
          cart: { items: CartItem[] };
          summary: { subtotal: number; itemCount: number };
        };
      }>("/cart", { productId, quantity });

      // ✅ Use cart.items and summary from response
      const { cart, summary } = res.data;
      set({
        items: cart.items,
        subtotal: summary.subtotal,
        itemCount: summary.itemCount,
        isOpen: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: async (itemId, quantity) => {
    set({ isLoading: true });
    try {
      await apiPut(`/cart/${itemId}`, { quantity });
      // Re-fetch cart after update
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (itemId) => {
    // Optimistic update
    const prevItems = get().items;
    const newItems = prevItems.filter((i) => i.id !== itemId);
    set({ items: newItems, ...calcTotals(newItems) });

    try {
      await apiDelete(`/cart/${itemId}`);
      // Re-fetch to get accurate state
      await get().fetchCart();
    } catch {
      // Revert on failure
      set({ items: prevItems, ...calcTotals(prevItems) });
    }
  },

  clearCart: async () => {
    const prevItems = get().items;
    set({ items: [], subtotal: 0, itemCount: 0 });
    try {
      await apiDelete("/cart");
    } catch {
      set({ items: prevItems, ...calcTotals(prevItems) });
    }
  },

  mergeCart: async () => {
    try {
      await apiPost("/cart/merge");
      await get().fetchCart();
    } catch {}
  },

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
}));

// Selectors
export const useCartItems = () => useCartStore((s) => s.items);
export const useCartCount = () => useCartStore((s) => s.itemCount);
export const useCartSubtotal = () => useCartStore((s) => s.subtotal);
export const useCartOpen = () => useCartStore((s) => s.isOpen);
