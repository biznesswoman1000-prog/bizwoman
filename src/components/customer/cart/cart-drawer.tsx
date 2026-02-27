"use client";

import Link from "next/link";
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice, getProductImage } from "@/lib/utils";
import {
  LoadingSpinner,
  EmptyState,
} from "@/components/shared/loading-spinner";
import Image from "next/image";

export function CartDrawer() {
  const {
    items,
    subtotal,
    itemCount,
    isLoading,
    isOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  return (
    <>
      {/* Backdrop with fade */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer with slide-in from right */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-600" />
            <h2 className="font-semibold text-gray-900">
              Shopping Cart
              {itemCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && items.length === 0 ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="w-14 h-14" />}
              title="Your cart is empty"
              description="Browse our products and add items to your cart"
              action={
                <Link
                  href="/products"
                  onClick={closeCart}
                  className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  Continue Shopping
                </Link>
              }
            />
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 bg-gray-50 rounded-2xl p-3"
                >
                  {/* Image */}
                  <Link
                    href={`/products/${item.product.slug}`}
                    onClick={closeCart}
                    className="shrink-0"
                  >
                    <Image
                      src={getProductImage(item.product.images)}
                      alt={item.product.name}
                      className="w-20 h-20 rounded-xl object-cover border border-gray-100"
                      width={80}
                      height={80}
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium text-gray-900 hover:text-brand-700 line-clamp-2 leading-snug"
                    >
                      {item.product.name}
                    </Link>

                    {/* Unit price */}
                    <p className="mt-1 text-sm font-semibold text-brand-700">
                      {formatPrice(item.price)}
                    </p>

                    {/* Quantity + remove row */}
                    <div className="flex items-center justify-between mt-2.5">
                      {/* Quantity stepper */}
                      <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1 || isLoading}
                          className="px-2.5 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <span className="w-8 text-center text-sm font-semibold text-gray-900 select-none">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={
                            item.quantity >= item.product.stockQuantity ||
                            isLoading
                          }
                          className="px-2.5 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line total + remove */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          disabled={isLoading}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-5 space-y-4 bg-white">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
              <span className="font-bold text-gray-900 text-base">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="text-xs text-gray-400 -mt-2">
              Shipping and taxes calculated at checkout
            </p>

            {/* CTAs */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full py-3.5 bg-brand-600 text-white text-sm font-semibold text-center rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
            >
              Checkout — {formatPrice(subtotal)}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cart"
              onClick={closeCart}
              className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-medium text-center rounded-xl hover:bg-gray-50 transition-colors block"
            >
              View Full Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
