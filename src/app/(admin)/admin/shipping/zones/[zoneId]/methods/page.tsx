// frontend/src/app/(admin)/admin/shipping/zones/[zoneId]/methods/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Edit2, Trash2, Weight, Truck, Store,
  ToggleLeft, ToggleRight, X, AlertCircle, Info,
} from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete, getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";
import { formatPrice } from "@/lib/utils";

interface WeightRate {
  id?: string;
  minWeight: number;
  maxWeight: number | null;
  cost: number;
}

interface ShippingMethod {
  id: string;
  name: string;
  type: "TABLE_RATE" | "FLAT_RATE" | "STORE_PICKUP";
  isActive: boolean;
  flatRateCost?: number;
  applicableToAll: boolean;
  estimatedMinDays?: number;
  estimatedMaxDays?: number;
  storeAddress?: {
    name: string; address: string; city: string; phone: string; hours: string;
  };
  weightRates?: WeightRate[];
}

const EMPTY_WEIGHT_RATES: WeightRate[] = [
  { minWeight: 0,   maxWeight: 5,    cost: 1500 },
  { minWeight: 5,   maxWeight: 10,   cost: 2500 },
  { minWeight: 10,  maxWeight: 20,   cost: 4000 },
  { minWeight: 20,  maxWeight: 50,   cost: 7000 },
  { minWeight: 50,  maxWeight: null, cost: 12000 },
];

const defaultForm = () => ({
  name: "",
  type: "TABLE_RATE" as ShippingMethod["type"],
  isActive: true,
  flatRateCost: 2000,
  applicableToAll: true,
  estimatedMinDays: 2,
  estimatedMaxDays: 5,
  weightRates: [...EMPTY_WEIGHT_RATES],
  storeAddress: { name: "", address: "", city: "", phone: "", hours: "Mon–Sat: 9AM–6PM" },
});

export default function ZoneMethodsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const zoneId = params.zoneId as string;

  const [zone, setZone] = useState<any>(null);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMethod, setEditMethod] = useState<ShippingMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm());

  useEffect(() => { fetchData(); }, [zoneId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [zoneRes, allMethodsRes] = await Promise.all([
        apiGet<any>(`/shipping/zones/${zoneId}`),
        apiGet<any>("/shipping/methods"),
      ]);
      setZone(zoneRes.data.zone);
      setMethods(
        (allMethodsRes.data.methods || []).filter(
          (m: any) => m.zone?.id === zoneId
        )
      );
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const openNew = () => {
    setEditMethod(null);
    setForm(defaultForm());
    setShowModal(true);
  };

  const openEdit = (method: ShippingMethod) => {
    setEditMethod(method);
    setForm({
      name: method.name,
      type: method.type,
      isActive: method.isActive,
      flatRateCost: method.flatRateCost ?? 2000,
      applicableToAll: method.applicableToAll,
      estimatedMinDays: method.estimatedMinDays ?? 2,
      estimatedMaxDays: method.estimatedMaxDays ?? 5,
      weightRates: method.weightRates?.length
        ? method.weightRates.map((r) => ({ ...r }))
        : [...EMPTY_WEIGHT_RATES],
      storeAddress: method.storeAddress ?? {
        name: "", address: "", city: "", phone: "", hours: "Mon–Sat: 9AM–6PM",
      },
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast("Name is required", "error"); return; }

    if (form.type === "TABLE_RATE" && form.weightRates.length === 0) {
      toast("Add at least one weight tier", "error"); return;
    }
    if (form.type === "FLAT_RATE" && form.flatRateCost <= 0) {
      toast("Flat rate cost must be > 0", "error"); return;
    }

    // Validate weight tiers don't overlap
    if (form.type === "TABLE_RATE") {
      for (let i = 0; i < form.weightRates.length - 1; i++) {
        const curr = form.weightRates[i];
        const next = form.weightRates[i + 1];
        if (curr.maxWeight === null) {
          toast("Only the last tier can have no max weight", "error"); return;
        }
        if (curr.maxWeight !== next.minWeight) {
          toast(`Weight tiers must be continuous: tier ${i + 1} max must equal tier ${i + 2} min`, "error");
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        zoneId,
        name: form.name,
        type: form.type,
        isActive: form.isActive,
        applicableToAll: form.applicableToAll,
        estimatedMinDays: form.estimatedMinDays,
        estimatedMaxDays: form.estimatedMaxDays,
        ...(form.type === "FLAT_RATE" && { flatRateCost: form.flatRateCost }),
        ...(form.type === "TABLE_RATE" && {
          weightRates: form.weightRates.map(({ id, ...r }) => r),
        }),
        ...(form.type === "STORE_PICKUP" && { storeAddress: form.storeAddress }),
      };

      if (editMethod) {
        await apiPut(`/shipping/methods/${editMethod.id}`, payload);
        toast("Method updated", "success");
      } else {
        await apiPost("/shipping/methods", payload);
        toast("Method created", "success");
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (method: ShippingMethod) => {
    if (!confirm(`Delete "${method.name}"?`)) return;
    try {
      await apiDelete(`/shipping/methods/${method.id}`);
      toast("Method deleted", "success");
      fetchData();
    } catch (err) {
      toast(getApiError(err), "error");
    }
  };

  const toggleMethod = async (method: ShippingMethod) => {
    try {
      await apiPut(`/shipping/methods/${method.id}`, { isActive: !method.isActive });
      toast(`Method ${method.isActive ? "disabled" : "enabled"}`, "success");
      fetchData();
    } catch (err) {
      toast(getApiError(err), "error");
    }
  };

  // Weight rate helpers
  const addWeightTier = () => {
    const last = form.weightRates[form.weightRates.length - 1];
    const prevMax = last?.maxWeight ?? 50;
    setForm((f) => ({
      ...f,
      weightRates: [
        ...f.weightRates.map((r, i) =>
          i === f.weightRates.length - 1 ? { ...r, maxWeight: prevMax } : r
        ),
        { minWeight: prevMax, maxWeight: null, cost: (last?.cost ?? 5000) + 2000 },
      ],
    }));
  };

  const removeWeightTier = (idx: number) => {
    setForm((f) => ({
      ...f,
      weightRates: f.weightRates.filter((_, i) => i !== idx),
    }));
  };

  const updateWeightTier = (idx: number, field: keyof WeightRate, value: any) => {
    setForm((f) => ({
      ...f,
      weightRates: f.weightRates.map((r, i) =>
        i === idx ? { ...r, [field]: value === "" ? null : Number(value) } : r
      ),
    }));
  };

  const typeIcon = (type: string) => {
    if (type === "TABLE_RATE") return <Weight className="w-4 h-4" />;
    if (type === "STORE_PICKUP") return <Store className="w-4 h-4" />;
    return <Truck className="w-4 h-4" />;
  };

  const typeColor = (type: string) => {
    if (type === "TABLE_RATE") return "bg-purple-50 text-purple-700 border-purple-100";
    if (type === "STORE_PICKUP") return "bg-green-50 text-green-700 border-green-100";
    return "bg-blue-50 text-blue-700 border-blue-100";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/shipping")}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {isLoading ? "Loading..." : zone?.name ?? "Zone Methods"}
          </h1>
          {zone && (
            <p className="text-sm text-gray-500 mt-1">
              {zone.states.join(", ")}
            </p>
          )}
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Method
        </button>
      </div>

      {/* Methods */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : methods.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No shipping methods yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Add flat rate, weight-based, or store pickup methods
          </p>
          <button
            onClick={openNew}
            className="mt-4 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
          >
            Add First Method
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {methods.map((method) => (
            <div key={method.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-start justify-between px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${typeColor(method.type)}`}>
                    {typeIcon(method.type)}
                    {method.type === "TABLE_RATE" ? "Weight-Based" : method.type === "STORE_PICKUP" ? "Store Pickup" : "Flat Rate"}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      {!method.isActive && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Disabled</span>
                      )}
                    </div>
                    {method.type === "FLAT_RATE" && (
                      <p className="text-sm text-gray-600 mt-0.5">₦{formatPrice(method.flatRateCost || 0)}</p>
                    )}
                    {method.type === "STORE_PICKUP" && method.storeAddress && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        {method.storeAddress.name} — {method.storeAddress.city}
                      </p>
                    )}
                    {method.estimatedMinDays && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {method.estimatedMinDays}–{method.estimatedMaxDays} business days
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleMethod(method)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                    {method.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => openEdit(method)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(method)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weight Rate Table */}
              {method.type === "TABLE_RATE" && method.weightRates && method.weightRates.length > 0 && (
                <div className="border-t border-gray-50 px-5 pb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-3 mb-2">Weight Rates</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b border-gray-100">
                        <th className="text-left py-1.5 font-medium">Min (kg)</th>
                        <th className="text-left py-1.5 font-medium">Max (kg)</th>
                        <th className="text-right py-1.5 font-medium">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {method.weightRates.map((rate, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-1.5 text-gray-700">{rate.minWeight}</td>
                          <td className="py-1.5 text-gray-700">{rate.maxWeight ?? "No limit"}</td>
                          <td className="py-1.5 text-right font-medium text-gray-900">₦{formatPrice(rate.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editMethod ? "Edit Shipping Method" : "New Shipping Method"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Method Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Method Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["TABLE_RATE", "FLAT_RATE", "STORE_PICKUP"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type }))}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        form.type === type
                          ? "border-brand-500 bg-brand-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${typeColor(type)}`}>
                        {typeIcon(type)}
                      </div>
                      <div className="text-xs font-medium text-gray-900">
                        {type === "TABLE_RATE" ? "Weight-Based" : type === "STORE_PICKUP" ? "Store Pickup" : "Flat Rate"}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {type === "TABLE_RATE" ? "Rate by kg" : type === "STORE_PICKUP" ? "Free collect" : "Fixed price"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Method Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  placeholder={
                    form.type === "TABLE_RATE" ? "e.g., Standard Weight Shipping"
                    : form.type === "STORE_PICKUP" ? "e.g., Lagos Store Pickup"
                    : "e.g., Express Delivery"
                  }
                />
              </div>

              {/* Delivery Estimate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Days</label>
                  <input
                    type="number"
                    min={0}
                    value={form.estimatedMinDays}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedMinDays: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Days</label>
                  <input
                    type="number"
                    min={0}
                    value={form.estimatedMaxDays}
                    onChange={(e) => setForm((f) => ({ ...f, estimatedMaxDays: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* FLAT RATE specific */}
              {form.type === "FLAT_RATE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Flat Cost (₦) *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.flatRateCost}
                    onChange={(e) => setForm((f) => ({ ...f, flatRateCost: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              {/* TABLE RATE: weight tiers */}
              {form.type === "TABLE_RATE" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Weight Tiers *</label>
                    <button
                      type="button"
                      onClick={addWeightTier}
                      className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      <Plus className="w-3 h-3" /> Add Tier
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">Min kg</th>
                          <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">Max kg</th>
                          <th className="text-left px-3 py-2.5 text-xs font-medium text-gray-500">Cost (₦)</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {form.weightRates.map((rate, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={rate.minWeight}
                                onChange={(e) => updateWeightTier(idx, "minWeight", e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step={0.1}
                                value={rate.maxWeight ?? ""}
                                placeholder="No limit"
                                onChange={(e) => updateWeightTier(idx, "maxWeight", e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                value={rate.cost}
                                onChange={(e) => updateWeightTier(idx, "cost", e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-400"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                onClick={() => removeWeightTier(idx)}
                                disabled={form.weightRates.length <= 1}
                                className="p-1 text-gray-300 hover:text-red-500 disabled:cursor-not-allowed rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Tiers must be continuous: each tier's min must equal the previous tier's max.
                    Leave max empty for the last tier (no upper limit).
                  </p>
                </div>
              )}

              {/* STORE PICKUP specific */}
              {form.type === "STORE_PICKUP" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Store Address</label>
                  <input
                    type="text"
                    placeholder="Store/Branch Name"
                    value={form.storeAddress.name}
                    onChange={(e) => setForm((f) => ({ ...f, storeAddress: { ...f.storeAddress, name: e.target.value } }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={form.storeAddress.address}
                    onChange={(e) => setForm((f) => ({ ...f, storeAddress: { ...f.storeAddress, address: e.target.value } }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={form.storeAddress.city}
                      onChange={(e) => setForm((f) => ({ ...f, storeAddress: { ...f.storeAddress, city: e.target.value } }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                    />
                    <input
                      type="text"
                      placeholder="Phone"
                      value={form.storeAddress.phone}
                      onChange={(e) => setForm((f) => ({ ...f, storeAddress: { ...f.storeAddress, phone: e.target.value } }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Operating Hours, e.g. Mon–Sat: 9AM–6PM"
                    value={form.storeAddress.hours}
                    onChange={(e) => setForm((f) => ({ ...f, storeAddress: { ...f.storeAddress, hours: e.target.value } }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
              )}

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? "bg-brand-600" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">Active (available at checkout)</span>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-5 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : editMethod ? "Update Method" : "Create Method"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
