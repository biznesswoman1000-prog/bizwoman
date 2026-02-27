// app/(admin)/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminHeader } from "@/components/admin/header";
import { SidebarProvider } from "@/components/admin/sidebar-context";
import { PageLoader } from "@/components/shared/loading-spinner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async () => {
      try {
        // Check authentication with backend
        await checkAuth();

        if (!isMounted) return;

        // Get fresh state after check
        const currentUser = useAuthStore.getState().user;
        const currentAuth = useAuthStore.getState().isAuthenticated;
        const isAdmin =
          currentUser?.role === "ADMIN" || currentUser?.role === "STAFF";

        console.log("🔐 Admin layout check:", {
          isAuthenticated: currentAuth,
          role: currentUser?.role,
          isAdmin,
        });

        if (!currentAuth) {
          console.log("❌ Not authenticated, redirecting to login");
          router.replace("/login?redirect=/admin");
          return;
        }

        if (!isAdmin) {
          console.log("❌ Not admin/staff, redirecting to home");
          router.replace("/?error=unauthorized");
          return;
        }

        console.log("✅ Admin access verified");
        setIsChecking(false);
      } catch (error) {
        console.error("Admin access check failed:", error);
        if (isMounted) {
          router.replace("/login?redirect=/admin");
        }
      }
    };

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [checkAuth, router]);

  // Show loader while checking or if not authorized
  const isAdmin = user?.role === "ADMIN" || user?.role === "STAFF";

  if (isChecking || !isAuthenticated || !isAdmin) {
    return <PageLoader />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <AdminSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
