// frontend/src/app/(admin)/admin/shipping/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Truck, Weight, Store, Plus, ChevronRight,
  ToggleLeft, ToggleRight, Trash2, Edit2, Package,
  TrendingUp, AlertCircle,
} from "lucide-react";
import { apiGet, apiDelete, apiPut, getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";
import { formatPrice } from "@/lib/utils";

interface ShippingZone {
  id: string;
  name: string;
  description?: string;
  states: string[];
  isActive: boolean;
  _count?: { methods: number };
}

interface ShippingMethod {
  id: string;
  name: string;
  type: "TABLE_RATE" | "FLAT_RATE" | "STORE_PICKUP";
  isActive: boolean;
  flatRateCost?: number;
  estimatedMinDays?: number;
  estimatedMaxDays?: number;
  zone: { id: string; name: string; states: string[] };
  weightRates?: Array<{ minWeight: number; maxWeight: number | null; cost: number }>;
}

export default function AdminShippingPage() {
  const router = useRouter();
  const toast = useToast();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "zones" | "methods">("overview");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [zonesRes, methodsRes] = await Promise.all([
        apiGet<any>("/shipping/zones/all"),
        apiGet<any>("/shipping/methods"),
      ]);
      setZones(zonesRes.data.zones || []);
      setMethods(methodsRes.data.methods || []);
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleZone = async (zone: ShippingZone) => {
    try {
      await apiPut(`/shipping/zones/${zone.id}`, { isActive: !zone.isActive });
      toast(`Zone ${zone.isActive ? "disabled" : "enabled"}`, "success");
      fetchAll();
    } catch (err) {
      toast(getApiError(err), "error");
    }
  };

  const toggleMethod = async (method: ShippingMethod) => {
    try {
      await apiPut(`/shipping/methods/${method.id}`, { isActive: !method.isActive });
      toast(`Method ${method.isActive ? "disabled" : "enabled"}`, "success");
      fetchAll();
    } catch (err) {
      toast(getApiError(err), "error");
    }
  };

  const deleteZone = async (zone: ShippingZone) => {
    if ((zone._count?.methods || 0) > 0) {
      toast("Delete all methods in this zone first", "error");
      return;
    }
    if (!confirm(`Delete zone "${zone.name}"?`)) return;
    try {
      await apiDelete(`/shipping/zones/${zone.id}`);
      toast("Zone deleted", "success");
      fetchAll();
    } catch (err) {
      toast(getApiError(err), "error");
    }
  };

  const deleteMethod = async (method: ShippingMethod) => {
    if (!confirm(`Delete method "${method.name}"?`)) return;
    try {
      await apiDelete(`/shipping/methods/${method.id}`);
      toast("Method deleted", "success");
      fetchAll();
    } catch (err) {
      toast(getApiError(err), "error");
    }
  };

  const typeIcon = (type: string) => {
    if (type === "TABLE_RATE") return <Weight className="w-4 h-4" />;
    if (type === "STORE_PICKUP") return <Store className="w-4 h-4" />;
    return <Truck className="w-4 h-4" />;
  };

  const typeLabel = (type: string) => {
    if (type === "TABLE_RATE") return "Weight-Based";
    if (type === "STORE_PICKUP") return "Store Pickup";
    return "Flat Rate";
  };

  const typeColor = (type: string) => {
    if (type === "TABLE_RATE") return "bg-purple-50 text-purple-700";
    if (type === "STORE_PICKUP") return "bg-green-50 text-green-700";
    return "bg-blue-50 text-blue-700";
  };

  const stats = {
    totalZones: zones.length,
    activeZones: zones.filter((z) => z.isActive).length,
    totalMethods: methods.length,
    activeMethods: methods.filter((m) => m.isActive).length,
    coveredStates: new Set(zones.flatMap((z) => z.states)).size,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logistics & Shipping</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage zones, shipping methods, rates, and tracking
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/admin/shipping/zones")}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Manage Zones
          </button>
          <button
            onClick={() => router.push("/admin/shipping/zones")}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Zone
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Zones", value: stats.totalZones, sub: `${stats.activeZones} active`, icon: MapPin, color: "text-blue-600 bg-blue-50" },
          { label: "Covered States", value: stats.coveredStates, sub: "of 37 states", icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { label: "Shipping Methods", value: stats.totalMethods, sub: `${stats.activeMethods} active`, icon: Truck, color: "text-purple-600 bg-purple-50" },
          { label: "Weight Tables", value: methods.filter((m) => m.type === "TABLE_RATE").length, sub: "table rate", icon: Weight, color: "text-orange-600 bg-orange-50" },
          { label: "Pickup Locations", value: methods.filter((m) => m.type === "STORE_PICKUP").length, sub: "store pickup", icon: Store, color: "text-pink-600 bg-pink-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm font-medium text-gray-700">{s.label}</div>
            <div className="text-xs text-gray-500">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(["overview", "zones", "methods"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {zones.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                  <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No shipping zones yet</p>
                  <p className="text-sm text-gray-400 mt-1">Create zones to define shipping coverage areas</p>
                  <button
                    onClick={() => router.push("/admin/shipping/zones")}
                    className="mt-4 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
                  >
                    Create First Zone
                  </button>
                </div>
              ) : (
                zones.map((zone) => {
                  const zoneMethods = methods.filter((m) => m.zone.id === zone.id);
                  return (
                    <div key={zone.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                      {/* Zone Header */}
                      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${zone.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                          <div>
                            <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                            <p className="text-xs text-gray-500">{zone.states.length} states • {zoneMethods.length} methods</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/admin/shipping/zones/${zone.id}/methods`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                          >
                            <Plus className="w-3 h-3" /> Add Method
                          </button>
                          <button onClick={() => toggleZone(zone)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                            {zone.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => router.push("/admin/shipping/zones")}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteZone(zone)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* States */}
                      <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-50">
                        <div className="flex flex-wrap gap-1">
                          {zone.states.slice(0, 10).map((s) => (
                            <span key={s} className="px-2 py-0.5 bg-white border border-gray-200 text-xs text-gray-600 rounded-md">{s}</span>
                          ))}
                          {zone.states.length > 10 && (
                            <span className="px-2 py-0.5 text-xs text-gray-400">+{zone.states.length - 10} more</span>
                          )}
                        </div>
                      </div>

                      {/* Methods */}
                      {zoneMethods.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                          {zoneMethods.map((method) => (
                            <div key={method.id} className="flex items-center justify-between px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${typeColor(method.type)}`}>
                                  {typeIcon(method.type)} {typeLabel(method.type)}
                                </span>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{method.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {method.type === "FLAT_RATE" && `₦${formatPrice(method.flatRateCost || 0)} flat`}
                                    {method.type === "TABLE_RATE" && `${method.weightRates?.length || 0} weight tiers`}
                                    {method.type === "STORE_PICKUP" && "Free pickup"}
                                    {method.estimatedMinDays && ` • ${method.estimatedMinDays}–${method.estimatedMaxDays} days`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!method.isActive && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Disabled</span>
                                )}
                                <button onClick={() => toggleMethod(method)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                                  {method.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => router.push(`/admin/shipping/zones/${zone.id}/methods`)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteMethod(method)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-5 py-4 text-center">
                          <p className="text-sm text-gray-400">No methods yet —{" "}
                            <button
                              onClick={() => router.push(`/admin/shipping/zones/${zone.id}/methods`)}
                              className="text-brand-600 hover:underline"
                            >
                              add one
                            </button>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Zones Tab */}
          {activeTab === "zones" && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => router.push("/admin/shipping/zones")}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Zone
                </button>
              </div>
              {zones.map((zone) => (
                <div key={zone.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${zone.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                      <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500">{zone.states.length} states • {zone._count?.methods || 0} methods</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {zone.states.slice(0, 6).map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-gray-50 text-xs text-gray-600 rounded">{s}</span>
                      ))}
                      {zone.states.length > 6 && <span className="text-xs text-gray-400">+{zone.states.length - 6}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/admin/shipping/zones/${zone.id}/methods`)}
                      className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                      title="Manage methods"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleZone(zone)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                      {zone.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => deleteZone(zone)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Methods Tab */}
          {activeTab === "methods" && (
            <div className="space-y-3">
              {methods.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                  <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No shipping methods yet</p>
                  <p className="text-sm text-gray-400 mt-1">Create zones first, then add methods to each zone</p>
                </div>
              ) : (
                methods.map((method) => (
                  <div key={method.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${typeColor(method.type)}`}>
                          {typeIcon(method.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{method.name}</h3>
                            {!method.isActive && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Disabled</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            Zone: {method.zone.name} • {typeLabel(method.type)}
                          </p>
                          {method.type === "FLAT_RATE" && (
                            <p className="text-sm font-medium text-gray-700 mt-1">₦{formatPrice(method.flatRateCost || 0)}</p>
                          )}
                          {method.type === "TABLE_RATE" && method.weightRates && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {method.weightRates.map((r, i) => (
                                <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-md">
                                  {r.minWeight}–{r.maxWeight ?? "∞"}kg: ₦{formatPrice(r.cost)}
                                </span>
                              ))}
                            </div>
                          )}
                          {method.estimatedMinDays && (
                            <p className="text-xs text-gray-400 mt-1">
                              Delivery: {method.estimatedMinDays}–{method.estimatedMaxDays} days
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleMethod(method)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                          {method.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => router.push(`/admin/shipping/zones/${method.zone.id}/methods`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMethod(method)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
