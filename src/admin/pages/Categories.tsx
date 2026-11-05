import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { admin } from '../api';
import { toPersianDigits } from '../../utils';
import { Plus, Search, Edit, Trash2, ArrowRight, Check, X, ChevronUp, ChevronDown, Package } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
  products_count: number;
}

interface Props {
  onClose?: () => void;
}

type SortField = 'name' | 'slug' | 'products_count' | 'is_active';
type SortDir = 'asc' | 'desc';

export default function AdminCategories({ onClose }: Props) {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await admin.categories.list({ search, sort: sortField, direction: sortDir });
      setCats(data.data || data || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [search, sortField, sortDir]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setName(''); setSlug(''); setIsActive(true); setEditId(null); setError(''); };
  const autoSlug = (n: string) => n.replace(/[^\w\s]/g, '').trim().toLowerCase().replace(/\s+/g, '-').substring(0, 40);

  const handleNameChange = (n: string) => {
    setName(n);
    if (!editId) setSlug(autoSlug(n));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editId) {
        await admin.categories.update(editId, { name, slug, is_active: isActive });
      } else {
        await admin.categories.create({ name, slug, is_active: isActive });
      }
      resetForm(); setShowForm(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleEdit = (c: Category) => {
    setEditId(c.id); setName(c.name); setSlug(c.slug); setIsActive(c.is_active); setShowForm(true);
  };

  const handleDelete = (id: number) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await admin.categories.remove(deleteId); setDeleteId(null); load(); }
    catch (e: any) { alert(e.message); setDeleteId(null); }
    finally { setDeleting(false); }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-flex flex-col ml-1">
      <ChevronUp className={`w-3 h-3 -mb-1 ${sortField === field && sortDir === 'asc' ? 'text-amber-600' : 'text-slate-300'}`} />
      <ChevronDown className={`w-3 h-3 ${sortField === field && sortDir === 'desc' ? 'text-amber-600' : 'text-slate-300'}`} />
    </span>
  );

  const filteredCats = useMemo(() => {
    let list = cats;
    if (search) list = list.filter(c => c.name.includes(search) || c.slug.includes(search));
    return list;
  }, [cats, search]);

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><ArrowRight className="w-5 h-5" /></button>
          )}
          <div>
            <h2 className="text-lg lg:text-xl font-black text-slate-800">دسته‌بندی‌ها</h2>
            <p className="text-xs text-slate-400 mt-1">مدیریت دسته‌بندی محصولات</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-black hover:bg-amber-700 transition-all flex items-center gap-2 self-end sm:self-auto">
          <Plus className="w-4 h-4" /> دسته‌بندی جدید
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی دسته‌بندی..."
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-sm text-right focus:outline-none focus:border-amber-500" />
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/30" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="bg-white rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-md shadow-xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-black text-slate-800 mb-4">{editId ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5">نام</label>
                <input value={name} onChange={e => handleNameChange(e.target.value)} required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-right focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5">اسلاگ (انگلیسی)</label>
                <input value={slug} onChange={e => setSlug(e.target.value.replace(/[^a-z0-9_-]/g, ''))} required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-left focus:outline-none focus:border-amber-500 font-mono" dir="ltr" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-600" />
                <span className="text-sm font-bold text-slate-700">فعال</span>
              </label>
              {error && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl text-sm font-black hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> {saving ? 'در حال ذخیره...' : editId ? 'بروزرسانی' : 'ایجاد'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-sm font-black hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filteredCats.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-600">دسته‌بندی‌ای وجود ندارد</h3>
          <p className="text-xs text-slate-400 mt-2">اولین دسته‌بندی محصولات را ایجاد کنید.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-right py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                    نام <SortIcon field="name" />
                  </th>
                  <th className="text-right py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('slug')}>
                    اسلاگ <SortIcon field="slug" />
                  </th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('products_count')}>
                    محصولات <SortIcon field="products_count" />
                  </th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('is_active')}>
                    وضعیت <SortIcon field="is_active" />
                  </th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCats.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{c.name}</td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-400" dir="ltr">{c.slug}</td>
                    <td className="py-3 px-4 text-center text-xs font-bold text-slate-600">{toPersianDigits(c.products_count ?? 0)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${c.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {c.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors" title="ویرایش">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف دسته‌بندی"
        message="محصولات مرتبط با این دسته‌بندی حذف نمی‌شوند، اما از دسته‌بندی خارج می‌شوند."
        confirmLabel="حذف دسته‌بندی"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
