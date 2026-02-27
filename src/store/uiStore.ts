'use client';

import { create } from 'zustand';

type ToastVariant = 'default' | 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface UIStore {
  // Toast
  toasts: Toast[];
  toast: (message: string, variant?: ToastVariant, duration?: number) => void;
  dismissToast: (id: string) => void;

  // Mobile nav
  mobileNavOpen: boolean;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;

  // Search
  searchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;

  // Quick view product modal
  quickViewProductId: string | null;
  openQuickView: (productId: string) => void;
  closeQuickView: () => void;

  // Confirm dialog
  confirmDialog: {
    open: boolean;
    title: string;
    description: string;
    onConfirm: (() => void) | null;
  };
  openConfirm: (title: string, description: string, onConfirm: () => void) => void;
  closeConfirm: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  // ─── Toast ─────────────────────────────────────────────────────────────────
  toasts: [],
  toast: (message, variant = 'default', duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, variant, duration }] }));
    setTimeout(() => get().dismissToast(id), duration);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // ─── Mobile nav ────────────────────────────────────────────────────────────
  mobileNavOpen: false,
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),

  // ─── Search ────────────────────────────────────────────────────────────────
  searchOpen: false,
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),

  // ─── Quick view ────────────────────────────────────────────────────────────
  quickViewProductId: null,
  openQuickView: (productId) => set({ quickViewProductId: productId }),
  closeQuickView: () => set({ quickViewProductId: null }),

  // ─── Confirm dialog ────────────────────────────────────────────────────────
  confirmDialog: { open: false, title: '', description: '', onConfirm: null },
  openConfirm: (title, description, onConfirm) =>
    set({ confirmDialog: { open: true, title, description, onConfirm } }),
  closeConfirm: () =>
    set({ confirmDialog: { open: false, title: '', description: '', onConfirm: null } }),
}));

// Convenience hooks
export const useToast = () => useUIStore((s) => s.toast);
export const useToasts = () => useUIStore((s) => s.toasts);
export const useDismissToast = () => useUIStore((s) => s.dismissToast);
