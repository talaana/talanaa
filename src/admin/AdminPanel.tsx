import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Shield, Users, Store, ArrowRight, ShoppingBag, Package, BarChart3, CreditCard, Menu, X } from 'lucide-react';
import { admin, setAdminToken } from './api';
import AdminDashboard from './pages/Dashboard';
import AdminRoles from './pages/Roles';
import AdminUsers from './pages/Users';
import AdminTenants from './pages/Tenants';

interface Props { onBack: () => void; token: string; }

const sidebarWidth = 'w-64';

export default function AdminPanel({ onBack, token }: Props) {
  const [page, setPage] = useState('dashboard');
  const [perms, setPerms] = useState<string[]>([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        setMobileMenuOpen(false);
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
    setAdminToken(token);
    setImpersonatedTenant(null);
    setImpersonatedToken('');
    setPage('dashboard');
    loadPermissions();
    setMobileMenuOpen(false);
  };

  const navigateTo = (id: string) => {
    setPage(id);
    setMobileMenuOpen(false);
  };

  const can = (slug: string) => isSuperadmin || perms.includes(slug);

  const superNav = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'tenants', label: 'فروشگاه‌ها', icon: Store },
    { id: 'users', label: 'کاربران', icon: Users },
    { id: 'roles', label: 'نقش‌ها و دسترسی‌ها', icon: Shield },
  ];

  const isMarketplaceAdmin = !isSuperadmin && tenant?.type === 'marketplace';
  const tenantNav = isMarketplaceAdmin ? [
    { id: 'dashboard', label: 'داشبورد بازارچه', icon: BarChart3 },
    { id: 'orders', label: 'سفارشات', icon: ShoppingBag },
    { id: 'products', label: 'محصولات', icon: Package },
    { id: 'sellers', label: 'فروشندگان', icon: Users },
    { id: 'users', label: 'کاربران', icon: Shield },
  ] : [
    { id: 'dashboard', label: 'داشبورد فروشگاه', icon: BarChart3 },
    { id: 'orders', label: 'سفارشات', icon: ShoppingBag },
    { id: 'products', label: 'محصولات', icon: Package },
    { id: 'branches', label: 'شعب', icon: Store },
  ];

  const nav = isSuperadmin ? superNav : tenantNav;

  // ============ LOADING / ERROR ============
  if (loading) return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex items-center justify-center font-sans">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-black text-slate-600">در حال بارگذاری پنل مدیریت...</p>
      </div>
    </div>
  );

  if (error) return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex items-center justify-center font-sans p-4">
      <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-sm w-full">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl">!</div>
        <p className="text-sm font-black text-slate-800 mb-2">خطا در بارگذاری</p>
        <p className="text-xs text-slate-500 mb-5">{error}</p>
        <button onClick={onBack} className="bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-black">بازگشت به سایت</button>
      </div>
    </div>
  );

  const sidebarBg = isSuperadmin ? 'bg-slate-900 text-white' : 'bg-white border-l border-amber-100 shadow-sm';
  const sidebarBorder = isSuperadmin ? 'border-slate-700' : 'border-amber-100';
  const navActive = isSuperadmin ? 'bg-slate-700 text-white' : 'bg-amber-100 text-amber-800';
  const navInactive = isSuperadmin ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-amber-50 hover:text-amber-700';
  const backBtnHover = isSuperadmin ? 'hover:bg-slate-800 hover:text-white' : 'hover:bg-amber-50 hover:text-amber-600';

  // ============ SIDEBAR CONTENT (shared between desktop + mobile) ============
  const sidebarContent = (
    <>
      {/* Header */}
      <div className={`p-5 border-b ${sidebarBorder}`}>
        {isSuperadmin ? (
          <>
            <h1 className="text-lg font-black">طلانا سوپر ادمین</h1>
            <p className="text-[10px] text-slate-400 mt-1">مدیریت کل پلتفرم</p>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              {tenant?.name?.[0] || 'ط'}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-slate-800 truncate">{tenant?.name || 'فروشگاه'}</h1>
              <p className="text-[9px] text-amber-600 font-extrabold mt-0.5">پنل مدیریت {isMarketplaceAdmin ? 'بازارچه' : 'فروشگاه'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Impersonation banner */}
      {impersonatedTenant && (
        <div className="p-3 mx-3 mt-3 bg-purple-50 border border-purple-200 rounded-xl">
          <p className="text-[9px] font-black text-purple-700 mb-1">حالت سوپر ادمین</p>
          <p className="text-[8px] text-purple-500 truncate">در حال مشاهده: {impersonatedTenant.name}</p>
          <button onClick={exitImpersonation}
            className="w-full mt-2 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-[10px] font-black transition-all">
            <ArrowRight className="w-3 h-3" /> خروج و بازگشت
          </button>
        </div>
      )}

      {/* Quick stats (tenant only) */}
      {!isSuperadmin && (
        <div className={`${impersonatedTenant ? 'pt-2' : 'pt-0'} p-4 grid grid-cols-2 gap-2 border-b ${sidebarBorder}`}>
          <div className="bg-amber-50 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-amber-600">۰</div>
            <div className="text-[8px] text-amber-500 font-bold">سفارش امروز</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
            <div className="text-lg font-black text-emerald-600">۰</div>
            <div className="text-[8px] text-emerald-500 font-bold">درآمد امروز</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {nav.map(item => (
          <button key={item.id} onClick={() => navigateTo(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-right transition-all ${page === item.id ? navActive : navInactive}`}>
            <item.icon className="w-4.5 h-4.5" /><span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Back button */}
      <div className={`p-3 border-t ${sidebarBorder}`}>
        <button onClick={onBack}
          className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 transition-all ${backBtnHover}`}>
          <ArrowRight className="w-4 h-4" /><span>{isSuperadmin ? 'بازگشت به سایت' : 'بازگشت به ویترین'}</span>
        </button>
      </div>
    </>
  );

  // ============ RENDER ============
  return (
    <div dir="rtl" className={`flex min-h-screen font-sans ${isSuperadmin ? 'bg-slate-100' : 'bg-amber-50/30'}`}>

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden lg:flex lg:flex-col ${sidebarWidth} lg:min-h-screen lg:flex-shrink-0 lg:sticky lg:top-0 ${sidebarBg}`}>
        {sidebarContent}
      </aside>

      {/* MOBILE HEADER + DRAWER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setMobileMenuOpen(true)} className="text-slate-600 p-1">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-black text-[10px]">
              {tenant?.name?.[0] || 'ط'}
            </div>
            <span className="text-sm font-black text-slate-800 truncate max-w-[140px]">{isSuperadmin ? 'سوپر ادمین' : tenant?.name || 'فروشگاه'}</span>
          </div>
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600 p-1">
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className={`absolute top-0 right-0 bottom-0 ${sidebarWidth} max-w-[85vw] ${sidebarBg} flex flex-col shadow-2xl`}>
            {/* Close button */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200/20">
              <span className="text-sm font-black">{isSuperadmin ? 'منو مدیریت' : 'پنل مدیریت'}</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full min-w-0 overflow-y-auto pt-14 lg:pt-0">
        <div className="p-4 lg:p-6">
          {/* Impersonation banner (desktop only — mobile shows in drawer) */}
          {impersonatedTenant && (
            <div className="hidden lg:flex mb-6 bg-purple-50 border border-purple-200 rounded-2xl p-4 items-center justify-between">
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

          {/* Page content */}
          {page === 'dashboard' && <AdminDashboard />}
          {page === 'roles' && <AdminRoles />}
          {page === 'users' && <AdminUsers can={can} isSuperadmin={isSuperadmin} />}
          {page === 'tenants' && <AdminTenants onImpersonate={handleImpersonate} />}
          {!isSuperadmin && page === 'dashboard' && <TenantDashboard isMarketplace={isMarketplaceAdmin} />}
          {!isSuperadmin && page === 'products' && <TenantProducts />}
          {!isSuperadmin && page === 'orders' && <TenantOrders />}
          {!isSuperadmin && page === 'sellers' && <TenantSellers />}
          {!isSuperadmin && page === 'branches' && <TenantBranches />}
        </div>
      </main>
    </div>
  );
}

// ============ TENANT SUB-PAGES ============

function TenantDashboard({ isMarketplace }: { isMarketplace?: boolean }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800">{isMarketplace ? 'داشبورد بازارچه' : 'داشبورد فروشگاه'}</h2>
        <p className="text-xs text-slate-400 mt-1">{isMarketplace ? 'خلاصه وضعیت بازارچه شما' : 'خلاصه وضعیت فروشگاه شما'}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <h3 className="text-sm font-black text-slate-600">{isMarketplace ? 'بازارچه شما آماده است' : 'فروشگاه شما آماده است'}</h3>
        <p className="text-xs text-slate-400 mt-2">{isMarketplace ? 'از طریق پنل مدیریت می‌توانید فروشندگان را مدیریت کرده، محصولات را کنترل و سفارشات را پیگیری کنید.' : 'از طریق پنل مدیریت می‌توانید محصولات جدید اضافه کرده، سفارشات را مدیریت و شعب فروشگاه را کنترل کنید.'}</p>
      </div>
    </div>
  );
}

function TenantProducts() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800">محصولات فروشگاه</h2>
          <p className="text-xs text-slate-400 mt-1">مدیریت محصولات و موجودی</p>
        </div>
        <button className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-black self-end sm:self-auto">+ محصول جدید</button>
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

function TenantSellers() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800">فروشندگان بازارچه</h2>
          <p className="text-xs text-slate-400 mt-1">مدیریت فروشندگان فعال در بازارچه</p>
        </div>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-black self-end sm:self-auto">+ فروشنده جدید</button>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
        <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <h3 className="text-sm font-black text-slate-600">مدیریت فروشندگان</h3>
        <p className="text-xs text-slate-400 mt-2">فروشندگان فعال در بازارچه را مدیریت کنید.</p>
      </div>
    </div>
  );
}

function TenantBranches() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800">شعب فروشگاه</h2>
          <p className="text-xs text-slate-400 mt-1">مدیریت شعب و آدرس‌های فیزیکی</p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-black self-end sm:self-auto">+ شعبه جدید</button>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
        <Store className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <h3 className="text-sm font-black text-slate-600">شعب فروشگاه</h3>
        <p className="text-xs text-slate-400 mt-2">شعب فیزیکی فروشگاه خود را ثبت کنید.</p>
      </div>
    </div>
  );
}
