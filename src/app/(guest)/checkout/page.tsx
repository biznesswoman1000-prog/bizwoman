//frontend/src/app/(guest)/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  Package,
  Truck,
  CreditCard,
  FileText,
  Plus,
  MapPin,
  Store,
} from "lucide-react";
import { z } from "zod";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/store/uiStore";
import { apiPost, apiGet, getApiError } from "@/lib/api";
import {
  formatPrice,
  NIGERIAN_STATES,
  calculateTotalWeight,
} from "@/lib/utils";
import Image from "next/image";

const checkoutSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(10, "Valid phone is required"),
  paymentMethod: z.enum(["PAYSTACK", "BANK_TRANSFER", "CASH_ON_DELIVERY"]),
  notes: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

interface Address {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  label?: string;
  isDefault: boolean;
}

interface ShippingMethod {
  id: string;
  name: string;
  type: "TABLE_RATE" | "FLAT_RATE" | "STORE_PICKUP";
  cost: number;
  estimatedMinDays?: number;
  estimatedMaxDays?: number;
  storeAddress?: {
    name: string;
    address: string;
    city: string;
    phone: string;
    hours: string;
  };
}

const STEPS = ["Address", "Shipping", "Payment", "Review"];

export default function CheckoutPage() {
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<{
    id: string;
    amount: number;
    name: string;
  } | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);

  const { items, subtotal, fetchCart } = useCartStore();
  const { user } = useAuthStore();
  const toast = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: user?.name || "",
      customerEmail: user?.email || "",
      customerPhone: user?.phone || "",
      paymentMethod: "PAYSTACK",
    },
  });

  const watchedPaymentMethod = watch("paymentMethod");

  // Calculate cart weight
  const cartWeight = calculateTotalWeight(
    items.map((item) => ({
      weight: (item.product as any).weight,
      quantity: item.quantity,
    })),
  );

  // Fetch user addresses
  useEffect(() => {
    if (user) {
      apiGet<{ success: boolean; data: { addresses: Address[] } }>("/addresses")
        .then((res) => {
          setAddresses(res.data.addresses);
          const defaultAddr = res.data.addresses.find((a) => a.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          }
        })
        .catch(() => toast("Failed to load addresses", "error"));
    }
  }, [user]);

  // Get selected address
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Calculate shipping when address changes
  useEffect(() => {
    if (selectedAddress) {
      setIsLoadingShipping(true);

      // Get category and product IDs from cart
      const categoryIds = [
        ...new Set(items.map((i) => (i.product as any).categoryId)),
      ];
      const productIds = items.map((i) => i.productId);

      apiPost<{
        success: boolean;
        data: { zone: string; methods: ShippingMethod[] };
      }>("/shipping/calculate", {
        state: selectedAddress.state,
        orderAmount: subtotal,
        weight: cartWeight,
        categoryIds,
        productIds,
      })
        .then((res) => {
          setShippingMethods(res.data.methods);
          // Auto-select first method (usually cheapest)
          if (res.data.methods.length > 0) {
            setSelectedMethodId(res.data.methods[0].id);
          }
        })
        .catch((err) => toast(getApiError(err), "error"))
        .finally(() => setIsLoadingShipping(false));
    }
  }, [selectedAddress, subtotal, cartWeight, items]);

  const applyDiscount = async () => {
    if (!discountCode.trim()) {
      toast("Please enter a discount code", "error");
      return;
    }

    try {
      const res = await apiPost<any>("/discounts/validate", {
        code: discountCode,
        orderAmount: subtotal,
      });
      setDiscount({
        id: res.data.discount.id,
        amount: res.data.discountAmount,
        name: res.data.discount.name,
      });
      toast(`Discount "${res.data.discount.name}" applied!`, "success");
    } catch (err) {
      toast(getApiError(err), "error");
      setDiscountCode("");
    }
  };

  const removeDiscount = () => {
    setDiscount(null);
    setDiscountCode("");
    toast("Discount removed", "success");
  };

  const onSubmit = async (data: CheckoutForm) => {
    // Validate address selection for step 0
    if (step === 0 && !selectedAddressId) {
      toast("Please select a delivery address", "error");
      return;
    }

    // Validate shipping selection for step 1
    if (step === 1 && !selectedMethodId) {
      toast("Please select a shipping method", "error");
      return;
    }

    // Move to next step if not final
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    // Place order (final step)
    if (!selectedAddress) {
      toast("Please select an address", "error");
      return;
    }

    setIsPlacing(true);
    try {
      const selectedMethod = shippingMethods.find(
        (m) => m.id === selectedMethodId,
      );
      const shippingCost = selectedMethod?.cost || 0;
      const discountAmount = discount?.amount || 0;
      const total = subtotal - discountAmount + shippingCost;

      const orderData = {
        ...data,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
        shippingAddress: {
          firstName: selectedAddress.firstName,
          lastName: selectedAddress.lastName,
          phone: selectedAddress.phone,
          addressLine1: selectedAddress.address,
          addressLine2: selectedAddress.addressLine2,
          city: selectedAddress.city,
          state: selectedAddress.state,
          country: selectedAddress.country,
          postalCode: selectedAddress.postalCode,
        },
        shippingMethodId: selectedMethodId,
        discountCode: discount ? discountCode : undefined,
        discountId: discount?.id,
      };

      const res = await apiPost<any>("/orders", orderData);
      const order = res.data.order;

      // Clear cart
      await fetchCart();

      // Handle payment redirect
      if (data.paymentMethod === "PAYSTACK") {
        const payRes = await apiPost<any>("/payment/initialize", {
          orderId: order.id,
        });
        window.location.href = payRes.data.authorizationUrl;
      } else {
        router.push(`/orders/${order.id}?success=1`);
      }
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setIsPlacing(false);
    }
  };

  const selectedMethod = shippingMethods.find((m) => m.id === selectedMethodId);
  const shippingCost = selectedMethod?.cost || 0;
  const discountAmount = discount?.amount || 0;
  const total = subtotal - discountAmount + shippingCost;

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !isPlacing) {
      router.push("/cart");
    }
  }, [items, router, isPlacing]);

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-600 mb-6">
          Add some items to your cart to checkout
        </p>
        <button
          onClick={() => router.push("/products")}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container py-10 max-w-6xl">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                i === step
                  ? "bg-brand-600 text-white"
                  : i < step
                    ? "bg-brand-100 text-brand-700"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < step ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
              )}
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 h-0.5 ${i < step ? "bg-brand-300" : "bg-gray-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 0: Delivery Address */}
            {step === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Delivery Address
                    </h2>
                    <p className="text-sm text-gray-500">
                      Select or add a delivery address
                    </p>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      {...register("customerName")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                    {errors.customerName && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.customerName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      {...register("customerEmail")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                    {errors.customerEmail && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.customerEmail.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      {...register("customerPhone")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                    {errors.customerPhone && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.customerPhone.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Saved Addresses */}
                {addresses.length > 0 && !showAddressForm && (
                  <div className="space-y-3 mb-4">
                    <p className="text-sm font-medium text-gray-700">
                      Select Address
                    </p>
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddressId === addr.id
                            ? "border-brand-500 bg-brand-50"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 w-4 h-4 text-brand-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">
                              {addr.firstName} {addr.lastName}
                            </p>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 bg-brand-600 text-white text-xs rounded-full">
                                Default
                              </span>
                            )}
                            {addr.label && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {addr.label}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {addr.address}
                            {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                          </p>
                          <p className="text-sm text-gray-600">
                            {addr.city}, {addr.state}
                          </p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {addr.phone}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Add New Address Button */}
                {!showAddressForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    {addresses.length > 0
                      ? "Add New Address"
                      : "Add Delivery Address"}
                  </button>
                )}

                {/* New Address Form */}
                {showAddressForm && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      New Address
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      This address will be saved to your account for future
                      orders
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      ← Back to saved addresses
                    </button>
                  </div>
                )}

                {/* Notes */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Notes (Optional)
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
                    placeholder="Any special instructions for delivery?"
                  />
                </div>
              </div>
            )}

            {/* Step 1: Shipping Method */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Shipping Method
                    </h2>
                    {selectedAddress && (
                      <p className="text-sm text-gray-600">
                        Delivering to:{" "}
                        <span className="font-medium">
                          {selectedAddress.city}, {selectedAddress.state}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {isLoadingShipping ? (
                  <div className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-600 mb-3" />
                    <p className="text-sm text-gray-600">
                      Calculating shipping options...
                    </p>
                  </div>
                ) : shippingMethods.length === 0 ? (
                  <div className="py-12 text-center">
                    <Truck className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm text-gray-600 mb-2">
                      No shipping options available
                    </p>
                    <p className="text-xs text-gray-400">
                      Please contact support for assistance
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shippingMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedMethodId === method.id
                            ? "border-brand-500 bg-brand-50 shadow-sm"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedMethodId === method.id}
                          onChange={() => setSelectedMethodId(method.id)}
                          className="mt-1 w-4 h-4 text-brand-600"
                        />

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-gray-900 text-sm">
                                {method.name}
                              </p>
                              {method.type === "STORE_PICKUP" && (
                                <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                                  <Store className="w-3 h-3" />
                                  Pickup
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              {method.cost === 0 ? (
                                <span className="text-base font-bold text-green-600">
                                  FREE
                                </span>
                              ) : (
                                <span className="text-base font-bold text-gray-900">
                                  {formatPrice(method.cost)}
                                </span>
                              )}
                            </div>
                          </div>

                          {method.type !== "STORE_PICKUP" && (
                            <p className="text-xs text-gray-500">
                              Delivery in {method.estimatedMinDays}
                              {method.estimatedMaxDays &&
                              method.estimatedMaxDays !==
                                method.estimatedMinDays
                                ? `-${method.estimatedMaxDays}`
                                : ""}{" "}
                              {method.estimatedMinDays === 0
                                ? "day (Today!)"
                                : "days"}
                            </p>
                          )}

                          {method.type === "STORE_PICKUP" &&
                            method.storeAddress && (
                              <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                  📍 {method.storeAddress.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {method.storeAddress.address},{" "}
                                  {method.storeAddress.city}
                                </p>
                                <p className="text-xs text-gray-600">
                                  📞 {method.storeAddress.phone}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  🕒 {method.storeAddress.hours}
                                </p>
                              </div>
                            )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Cart Weight Info */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <span className="font-medium">Cart Weight:</span>{" "}
                    {cartWeight.toFixed(2)} kg
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-brand-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Payment Method
                  </h2>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    {
                      value: "PAYSTACK",
                      label: "Pay with Paystack",
                      desc: "Credit card, debit card, bank transfer, USSD",
                      icon: "💳",
                    },
                    {
                      value: "BANK_TRANSFER",
                      label: "Direct Bank Transfer",
                      desc: "Transfer directly to our bank account",
                      icon: "🏦",
                    },
                    {
                      value: "CASH_ON_DELIVERY",
                      label: "Cash on Delivery",
                      desc: "Pay with cash when your order arrives",
                      icon: "💵",
                    },
                  ].map(({ value, label, desc, icon }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        watchedPaymentMethod === value
                          ? "border-brand-500 bg-brand-50 shadow-sm"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        value={value}
                        {...register("paymentMethod")}
                        className="w-4 h-4 text-brand-600"
                      />
                      <span className="text-2xl">{icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {label}
                        </p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Discount Code */}
                <div className="pt-6 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Have a discount code?
                  </p>

                  {!discount ? (
                    <div className="flex gap-2">
                      <input
                        value={discountCode}
                        onChange={(e) =>
                          setDiscountCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter code"
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 uppercase"
                      />
                      <button
                        type="button"
                        onClick={applyDiscount}
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700"
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {discount.name}
                        </p>
                        <p className="text-xs text-green-600">
                          Saving {formatPrice(discount.amount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeDiscount}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Order Review */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brand-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Review Your Order
                  </h2>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <Image
                        src={
                          item.product.images[0] ||
                          "/images/placeholder-product.png"
                        }
                        alt={item.product.name}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                        width={64}
                        height={64}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Delivery Details */}
                <div className="space-y-3 pt-6 border-t border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Address</span>
                    <span className="font-medium text-gray-900 text-right max-w-xs">
                      {selectedAddress?.address}, {selectedAddress?.city},{" "}
                      {selectedAddress?.state}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-medium text-gray-900">
                      {watchedPaymentMethod === "PAYSTACK"
                        ? "Paystack"
                        : watchedPaymentMethod === "BANK_TRANSFER"
                          ? "Bank Transfer"
                          : "Cash on Delivery"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping Method</span>
                    <span className="font-medium text-gray-900">
                      {selectedMethod?.name || "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ← Back
                </button>
              )}
              <button
                type="submit"
                disabled={
                  isPlacing ||
                  (step === 0 && !selectedAddressId) ||
                  (step === 1 && !selectedMethodId)
                }
                className="flex-1 py-3 px-6 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isPlacing && <Loader2 className="w-4 h-4 animate-spin" />}
                {step < STEPS.length - 1 ? (
                  <>Continue to {STEPS[step + 1]} →</>
                ) : isPlacing ? (
                  "Placing Order..."
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 h-fit sticky top-24 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-medium text-gray-900">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">
                    -{formatPrice(discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="font-medium text-gray-900">
                  {step >= 1 && shippingCost > 0 ? (
                    formatPrice(shippingCost)
                  ) : step >= 1 && shippingCost === 0 ? (
                    <span className="text-green-600 font-semibold">FREE</span>
                  ) : (
                    "—"
                  )}
                </span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-brand-700">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Secure checkout</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Quality assurance</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
