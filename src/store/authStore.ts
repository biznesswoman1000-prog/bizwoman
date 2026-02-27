//frontend/src/store/authStore.ts
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, LoginPayload, RegisterPayload } from "@/types";
import { apiPost, apiGet } from "@/lib/api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
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

          // ✅ Set state immediately with user data
          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // ✅ Force persist to localStorage/cookies immediately
          // This ensures middleware can read the updated state
          await new Promise((resolve) => setTimeout(resolve, 100));
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

      // ✅ Check authentication status with backend
      checkAuth: async () => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          set({ user: null, accessToken: null, isAuthenticated: false });
          return;
        }

        try {
          // ✅ Always fetch fresh user data from backend
          const res = await apiGet<{ success: boolean; data: { user: User } }>(
            "/auth/me",
          );

          // ✅ Update stored user with fresh data
          set({
            user: res.data.user,
            accessToken: token,
            isAuthenticated: true,
          });
        } catch (error) {
          // Token is invalid or expired, clear everything
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

// Convenience selectors
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
