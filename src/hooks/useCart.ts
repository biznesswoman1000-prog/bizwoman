//frontend/src/hooks/useCart.ts
"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/store/uiStore";
import { getApiError } from "@/lib/api";

export function useCart() {
  const store = useCartStore();
  const toast = useToast();

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      await store.addItem(productId, quantity);
      toast("Added to cart", "success");
    } catch (error) {
      toast(getApiError(error), "error");
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    try {
      await store.updateItem(itemId, quantity);
    } catch (error) {
      toast(getApiError(error), "error");
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      await store.removeItem(itemId);
      toast("Item removed", "default");
    } catch (error) {
      toast(getApiError(error), "error");
    }
  };

  const clearCart = async () => {
    try {
      await store.clearCart();
    } catch (error) {
      toast(getApiError(error), "error");
    }
  };

  return {
    items: store.items,
    subtotal: store.subtotal,
    itemCount: store.itemCount,
    isLoading: store.isLoading,
    isOpen: store.isOpen,
    openCart: store.openCart,
    closeCart: store.closeCart,
    toggleCart: store.toggleCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart: store.fetchCart,
  };
}
