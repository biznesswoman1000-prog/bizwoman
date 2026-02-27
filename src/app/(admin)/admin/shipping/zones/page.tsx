"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ChevronRight } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete, getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";
import { NIGERIAN_STATES } from "@/lib/utils";

interface ShippingZone {
  id: string;
  name: string;
  description?: string;
  states: string[];
  isActive: boolean;
  _count?: { methods: number };
}

export default function AdminShippingZonesPage() {
  const toast = useToast();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editZone, setEditZone] = useState<ShippingZone | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    states: [] as string[],
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/shipping/zones/all");
      setZones(res.data.zones);
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const openNew = () => {
    setEditZone(null);
    setForm({ name: "", description: "", states: [], isActive: true });
    setShowModal(true);
  };

  const openEdit = (zone: ShippingZone) => {
    setEditZone(zone);
    setForm({
      name: zone.name,
      description: zone.description || "",
      states: zone.states,
      isActive: zone.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.states.length === 0) {
      toast("Please select at least one state", "error");
      return;
    }

    setSaving(true);
    try {
      if (editZone) {
        await apiPut(`/shipping/zones/${editZone.id}`, form);
        toast("Zone updated successfully", "success");
      } else {
        await apiPost("/shipping/zones", form);
        toast("Zone created successfully", "success");
      }
      setShowModal(false);
      fetchZones();
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, hasMethod: boolean) => {
    if (hasMethod) {
      toast("Cannot delete zone with shipping methods", "error");
      return;
    }

    if (!confirm("Are you sure you want to delete this zone?")) return;

    try {
      await apiDelete(`/shipping/zones/${id}`);
      toast("Zone deleted successfully", "success");
      fetchZones();
    } catch (err) {
      toast(getApiError(err), "error");
    }
  };

  const toggleState = (state: string) => {
    setForm((prev) => ({
      ...prev,
      states: prev.states.includes(state)
        ? prev.states.filter((s) => s !== state)
        : [...prev.states, state],
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Zones</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage shipping zones and coverage areas
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Zone
        </button>
      </div>

      {/* Zones List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No shipping zones yet.</p>
          <button
            onClick={openNew}
            className="mt-4 text-brand-600 hover:text-brand-700 text-sm font-medium"
          >
            Create your first zone
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {zone.name}
                    </h3>
                    {!zone.isActive && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>

                  {zone.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {zone.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>📍 {zone.states.length} states</span>
                    <span>🚚 {zone._count?.methods || 0} shipping methods</span>
                  </div>

                  {/* States Preview */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {zone.states.slice(0, 8).map((state) => (
                      <span
                        key={state}
                        className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded"
                      >
                        {state}
                      </span>
                    ))}
                    {zone.states.length > 8 && (
                      <span className="px-2 py-1 text-gray-500 text-xs">
                        +{zone.states.length - 8} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() =>
                      (window.location.href = `/admin/shipping/zones/${zone.id}/methods`)
                    }
                    className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Manage methods"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEdit(zone)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(zone.id, (zone._count?.methods || 0) > 0)
                    }
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editZone ? "Edit Zone" : "New Shipping Zone"}
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
                  placeholder="e.g., Lagos Metropolitan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 resize-none"
                  placeholder="Brief description of this zone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  States * ({form.states.length} selected)
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {NIGERIAN_STATES.map((state) => (
                      <label
                        key={state}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
                      >
                        <input
                          type="checkbox"
                          checked={form.states.includes(state)}
                          onChange={() => toggleState(state)}
                          className="rounded border-gray-300 text-brand-600"
                        />
                        <span className="text-sm text-gray-700">{state}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="rounded border-gray-300 text-brand-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (available for customers)
                  </span>
                </label>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 flex gap-3">
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
                {saving
                  ? "Saving..."
                  : editZone
                    ? "Update Zone"
                    : "Create Zone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
