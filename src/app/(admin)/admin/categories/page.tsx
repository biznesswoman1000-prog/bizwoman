'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Category } from '@/types';
import { apiGet, apiPost, apiPut, apiDelete, getApiError } from '@/lib/api';
import { useToast } from '@/store/uiStore';
import { TableRowSkeleton, EmptyState } from '@/components/shared/loading-spinner';
import { generateSlug } from '@/lib/utils';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', parentId: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const fetch = async () => {
    setIsLoading(true);
    try {
      const res = await apiGet<any>('/categories');
      setCategories(res.data.categories);
    } catch { toast('Failed to load categories', 'error'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEditItem(null); setForm({ name: '', slug: '', description: '', parentId: '', isActive: true }); setShowForm(true); };
  const openEdit = (cat: Category) => { setEditItem(cat); setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', parentId: cat.parentId || '', isActive: cat.isActive }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, parentId: form.parentId || undefined };
      if (editItem) { await apiPut(`/categories/${editItem.id}`, payload); toast('Category updated', 'success'); }
      else { await apiPost('/categories', payload); toast('Category created', 'success'); }
      setShowForm(false); fetch();
    } catch (err) { toast(getApiError(err), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await apiDelete(`/categories/${id}`); toast('Deleted', 'success'); fetch(); }
    catch (err) { toast(getApiError(err), 'error'); }
  };

  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Categories</h1>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">{editItem ? 'Edit Category' : 'New Category'}</h2>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                required className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug *</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Parent Category</label>
              <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-brand-500">
                <option value="">None (top-level)</option>
                {topLevel.filter((c) => !editItem || c.id !== editItem.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-brand-600" />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-colors">
                {saving ? 'Saving…' : editItem ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/50">
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Parent</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Products</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />) :
             categories.length === 0 ? <tr><td colSpan={6}><EmptyState title="No categories yet" /></td></tr> :
             categories.map((cat) => (
              <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{cat.slug}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{cat.parent?.name || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{cat._count?.products ?? 0}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(cat.id, cat.name)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
