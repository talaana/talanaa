import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Shield, Users, Store, ArrowRight, ShoppingBag, Package, BarChart3, CreditCard } from 'lucide-react';
import { admin, setAdminToken } from './api';
import AdminDashboard from './pages/Dashboard';
import AdminRoles from './pages/Roles';
import AdminUsers from './pages/Users';
import AdminTenants from './pages/Tenants';

interface Props { onBack: () => void; token: string; }

export default function AdminPanel({ onBack, token }: Props) {
  const [page, setPage] = useState('dashboard');
  const [perms, setPerms] = useState<string[]>([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Impersonation state
  const [impersonatedTenant, setImpersonatedTenant] = useState<any>(null);
  const [impersonatedToken, setImpersonatedToken] = useState<string>('');
  const [impersonating, setImpersonating] = useState(false);

  const loadPermissions = (tenantId?: number) => {
    setLoading(true); setError('');
    const qs = tenantId ? `?tenant_id=${tenantId}` : '';
    admin.permissions(qs).then(d => {
      setPerms(d.permissions);
      setIsSuperadmin(d.is_superadmin);
      if (d.tenant) setTenant(d.tenant);
      setLoading(false);
    }).catch((e) => {
      setError(e.message || 'خطا در دریافت دسترسی');
      setLoading(false);
    });
  };

  useEffect(() => {
    setAdminToken(token);
    loadPermissions();
  }, []);

  const handleImpersonate = async (tenantId: number) => {
    setImpersonating(true);
    try {
      const result = await admin.tenants.impersonate(tenantId);
      setImpersonatedToken(result.token);
      setImpersonatedTenant(result.tenant);
      setAdminToken(result.token);
      setLoading(true); setError('');
      admin.permissions(`?tenant_id=${tenantId}`).then(d => {
        setPerms(d.permissions);
        setIsSuperadmin(d.is_superadmin);
        if (d.tenant) setTenant(d.tenant);
        setPage('dashboard');
        setLoading(false);
        setImpersonating(false);
      }).catch((e) => {
        setError(e.message || 'خطا در ورود به فروشگاه');
        setLoading(false);
        setImpersonating(false);
      });
    } catch (e: any) {
      setError(e.message || 'خطا در ورود به فروشگاه');
      setImpersonating(false);
    }
  };

  const exitImpersonation = () => {
    // Restore original token
    setAdminToken(token);
    setImpersonatedTenant(null);
    setImpersonatedToken('');
    setPage('dashboard');
    loadPermissions();
  };

  const can = (slug: string) => isSuperadmin || perms.includes(slug);

  // Superadmin nav
  const superNav = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'tenants', label: 'فروشگاه‌ها', icon: Store },
    { id: 'users', label: 'کاربران', icon: Users },
    { id: 'roles', label: 'نقش‌ها و دسترسی‌ها', icon: Shield },
  ];

  // Tenant/store admin nav
  const tenantNav = [
    { id: 'dashboard', label: 'داشبورد فروشگاه', icon: BarChart3 },
    { id: 'orders', label: 'سفارشات', icon: ShoppingBag },
    { id: 'products', label: 'محصولات', icon: Package },
    { id: 'users', label: 'کاربران فروشگاه', icon: Users },
  ];

  const nav = isSuperadmin ? superNav : tenantNav;

  // Loading / Error states
  if (loading) return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-black text-slate-600">در حال بارگذاری پنل مدیریت...</p>
      </div>
    </div>
  );

  if (error) return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
      <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-sm">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl">!</div>
        <p className="text-sm font-black text-slate-800 mb-2">خطا در بارگذاری</p>
        <p className="text-xs text-slate-500 mb-5">{error}</p>
        <button onClick={onBack} className="bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-black">بازگشت به سایت</button>
      </div>
    </div>
  );

  // ============ SUPERADMIN PANEL ============
  if (isSuperadmin) return (
    <div dir="rtl" className="flex min-h-screen bg-slate-100 font-sans">
      <aside className="w-64 bg-slate-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-700">
          <h1 className="text-lg font-black">طلانا سوپر ادمین</h1>
          <p className="text-[10px] text-slate-400 mt-1">مدیریت کل پلتفرم</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-right transition-all ${page === item.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className="w-4.5 h-4.5" /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button onClick={onBack} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white">
            <ArrowRight className="w-4 h-4" /><span>بازگشت به سایت</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        {page === 'dashboard' && <AdminDashboard />}
        {page === 'roles' && <AdminRoles />}
        {page === 'users' && <AdminUsers can={can} isSuperadmin={isSuperadmin} />}
        {page === 'tenants' && <AdminTenants onImpersonate={handleImpersonate} />}
      </main>
    </div>
  );

  // ============ TENANT PANEL ============
  return (
    <div dir="rtl" className="flex min-h-screen bg-amber-50/30 font-sans">
      {/* Tenant sidebar — lighter, brand-colored */}
      <aside className="w-64 bg-white border-l border-amber-100 flex flex-col flex-shrink-0 shadow-sm">
        <div className="p-5 border-b border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-black text-sm">
              {tenant?.name?.[0] || 'ط'}
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-800">{tenant?.name || 'فروشگاه'}</h1>
              <p className="text-[9px] text-amber-600 font-extrabold mt-0.5">پنل مدیریت فروشگاه</p>
            </div>
          </div>
        </div>

        {/* Impersonation banner in sidebar */}
        {impersonatedTenant && (
          <div className="p-3 mx-3 mt-3 bg-purple-50 border border-purple-200 rounded-xl">
            <p className="text-[9px] font-black text-purple-700 mb-1">حالت سوپر ادمین</p>
            <p className="text-[8px] text-purple-500">در حال مشاهده فروشگاه: {impersonatedTenant.name}</p>
            <button onClick={exitImpersonation}
              className="w-full mt-2 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-[10px] font-black transition-all">
              <ArrowRight className="w-3 h-3" /> خروج و بازگشت
            </button>
          </div>
        )}

        {/* Quick stats */}
        <div className={`${impersonatedTenant ? 'pt-2' : 'pt-0'} p-4 grid grid-cols-2 gap-2 border-b border-amber-50`}>
          <div className="bg-amber-50 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-amber-600">۰</div>
            <div className="text-[8px] text-amber-500 font-bold">سفارش امروز</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-emerald-600">۰</div>
            <div className="text-[8px] text-emerald-500 font-bold">درآمد امروز</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-right transition-all ${page === item.id ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-700'}`}>
              <item.icon className="w-4.5 h-4.5" /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-amber-100">
          <button onClick={onBack} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:bg-amber-50 hover:text-amber-600">
            <ArrowRight className="w-4 h-4" /><span>بازگشت به ویترین</span>
          </button>
        </div>
      </aside>

      {/* Tenant content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Impersonation banner in content area */}
        {impersonatedTenant && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-200 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-black text-purple-800">حالت مدیریت سوپر ادمین</p>
                <p className="text-xs text-purple-500">شما در حال مشاهده و مدیریت فروشگاه «{impersonatedTenant.name}» با دسترسی کامل هستید.</p>
              </div>
            </div>
            <button onClick={exitImpersonation}
              className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all">
              <ArrowRight className="w-3.5 h-3.5" /> خروج و بازگشت به سوپر ادمین
            </button>
          </div>
        )}
        {page === 'dashboard' && <TenantDashboard />}
        {page === 'users' && <AdminUsers can={can} isSuperadmin={false} />}
        {page === 'products' && <TenantProducts />}
        {page === 'orders' && <TenantOrders />}
      </main>
    </div>
  );
}

// ============ TENANT SUB-PAGES ============

function TenantDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800">داشبورد فروشگاه</h2>
        <p className="text-xs text-slate-400 mt-1">خلاصه وضعیت فروشگاه شما</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'سفارشات فعال', value: '۰', icon: <ShoppingBag className="w-8 h-8" />, color: 'bg-amber-100 text-amber-600' },
          { label: 'محصولات', value: '۰', icon: <Package className="w-8 h-8" />, color: 'bg-purple-100 text-purple-600' },
          { label: 'درآمد ماه', value: '۰ تومان', icon: <CreditCard className="w-8 h-8" />, color: 'bg-emerald-100 text-emerald-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center mb-4`}>{s.icon}</div>
            <div className="text-xs font-black text-slate-500">{s.label}</div>
            <div className="text-xl font-black text-slate-800 mt-1">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
        <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <h3 className="text-sm font-black text-slate-600">فروشگاه شما آماده است</h3>
        <p className="text-xs text-slate-400 mt-2">از طریق پنل مدیریت می‌توانید محصولات جدید اضافه کرده، سفارشات را مدیریت و کاربران فروشگاه را کنترل کنید.</p>
      </div>
    </div>
  );
}

function TenantProducts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">محصولات فروشگاه</h2>
          <p className="text-xs text-slate-400 mt-1">مدیریت محصولات و موجودی</p>
        </div>
        <button className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-black">+ محصول جدید</button>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
        <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <h3 className="text-sm font-black text-slate-600">هنوز محصولی ثبت نشده</h3>
        <p className="text-xs text-slate-400 mt-2">اولین محصول فروشگاه خود را اضافه کنید.</p>
      </div>
    </div>
  );
}

function TenantOrders() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800">سفارشات</h2>
        <p className="text-xs text-slate-400 mt-1">مدیریت سفارشات مشتریان</p>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
        <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <h3 className="text-sm font-black text-slate-600">سفارشی ثبت نشده</h3>
        <p className="text-xs text-slate-400 mt-2">سفارشات جدید مشتریان در این بخش نمایش داده می‌شود.</p>
      </div>
    </div>
  );
}
