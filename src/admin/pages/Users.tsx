import React, { useEffect, useState } from 'react';
import { admin } from '../api';
import { toPersianDigits } from '../../utils';
import { Save, Search } from 'lucide-react';

export default function AdminUsers({ can, isSuperadmin }: { can: (s: string) => boolean; isSuperadmin: boolean }) {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [editUser, setEditUser] = useState<any>(null);
  const [filterTenant, setFilterTenant] = useState('');

  useEffect(() => {
    loadUsers();
    if (can('admin.roles')) admin.roles.list().then(setRoles);
    if (isSuperadmin) admin.tenants.list().then(setTenants);
  }, [filterTenant]);

  const loadUsers = () => admin.users.list(filterTenant ? +filterTenant : undefined).then(d => setUsers(d.data));

  const handleSave = async (user: any) => {
    await admin.users.update(user.id, { roles: user._roles || [], tenant_id: user._tenant_id, name: user.name });
    setEditUser(null); loadUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-black text-slate-800">مدیریت کاربران</h2>
        {isSuperadmin && (
          <select value={filterTenant} onChange={e => setFilterTenant(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm text-right">
            <option value="">همه فروشگاه‌ها</option>
            {tenants.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      <div className="space-y-2">
        {users.map((u: any) => (
          <div key={u.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            {editUser?.id === u.id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input value={editUser.name} onChange={e => setEditUser((f: any) => ({ ...f, name: e.target.value }))}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm flex-1 text-right" />
                  {isSuperadmin && (
                    <select value={editUser._tenant_id || ''} onChange={e => setEditUser((f: any) => ({ ...f, _tenant_id: e.target.value ? +e.target.value : null }))}
                      className="bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm">
                      <option value="">بدون فروشگاه</option>
                      {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {roles.map((r: any) => (
                    <button key={r.id} onClick={() => setEditUser((f: any) => ({
                      ...f, _roles: (f._roles||[]).includes(r.id) ? (f._roles||[]).filter((x: number) => x !== r.id) : [...(f._roles||[]), r.id]
                    }))}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${(editUser._roles||[]).includes(r.id) ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                      {r.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSave(editUser)} className="flex items-center gap-1 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black"><Save className="w-3.5 h-3.5" /> ذخیره</button>
                  <button onClick={() => setEditUser(null)} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-black">لغو</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button onClick={() => setEditUser({ ...u, _roles: u.roles?.map((r: any) => r.id) || [], _tenant_id: u.tenant_id })}
                  className="text-right">
                  <span className="text-sm font-black text-slate-800 block">{toPersianDigits(u.name || '---')}</span>
                  <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{u.phone}</span>
                </button>
                <div className="flex items-center gap-3">
                  {u.tenant && <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">{u.tenant.name}</span>}
                  <div className="flex gap-1">
                    {u.roles?.map((r: any) => <span key={r.id} className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-extrabold">{r.name}</span>)}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
