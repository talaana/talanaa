import React, { useEffect, useState } from 'react';
import { admin } from '../api';
import { toPersianDigits } from '../../utils';
import { Plus, Store, ToggleLeft, ToggleRight, Save, X, LogIn, ShoppingBag, Users } from 'lucide-react';
import Dropdown from '../../components/Dropdown';

export default function AdminTenants({ onImpersonate }: { onImpersonate?: (tenantId: number) => void }) {
  const [tenants, setTenants] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', domain: '', type: 'marketplace' });
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => { load(); }, []);
  const load = async () => setTenants(await admin.tenants.list());

  const handleSave = async () => {
    if (editId) { await admin.tenants.update(editId, form); } else { await admin.tenants.create(form); }
    setShowForm(false); setEditId(null); setForm({ name: '', slug: '', domain: '', type: 'marketplace' }); load();
  };

  const handleToggle = async (id: number) => { await admin.tenants.toggle(id); load(); };

  const typeLabel = (t: string) => t === 'marketplace' ? 'بازارچه' : t === 'store' ? 'فروشگاه' : t;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800">مدیریت فروشگاه‌ها</h2>
        <button onClick={() => { setEditId(null); setForm({ name: '', slug: '', domain: '', type: 'marketplace' }); setShowForm(true); }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-black"><Plus className="w-4 h-4" /> فروشگاه جدید</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="نام فروشگاه" className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-sm text-right" />
            <input value={form.slug} onChange={e => setForm(f=>({...f,slug:e.target.value}))} placeholder="slug" dir="ltr" className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-sm text-left font-mono" />
            <input value={form.domain} onChange={e => setForm(f=>({...f,domain:e.target.value}))} placeholder="domain.com" dir="ltr" className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-sm text-left font-mono" />
            <Dropdown
              options={[{ value: 'marketplace', label: 'بازارچه (چند فروشنده)' }, { value: 'store', label: 'فروشگاه (تک فروشنده)' }]}
              value={form.type}
              onChange={v => setForm(f => ({ ...f, type: String(v) }))}
              placeholder="نوع فروشگاه"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex items-center gap-1.5 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-black"><Save className="w-4 h-4" /> ذخیره</button>
            <button onClick={() => setShowForm(false)} className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-black"><X className="w-4 h-4" /> لغو</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenants.map((t: any) => (
          <div key={t.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'marketplace' ? 'bg-purple-100' : 'bg-emerald-100'}`}>
                  {t.type === 'marketplace' ? <Users className="w-5 h-5 text-purple-600" /> : <ShoppingBag className="w-5 h-5 text-emerald-600" />}
                </div>
                <div>
                  <span className="text-sm font-black text-slate-800 block">{toPersianDigits(t.name)}</span>
                  <span className="text-[9px] text-slate-400 font-mono" dir="ltr">{t.slug}</span>
                </div>
              </div>
              <button onClick={() => handleToggle(t.id)}>{t.is_active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold">
              <span>{toPersianDigits(t.users_count || 0)} کاربر</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${t.type === 'marketplace' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>{typeLabel(t.type)}</span>
              {t.domain && <span className="font-mono" dir="ltr">{t.domain}</span>}
            </div>
            {onImpersonate && (
              <button
                onClick={() => onImpersonate(t.id)}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl text-xs font-black transition-all mt-2"
              >
                <LogIn className="w-4 h-4" />
                ورود به فروشگاه
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
