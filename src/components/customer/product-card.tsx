"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Star, Heart, Eye, FileQuestion } from "lucide-react";
import { Product } from "@/types";
import {
  cn,
  formatPrice,
  calculateDiscountPercent,
  getProductImage,
} from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useSettings } from "@/hooks/useSettings";
import { RequestQuoteModal } from "@/components/shared/request-quote-modal";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart, isLoading: cartLoading } = useCart();
  const {
    toggleWishlist,
    isInWishlist,
    isLoading: wishlistLoading,
  } = useWishlist();
  const router = useRouter();
  const { settings } = useSettings();

  const [quoteOpen, setQuoteOpen] = useState(false);

  const hidePricing = settings.hidePricing ?? false;

  const discount =
    !hidePricing && product.comparePrice
      ? calculateDiscountPercent(product.comparePrice, product.price)
      : 0;

  const isOutOfStock = product.stockStatus === "OUT_OF_STOCK";
  const inWishlist = isInWishlist(product.id);

  return (
    <>
      <div
        className={cn(
          "group relative bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col",
          "hover:shadow-elevated hover:border-brand-100 transition-all duration-300",
          className,
        )}
      >
        {/* ── Image ── */}
        <div className="relative overflow-hidden aspect-square bg-gray-50">
          <Image
            src={getProductImage(product.images)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            width={500}
            height={500}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
            {!hidePricing && discount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                -{discount}%
              </span>
            )}
            {product.isNewArrival && (
              <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                New
              </span>
            )}
            {product.isFeatured && (
              <span className="px-2 py-0.5 bg-gold-500 text-white text-xs font-bold rounded-full">
                Featured
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1 bg-gray-800 text-white text-xs font-semibold rounded-full">
                Out of Stock
              </span>
            </div>
          )}

          {/* Hover actions */}
          <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200">
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product.id, product.name);
              }}
              disabled={wishlistLoading}
              className={cn(
                "w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-200 disabled:opacity-50",
                inWishlist
                  ? "text-red-500 hover:text-red-600"
                  : "text-gray-400 hover:text-red-500",
              )}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-all duration-200",
                  inWishlist && "fill-red-500",
                )}
              />
            </button>

            <button
              onClick={() => router.push(`/products/${product.slug}`)}
              className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-gray-400 hover:text-brand-600 transition-colors"
              aria-label="View product"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Info ── */}
        <div className="p-4 flex flex-col flex-1">
          {product.brand && (
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {product.brand.name}
            </p>
          )}

          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug flex-1">
            {product.name}
          </h3>

          {product.averageRating > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star className="w-3 h-3 fill-gold-400 text-gold-400" />
              <span className="text-xs text-gray-500">
                {product.averageRating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Price — hidden when hidePricing is on */}
          {!hidePricing && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-base font-bold text-brand-700">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              href={`/products/${product.slug}`}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-center border border-brand-200 text-brand-700 hover:bg-brand-50 transition-colors"
            >
              Details
            </Link>

            {hidePricing ? (
              <button
                onClick={() => setQuoteOpen(true)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              >
                <FileQuestion className="w-3.5 h-3.5" />
                Get a Quote
              </button>
            ) : (
              <button
                onClick={() => !isOutOfStock && addToCart(product.id)}
                disabled={isOutOfStock || cartLoading}
                className={cn(
                  "w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors",
                  isOutOfStock
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-brand-600 text-white hover:bg-brand-700",
                )}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {isOutOfStock ? "Sold Out" : "Add to Cart"}
              </button>
            )}
          </div>
        </div>
      </div>

      <RequestQuoteModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        productName={product.name}
        productId={product.id}
        initialQuantity={1}
      />
    </>
  );
}
