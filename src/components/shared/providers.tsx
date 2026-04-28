// components/shared/providers.tsx
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

// Routes that should NEVER be blocked waiting for auth
const ALWAYS_PUBLIC = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/",
  "/products",
  "/categories",
  "/blog",
  "/about",
  "/contact",
  "/cart",
  "/privacy",
  "/terms",
];

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const initialized = useRef(false);

  // Hydrate cart immediately — guests can have carts too
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Initialize auth once, silently — never block the render
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    // Fire-and-forget: layouts handle their own auth guards
    checkAuth().catch(() => {});
  }, [checkAuth]);

  // Never block rendering — let each layout/page handle auth redirects
  return <>{children}</>;
}
