//frontend/src/hooks/useAuth.ts
"use client";

import { useAuthStore } from "@/store/authStore";
import { getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";
import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { LoginPayload, RegisterPayload } from "@/types";
import axios from "axios";

export function useAuth() {
  const store = useAuthStore();
  const toast = useToast();
  const mergeCart = useCartStore((s) => s.mergeCart);
  const router = useRouter();

  const login = async (payload: LoginPayload, redirectTo = "/") => {
    try {
      // 1. Call login API
      await store.login(payload);

      // 2. Wait a bit for state to persist to cookie
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 3. Verify we have the user data
      const currentUser = useAuthStore.getState().user;
      const currentAuth = useAuthStore.getState().isAuthenticated;

      console.log("✅ Login successful:", {
        email: currentUser?.email,
        role: currentUser?.role,
        isAuthenticated: currentAuth,
      });

      // 4. Merge cart items
      await mergeCart();

      // 5. Show success message
      toast("Welcome back!", "success");

      // 6. Force a hard navigation to ensure middleware reads fresh state
      // Using window.location instead of router.push ensures a full page load
      window.location.href = redirectTo;
    } catch (error) {
      console.error("Login failed:", error);

      // Don't show toast for validation errors (400) - let form handle it
      if (!axios.isAxiosError(error) || error.response?.status !== 400) {
        toast(getApiError(error), "error");
      }
      throw error; // Re-throw so form can catch it
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      await store.register(payload);
      toast("Account created! Please check your email to verify.", "success");
      router.push("/login");
    } catch (error) {
      // Don't show toast for validation errors (400) - let form handle it
      if (!axios.isAxiosError(error) || error.response?.status !== 400) {
        toast(getApiError(error), "error");
      }
      throw error; // Re-throw so form can catch it
    }
  };

  const logout = async () => {
    await store.logout();
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
