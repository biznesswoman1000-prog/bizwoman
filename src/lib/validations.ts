//frontend/src/lib/validations.ts
import { z } from "zod";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /[A-Z]/,
        "Password must contain at least one uppercase letter (A-Z)",
      )
      .regex(
        /[a-z]/,
        "Password must contain at least one lowercase letter (a-z)",
      )
      .regex(/[0-9]/, "Password must contain at least one number (0-9)")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character (!@#$%^&*)",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /[A-Z]/,
        "Password must contain at least one uppercase letter (A-Z)",
      )
      .regex(
        /[a-z]/,
        "Password must contain at least one lowercase letter (a-z)",
      )
      .regex(/[0-9]/, "Password must contain at least one number (0-9)")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character (!@#$%^&*)",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ✅ ADDED: Update password schema with proper export
export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /[A-Z]/,
        "Password must contain at least one uppercase letter (A-Z)",
      )
      .regex(
        /[a-z]/,
        "Password must contain at least one lowercase letter (a-z)",
      )
      .regex(/[0-9]/, "Password must contain at least one number (0-9)")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character (!@#$%^&*)",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ─── Address ──────────────────────────────────────────────────────────────────
export const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  lga: z.string().optional(),
  postalCode: z.string().optional(),
  label: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// ─── Checkout ─────────────────────────────────────────────────────────────────
export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(10, "Valid phone number required"),
  shippingAddressId: z.string().optional(),
  shippingAddress: addressSchema.optional(),
  shippingRateId: z.string().min(1, "Please select a shipping method"),
  paymentMethod: z.enum(["PAYSTACK", "BANK_TRANSFER", "CASH_ON_DELIVERY"]),
  discountCode: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Product ──────────────────────────────────────────────────────────────────
export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  compareAtPrice: z.coerce.number().optional(),
  costPrice: z.coerce.number().optional(),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  weight: z.coerce.number().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

// ─── Category ─────────────────────────────────────────────────────────────────
export const categorySchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
});

// ─── Brand ────────────────────────────────────────────────────────────────────
export const brandSchema = z.object({
  name: z.string().min(2, "Name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  description: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

// ─── Review ───────────────────────────────────────────────────────────────────
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, "Please write at least 10 characters").optional(),
});

// ─── Quotation ────────────────────────────────────────────────────────────────
export const quotationSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(10, "Valid phone number required"),
  companyName: z.string().optional(),
  items: z
    .array(
      z.object({
        productName: z.string().min(1, "Product name is required"),
        quantity: z.coerce.number().int().min(1),
        specifications: z.string().optional(),
      }),
    )
    .min(1, "At least one item is required"),
  message: z.string().optional(),
});

// ─── Consultation ─────────────────────────────────────────────────────────────
export const consultationSchema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(10, "Valid phone number required"),
  companyName: z.string().optional(),
  subject: z.string().min(5, "Subject is required"),
  message: z.string().min(20, "Please describe your consultation needs"),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
});

// ─── Discount ─────────────────────────────────────────────────────────────────
export const discountSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters").max(20),
  name: z.string().min(2, "Name is required"),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
  value: z.coerce.number().min(0),
  minOrderAmount: z.coerce.number().optional(),
  maxDiscount: z.coerce.number().optional(),
  usageLimit: z.coerce.number().int().optional(),
  isActive: z.boolean().default(true),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
});

// ─── Blog post ────────────────────────────────────────────────────────────────
export const blogPostSchema = z.object({
  title: z.string().min(5, "Title is required"),
  slug: z
    .string()
    .min(3, "Slug is required")
    .regex(/^[a-z0-9-]+$/),
  excerpt: z.string().optional(),
  content: z.string().min(50, "Content must be at least 50 characters"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────
export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordForm = z.infer<typeof updatePasswordSchema>; // ✅ ADDED
export type AddressForm = z.infer<typeof addressSchema>;
export type CheckoutForm = z.infer<typeof checkoutSchema>;
export type ProductForm = z.infer<typeof productSchema>;
export type CategoryForm = z.infer<typeof categorySchema>;
export type BrandForm = z.infer<typeof brandSchema>;
export type ReviewForm = z.infer<typeof reviewSchema>;
export type QuotationForm = z.infer<typeof quotationSchema>;
export type ConsultationForm = z.infer<typeof consultationSchema>;
export type DiscountForm = z.infer<typeof discountSchema>;
export type BlogPostForm = z.infer<typeof blogPostSchema>;
