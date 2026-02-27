//frontend/src/types/index.ts
"use client";
import { create } from "zustand";
import { apiGet, apiPost, apiPut, apiDelete, getApiError } from "@/lib/api";

interface CartStore {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isLoading: boolean;
  isOpen: boolean;

  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const calcTotals = (items: CartItem[]) => ({
  subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
  itemCount: items.reduce((s, i) => s + i.quantity, 0),
});

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  subtotal: 0,
  itemCount: 0,
  isLoading: false,
  isOpen: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await apiGet<{
        success: boolean;
        data: {
          cart: { items: CartItem[] } | null;
          items: CartItem[];
          summary: { subtotal: number; itemCount: number };
        };
      }>("/cart");

      // ✅ Use the flattened response structure
      const { items, summary } = res.data;
      set({
        items: items || [],
        subtotal: summary?.subtotal || 0,
        itemCount: summary?.itemCount || 0,
      });
    } catch {
      // Silently fail — guest cart may not exist
      set({ items: [], subtotal: 0, itemCount: 0 });
    } finally {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity) => {
    set({ isLoading: true });
    try {
      const res = await apiPost<{
        success: boolean;
        data: {
          cart: { items: CartItem[] };
          summary: { subtotal: number; itemCount: number };
        };
      }>("/cart", { productId, quantity });

      // ✅ Use cart.items and summary from response
      const { cart, summary } = res.data;
      set({
        items: cart.items,
        subtotal: summary.subtotal,
        itemCount: summary.itemCount,
        isOpen: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateItem: async (itemId, quantity) => {
    set({ isLoading: true });
    try {
      await apiPut(`/cart/${itemId}`, { quantity });
      // Re-fetch cart after update
      await get().fetchCart();
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (itemId) => {
    // Optimistic update
    const prevItems = get().items;
    const newItems = prevItems.filter((i) => i.id !== itemId);
    set({ items: newItems, ...calcTotals(newItems) });

    try {
      await apiDelete(`/cart/${itemId}`);
      // Re-fetch to get accurate state
      await get().fetchCart();
    } catch {
      // Revert on failure
      set({ items: prevItems, ...calcTotals(prevItems) });
    }
  },

  clearCart: async () => {
    const prevItems = get().items;
    set({ items: [], subtotal: 0, itemCount: 0 });
    try {
      await apiDelete("/cart");
    } catch {
      set({ items: prevItems, ...calcTotals(prevItems) });
    }
  },

  mergeCart: async () => {
    try {
      await apiPost("/cart/merge");
      await get().fetchCart();
    } catch {}
  },

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
}));

export interface Address {
  id: string;
  userId: string;
  label?: string; // "Home", "Office", etc.
  firstName: string;
  lastName: string;
  phone: string;
  address: string; // Main address line
  addressLine2?: string; // Apartment, suite, etc.
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  image?: string;
  emailVerified: boolean;
  customerSegment?: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

// ============================================
// ADDRESS TYPES
// ============================================

export interface Address {
  id: string;
  userId: string;
  label?: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PRODUCT TYPES
// ============================================

// Updated Product interface with correct SEO fields

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;

  // Pricing
  price: number;
  comparePrice?: number; // Changed from compareAtPrice
  costPrice?: number; // Changed from cost

  // Media
  images: string[];
  videos?: string[]; // Added videos

  // Classification
  categoryId?: string;
  category?: Category;
  brandId?: string;
  brand?: Brand;
  tags: string[];

  // Inventory
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  allowBackorder: boolean;
  trackInventory: boolean;

  // Status
  status: "ACTIVE" | "DRAFT" | "OUT_OF_STOCK" | "DISCONTINUED";
  isFeatured: boolean;
  isNewArrival: boolean;

  // Dimensions
  weight?: number;
  length?: number;
  width?: number;
  height?: number;

  // Analytics
  averageRating: number;
  reviewCount: number;
  salesCount: number;
  viewCount: number;

  // SEO - ✅ Correct field names matching schema
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;

  // Features & Specifications - ✅ Added
  features?: string[];
  specifications?: Record<string, any>;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CART TYPES
// ============================================

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  userId?: string;
  guestId?: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// ORDER TYPES
// ============================================

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  user?: User;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  customerName: string; // ✅ Added
  customerEmail: string; // ✅ Added
  customerPhone?: string; // ✅ Added
  tax: number;
  total: number;
  items: OrderItem[];
  shippingAddress?: Address;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SHIPPING TYPES
// ============================================

export interface ShippingZone {
  id: string;
  name: string;
  description?: string;
  states: string[];
  isActive: boolean;
  rates?: ShippingRate[];
  createdAt: string;
  updatedAt: string;
}

export interface ShippingRate {
  id: string;
  zoneId: string;
  name: string;
  cost: number;
  minOrderAmount?: number;
  freeAbove?: number;
  estimatedDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// BLOG TYPES
// ============================================

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  categoryId?: string;
  category?: BlogCategory;
  authorId?: string;
  author?: User;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  viewCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// DASHBOARD & ANALYTICS TYPES
// ============================================

export interface DashboardStats {
  orders: {
    total: number;
    today: number;
  };
  revenue: {
    thisMonth: number;
    growth?: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
  };
  inventory: {
    total: number;
    lowStock: number;
  };
  pending: {
    quotations: number;
    consultations: number;
  };
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
}

// ============================================
// PAGINATION TYPES
// ============================================

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export interface ProductFilters {
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  search?: string;
  sort?: "price-asc" | "price-desc" | "name-asc" | "name-desc" | "newest";
  page?: number;
  limit?: number;
}

// ============================================
// UTILITY TYPES
// ============================================

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

// Selectors
export const useCartItems = () => useCartStore((s) => s.items);
export const useCartCount = () => useCartStore((s) => s.itemCount);
export const useCartSubtotal = () => useCartStore((s) => s.subtotal);
export const useCartOpen = () => useCartStore((s) => s.isOpen);
