"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2, CheckCircle } from "lucide-react";
import { quotationSchema, type QuotationForm } from "@/lib/validations";
import { apiPost, getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { ProductSelect } from "@/components/shared/product-select";

export default function QuotationPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const toast = useToast();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<QuotationForm>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerName: user?.name || "",
      customerEmail: user?.email || "",
      customerPhone: user?.phone || "",
      items: [{ productName: "", quantity: 1, specifications: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const onSubmit = async (data: QuotationForm) => {
    setIsLoading(true);
    try {
      await apiPost("/quotations", data);
      setSubmitted(true);
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container py-16 max-w-xl text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900">
          Request Submitted!
        </h2>
        <p className="mt-3 text-gray-500">
          Thank you. Our team will review your request and contact you within 24
          hours with a personalized quote.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">
          Request a Quotation
        </h1>
        <p className="mt-2 text-gray-500">
          For bulk orders, wholesale inquiries, or custom requirements. Fill in
          the form below and we'll get back to you within 24 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Contact info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Your Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: "customerName", label: "Full Name *", type: "text" },
              { name: "customerEmail", label: "Email *", type: "email" },
              { name: "customerPhone", label: "Phone Number *", type: "tel" },
              { name: "companyName", label: "Company Name", type: "text" },
            ].map(({ name, label, type }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  {...register(name as any)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors"
                />
                {(errors as any)[name] && (
                  <p className="mt-1 text-xs text-red-500">
                    {(errors as any)[name]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Products Required</h2>
            <button
              type="button"
              onClick={() =>
                append({ productName: "", quantity: 1, specifications: "" })
              }
              className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
          <div className="space-y-4">
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="p-4 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Item {idx + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid sm:grid-cols-4 gap-3">
                  {/* Product Select with Search */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Product Name *
                    </label>
                    <Controller
                      name={`items.${idx}.productName`}
                      control={control}
                      render={({ field }) => (
                        <ProductSelect
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.items?.[idx]?.productName?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min={1}
                      {...register(`items.${idx}.quantity`, {
                        valueAsNumber: true,
                      })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                    />
                    {errors.items?.[idx]?.quantity && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.items[idx]!.quantity!.message}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Specs
                    </label>
                    <input
                      type="text"
                      {...register(`items.${idx}.specifications`)}
                      placeholder="Colour, size, etc."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional notes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Additional Notes
          </label>
          <textarea
            {...register("message")}
            rows={4}
            placeholder="Any additional requirements, delivery timeline, or questions…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 text-base"
        >
          {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          Submit Quotation Request
        </button>
      </form>
    </div>
  );
}
