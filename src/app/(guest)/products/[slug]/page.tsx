"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Head from "next/head";
import {
  ShoppingCart,
  Star,
  Shield,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  Heart,
  Check,
} from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import {
  formatPrice,
  calculateDiscountPercent,
  getProductImage,
} from "@/lib/utils";
import { PageLoader, ErrorState } from "@/components/shared/loading-spinner";
import { ProductReviews } from "@/components/shared/product-reviews";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { product, isLoading, error } = useProduct(slug);
  const { addToCart, isLoading: cartLoading } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "description" | "specs" | "reviews"
  >("description");

  if (isLoading) return <PageLoader />;
  if (error || !product)
    return (
      <div className="container py-12">
        <ErrorState message={error || "Product not found"} />
      </div>
    );

  const discount = product.comparePrice
    ? calculateDiscountPercent(product.comparePrice, product.price)
    : 0;
  const isOutOfStock = product.stockStatus === "OUT_OF_STOCK";
  const maxQty = Math.min(product.stockQuantity, 99);

  const metaTitle = product.metaTitle || `${product.name} | EquipUniverse`;
  const metaDescription =
    product.metaDescription ||
    product.shortDescription ||
    product.description?.substring(0, 160);
  const metaKeywords = product.metaKeywords || product.tags?.join(", ");

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        {metaKeywords && <meta name="keywords" content={metaKeywords} />}
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={product.images[0]} />
        <meta property="og:type" content="product" />
        <meta
          property="product:price:amount"
          content={product.price.toString()}
        />
        <meta property="product:price:currency" content="NGN" />
      </Head>

      <div className="container py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
              <img
                src={getProductImage(product.images, selectedImage)}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                      selectedImage === i
                        ? "border-brand-500"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.brand && (
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
                {product.brand.name}
              </p>
            )}
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating — click to jump to reviews tab */}
            {product.averageRating > 0 && (
              <button
                onClick={() => setActiveTab("reviews")}
                className="flex items-center gap-2 mt-3 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(product.averageRating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-brand-600 underline">
                  {product.averageRating.toFixed(1)} ·{" "}
                  {product.reviewCount ?? ""} reviews
                </span>
              </button>
            )}

            {/* Price */}
            <div className="flex items-center gap-3 mt-4">
              <span className="text-3xl font-bold text-brand-700">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                  <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-sm font-bold rounded-full">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {product.shortDescription && (
              <p className="mt-4 text-gray-600 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {product.features && product.features.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">
                  Key Features:
                </p>
                <ul className="space-y-1.5">
                  {product.features.slice(0, 5).map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stock status */}
            <div className="mt-4">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Out of
                  Stock
                </span>
              ) : product.stockStatus === "LOW_STOCK" ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-orange-600">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> Low
                  Stock — Only {product.stockQuantity} left
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500" /> In
                  Stock
                </span>
              )}
            </div>

            {!isOutOfStock && (
              <div className="mt-6 flex items-center gap-3">
                <div className="flex items-center border border-gray-200 rounded-xl">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-3 text-gray-500 hover:text-gray-900 disabled:opacity-40 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                    className="px-3 py-3 text-gray-500 hover:text-gray-900 disabled:opacity-40 transition-colors"
                    disabled={quantity >= maxQty}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => addToCart(product.id, quantity)}
                  disabled={cartLoading}
                  className="flex-1 py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>

                <button className="p-3.5 border border-gray-200 rounded-xl text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: "Fast Delivery" },
                { icon: Shield, label: "Secure Payment" },
                { icon: RotateCcw, label: "Easy Returns" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 text-center"
                >
                  <Icon className="w-5 h-5 text-brand-500" />
                  <span className="text-xs text-gray-600 font-medium">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-gray-400">SKU: {product.sku}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <div className="flex gap-6 border-b border-gray-100 mb-6">
            {(["description", "specs", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "text-brand-700 border-brand-600"
                    : "text-gray-500 border-transparent hover:text-gray-900"
                }`}
              >
                {tab === "specs"
                  ? "Specifications"
                  : tab === "reviews"
                    ? `Reviews${product.reviewCount ? ` (${product.reviewCount})` : ""}`
                    : tab}
              </button>
            ))}
          </div>

          {activeTab === "description" ? (
            <div>
              <div
                className="prose prose-sm max-w-none text-gray-700 mb-6"
                dangerouslySetInnerHTML={{
                  __html:
                    product.description || "<p>No description available.</p>",
                }}
              />
              {product.features && product.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Product Features
                  </h3>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {product.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : activeTab === "specs" ? (
            <div>
              {product.specifications &&
              Object.keys(product.specifications).length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {Object.entries(product.specifications).map(
                        ([key, value], i) => (
                          <tr
                            key={i}
                            className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}
                          >
                            <td className="px-6 py-3 text-sm font-semibold text-gray-900 w-1/3">
                              {key}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              {String(value)}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No specifications available.
                </p>
              )}

              {(product.weight ||
                product.length ||
                product.width ||
                product.height) && (
                <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Dimensions & Weight
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    {product.weight && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Weight</span>
                        <span className="font-semibold text-gray-900">
                          {product.weight} kg
                        </span>
                      </div>
                    )}
                    {product.length && product.width && product.height && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">
                          Dimensions (L×W×H)
                        </span>
                        <span className="font-semibold text-gray-900">
                          {product.length} × {product.width} × {product.height}{" "}
                          cm
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // ─── REVIEWS TAB ───────────────────────────────────────────────
            <ProductReviews productId={product.id} />
          )}
        </div>
      </div>
    </>
  );
}
