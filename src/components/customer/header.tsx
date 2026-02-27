//frontend/src/components/customer/header.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  Heart,
  ChevronRight,
  Package,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn, formatPrice, getProductImage } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";
import { apiGet } from "@/lib/api";
import { Category, Product } from "@/types";
import Image from "next/image";

// ─── types ────────────────────────────────────────────────────
interface SiteSettings {
  logo?: string;
  siteName?: string;
  headerBanner?: string;
  showHeaderBanner?: boolean;
}

// ─── debounce ────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

// ─── Search Dropdown ─────────────────────────────────────────
function SearchDropdown({
  query,
  onNavigate,
}: {
  query: string;
  onNavigate: () => void;
}) {
  const router = useRouter();
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    apiGet<{ success: boolean; data: { products: Product[] } }>("/products", {
      search: query,
      limit: 6,
    })
      .then((res) => setResults(res.data.products ?? []))
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  }, [query]);

  if (query.length < 3) return null;

  return (
    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[60]">
      {isLoading ? (
        <div className="p-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3 items-center animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
              <div className="h-4 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="py-10 text-center">
          <Package className="w-9 h-9 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            No results for &ldquo;{query}&rdquo;
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-[352px] overflow-y-auto divide-y divide-gray-50">
            {results.map((product) => (
              <button
                key={product.id}
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus on input so blur doesn't fire first
                  router.push(`/products/${product.slug}`);
                  onNavigate();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <Image
                  src={getProductImage(product.images)}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    {product.category?.name}
                    {product.brand?.name && (
                      <>
                        <span className="mx-1 text-gray-200">·</span>
                        {product.brand.name}
                      </>
                    )}
                  </p>
                </div>
                <span className="text-sm font-bold text-brand-700 shrink-0">
                  {formatPrice(product.price)}
                </span>
              </button>
            ))}
          </div>

          {/* See more */}
          <div className="border-t border-gray-100 p-3">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                router.push(`/products?search=${encodeURIComponent(query)}`);
                onNavigate();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-50 text-brand-700 text-sm font-semibold hover:bg-brand-100 transition-colors"
            >
              See all results for &ldquo;{query}&rdquo;
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Category Bar ─────────────────────────────────────────────
function CategoryBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const activeCatId = searchParams?.get("categoryId") ?? "";

  if (!categories.length) return null;

  return (
    <div className="border-t border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="container">
        <div
          className="flex items-center gap-1.5 overflow-x-auto py-2.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* All Products pill */}
          <button
            onClick={() => router.push("/products")}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
              !activeCatId
                ? "bg-brand-600 text-white shadow-sm shadow-brand-200"
                : "bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-700",
            )}
          >
            All Products
          </button>

          {/* Category divider */}
          <span className="shrink-0 w-px h-4 bg-gray-200 mx-1" />

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => router.push(`/products?categoryId=${cat.id}`)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap",
                activeCatId === cat.id
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-200"
                  : "bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-700",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Header ─────────────────────────────────────────────
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({});
  const [categories, setCategories] = useState<Category[]>([]);

  // Search
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 280);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stores
  const itemCount = useCartStore((s) => s.itemCount);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const wishlistCount = useWishlistStore((s) => s.itemCount);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const { user, isAuthenticated, checkAuth } = useAuthStore();

  // ── boot ──
  useEffect(() => {
    apiGet<any>("/settings")
      .then((r) => setSettings(r.data.settings ?? {}))
      .catch(() => {});

    apiGet<{ success: boolean; data: { categories: Category[] } }>(
      "/categories",
    )
      .then((r) =>
        setCategories(
          (r.data.categories ?? []).filter((c) => c.isActive !== false),
        ),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    checkAuth();
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkAuth();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) fetchWishlist();
  }, [isAuthenticated, fetchWishlist]);

  // close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      closeSearch();
    }
  };

  const siteName = settings.siteName || "EquipUniverse";
  const showBanner = settings.showHeaderBanner && settings.headerBanner;

  return (
    <>
      {/* Announcement Banner */}
      {showBanner && (
        <div className="bg-brand-600 text-white text-center py-2 px-4 text-sm font-medium">
          {settings.headerBanner}
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white shadow-sm">
        {/* ── Main row ─────────────────────────────────────── */}
        <div className="border-b border-gray-100">
          <div className="container">
            <div className="flex items-center gap-4 h-16 lg:h-[72px]">
              {/* Logo */}
              <Link href="/" className="shrink-0">
                {settings.logo ? (
                  <Image
                    src={settings.logo}
                    alt={siteName}
                    className="h-8 lg:h-10 w-auto object-contain"
                    width={120}
                    height={32}
                  />
                ) : (
                  <span className="font-display text-xl lg:text-2xl font-bold text-brand-700 tracking-tight">
                    Equip<span className="text-gold-500">Universe</span>
                  </span>
                )}
              </Link>

              {/* ── Search bar (desktop) ── */}
              <div
                ref={searchWrapRef}
                className="flex-1 relative hidden md:block max-w-xl lg:max-w-2xl mx-auto"
              >
                <form onSubmit={handleSubmit}>
                  <div
                    className={cn(
                      "flex items-center gap-2.5 border rounded-2xl px-4 py-2.5 transition-all duration-200",
                      searchOpen
                        ? "border-brand-400 bg-white shadow-lg shadow-brand-100/30 ring-2 ring-brand-100"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white",
                    )}
                  >
                    <Search
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        searchOpen ? "text-brand-600" : "text-gray-400",
                      )}
                    />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onFocus={() => setSearchOpen(true)}
                      placeholder="Search products, categories, SKUs…"
                      className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none min-w-0"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          inputRef.current?.focus();
                        }}
                        className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </form>

                {/* Dropdown results */}
                {searchOpen && debouncedQuery.length >= 3 && (
                  <SearchDropdown
                    query={debouncedQuery}
                    onNavigate={closeSearch}
                  />
                )}

                {/* Hint when typing but < 3 chars */}
                {searchOpen && query.length > 0 && query.length < 3 && (
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 z-[60]">
                    <p className="text-xs text-gray-400">
                      Type {3 - query.length} more character
                      {3 - query.length !== 1 ? "s" : ""} to search…
                    </p>
                  </div>
                )}
              </div>

              {/* ── Right actions ── */}
              <div className="flex items-center shrink-0 ml-auto gap-1">
                {/* Mobile search trigger */}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    setSearchOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="md:hidden p-2 rounded-xl text-gray-500 hover:text-brand-700 hover:bg-gray-50 transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>

                {/* Wishlist */}
                <Link
                  href="/wishlist"
                  className="relative p-2 rounded-xl text-gray-500 hover:text-brand-700 hover:bg-gray-50 transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart
                    className={cn(
                      "w-5 h-5 transition-all duration-200",
                      wishlistCount > 0 && "fill-red-500 text-red-500",
                    )}
                  />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <button
                  onClick={toggleCart}
                  className="relative p-2 rounded-xl text-gray-500 hover:text-brand-700 hover:bg-gray-50 transition-colors"
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </button>

                {/* Auth — desktop */}
                {isAuthenticated && user ? (
                  <Link
                    href="/account"
                    className="hidden lg:flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-brand-700 hover:bg-gray-50 transition-colors"
                  >
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        className="w-6 h-6 rounded-full object-cover ring-2 ring-brand-100"
                        width={24}
                        height={24}
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-brand-700">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="max-w-[72px] truncate">
                      {user.name?.split(" ")[0]}
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="hidden lg:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Sign in
                  </Link>
                )}

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen((o) => !o)}
                  className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-brand-700 hover:bg-gray-50 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Category Bar ─────────────────────────────────── */}
        <CategoryBar categories={categories} />

        {/* ── Mobile menu ──────────────────────────────────── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white shadow-lg">
            {/* Mobile search */}
            <div className="container pt-3 pb-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (query.trim().length >= 3) {
                    router.push(
                      `/products?search=${encodeURIComponent(query.trim())}`,
                    );
                    setMobileOpen(false);
                    setQuery("");
                  }
                }}
              >
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
                  />
                </div>
              </form>
            </div>

            <nav className="container pb-4 flex flex-col gap-1">
              <Link
                href="/products"
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  pathname === "/products"
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50",
                )}
              >
                All Products
              </Link>

              {categories.slice(0, 10).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    router.push(`/products?categoryId=${cat.id}`);
                    setMobileOpen(false);
                  }}
                  className="text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {cat.name}
                </button>
              ))}

              <Link
                href="/blog"
                className="px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/contact"
                className="px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Contact
              </Link>

              <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
                <Link
                  href="/wishlist"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Heart
                    className={cn(
                      "w-4 h-4",
                      wishlistCount > 0 && "fill-red-500 text-red-500",
                    )}
                  />
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="ml-auto text-xs font-bold text-red-500">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {isAuthenticated && user ? (
                  <Link
                    href="/account"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" /> My Account
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-600 text-white text-sm font-semibold"
                  >
                    <User className="w-4 h-4" /> Sign In
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
