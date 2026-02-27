"use client";

import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { Consultation } from "@/types";
import { apiGet, apiPut, getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";
import { formatDateTime } from "@/lib/utils";
import {
  TableRowSkeleton,
  EmptyState,
} from "@/components/shared/loading-spinner";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function AdminConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [status, setStatus] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetch = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>("/consultations");
      setConsultations(res.data.consultations);
    } catch {
      toast("Failed to load", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const openDetail = (c: Consultation) => {
    setSelected(c);
    setStatus(c.status);
    setAdminNotes(c.adminNotes || "");
    setScheduledAt(
      c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : "",
    );
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiPut(`/consultations/${selected.id}`, {
        status,
        adminNotes,
        scheduledAt: scheduledAt || undefined,
      });
      toast("Updated", "success");
      setSelected(null);
      fetch();
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Consultation Bookings</h1>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {["Customer", "Subject", "Preferred", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={5} />
                ))
              ) : consultations.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState title="No consultations yet" />
                  </td>
                </tr>
              ) : (
                consultations.map((c) => (
                  <tr
                    key={c.id}
                    className={`border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors ${selected?.id === c.id ? "bg-brand-50/50" : ""}`}
                    onClick={() => openDetail(c)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {c.customerName}
                      </p>
                      <p className="text-xs text-gray-400">{c.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] line-clamp-1 text-xs">
                      {c.subject}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {c.preferredDate
                        ? `${c.preferredDate}${c.preferredTime ? " " + c.preferredTime : ""}`
                        : "Flexible"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-600">
                      <Eye className="w-4 h-4" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selected ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Details</h2>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-gray-500">Name:</span>{" "}
                <span className="font-medium">{selected.customerName}</span>
              </p>
              <p>
                <span className="text-gray-500">Email:</span>{" "}
                {selected.customerEmail}
              </p>
              <p>
                <span className="text-gray-500">Phone:</span>{" "}
                {selected.customerPhone || "—"}
              </p>
              {selected.companyName && (
                <p>
                  <span className="text-gray-500">Company:</span>{" "}
                  {selected.companyName}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Subject</p>
              <p className="text-sm font-medium text-gray-900">
                {selected.subject}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Message</p>
              <p className=" text-gray-600 bg-gray-50 rounded-lg p-3 text-xs">
                {selected.message}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Schedule Date/Time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-500"
              >
                {Object.keys(statusColors).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="flex-1 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {saving ? "Saving…" : "Update"}
              </button>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2.5 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 flex items-center justify-center text-center">
            <p className="text-sm text-gray-400">
              Select a booking to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
