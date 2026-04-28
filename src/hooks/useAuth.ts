//frontend/src/hooks/useAuth.ts
"use client";

import { useAuthStore } from "@/store/authStore";
import { getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { LoginPayload, RegisterPayload } from "@/types";
import axios from "axios";

const AUTH_COOKIE = "auth-token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function setAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function useAuth() {
  const store = useAuthStore();
  const toast = useToast();
  const mergeCart = useCartStore((s) => s.mergeCart);
  const router = useRouter();

  const login = async (payload: LoginPayload, redirectTo = "/") => {
    try {
      // 1. Call login API — stores token in localStorage & Zustand
      await store.login(payload);

      // 2. Set a lightweight cookie the middleware can read on the next request
      setAuthCookie();

      // 3. Small wait to ensure Zustand persist writes to localStorage
      await new Promise((resolve) => setTimeout(resolve, 150));

      const currentUser = useAuthStore.getState().user;
      console.log("✅ Login successful:", {
        email: currentUser?.email,
        role: currentUser?.role,
      });

      // 4. Merge guest cart into user cart
      await mergeCart();

      // 5. Confirm to user
      toast("Welcome back!", "success");

      // 6. Hard navigate so middleware reads the fresh cookie
      window.location.href = redirectTo;
    } catch (error) {
      console.error("Login failed:", error);
      // Only show toast for non-validation errors (400s are shown by the form)
      if (!axios.isAxiosError(error) || error.response?.status !== 400) {
        toast(getApiError(error), "error");
      }
      throw error;
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      await store.register(payload);
      toast("Account created! Please check your email to verify.", "success");
      router.push("/login");
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 400) {
        toast(getApiError(error), "error");
      }
      throw error;
    }
  };

  const logout = async () => {
    await store.logout();
    clearAuthCookie();
    toast("Logged out successfully", "default");
    window.location.href = "/";
  };

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isAdmin: store.user?.role === "ADMIN",
    isStaffOrAdmin:
      store.user?.role === "ADMIN" || store.user?.role === "STAFF",
    login,
    register,
    logout,
  };
}
