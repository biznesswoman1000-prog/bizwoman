// app/(customer)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { PageLoader } from "@/components/shared/loading-spinner";
import { Header } from "@/components/customer/header";
import { Footer } from "@/components/customer/footer";
import { CartDrawer } from "@/components/customer/cart/cart-drawer";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async () => {
      try {
        await checkAuth();

        if (!isMounted) return;

        const currentAuth = useAuthStore.getState().isAuthenticated;

        console.log("🔐 Account access check:", { isAuthenticated: currentAuth });

        if (!currentAuth) {
          console.log("❌ Not authenticated, redirecting to login");
          router.replace("/login?redirect=/account");
          return;
        }

        console.log("✅ Account access verified");
        setIsChecking(false);
      } catch (error) {
        console.error("Account access check failed:", error);
        if (isMounted) {
          router.replace("/login?redirect=/account");
        }
      }
    };

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [checkAuth, router]);

  if (isChecking || !isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
