import React, { useState, useEffect, useMemo } from 'react';
import { admin } from '../api';
import { Plus, Search, Edit, Trash2, ArrowRight, Check, X, ChevronUp, ChevronDown, Package, Eye } from 'lucide-react';
import { toPersianDigits, formatToman, formatGram } from '../../utils';
import Dropdown, { DropdownOption } from '../../components/Dropdown';
import ConfirmDialog from '../../components/ConfirmDialog';

interface Product {
  id: number; title: string; category_id: number; seller_id: number | null;
  weight: number; wage_percentage: number; tax_percentage: number;
  metal: 'gold' | 'silver'; is_active: boolean; calculated_price?: { final_price: number } | null;
  description: string | null;
  category?: { id: number; name: string };
  seller?: { id: number; name: string };
}

interface Props { onClose?: () => void; }

type SortField = 'title' | 'metal' | 'weight' | 'wage_percentage' | 'calculated_price' | 'is_active';
type SortDir = 'asc' | 'desc';

export default function AdminProducts({ onClose }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [metal, setMetal] = useState<'gold' | 'silver'>('gold');
  const [weight, setWeight] = useState('');
  const [wagePercent, setWagePercent] = useState('8');
  const [taxPercent, setTaxPercent] = useState('9');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await admin.products.list({ search, sort: sortField, direction: sortDir });
      setProducts(data.data || data || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const loadCats = async () => {
    try {
      const data = await admin.categories.list({ per_page: 100 });
      setCategories(data.data || data || []);
    } catch {}
  };

  useEffect(() => { load(); loadCats(); }, [search, sortField, sortDir]);

  const resetForm = () => {
    setTitle(''); setCategoryId(''); setMetal('gold'); setWeight('');
    setWagePercent('8'); setTaxPercent('9'); setDescription(''); setIsActive(true);
    setEditId(null); setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = {
        title, category_id: categoryId || null, metal,
        weight: parseFloat(weight), wage_percentage: parseInt(wagePercent) || 0,
        tax_percentage: parseInt(taxPercent) || 0, description: description || null,
        is_active: isActive,
      };
      if (editId) {
        await admin.products.update(editId, payload);
      } else {
        await admin.products.create(payload);
      }
      resetForm(); setShowForm(false); load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleEdit = (p: Product) => {
    setEditId(p.id); setTitle(p.title); setCategoryId(p.category_id || '');
    setMetal(p.metal); setWeight(String(p.weight)); setWagePercent(String(p.wage_percentage));
    setDescription(p.description ?? '');
    setTaxPercent(String(p.tax_percentage)); setIsActive(p.is_active); setShowForm(true);
  };

  const handleDelete = (id: number) => setDeleteId(id);

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await admin.products.remove(deleteId); setDeleteId(null); load(); }
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
            <h2 className="text-lg lg:text-xl font-black text-slate-800">محصولات</h2>
            <p className="text-xs text-slate-400 mt-1">مدیریت محصولات فروشگاه</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-black hover:bg-amber-700 transition-all flex items-center gap-2 self-end sm:self-auto">
          <Plus className="w-4 h-4" /> محصول جدید
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی محصول..."
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-sm text-right focus:outline-none focus:border-amber-500" />
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/30 overflow-y-auto" onClick={() => { setShowForm(false); resetForm(); }}>
          <div className="bg-white rounded-t-2xl lg:rounded-2xl p-6 w-full lg:max-w-lg shadow-xl max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-black text-slate-800 mb-4">{editId ? 'ویرایش محصول' : 'محصول جدید'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5">نام محصول</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-right focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1.5">دسته‌بندی</label>
                  <Dropdown
                    options={[{ value: '', label: 'انتخاب کنید' }, ...categories.map((c: any) => ({ value: c.id, label: c.name }))]}
                    value={categoryId || ''}
                    onChange={v => setCategoryId(v ? Number(v) : '')}
                    placeholder="انتخاب کنید"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1.5">فلز</label>
                  <Dropdown
                    options={[{ value: 'gold', label: 'طلا' }, { value: 'silver', label: 'نقره' }]}
                    value={metal}
                    onChange={v => setMetal(v as 'gold' | 'silver')}
                    placeholder="انتخاب فلز"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1.5">وزن (گرم)</label>
                  <input type="number" step="0.01" min="0.01" value={weight} onChange={e => setWeight(e.target.value)} required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-left focus:outline-none focus:border-amber-500" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1.5">اجرت (%)</label>
                  <input type="number" min="0" max="100" value={wagePercent} onChange={e => setWagePercent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-left focus:outline-none focus:border-amber-500" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1.5">مالیات (%)</label>
                  <input type="number" min="0" max="100" value={taxPercent} onChange={e => setTaxPercent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-sm text-left focus:outline-none focus:border-amber-500" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1.5">توضیحات</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-right focus:outline-none focus:border-amber-500" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded accent-amber-600" />
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
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-600">محصولی ثبت نشده</h3>
          <p className="text-xs text-slate-400 mt-2">اولین محصول فروشگاه خود را اضافه کنید.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-right py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('title')}>نام <SortIcon field="title" /></th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('metal')}>فلز <SortIcon field="metal" /></th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('weight')}>وزن <SortIcon field="weight" /></th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('wage_percentage')}>اجرت <SortIcon field="wage_percentage" /></th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('calculated_price')}>قیمت <SortIcon field="calculated_price" /></th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('is_active')}>وضعیت <SortIcon field="is_active" /></th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{p.title}</div>
                      {p.category && <div className="text-[10px] text-slate-400">{p.category.name}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${p.metal === 'gold' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                        {p.metal === 'gold' ? 'طلا' : 'نقره'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-xs font-bold text-slate-600" dir="ltr">{formatGram(p.weight)}</td>
                    <td className="py-3 px-4 text-center text-xs font-bold text-slate-600" dir="ltr">{toPersianDigits(p.wage_percentage)}٪</td>
                    <td className="py-3 px-4 text-center text-xs font-black text-amber-600">{p.calculated_price?.final_price != null ? formatToman(p.calculated_price.final_price) : '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {p.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-amber-600 transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
        title="حذف محصول"
        message="آیا از حذف این محصول اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmLabel="حذف محصول"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
