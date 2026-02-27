// components/shared/providers.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const checkAuth = useAuthStore((s) => s.checkAuth);
  const fetchCart = useCartStore((s) => s.fetchCart);

  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  /**
   * 1. Hydrate cart immediately on app load
   * Cart is harmless — even guests can have carts
   */
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  /**
   * 2. Initialize auth once
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsAuthInitialized(true);
      }
    };

    initAuth();
  }, [checkAuth]);

  /**
   * 3. Public routes (no auth blocking)
   */
  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  /**
   * 4. Block protected routes until auth is ready
   */
  if (!isPublicPage && !isAuthInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return <>{children}</>;
}
