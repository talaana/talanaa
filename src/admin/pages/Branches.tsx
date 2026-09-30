import React, { useState, useEffect, useMemo } from 'react';
import { admin } from '../api';
import { Plus, Search, Edit, Trash2, ArrowRight, Check, X, ChevronUp, ChevronDown, Store, Phone, MapPin } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

interface Branch {
  id: number; name: string; slug: string; city: string | null; address: string | null;
  phone: string | null; is_active: boolean; staff_count?: number;
}

interface Props { onClose?: () => void; }

type SortField = 'name' | 'slug' | 'city' | 'is_active';
type SortDir = 'asc' | 'desc';

export default function AdminBranches({ onClose }: Props) {
  const [branches, setBranches] = useState<Branch[]>([]);
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

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await admin.branches.list({ search, sort: sortField, direction: sortDir });
      setBranches(data.data || data || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, sortField, sortDir]);

  const resetForm = () => { setName(''); setSlug(''); setCity(''); setAddress(''); setPhone(''); setIsActive(true); setEditId(null); setError(''); };
  const autoSlug = (n: string) => n.replace(/[^\w\s]/g, '').trim().toLowerCase().replace(/\s+/g, '-').substring(0, 40);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { name, slug, city: city || null, address: address || null, phone: phone || null, is_active: isActive };
      if (editId) await admin.branches.update(editId, payload);
      else await admin.branches.create(payload);
      resetForm(); setShowForm(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleEdit = (b: Branch) => {
    setEditId(b.id); setName(b.name); setSlug(b.slug); setCity(b.city || ''); setAddress(b.address || '');
    setPhone(b.phone || ''); setIsActive(b.is_active); setShowForm(true);
  };

  const handleDelete = (id: number) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await admin.branches.remove(deleteId); setDeleteId(null); load(); }
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

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onClose && <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><ArrowRight className="w-5 h-5" /></button>}
          <div>
            <h2 className="text-lg lg:text-xl font-black text-slate-800">شعب فروشگاه</h2>
            <p className="text-xs text-slate-400 mt-1">مدیریت شعب و آدرس‌های فیزیکی</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-black hover:bg-emerald-700 transition-all flex items-center gap-2 self-end sm:self-auto">
          <Plus className="w-4 h-4" /> شعبه جدید
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی شعبه..."
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-sm text-right focus:outline-none focus:border-amber-500" />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/30" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="bg-white rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-md shadow-xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-black text-slate-800 mb-4">{editId ? 'ویرایش شعبه' : 'شعبه جدید'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5">نام شعبه</label>
                <input value={name} onChange={e => { setName(e.target.value); if (!editId) setSlug(autoSlug(e.target.value)); }} required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-right focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5">اسلاگ</label>
                <input value={slug} onChange={e => setSlug(e.target.value.replace(/[^a-z0-9_-]/g, ''))} required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-left focus:outline-none focus:border-amber-500 font-mono" dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1.5"><MapPin className="w-3 h-3 inline ml-1" />شهر</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1.5"><Phone className="w-3 h-3 inline ml-1" />تلفن</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-left focus:outline-none focus:border-amber-500" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5">آدرس</label>
                <input value={address} onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-right focus:outline-none focus:border-amber-500" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded accent-amber-600" />
                <span className="text-sm font-bold text-slate-700">فعال</span>
              </label>
              {error && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-black hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
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

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : branches.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <Store className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-600">شعبه‌ای ثبت نشده</h3>
          <p className="text-xs text-slate-400 mt-2">شعب فیزیکی فروشگاه خود را اضافه کنید.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-right py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('name')}>نام <SortIcon field="name" /></th>
                  <th className="text-right py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('slug')}>اسلاگ <SortIcon field="slug" /></th>
                  <th className="text-right py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('city')}>شهر <SortIcon field="city" /></th>
                  <th className="text-right py-3 px-4 text-[10px] font-black text-slate-500">آدرس</th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('is_active')}>وضعیت <SortIcon field="is_active" /></th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {branches.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{b.name}</td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-400" dir="ltr">{b.slug}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{b.city || '-'}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-[200px] truncate">{b.address || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${b.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {b.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(b)} className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
        title="حذف شعبه"
        message="آیا از حذف این شعبه اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmLabel="حذف شعبه"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
