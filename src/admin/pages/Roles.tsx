import React, { useState, useEffect } from 'react';
import { admin } from '../api';
import { Shield, Plus, Copy, Trash2, X, Edit2, Users, Check } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  slug: string;
  group: string;
}

interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  tenant_id: number | null;
  branch_id: number | null;
  permissions: Permission[];
  users_count: number;
}

const groupLabels: Record<string, string> = {
  admin: 'پنل ادمین',
  products: 'محصولات',
  orders: 'سفارشات',
  finance: 'مالی',
  operations: 'عملیات',
  system: 'سیستم',
};

export default function AdminRoles({ isSuperadmin = false, can }: { isSuperadmin?: boolean; can?: (slug: string) => boolean }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [cloningRole, setCloningRole] = useState<Role | null>(null);
  const [assignRole, setAssignRole] = useState<{ role: Role; userId: number } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([
        admin.roles.list(),
        admin.roles.permissions(),
      ]);
      setRoles(rolesData || []);
      setPermissions(permsData || {});
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const systemRoles = roles.filter(r => r.tenant_id === null);
  const customRoles = roles.filter(r => r.tenant_id !== null);

  if (loading) return <div className="p-8 text-center text-slate-500">در حال بارگذاری...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">رول‌ها و دسترسی‌ها</h2>
          <p className="text-sm text-slate-500 mt-1">مدیریت رول‌های سیستمی و شخصی‌سازی شده</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm">
          <Plus className="w-4 h-4" /> رول جدید
        </button>
      </div>

      {/* System Roles */}
      <section>
        <h3 className="text-lg font-bold text-slate-700 mb-3">رول‌های سیستمی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemRoles.map(role => (
            <RoleCard key={role.id} role={role} isSuperadmin={isSuperadmin}
              onClone={() => setCloningRole(role)}
              onAssign={(userId) => setAssignRole({ role, userId })} />
          ))}
        </div>
      </section>

      {/* Custom Roles */}
      {customRoles.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-slate-700 mb-3">رول‌های شخصی‌سازی شده</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customRoles.map(role => (
              <RoleCard key={role.id} role={role} isSuperadmin={isSuperadmin}
                onEdit={() => setEditingRole(role)}
                onClone={() => setCloningRole(role)}
                onDelete={async () => {
                  if (confirm(`آیا از حذف رول "${role.name}" مطمئنید؟`)) {
                    try {
                      await admin.roles.remove(role.id);
                      load();
                    } catch (e: any) { alert(e.message); }
                  }
                }}
                onAssign={(userId) => setAssignRole({ role, userId })} />
            ))}
          </div>
        </section>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} permissions={permissions} />}
      {editingRole && <EditModal role={editingRole} onClose={() => setEditingRole(null)} onSaved={() => { setEditingRole(null); load(); }} permissions={permissions} />}
      {cloningRole && <CloneModal role={cloningRole} onClose={() => setCloningRole(null)} onCloned={() => { setCloningRole(null); load(); }} />}
      {assignRole && <AssignModal role={assignRole.role} userId={assignRole.userId} onClose={() => setAssignRole(null)} onAssigned={() => { setAssignRole(null); alert('رول تخصیص داده شد'); }} />}
    </div>
  );
}

function RoleCard({ role, isSuperadmin, onEdit, onClone, onDelete, onAssign }: {
  role: Role;
  isSuperadmin: boolean;
  onEdit?: () => void;
  onClone?: () => void;
  onDelete?: () => void;
  onAssign: (userId: number) => void;
}) {
  const isSystem = role.tenant_id === null;

  return (
    <div className={`bg-white rounded-2xl border-2 p-5 ${isSystem ? 'border-slate-200' : 'border-amber-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Shield className={`w-5 h-5 ${isSystem ? 'text-slate-400' : 'text-amber-600'}`} />
          <h4 className="font-bold text-slate-800">{role.name}</h4>
        </div>
        {isSystem && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">سیستمی</span>}
      </div>

      {role.description && <p className="text-sm text-slate-500 mb-3">{role.description}</p>}

      <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
        <Users className="w-3 h-3" />
        <span>{role.users_count} کاربر</span>
        <span className="mx-1">•</span>
        <span>{role.permissions.length} دسترسی</span>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {role.permissions.slice(0, 3).map(p => (
          <span key={p.id} className="text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded">{p.name}</span>
        ))}
        {role.permissions.length > 3 && <span className="text-xs text-slate-400">+{role.permissions.length - 3}</span>}
      </div>

      <div className="flex gap-2">
        {!isSystem && onEdit && (
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">
            <Edit2 className="w-3 h-3" /> ویرایش
          </button>
        )}
        {onClone && (
          <button onClick={onClone} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">
            <Copy className="w-3 h-3" /> کپی
          </button>
        )}
        {!isSystem && onDelete && (
          <button onClick={onDelete} className="flex items-center justify-center py-2 px-3 rounded-lg border border-rose-200 text-rose-600 text-sm hover:bg-rose-50">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreated, permissions }: { onClose: () => void; onCreated: () => void; permissions: Record<string, Permission[]> }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) { alert('نام و شناسه رول را وارد کنید'); return; }
    setLoading(true);
    try {
      await admin.roles.create({ name, slug, description, permissions: selectedPerms });
      onCreated();
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const togglePerm = (id: number) => {
    setSelectedPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-800">رول جدید</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">نام رول</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="مثال: مدیر فروش" aria-label="نام رول"
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">شناسه (slug)</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="manager_sales" aria-label="شناسه (slug)"
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">توضیحات</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} aria-label="توضیحات"
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">دسترسی‌ها ({selectedPerms.length} انتخاب شده)</label>
            <div className="space-y-3 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3">
              {Object.entries(permissions).map(([group, perms]) => (
                <div key={group}>
                  <h5 className="text-xs font-bold text-slate-500 mb-2">{groupLabels[group] || group}</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={selectedPerms.includes(p.id)} onChange={() => togglePerm(p.id)}
                          className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                        <span className="text-slate-700">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">انصراف</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-50">
              {loading ? 'در حال ساخت...' : 'ساخت رول'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ role, onClose, onSaved, permissions }: { role: Role; onClose: () => void; onSaved: () => void; permissions: Record<string, Permission[]> }) {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description || '');
  const [selectedPerms, setSelectedPerms] = useState<number[]>(role.permissions.map(p => p.id));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) { alert('نام رول را وارد کنید'); return; }
    setLoading(true);
    try {
      await admin.roles.update(role.id, { name, description, permissions: selectedPerms });
      onSaved();
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  const togglePerm = (id: number) => {
    setSelectedPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-800">ویرایش رول: {role.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">نام رول</label>
            <input value={name} onChange={e => setName(e.target.value)} aria-label="نام رول"
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">توضیحات</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} aria-label="توضیحات"
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">دسترسی‌ها ({selectedPerms.length} انتخاب شده)</label>
            <div className="space-y-3 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3">
              {Object.entries(permissions).map(([group, perms]) => (
                <div key={group}>
                  <h5 className="text-xs font-bold text-slate-500 mb-2">{groupLabels[group] || group}</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {perms.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={selectedPerms.includes(p.id)} onChange={() => togglePerm(p.id)}
                          className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                        <span className="text-slate-700">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">انصراف</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-50">
              {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CloneModal({ role, onClose, onCloned }: { role: Role; onClose: () => void; onCloned: () => void }) {
  const [name, setName] = useState(role.name + ' (کپی)');
  const [slug, setSlug] = useState(role.slug + '_copy_' + Date.now());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) { alert('نام و شناسه رول را وارد کنید'); return; }
    setLoading(true);
    try {
      await admin.roles.clone(role.id, { name, slug });
      onCloned();
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-800">کپی رول: {role.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Copy className="w-5 h-5 text-slate-500" />
              <span className="font-bold text-slate-800">{role.name}</span>
            </div>
            <p className="text-sm text-slate-600">{role.permissions.length} دسترسی کپی خواهد شد</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">نام رول جدید</label>
            <input value={name} onChange={e => setName(e.target.value)} aria-label="نام رول جدید"
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">شناسه (slug)</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} aria-label="شناسه (slug)"
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:border-amber-500" />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">انصراف</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-50">
              {loading ? 'در حال کپی...' : 'کپی رول'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignModal({ role, userId, onClose, onAssigned }: { role: Role; userId: number; onClose: () => void; onAssigned: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    setLoading(true);
    try {
      await admin.roles.assignToUser(userId, { role_id: role.id });
      onAssigned();
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-800">تخصیص رول</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-slate-800">{role.name}</span>
            </div>
            <p className="text-sm text-slate-600">{role.permissions.length} دسترسی</p>
          </div>

          <p className="text-sm text-slate-500">آیا از تخصیص این رول به کاربر مطمئنید؟</p>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">انصراف</button>
            <button onClick={handleAssign} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-50">
              {loading ? 'در حال تخصیص...' : 'تخصیص رول'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
