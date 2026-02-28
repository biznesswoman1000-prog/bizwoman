"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, LoginPayload, RegisterPayload } from "@/types";
import { apiPost, apiGet } from "@/lib/api";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (payload) => {
        set({ isLoading: true });
        try {
          const res = await apiPost<{
            success: boolean;
            data: { user: User; accessToken: string; refreshToken: string };
          }>("/auth/login", payload);

          const { user, accessToken, refreshToken } = res.data;

          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);

          set({ user, accessToken, isAuthenticated: true, isLoading: false });

          // ✅ Load wishlist immediately after login — token is already in localStorage
          useWishlistStore.getState().fetchWishlist();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          await apiPost("/auth/register", payload);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await apiPost("/auth/logout");
        } catch {}
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, accessToken: null, isAuthenticated: false });
        // ✅ Clear wishlist and cart on logout
        useWishlistStore.setState({
          items: [],
          productIds: new Set(),
          itemCount: 0,
        });
      },

      setUser: (user) => set({ user, isAuthenticated: true }),

      refreshUser: async () => {
        try {
          const res = await apiGet<{ success: boolean; data: { user: User } }>(
            "/auth/me",
          );
          set({ user: res.data.user, isAuthenticated: true });
        } catch {
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      // ✅ checkAuth now fetches wishlist itself after confirming auth
      // This ensures token is valid and in localStorage BEFORE wishlist fetches
      checkAuth: async () => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          set({ user: null, accessToken: null, isAuthenticated: false });
          return;
        }

        const wasAuthenticated = get().isAuthenticated;

        try {
          const res = await apiGet<{ success: boolean; data: { user: User } }>(
            "/auth/me",
          );
          set({
            user: res.data.user,
            accessToken: token,
            isAuthenticated: true,
          });

          // ✅ Only fetch wishlist if we weren't already authenticated
          // (avoids re-fetching on every visibility change if already loaded)
          if (!wasAuthenticated) {
            useWishlistStore.getState().fetchWishlist();
          }
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "sbw-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsAdmin = () => {
  const user = useAuthStore((s) => s.user);
  return user?.role === "ADMIN";
};
export const useIsStaffOrAdmin = () => {
  const user = useAuthStore((s) => s.user);
  return user?.role === "ADMIN" || user?.role === "STAFF";
};
