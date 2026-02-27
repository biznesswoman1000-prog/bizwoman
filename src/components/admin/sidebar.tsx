"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  Mail,
  Truck,
  Star,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Building2,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/admin/sidebar-context";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "Products",
    icon: Package,
    children: [
      { label: "All Products", href: "/admin/products" },
      { label: "Add Product", href: "/admin/products/new" },
      { label: "Categories", href: "/admin/categories" },
      { label: "Brands", href: "/admin/brands" },
      { label: "Inventory", href: "/admin/inventory" },
    ],
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    children: [
      { label: "All Orders", href: "/admin/orders" },
      { label: "Quotations", href: "/admin/quotations" },
    ],
  },
  {
    label: "Customers",
    icon: Users,
    children: [
      { label: "All Customers", href: "/admin/customers" },
      { label: "User Management", href: "/admin/users" },
    ],
  },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  {
    label: "Marketing",
    icon: Mail,
    children: [
      { label: "Email Campaigns", href: "/admin/marketing/emails" },
      { label: "SMS Campaigns", href: "/admin/marketing/sms" },
      { label: "Abandoned Carts", href: "/admin/marketing/abandoned-carts" },
      { label: "Discounts", href: "/admin/discounts" },
    ],
  },
  { label: "Consultations", href: "/admin/consultations", icon: MessageSquare },
  {
    label: "Blog",
    icon: BookOpen,
    children: [
      { label: "All Posts", href: "/admin/blog" },
      { label: "New Post", href: "/admin/blog/new" },
    ],
  },
  {
    label: "Shipping",
    icon: Truck,
    children: [
      { label: "Shipping Zones", href: "/admin/shipping/zones" },
      { label: "All Methods", href: "/admin/shipping/methods" },
    ],
  },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "General", href: "/admin/settings" },
      { label: "Pages", href: "/admin/settings/pages" },
      { label: "Site Identity", href: "/admin/settings/site" },
      { label: "Email Config", href: "/admin/settings/email" },
      { label: "SMS Config", href: "/admin/settings/sms" },
    ],
  },
];

function NavItemComponent({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = item.href
    ? pathname === item.href
    : item.children?.some((c) => pathname.startsWith(c.href));
  const [expanded, setExpanded] = useState(isActive || false);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            isActive
              ? "bg-brand-50 text-brand-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </div>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
        {expanded && (
          <div className="mt-1 ml-7 space-y-0.5">
            {item.children.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm transition-colors",
                  pathname === href
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href!}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-brand-50 text-brand-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
      )}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {item.label}
    </Link>
  );
}

// ─── Shared nav content ────────────────────────────────────────────────────────
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => (
          <NavItemComponent
            key={item.label}
            item={item}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      <div className="border-t border-gray-100 p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-brand-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Back to store
        </Link>
      </div>
    </>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="p-5 border-b border-gray-100">
      <Link href="/admin/dashboard" className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">EquipUniverse</p>
          <p className="text-[11px] text-gray-400">Admin Panel</p>
        </div>
      </Link>
    </div>
  );
}

// ─── Desktop sidebar ───────────────────────────────────────────────────────────
export function AdminSidebar() {
  const { isOpen, close } = useSidebar();

  return (
    <>
      {/* Desktop — always visible */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 shrink-0">
        <Logo />
        <SidebarContent />
      </aside>

      {/* Mobile — slide-in drawer */}
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={close}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Close button */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <Link
            href="/admin/dashboard"
            onClick={close}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">EquipUniverse</p>
              <p className="text-[11px] text-gray-400">Admin Panel</p>
            </div>
          </Link>
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent onNavigate={close} />
      </aside>
    </>
  );
}
