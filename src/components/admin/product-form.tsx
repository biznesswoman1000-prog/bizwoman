"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, X } from "lucide-react";
import { apiGet, apiPost, apiPut, getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";
import { generateSlug } from "@/lib/utils";
import { Category, Brand } from "@/types";
import { PageLoader } from "@/components/shared/loading-spinner";
import { DragDropMediaUploader } from "@/components/shared/drag-drop-media-uploader";

interface Props {
  productId?: string;
  onSave?: () => void;
}

interface MediaItem {
  url: string;
  publicId?: string;
  type: "image" | "video";
  width?: number;
  height?: number;
}

interface SpecificationRow {
  key: string;
  value: string;
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  shortDescription: "",
  price: "",
  comparePrice: "",
  costPrice: "",
  sku: "",
  barcode: "",
  categoryId: "",
  brandId: "",
  tags: "",
  stockQuantity: 0,
  lowStockThreshold: 5,
  isFeatured: false,
  isNewArrival: false,
  status: "ACTIVE" as "ACTIVE" | "DRAFT" | "DISCONTINUED",
  media: [] as MediaItem[],
  weight: "",
  length: "",
  width: "",
  height: "",
  // SEO Fields
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  // Features and Specifications
  features: [] as string[],
  specifications: {} as Record<string, string>,
  videos: [] as string[],
  allowBackorder: false,
  trackInventory: true,
};

export default function ProductForm({ productId, onSave }: Props) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("basic");

  // Features management
  const [newFeature, setNewFeature] = useState("");

  // Specifications management
  const [specRows, setSpecRows] = useState<SpecificationRow[]>([
    { key: "", value: "" },
  ]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catsRes, brandsRes] = await Promise.all([
          apiGet<any>("/categories"),
          apiGet<any>("/brands"),
        ]);
        setCategories(catsRes.data.categories);
        setBrands(brandsRes.data.brands);

        if (productId) {
          const res = await apiGet<any>(`/products/${productId}`);
          const p = res.data.product;

          // Convert images to media format
          const media: MediaItem[] = (p.images || []).map((url: string) => ({
            url,
            type: "image" as const,
          }));

          // Convert specifications from JSON to rows
          let specs: SpecificationRow[] = [{ key: "", value: "" }];
          if (p.specifications && typeof p.specifications === "object") {
            specs = Object.entries(p.specifications).map(([key, value]) => ({
              key,
              value: String(value),
            }));
            if (specs.length === 0) specs = [{ key: "", value: "" }];
          }
          setSpecRows(specs);

          setForm({
            name: p.name,
            slug: p.slug,
            description: p.description || "",
            shortDescription: p.shortDescription || "",
            price: p.price.toString(),
            comparePrice: p.comparePrice?.toString() || "",
            costPrice: p.costPrice?.toString() || "",
            sku: p.sku,
            barcode: p.barcode || "",
            categoryId: p.categoryId || "",
            brandId: p.brandId || "",
            tags: p.tags?.join(", ") || "",
            stockQuantity: p.stockQuantity,
            lowStockThreshold: p.lowStockThreshold,
            isFeatured: p.isFeatured,
            isNewArrival: p.isNewArrival,
            status: p.status,
            media,
            weight: p.weight?.toString() || "",
            length: p.length?.toString() || "",
            width: p.width?.toString() || "",
            height: p.height?.toString() || "",
            // SEO
            metaTitle: p.metaTitle || "",
            metaDescription: p.metaDescription || "",
            metaKeywords: p.metaKeywords || "",
            // Features
            features: p.features || [],
            specifications: p.specifications || {},
            videos: p.videos || [],
            allowBackorder: p.allowBackorder || false,
            trackInventory: p.trackInventory ?? true,
          });
        }
      } catch {
        toast("Failed to load data", "error");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Build specifications object from rows
      const specifications: Record<string, string> = {};
      specRows.forEach((row) => {
        if (row.key.trim() && row.value.trim()) {
          specifications[row.key.trim()] = row.value.trim();
        }
      });

      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        shortDescription: form.shortDescription || undefined,
        sku: form.sku,
        barcode: form.barcode || undefined,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        stockQuantity: form.stockQuantity,
        lowStockThreshold: form.lowStockThreshold,
        categoryId: form.categoryId || undefined,
        brandId: form.brandId || undefined,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status: form.status,
        isFeatured: form.isFeatured,
        isNewArrival: form.isNewArrival,
        images: form.media.map((m) => m.url),
        videos: form.videos.filter(Boolean),
        weight: form.weight ? Number(form.weight) : undefined,
        length: form.length ? Number(form.length) : undefined,
        width: form.width ? Number(form.width) : undefined,
        height: form.height ? Number(form.height) : undefined,
        // SEO
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        metaKeywords: form.metaKeywords || undefined,
        // Features & Specs
        features: form.features,
        specifications:
          Object.keys(specifications).length > 0 ? specifications : undefined,
        allowBackorder: form.allowBackorder,
        trackInventory: form.trackInventory,
      };

      if (productId) {
        await apiPut(`/products/${productId}`, payload);
      } else {
        await apiPost("/products", payload);
      }

      toast(productId ? "Product updated" : "Product created", "success");
      onSave?.();
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setForm((p) => ({ ...p, features: [...p.features, newFeature.trim()] }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setForm((p) => ({
      ...p,
      features: p.features.filter((_, i) => i !== index),
    }));
  };

  const addSpecRow = () => {
    setSpecRows([...specRows, { key: "", value: "" }]);
  };

  const removeSpecRow = (index: number) => {
    if (specRows.length > 1) {
      setSpecRows(specRows.filter((_, i) => i !== index));
    }
  };

  const updateSpecRow = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const updated = [...specRows];
    updated[index][field] = value;
    setSpecRows(updated);
  };

  const f = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 transition-colors";

  if (isLoading) return <PageLoader />;

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "pricing", label: "Pricing" },
    { id: "inventory", label: "Inventory" },
    { id: "media", label: "Media" },
    { id: "features", label: "Features & Specs" },
    { id: "seo", label: "SEO" },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/products"
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex-1">
          {productId ? "Edit Product" : "New Product"}
        </h1>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {productId ? "Save Changes" : "Create Product"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? "bg-white text-brand-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {activeTab === "basic" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    f("name", e.target.value);
                    if (!form.slug) f("slug", generateSlug(e.target.value));
                  }}
                  required
                  className={inputCls}
                  placeholder="e.g. Gas Deck Oven Timer"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Slug *
                </label>
                <input
                  value={form.slug}
                  onChange={(e) => f("slug", e.target.value)}
                  required
                  className={inputCls + " font-mono text-xs"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => f("categoryId", e.target.value)}
                  className={inputCls + " bg-white"}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Brand
                </label>
                <select
                  value={form.brandId}
                  onChange={(e) => f("brandId", e.target.value)}
                  className={inputCls + " bg-white"}
                >
                  <option value="">No brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Short Description
                </label>
                <input
                  value={form.shortDescription}
                  onChange={(e) => f("shortDescription", e.target.value)}
                  className={inputCls}
                  placeholder="Brief one-line description"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => f("description", e.target.value)}
                  rows={6}
                  className={inputCls + " resize-none"}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tags (comma-separated)
                </label>
                <input
                  value={form.tags}
                  onChange={(e) => f("tags", e.target.value)}
                  className={inputCls}
                  placeholder="office, paper, stationery"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
              {[
                {
                  k: "status",
                  l: "Status",
                  options: ["ACTIVE", "DRAFT", "DISCONTINUED"],
                },
              ].map(({ k, l, options }) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {l}
                  </label>
                  <select
                    value={(form as any)[k]}
                    onChange={(e) => f(k, e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"
                  >
                    {options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {[
                { k: "isFeatured", l: "Featured product" },
                { k: "isNewArrival", l: "New arrival" },
                { k: "trackInventory", l: "Track inventory" },
                { k: "allowBackorder", l: "Allow backorder" },
              ].map(({ k, l }) => (
                <label
                  key={k}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(form as any)[k]}
                    onChange={(e) => f(k, e.target.checked)}
                    className="rounded border-gray-300 text-brand-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{l}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === "pricing" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Price (₦) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => f("price", e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Compare At Price (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.comparePrice}
                  onChange={(e) => f("comparePrice", e.target.value)}
                  className={inputCls}
                  placeholder="Original price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cost Price (₦)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) => f("costPrice", e.target.value)}
                  className={inputCls}
                  placeholder="Your cost"
                />
              </div>
            </div>
            {form.price && form.costPrice && (
              <p className="text-sm text-gray-500">
                Margin:{" "}
                <span className="font-semibold text-green-600">
                  {(
                    ((Number(form.price) - Number(form.costPrice)) /
                      Number(form.price)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </p>
            )}
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  SKU *
                </label>
                <input
                  value={form.sku}
                  onChange={(e) => f("sku", e.target.value)}
                  required
                  className={inputCls + " font-mono"}
                  placeholder="e.g. SPRT-GASDEC-87012"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Barcode / EAN
                </label>
                <input
                  value={form.barcode}
                  onChange={(e) => f("barcode", e.target.value)}
                  className={inputCls + " font-mono"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.stockQuantity}
                  onChange={(e) => f("stockQuantity", Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    f("lowStockThreshold", Number(e.target.value))
                  }
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.weight}
                  onChange={(e) => f("weight", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Length (cm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.length}
                    onChange={(e) => f("length", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Width (cm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.width}
                    onChange={(e) => f("width", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.height}
                    onChange={(e) => f("height", e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "media" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <DragDropMediaUploader
                value={form.media}
                onChange={(media) => f("media", media)}
                maxFiles={10}
                folder="products"
                accept="image"
                label="Product Images"
                helperText="First image will be the main product image. Drag to reorder."
                showPreview={true}
              />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Video URLs (Optional)
              </label>
              {form.videos.map((video, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    value={video}
                    onChange={(e) => {
                      const updated = [...form.videos];
                      updated[i] = e.target.value;
                      f("videos", updated);
                    }}
                    className={inputCls}
                    placeholder="https://youtube.com/..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      f(
                        "videos",
                        form.videos.filter((_, idx) => idx !== i),
                      );
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => f("videos", [...form.videos, ""])}
                className="flex items-center gap-2 px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Add Video URL
              </button>
            </div>
          </div>
        )}

        {activeTab === "features" && (
          <div className="space-y-4">
            {/* Features */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Product Features
              </label>
              <div className="space-y-2 mb-3">
                {form.features.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="flex-1 text-sm text-gray-700">
                      {feature}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFeature(i)}
                      className="text-red-500 hover:bg-red-100 p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addFeature())
                  }
                  className={inputCls}
                  placeholder="Add a feature..."
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Specifications
              </label>
              <div className="space-y-2 mb-3">
                {specRows.map((row, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={row.key}
                      onChange={(e) => updateSpecRow(i, "key", e.target.value)}
                      className={inputCls + " flex-1"}
                      placeholder="Key (e.g., Color)"
                    />
                    <input
                      value={row.value}
                      onChange={(e) =>
                        updateSpecRow(i, "value", e.target.value)
                      }
                      className={inputCls + " flex-1"}
                      placeholder="Value (e.g., Black)"
                    />
                    {specRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSpecRow(i)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSpecRow}
                className="flex items-center gap-2 px-4 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Add Row
              </button>
            </div>
          </div>
        )}

        {activeTab === "seo" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Meta Title
              </label>
              <input
                value={form.metaTitle}
                onChange={(e) => f("metaTitle", e.target.value)}
                className={inputCls}
                placeholder="Leave blank to use product name"
              />
              <p className="mt-1 text-xs text-gray-400">
                {form.metaTitle.length}/60 chars • Best: 50-60 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Meta Description
              </label>
              <textarea
                value={form.metaDescription}
                onChange={(e) => f("metaDescription", e.target.value)}
                rows={3}
                className={inputCls + " resize-none"}
                placeholder="Meta description for search engines"
              />
              <p className="mt-1 text-xs text-gray-400">
                {form.metaDescription.length}/160 chars • Best: 150-160
                characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Meta Keywords
              </label>
              <input
                value={form.metaKeywords}
                onChange={(e) => f("metaKeywords", e.target.value)}
                className={inputCls}
                placeholder="keyword1, keyword2, keyword3"
              />
              <p className="mt-1 text-xs text-gray-400">
                Comma-separated keywords for SEO
              </p>
            </div>
            {/* Preview */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">
                Search Preview
              </p>
              <p className="text-blue-700 text-sm font-medium truncate">
                {form.metaTitle || form.name || "Product Title"}
              </p>
              <p className="text-green-700 text-xs">
                Super Business Woman.com/products/{form.slug || "product-slug"}
              </p>
              <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">
                {form.metaDescription ||
                  form.shortDescription ||
                  form.description ||
                  "Product description will appear here."}
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
