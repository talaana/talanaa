import React, { useEffect, useState } from 'react';
import { admin } from '../api';
import { toPersianDigits } from '../../utils';
import { Plus, Trash2, Save, X, ShieldCheck } from 'lucide-react';

export default function AdminRoles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [perms, setPerms] = useState<any>({});
  const [editRole, setEditRole] = useState<any>(null);
  const [form, setForm] = useState({ name: '', slug: '', permissions: [] as number[] });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [r, p] = await Promise.all([admin.roles.list(), admin.permissionGroups()]);
    setRoles(r); setPerms(p);
  };

  const handleSave = async () => {
    if (editRole) {
      await admin.roles.update(editRole.id, form);
    } else {
      await admin.roles.create(form);
    }
    setShowForm(false); setEditRole(null); setForm({ name: '', slug: '', permissions: [] }); load();
  };

  const handleEdit = (role: any) => {
    setEditRole(role);
    setForm({ name: role.name, slug: role.slug, permissions: role.permissions.map((p: any) => p.id) });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => { if (confirm('حذف شود؟')) { await admin.roles.remove(id); load(); } };

  const togglePerm = (pid: number) => {
    setForm(f => ({ ...f, permissions: f.permissions.includes(pid) ? f.permissions.filter(p => p !== pid) : [...f.permissions, pid] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800">مدیریت نقش‌ها</h2>
        <button onClick={() => { setEditRole(null); setForm({ name: '', slug: '', permissions: [] }); setShowForm(true); }}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-black"><Plus className="w-4 h-4" /> نقش جدید</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="نام نقش" className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-sm text-right" />
            <input value={form.slug} onChange={e => setForm(f=>({...f,slug:e.target.value}))} placeholder="slug" dir="ltr" className="bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-sm text-left font-mono" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 mb-2 block">دسترسی‌ها:</span>
            {Object.entries(perms).map(([group, items]: [string, any]) => (
              <div key={group} className="mb-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">{group}</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {items.map((p: any) => (
                    <button key={p.id} onClick={() => togglePerm(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${form.permissions.includes(p.id) ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex items-center gap-1.5 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-black"><Save className="w-4 h-4" /> ذخیره</button>
            <button onClick={() => { setShowForm(false); setEditRole(null); }} className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl text-sm font-black"><X className="w-4 h-4" /> لغو</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {roles.map((r: any) => (
          <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              {r.is_system && <ShieldCheck className="w-4 h-4 text-amber-500" />}
              <button onClick={() => handleEdit(r)} className="text-blue-600 hover:text-blue-700 text-xs font-black">{r.name}</button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-400 font-bold">{r.users_count || 0} کاربر</span>
              <span className="text-[9px] text-slate-300 font-mono" dir="ltr">{r.permissions?.length || 0} perm</span>
              {!r.is_system && <button onClick={() => handleDelete(r.id)} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
