// frontend/src/app/(customer)/orders/[id]/tracking/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Package, Truck, CheckCircle, MapPin, Clock,
  ExternalLink, ArrowLeft, AlertCircle, RefreshCw,
} from "lucide-react";
import { apiGet, getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";
import Link from "next/link";

interface TrackingUpdate {
  id: string;
  status: string;
  message: string;
  location?: string;
  timestamp: string;
}

interface OrderTracking {
  id: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  createdAt: string;
  shippedAt?: string;
  trackingUpdates: TrackingUpdate[];
}

const STATUS_STEPS = [
  { key: "PENDING",    label: "Order Placed",    icon: Package },
  { key: "CONFIRMED",  label: "Confirmed",        icon: CheckCircle },
  { key: "PROCESSING", label: "Processing",       icon: Clock },
  { key: "SHIPPED",    label: "Shipped",          icon: Truck },
  { key: "DELIVERED",  label: "Delivered",        icon: CheckCircle },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => { fetchTracking(); }, [orderId]);

  const fetchTracking = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await apiGet<any>(`/orders/${orderId}/tracking`);
      setOrder(res.data.order);
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const currentStepIdx = order
    ? STATUS_ORDER.indexOf(order.status)
    : -1;

  const isCancelled = order?.status === "CANCELLED";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Order not found</p>
          <Link href="/account/orders" className="mt-3 text-brand-600 text-sm hover:underline block">
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Track Order</h1>
            <p className="text-sm text-gray-500">#{order.orderNumber}</p>
          </div>
          <button
            onClick={() => fetchTracking(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Tracking Number */}
        {order.trackingNumber && (
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-brand-700 uppercase tracking-wide">Tracking Number</p>
              <p className="text-lg font-mono font-bold text-brand-900 mt-0.5">{order.trackingNumber}</p>
            </div>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
              >
                Track <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Estimated Delivery */}
        {order.estimatedDelivery && order.status !== "DELIVERED" && !isCancelled && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Estimated Delivery</p>
            <p className="text-base font-semibold text-green-900 mt-0.5">{fmtDate(order.estimatedDelivery)}</p>
          </div>
        )}

        {order.deliveredAt && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Delivered!</p>
              <p className="text-xs text-green-600">{fmt(order.deliveredAt)}</p>
            </div>
          </div>
        )}

        {/* Progress Stepper */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-5">Shipment Progress</h2>
            <div className="relative">
              {/* Track line */}
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
              <div
                className="absolute left-4 top-4 w-0.5 bg-brand-500 transition-all duration-500"
                style={{
                  height: currentStepIdx >= 0
                    ? `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%`
                    : "0%",
                }}
              />

              <div className="space-y-6">
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex items-start gap-4 relative">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all ${
                          isCompleted
                            ? "bg-brand-600 border-brand-600"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isCompleted ? "text-white" : "text-gray-300"}`} />
                      </div>
                      <div className="flex-1 pb-2">
                        <p className={`text-sm font-medium ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-brand-100 text-brand-700 text-xs rounded-full font-medium">
                            Current Status
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Cancelled State */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Order Cancelled</p>
              <p className="text-xs text-red-600 mt-0.5">This order was cancelled. Contact support if you have questions.</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        {order.trackingUpdates.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-5">Tracking History</h2>
            <div className="space-y-5">
              {order.trackingUpdates.map((update, idx) => (
                <div key={update.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${idx === 0 ? "bg-brand-600" : "bg-gray-300"}`} />
                    {idx < order.trackingUpdates.length - 1 && (
                      <div className="w-0.5 bg-gray-100 flex-1 mt-1 min-h-6" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className={`text-sm font-medium ${idx === 0 ? "text-gray-900" : "text-gray-600"}`}>
                      {update.status}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{update.message}</p>
                    {update.location && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{update.location}</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{fmt(update.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Order Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Order Number</span>
              <span className="font-medium text-gray-900">#{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Order Date</span>
              <span className="text-gray-700">{fmtDate(order.createdAt)}</span>
            </div>
            {order.shippedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Shipped</span>
                <span className="text-gray-700">{fmtDate(order.shippedAt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium capitalize ${
                order.status === "DELIVERED" ? "text-green-600"
                : order.status === "CANCELLED" ? "text-red-600"
                : order.status === "SHIPPED" ? "text-blue-600"
                : "text-orange-600"
              }`}>
                {order.status.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/account/orders" className="text-sm text-brand-600 hover:text-brand-700 hover:underline">
            ← Back to My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
