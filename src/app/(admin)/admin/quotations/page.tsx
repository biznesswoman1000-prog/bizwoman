'use client';

import { useState, useEffect } from 'react';
import { Eye, ChevronDown } from 'lucide-react';
import { Quotation } from '@/types';
import { apiGet, apiPut, getApiError } from '@/lib/api';
import { useToast } from '@/store/uiStore';
import { formatDateTime, formatPrice } from '@/lib/utils';
import { TableRowSkeleton, EmptyState } from '@/components/shared/loading-spinner';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800', IN_REVIEW: 'bg-blue-100 text-blue-800',
  SENT: 'bg-purple-100 text-purple-800', ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800', CONVERTED: 'bg-gray-100 text-gray-700',
};

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [status, setStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [totalEstimate, setTotalEstimate] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetch = async () => {
    setIsLoading(true);
    try { const res = await apiGet<any>('/quotations'); setQuotations(res.data.quotations); }
    catch { toast('Failed to load', 'error'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openDetail = (q: Quotation) => {
    setSelected(q); setStatus(q.status); setAdminNotes(q.adminNotes || ''); setTotalEstimate(q.totalEstimate?.toString() || '');
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiPut(`/quotations/${selected.id}`, { status, adminNotes, totalEstimate: totalEstimate ? Number(totalEstimate) : undefined });
      toast('Updated', 'success'); setSelected(null); fetch();
    } catch (err) { toast(getApiError(err), 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Quotation Requests</h1>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {['Customer', 'Company', 'Items', 'Date', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />) :
               quotations.length === 0 ? <tr><td colSpan={6}><EmptyState title="No quotations yet" /></td></tr> :
               quotations.map((q) => (
                <tr key={q.id} className={`border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors ${selected?.id === q.id ? 'bg-brand-50/50' : ''}`}
                  onClick={() => openDetail(q)}>
                  <td className="px-4 py-3"><p className="font-medium text-gray-900">{q.customerName}</p><p className="text-xs text-gray-400">{q.customerEmail}</p></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{q.companyName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{q.items.length}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDateTime(q.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[q.status]}`}>{q.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-brand-600"><Eye className="w-4 h-4" /></td>
                </tr>
               ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">#{selected.id.slice(-6).toUpperCase()}</h2>
            <div className="text-sm space-y-1">
              <p><span className="text-gray-500">Customer:</span> <span className="font-medium">{selected.customerName}</span></p>
              <p><span className="text-gray-500">Email:</span> {selected.customerEmail}</p>
              <p><span className="text-gray-500">Phone:</span> {selected.customerPhone || '—'}</p>
              {selected.companyName && <p><span className="text-gray-500">Company:</span> {selected.companyName}</p>}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Items Requested</p>
              <ul className="space-y-1">
                {selected.items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium">{item.quantity}x</span> {item.productName}
                    {item.specifications && <p className="text-xs text-gray-400 mt-0.5">{item.specifications}</p>}
                  </li>
                ))}
              </ul>
            </div>
            {selected.message && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Message</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selected.message}</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-500">
                {Object.keys(statusColors).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Total Estimate (₦)</label>
              <input type="number" value={totalEstimate} onChange={(e) => setTotalEstimate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Admin Notes</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-brand-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleUpdate} disabled={saving}
                className="flex-1 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-colors">
                {saving ? 'Saving…' : 'Update'}
              </button>
              <button onClick={() => setSelected(null)}
                className="px-4 py-2.5 border border-gray-200 text-sm rounded-xl hover:bg-gray-50 transition-colors">Close</button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 flex items-center justify-center text-center">
            <p className="text-sm text-gray-400">Click a quotation to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
