//frontend/src/app/(admin)/admin/shipping/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { ShippingZone, ShippingRate } from "@/types";
import { apiGet, apiPost, apiPut, apiDelete, getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";
import { formatPrice, NIGERIAN_STATES } from "@/lib/utils";
import { EmptyState } from "@/components/shared/loading-spinner";

export default function AdminShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [showRateForm, setShowRateForm] = useState<string | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: "",
    states: [] as string[],
    isActive: true,
  });
  const [rateForm, setRateForm] = useState({
    name: "",
    cost: 0,
    minOrderAmount: "",
    freeAbove: "",
    estimatedDays: 3,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetchZones = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/shipping/zones");
      setZones(res.data.zones);
    } catch {
      toast("Failed to load", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const createZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost("/shipping/zones", zoneForm);
      toast("Zone created", "success");
      setShowZoneForm(false);
      fetchZones();
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteZone = async (id: string) => {
    if (!confirm("Delete this zone?")) return;
    try {
      await apiDelete(`/shipping/zones/${id}`);
      toast("Deleted", "success");
      fetchZones();
    } catch (err) {
      toast(getApiError(err), "error");
    }
  };

  const createRate = async (e: React.FormEvent, zoneId: string) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiPost(`/shipping/zones/${zoneId}/rates`, {
        ...rateForm,
        cost: Number(rateForm.cost),
        minOrderAmount: rateForm.minOrderAmount
          ? Number(rateForm.minOrderAmount)
          : undefined,
        freeAbove: rateForm.freeAbove ? Number(rateForm.freeAbove) : undefined,
      });
      toast("Rate added", "success");
      setShowRateForm(null);
      fetchZones();
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteRate = async (zoneId: string, rateId: string) => {
    if (!confirm("Delete this rate?")) return;
    try {
      await apiDelete(`/shipping/zones/${zoneId}/rates/${rateId}`);
      toast("Deleted", "success");
      fetchZones();
    } catch (err) {
      toast(getApiError(err), "error");
    }
  };

  const toggleState = (state: string) => {
    setZoneForm((p) => ({
      ...p,
      states: p.states.includes(state)
        ? p.states.filter((s) => s !== state)
        : [...p.states, state],
    }));
  };

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500";

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          Shipping Zones & Rates
        </h1>
        <button
          onClick={() => {
            setZoneForm({ name: "", states: [], isActive: true });
            setShowZoneForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Zone
        </button>
      </div>

      {showZoneForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            New Shipping Zone
          </h2>
          <form onSubmit={createZone} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Zone Name *
              </label>
              <input
                value={zoneForm.name}
                onChange={(e) =>
                  setZoneForm({ ...zoneForm, name: e.target.value })
                }
                required
                placeholder="e.g. Lagos, South-West, Rest of Nigeria"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                States Covered
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-3">
                {NIGERIAN_STATES.map((s) => (
                  <label
                    key={s}
                    className="flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={zoneForm.states.includes(s)}
                      onChange={() => toggleState(s)}
                      className="rounded border-gray-300 text-brand-600"
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {saving ? "Saving…" : "Create Zone"}
              </button>
              <button
                type="button"
                onClick={() => setShowZoneForm(false)}
                className="px-5 py-2.5 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading zones…</div>
      ) : zones.length === 0 ? (
        <EmptyState
          title="No shipping zones yet"
          description="Create zones to set up delivery rates."
        />
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer"
                onClick={() =>
                  setExpanded(expanded === zone.id ? null : zone.id)
                }
              >
                {expanded === zone.id ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{zone.name}</p>
                  <p className="text-xs text-gray-400">
                    {zone.states.length} state(s) · {zone.rates?.length || 0}{" "}
                    rate(s)
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${zone.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {zone.isActive ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteZone(zone.id);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {expanded === zone.id && (
                <div className="border-t border-gray-50 px-5 pb-5 pt-4 space-y-4">
                  {zone.states.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {zone.states.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        Shipping Rates
                      </p>
                      <button
                        onClick={() => {
                          setRateForm({
                            name: "",
                            cost: 0,
                            minOrderAmount: "",
                            freeAbove: "",
                            estimatedDays: 3,
                            isActive: true,
                          });
                          setShowRateForm(zone.id);
                        }}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium"
                      >
                        <Plus className="w-3 h-3" /> Add Rate
                      </button>
                    </div>

                    {zone.rates?.length ? (
                      <div className="space-y-2">
                        {zone.rates.map((rate) => (
                          <div
                            key={rate.id}
                            className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 text-sm"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {rate.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {rate.estimatedDays} days
                                {rate.freeAbove
                                  ? ` · Free above ${formatPrice(rate.freeAbove)}`
                                  : ""}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-gray-900">
                                {rate.cost === 0 ? (
                                  <span className="text-green-600">Free</span>
                                ) : (
                                  formatPrice(rate.cost)
                                )}
                              </span>
                              <button
                                onClick={() => deleteRate(zone.id, rate.id)}
                                className="p-1 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No rates yet.</p>
                    )}

                    {showRateForm === zone.id && (
                      <form
                        onSubmit={(e) => createRate(e, zone.id)}
                        className="mt-3 bg-brand-50 rounded-xl p-4 space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Rate Name *
                            </label>
                            <input
                              value={rateForm.name}
                              onChange={(e) =>
                                setRateForm({
                                  ...rateForm,
                                  name: e.target.value,
                                })
                              }
                              required
                              placeholder="e.g. Standard Delivery"
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Cost (₦) *
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={rateForm.cost}
                              onChange={(e) =>
                                setRateForm({
                                  ...rateForm,
                                  cost: Number(e.target.value),
                                })
                              }
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Days
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={rateForm.estimatedDays}
                              onChange={(e) =>
                                setRateForm({
                                  ...rateForm,
                                  estimatedDays: Number(e.target.value),
                                })
                              }
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Free above (₦)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={rateForm.freeAbove}
                              onChange={(e) =>
                                setRateForm({
                                  ...rateForm,
                                  freeAbove: e.target.value,
                                })
                              }
                              placeholder="Optional"
                              className={inputCls}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60"
                          >
                            {saving ? "…" : "Add Rate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRateForm(null)}
                            className="px-4 py-2 border border-gray-200 text-xs rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
