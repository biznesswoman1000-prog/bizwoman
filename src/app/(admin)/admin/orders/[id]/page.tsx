"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Order } from "@/types";
import { apiGet, apiPut, getApiError } from "@/lib/api";
import {
  formatPrice,
  formatDateTime,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  getProductImage,
} from "@/lib/utils";
import { PageLoader, ErrorState } from "@/components/shared/loading-spinner";
import { useToast } from "@/store/uiStore";
import Image from "next/image";

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const toast = useToast();

  const loadOrder = () => {
    setIsLoading(true);
    apiGet<any>(`/orders/${id}`)
      .then((res) => {
        setOrder(res.data.order);
        setNewStatus(res.data.order.status);
        setTrackingNumber(res.data.order.trackingNumber || "");
      })
      .catch(() => setError("Order not found"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const updateStatus = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      await apiPut(`/orders/${id}/status`, {
        status: newStatus,
        notes: statusNotes || undefined,
        trackingNumber: trackingNumber || undefined,
      });
      toast("Order updated", "success");
      setStatusNotes("");
      loadOrder();
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading) return <PageLoader />;
  if (error || !order)
    return (
      <div className="p-6">
        <ErrorState message={error || "Not found"} />
      </div>
    );

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            Order {order.orderNumber}
          </h1>
          <p className="text-sm text-gray-500">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[order.status]}`}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${PAYMENT_STATUS_COLORS[order.paymentStatus]}`}
          >
            {order.paymentStatus}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <Image
                    src={getProductImage(item.product.images)}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0"
                    width={48}
                    height={48}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm line-clamp-1">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      SKU: {item.product.sku} · Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-sm shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2">
                <span>Total</span>
                <span className="text-brand-700">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Status update */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Update Status</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-500"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {ORDER_STATUS_LABELS[s] || s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tracking Number
                </label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. GIG12345"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Notes (optional)
                </label>
                <input
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
            <button
              onClick={updateStatus}
              disabled={updating || newStatus === order.status}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-colors"
            >
              {updating && <Loader2 className="w-4 h-4 animate-spin" />} Update
              Order
            </button>
          </div>

          {/* Status history */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900 mb-4">
                Status History
              </h2>
              <div className="space-y-3">
                {order.statusHistory.map((h) => (
                  <div key={h.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {ORDER_STATUS_LABELS[h.status] || h.status}
                      </p>
                      {h.notes && (
                        <p className="text-gray-500 text-xs">{h.notes}</p>
                      )}
                      <p className="text-gray-400 text-xs">
                        {formatDateTime(h.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side info */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Customer</h2>
            <p className="font-medium text-gray-900 text-sm">
              {order.customerName}
            </p>
            <p className="text-xs text-gray-500">{order.customerEmail}</p>
            {order.customerPhone && (
              <p className="text-xs text-gray-500">{order.customerPhone}</p>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">
              Shipping Address
            </h2>
            <address className="not-italic text-sm text-gray-600 space-y-0.5">
              <p className="font-medium">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.addressLine1}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state}
              </p>
              <p className="mt-1">{order.shippingAddress?.phone}</p>
            </address>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Payment</h2>
            <div className="text-sm space-y-1">
              <p className="text-gray-600">
                Method:{" "}
                <span className="font-medium text-gray-900">
                  {order.paymentMethod}
                </span>
              </p>
              {order.paymentReference && (
                <p className="text-gray-600">
                  Ref:{" "}
                  <span className="font-mono text-xs">
                    {order.paymentReference}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
