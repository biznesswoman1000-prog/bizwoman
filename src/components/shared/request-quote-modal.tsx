"use client";

// src/components/shared/request-quote-modal.tsx

import { useState } from "react";
import { X, Send, Loader2, CheckCircle, FileQuestion } from "lucide-react";
import { apiPost, getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";

interface RequestQuoteModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  productId?: string;
  initialQuantity?: number;
}

export function RequestQuoteModal({
  open,
  onClose,
  productName,
  productId,
  initialQuantity = 1,
}: RequestQuoteModalProps) {
  const toast = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    companyName: "",
    quantity: initialQuantity,
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Full name is required";
    if (!form.customerEmail.trim()) e.customerEmail = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.customerEmail))
      e.customerEmail = "Enter a valid email address";
    if (form.quantity < 1) e.quantity = "Quantity must be at least 1";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await apiPost("/quotations", {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone || undefined,
        companyName: form.companyName || undefined,
        message: form.message || undefined,
        items: [
          {
            productId: productId || undefined,
            productName,
            quantity: form.quantity,
          },
        ],
      });
      setSubmitted(true);
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-200 ${
      errors[field]
        ? "border-red-300 focus:border-red-400"
        : "border-gray-200 focus:border-brand-500"
    }`;

  const handleClose = () => {
    setSubmitted(false);
    setLoading(false);
    setErrors({});
    setForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      companyName: "",
      quantity: initialQuantity,
      message: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center">
              <FileQuestion className="w-4.5 h-4.5 text-brand-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">
                Request a Quote
              </h2>
              <p className="text-xs text-gray-500 truncate max-w-[260px]">
                {productName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {submitted ? (
          // ── Success state ──────────────────────────────────────────────
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Quote Request Sent!
              </h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Thank you! We've received your request for{" "}
                <strong>{productName}</strong>. Our team will get back to you
                within 24 hours.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="mt-2 px-6 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          // ── Form ────────────────────────────────────────────────────────
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Row: Name + Email */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, customerName: e.target.value }))
                  }
                  placeholder="Jane Doe"
                  className={inputCls("customerName")}
                />
                {errors.customerName && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.customerName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, customerEmail: e.target.value }))
                  }
                  placeholder="jane@company.com"
                  className={inputCls("customerEmail")}
                />
                {errors.customerEmail && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.customerEmail}
                  </p>
                )}
              </div>
            </div>

            {/* Row: Phone + Company */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, customerPhone: e.target.value }))
                  }
                  placeholder="+234 800 000 0000"
                  className={inputCls("customerPhone")}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, companyName: e.target.value }))
                  }
                  placeholder="Acme Ltd."
                  className={inputCls("companyName")}
                />
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Quantity Interested In <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      quantity: Math.max(1, p.quantity - 1),
                    }))
                  }
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold text-lg"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      quantity: Math.max(1, Number(e.target.value)),
                    }))
                  }
                  className="w-20 text-center px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, quantity: p.quantity + 1 }))
                  }
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors font-bold text-lg"
                >
                  +
                </button>
                {errors.quantity && (
                  <p className="text-xs text-red-500">{errors.quantity}</p>
                )}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Additional Message / Specifications
              </label>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) =>
                  setForm((p) => ({ ...p, message: e.target.value }))
                }
                placeholder="Any specific requirements, color preferences, delivery location, etc."
                className={`${inputCls("message")} resize-none`}
              />
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {loading ? "Submitting…" : "Submit Quote Request"}
            </button>

            <p className="text-center text-xs text-gray-400">
              We'll respond within 24 hours with a personalised quote.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
