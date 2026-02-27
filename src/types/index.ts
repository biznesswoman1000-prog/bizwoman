// NOTE: cartStore logic does NOT belong here.
// This file is types only. Keep cartStore in src/store/cartStore.ts

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  image?: string;
  // ✅ FIX: customers/[id]/page.tsx used `isEmailVerified` — correct name is `emailVerified`
  emailVerified: boolean;
  customerSegment?: string;
  totalSpent: number;
  orderCount: number;
  // ✅ FIX: `loyaltyPoints` doesn't exist in the Prisma schema — removed.
  //    customers/[id]/page.tsx must be updated to remove that reference (see note below)
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
  comparePrice?: number;
  costPrice?: number;

  // Media
  images: string[];
  videos?: string[];

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

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;

  // Features & Specifications
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
  // ✅ FIX: categories/page.tsx uses `cat._count?.products` — added _count
  _count?: {
    products: number;
  };
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
  _count?: {
    products: number;
  };
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

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  user?: User;
  status: OrderStatus;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
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
// DISCOUNT TYPES — ✅ FIX: was missing entirely
// ============================================

// ✅ FIX: discounts/page.tsx had `form.type !== 'FREE_SHIPPING'` error because
//    `defaultForm` typed `type` as `'PERCENTAGE'` (a literal), so TS saw the
//    comparison as always false. Using this union type fixes it.
export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

export interface Discount {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit?: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
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
// REVIEW TYPES — ✅ FIX: was missing entirely
// ============================================

export interface Review {
  id: string;
  productId: string;
  product?: Product;
  userId: string;
  user?: Pick<User, "id" | "name" | "image">;
  rating: number;
  comment?: string;
  images?: string[];
  isVerified: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// QUOTATION TYPES — ✅ FIX: was missing entirely
// ============================================

export type QuotationStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "CONVERTED";

// ✅ FIX: quotations/page.tsx had implicit `any` on map callback params because
//    `items` was typed as `any`. This typed interface fixes it.
export interface QuotationItem {
  productId?: string;
  productName: string;
  quantity: number;
  specifications?: string;
}

export interface Quotation {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  items: QuotationItem[];
  message?: string;
  totalEstimate?: number;
  status: QuotationStatus;
  adminNotes?: string;
  quotationFile?: string;
  orderId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CONSULTATION TYPES — ✅ FIX: was missing entirely
// ============================================

export type ConsultationStatus =
  | "PENDING"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

export interface Consultation {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName?: string;
  subject: string;
  message: string;
  preferredDate?: string;
  preferredTime?: string;
  status: ConsultationStatus;
  scheduledAt?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SITE SETTINGS TYPES — ✅ FIX: was missing entirely
// ============================================

// ✅ FIX: settings/page.tsx had implicit `any` on `(p) => ({ ...p, [k]: v })`
//    because setSettings was typed as Partial<any>. Now that SiteSettings is
//    exported, the setter is properly typed as
//    React.Dispatch<React.SetStateAction<Partial<SiteSettings>>>
export interface SiteSettings {
  id?: string;
  siteName: string;
  siteDescription?: string;
  siteKeywords?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;

  // Contact
  email?: string;
  phone?: string;
  address?: string;
  whatsapp?: string;

  // Social
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;

  // Business
  currency?: string;
  currencySymbol?: string;
  taxRate?: number;

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaImage?: string;

  // Header
  headerBanner?: string;
  showHeaderBanner?: boolean;

  createdAt?: string;
  updatedAt?: string;
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

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

export type UserRole = "CUSTOMER" | "STAFF" | "ADMIN";

export type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
