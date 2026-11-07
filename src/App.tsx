import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { UserWallet, Transaction } from './types';
import Header from './components/Header';
import InstallerPage from './components/InstallerPage';
import LoginPage from './components/LoginPage';
import SerialVerifyPage from './components/SerialVerifyPage';
import MainJewelryExperienceLanding from './features/cinematic-experience/pages/MainJewelryExperienceLanding';
import DynamicCampaignExperiencePage from './features/cinematic-experience/pages/DynamicCampaignExperiencePage';
import { detectExperienceRoute } from './features/cinematic-experience/lib/routes';
import { Home, Store, ArrowLeftRight, LayoutGrid, LogOut, Bell, User, Shield, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, wallet, prices, transactions, setToken, getToken, setTenantContext, getAuthContext, setAuthContext } from './api';
import { formatToman, formatGram, toPersianDigits, apiAssetUrl } from './utils';
import { useTenant, detectTenantFromURL } from './tenant';
import AdminPanel from './admin/AdminPanel';

const HomeDashboard = lazy(() => import('./components/HomeDashboard'));
const MarketplaceTab = lazy(() => import('./components/MarketplaceTab'));
const InvestmentTab = lazy(() => import('./components/InvestmentTab'));
const ServicesTab = lazy(() => import('./components/ServicesTab'));
const OrdersTab = lazy(() => import('./components/OrdersTab'));
const ProfileTab = lazy(() => import('./components/ProfileTab'));
const NotificationsTab = lazy(() => import('./components/NotificationsTab'));

const TabFallback = () => (
  <div className="flex justify-center py-12">
    <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const marketplaceNavItems = [
  { id: 'home', label: 'خانه', icon: Home },
  { id: 'vitrine', label: 'ویترین', icon: Store },
  { id: 'trade', label: 'خرید و فروش', icon: ArrowLeftRight },
  { id: 'services', label: 'خدمات', icon: LayoutGrid },
];

const storeNavItems = [
  { id: 'home', label: 'خانه', icon: Home },
  { id: 'vitrine', label: 'محصولات', icon: Store },
  { id: 'trade', label: 'خرید و فروش', icon: ArrowLeftRight },
  { id: 'services', label: 'خدمات', icon: LayoutGrid },
];

// Captured at module load time — tells us if URL had a tenant identifier (store vs landing)
const urlTenant = typeof window !== 'undefined' ? detectTenantFromURL() : null;

// Tenant branding cache — store name/logo/brand_color in localStorage for instant display on revisit
const TENANT_CACHE_KEY = 'talana_tenant_cache';
function cacheTenantBranding(tenant: { slug: string; name: string; logo: string | null; brand_color: string | null }) {
  try {
    const cache = JSON.parse(localStorage.getItem(TENANT_CACHE_KEY) || '{}');
    cache[tenant.slug] = { name: tenant.name, logo: tenant.logo, brand_color: tenant.brand_color };
    localStorage.setItem(TENANT_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}
function getCachedTenant(slug: string): { name: string; logo: string | null; brand_color: string | null } | null {
  try {
    const cache = JSON.parse(localStorage.getItem(TENANT_CACHE_KEY) || '{}');
    return cache[slug] || null;
  } catch { return null; }
}

export default function App() {
  const { tenant, loading: tenantLoading } = useTenant();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!getToken());
  const [isLoading, setIsLoading] = useState<boolean>(!!getToken());
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const [walletData, setWalletData] = useState<UserWallet>({ goldGrams: 0, silverGrams: 0, cashToman: 0 });
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [txList, setTxList] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [goldPrice18k, setGoldPrice18k] = useState<number>(8650000);
  const [silverPrice999, setSilverPrice999] = useState<number>(125000);
  const [priceTrend, setPriceTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [prevGoldPrice, setPrevGoldPrice] = useState<number>(8650000);
  const [showBalances, setShowBalances] = useState<boolean>(() => localStorage.getItem('talana_show_balances') !== 'false');
  const [activeMetal, setActiveMetal] = useState<'gold' | 'silver'>('gold');
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isServicePageOpen, setIsServicePageOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(() => window.location.hash === '#/admin');
    const [showInstaller, setShowInstaller] = useState(false);
    const [installerPreselectedType, setInstallerPreselectedType] = useState<'marketplace' | 'store' | 'supplier' | undefined>();
    const [userPerms, setUserPerms] = useState<string[]>([]);
    const [isSuperadmin, setIsSuperadmin] = useState(false);
    const [showLoginPage, setShowLoginPage] = useState(() => window.location.hash === '#/login');
    const [loginRedirect, setLoginRedirect] = useState<'admin' | 'landing'>(() => window.location.hash === '#/admin' ? 'admin' : 'landing');
    const [verifyHash, setVerifyHash] = useState<string | null>(() => {
      const match = window.location.hash.match(/^#\/verify\/(.+)$/);
      return match ? match[1] : null;
    });

    const can = (perm: string) => isSuperadmin || userPerms.includes(perm);

  // Sync tenant ID with API client — and reload auth state when tenant changes
  const [syncedTenantSlug, setSyncedTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    setSyncedTenantSlug(tenant?.slug ?? '');
    if (tenant) {
      setTenantContext(tenant.id, tenant.slug, tenant.type);
      cacheTenantBranding({ slug: tenant.slug, name: tenant.name, logo: tenant.logo, brand_color: tenant.brand_color });
      const tk = getToken();
      if (tk) {
        setIsLoggedIn(true);
        setIsLoading(true);
        const ctx = getAuthContext();
        if (ctx) {
          setUserPerms(ctx.permissions);
          setIsSuperadmin(ctx.is_superadmin);
        }
        loadUserData();
      } else {
        setIsLoggedIn(false);
        setIsLoading(false);
      }
    } else {
      setTenantContext(null, '');
      setIsLoggedIn(false);
      setIsLoading(false);
    }
  }, [tenant]);

  // The preload splash in index.html doubles as the boot loader: keep it visible
  // until the app has real content to show, so no secondary spinner flashes.
  // When showAdmin is set, AdminPanel emits the readiness signal instead.
  useEffect(() => {
    if (showAdmin) return;
    const tenantSyncPending = !!urlTenant && (tenantLoading || (!!tenant && syncedTenantSlug !== tenant.slug));
    const booting = tenantLoading || (!!tenant && isLoading) || tenantSyncPending;
    if (!booting) (window as any).__tlBootReady?.();
  }, [showAdmin, tenantLoading, isLoading, tenant, syncedTenantSlug]);

  const isMarketplace = !tenant || tenant?.type === 'marketplace' || tenant?.type === 'platform';
  const isStore = tenant?.type === 'store';
  const navItems = isStore ? storeNavItems : marketplaceNavItems;
  const platformName = tenant?.name || 'طلانا';
  const platformLogo = tenant?.logo ? apiAssetUrl(tenant.logo) : '/talana_logo.png';
  const platformSubtitle = isMarketplace
    ? 'بازارچه آنلاین طلا و نقره'
    : isStore
    ? 'فروشگاه آنلاین طلا و نقره'
    : 'سامانه هوشمند معاملات طلا و نقره';

  // Apply brand color as CSS custom properties
  const brandColor = tenant?.brand_color || '#ca8a04';
  const brandColorLight = brandColor + '18'; // ~10% opacity hex suffix for backgrounds
  const brandColorLighter = brandColor + '0a'; // ~4% opacity
  const silverColor = tenant?.silver_tab_color || '#475569';
  const silverColorLight = silverColor + '18';
  const silverColorLighter = silverColor + '0a';

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-color', brandColor);
    root.style.setProperty('--brand-color-light', brandColorLight);
    root.style.setProperty('--brand-color-lighter', brandColorLighter);
    root.style.setProperty('--silver-color', silverColor);
    root.style.setProperty('--silver-color-light', silverColorLight);
    root.style.setProperty('--silver-color-lighter', silverColorLighter);
    // Update browser theme color for PWA/mobile title bar
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', brandColor);
  }, [brandColor, brandColorLight, brandColorLighter, silverColor]);

  useEffect(() => {
      const onHashChange = () => {
        setShowAdmin(window.location.hash === '#/admin');
        setShowLoginPage(window.location.hash === '#/login');
        const verifyMatch = window.location.hash.match(/^#\/verify\/(.+)$/);
        setVerifyHash(verifyMatch ? verifyMatch[1] : null);
        if (window.location.hash !== '#/login') setLoginRedirect(window.location.hash === '#/admin' ? 'admin' : 'landing');
      };
      window.addEventListener('hashchange', onHashChange);
      return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const goToAdmin = () => { window.location.hash = '#/admin'; };
    const goToApp = () => { window.location.hash = '#/'; };
    const goToLogin = () => { window.location.hash = '#/login'; };

  const loadUserData = async () => {
    try {
      const profile = await auth.profile();
      const u = profile.user;
      setUserName(u.name);
      setUserPhone(u.phone || '');
      if (u.wallet) setWalletData({ goldGrams: u.wallet.gold_grams, silverGrams: u.wallet.silver_grams || 0, cashToman: u.wallet.cash_toman });
      setIsLoggedIn(true);
      try {
        const perms = await auth.permissions();
        setUserPerms(perms.permissions || []);
        setIsSuperadmin(perms.is_superadmin || false);
        // Login response carries no role/permissions — persist them for the admin guard
        const newCtx = {
          type: 'user' as const,
          role: perms.roles?.[0] || null,
          permissions: perms.permissions || [],
          is_superadmin: perms.is_superadmin || false,
          roles: perms.roles || [],
        };
        setAuthContext(newCtx);
      } catch { /* non-admin users get empty perms */ }
    } catch { setToken(null); setIsLoggedIn(false); }
    finally { setIsLoading(false); }
  };

  const loadTransactions = async () => {
    try {
      const data = await transactions.list();
      setTxList(data.data.map((t: any) => ({
        id: String(t.id), type: t.type, title: t.title,
        date: new Date(t.date).toLocaleDateString('fa-IR') + ' ' + new Date(t.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        amountToman: t.amount_toman, weightGrams: t.weight_grams, status: t.status, details: t.details, image: t.image,
      })));
    } catch {}
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchPrices = async () => {
      try {
        const data = await prices.current();
        if (data.gold_18k) {
          setPrevGoldPrice(gp => { setPriceTrend(data.gold_18k > gp ? 'up' : data.gold_18k < gp ? 'down' : 'stable'); return gp; });
          setGoldPrice18k(data.gold_18k);
        }
        if (data.silver_999) setSilverPrice999(data.silver_999);
      } catch {}
    };
    fetchPrices();
    const i = setInterval(fetchPrices, 30000);
    return () => clearInterval(i);
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginError('');
    try {
      const data = await auth.login(loginPhone, loginPassword, tenant?.slug);
      setUserName(data.user.name); setUserPhone(data.user.phone || '');
      if (data.user.wallet) setWalletData({ goldGrams: data.user.wallet.gold_grams, silverGrams: data.user.wallet.silver_grams || 0, cashToman: data.user.wallet.cash_toman });
      setIsLoggedIn(true);
      await loadUserData();
      loadTransactions();
    } catch (err: any) { setLoginError(err.message || 'خطا در ورود'); }
  };

  const handleRequestOtp = async () => {
    if (loginPhone.length !== 11) { setLoginError('شماره موبایل باید ۱۱ رقم باشد'); return; }
    setLoginError(''); setOtpLoading(true);
    try {
      await auth.requestOtp(loginPhone);
      setOtpSent(true);
    } catch (err: any) { setLoginError(err.message || 'خطا در ارسال کد'); }
    finally { setOtpLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginError('');
    try {
      const data = await auth.verifyOtp(loginPhone, otpCode, tenant?.slug);
      setUserName(data.user.name); setUserPhone(data.user.phone || '');
      if (data.user.wallet) setWalletData({ goldGrams: data.user.wallet.gold_grams, silverGrams: data.user.wallet.silver_grams || 0, cashToman: data.user.wallet.cash_toman });
      setIsLoggedIn(true);
      await loadUserData();
      loadTransactions();
    } catch (err: any) { setLoginError(err.message || 'خطا در تأیید کد'); }
  };

  const handleLogout = async () => {
    try { await auth.logout(); } catch {}
    setToken(null); setAuthContext(null); setIsLoggedIn(false); setWalletData({ goldGrams: 0, silverGrams: 0, cashToman: 0 }); setTxList([]); setUserName(''); setUserPhone(''); setUserPerms([]); setIsSuperadmin(false);
  };

  const handleUpdateName = async (newName: string) => { try { await auth.updateProfile(newName); setUserName(newName); } catch {} };

  const handleNewTransaction = useCallback(async (tx: Transaction) => {
    try {
      const metal = tx.title.includes('نقره') ? 'silver' : 'gold';
      const result = await transactions.create({ type: tx.type, title: tx.title, amount_toman: tx.amountToman, weight_grams: tx.weightGrams, metal, details: tx.details, image: tx.image });
      if (result.wallet) setWalletData({ goldGrams: result.wallet.gold_grams, silverGrams: result.wallet.silver_grams || 0, cashToman: result.wallet.cash_toman });
      loadTransactions();
    } catch (err: any) { alert(err.message || 'خطا در ثبت تراکنش'); }
  }, []);

  const handleNavigateToTab = useCallback((tabId: string, categoryFilter: string | null = null) => {
    setIsProductDetailOpen(false); setActiveTab(tabId);
    if (tabId === 'vitrine') setSelectedCategory(categoryFilter);
    if (tabId === 'orders') loadTransactions();
  }, []);

  const toggleBalances = useCallback(() => setShowBalances(p => !p), []);

    // ===== CINEMATIC EXPERIENCE ROUTES (/experience and /experience/:slug) =====
    const experienceRoute = typeof window !== 'undefined' ? detectExperienceRoute() : null;
    const handleExperienceDirectPurchase = useCallback((_product: { id: string }) => {
      window.location.href = '/?tenant=talana';
    }, []);

    if (experienceRoute?.kind === 'campaign') {
      return (
        <DynamicCampaignExperiencePage
          slug={experienceRoute.slug}
          rawGoldPerGramToman={goldPrice18k}
          onDirectPurchase={handleExperienceDirectPurchase}
        />
      );
    }
    if (experienceRoute?.kind === 'landing') {
      const enterMarketplace = () => { window.location.href = '/?tenant=talana'; };
      const enterStore = (slug: string) => { window.location.href = `/?tenant=${slug}`; };
      const startBuilding = (type?: 'marketplace' | 'store' | 'supplier') => {
        setInstallerPreselectedType(type);
        setShowInstaller(true);
      };
      return (
        <MainJewelryExperienceLanding
          rawGoldPerGramToman={goldPrice18k}
          onEnterMarketplace={enterMarketplace}
          onEnterStore={enterStore}
          onStartBuilding={startBuilding}
          onDirectPurchase={handleExperienceDirectPurchase}
        />
      );
    }

    // ===== LOGIN PAGE ROUTE =====
        if (showLoginPage) {
          const handleLogin = async (phone: string, password: string) => {
            setLoginError('');
            try {
              const data = await auth.login(phone, password, tenant?.slug);
              setUserName(data.user.name); setUserPhone(data.user.phone || '');
              if (data.user.wallet) setWalletData({ goldGrams: data.user.wallet.gold_grams, silverGrams: data.user.wallet.silver_grams || 0, cashToman: data.user.wallet.cash_toman });
              setIsLoggedIn(true);
              const ctx = getAuthContext();
              if (ctx) { setUserPerms(ctx.permissions); setIsSuperadmin(ctx.is_superadmin); }
              setShowLoginPage(false);
              window.location.hash = loginRedirect === 'admin' ? '#/admin' : '#/';
              loadTransactions();
            } catch (err: any) { setLoginError(err.message || 'خطا در ورود'); }
          };

          const handleRequestOtp = async (phone: string) => {
            if (phone.length !== 11) { setLoginError('شماره موبایل باید ۱۱ رقم باشد'); return; }
            setLoginError(''); setOtpLoading(true);
            try {
              await auth.requestOtp(phone);
              setOtpSent(true);
            } catch (err: any) { setLoginError(err.message || 'خطا در ارسال کد'); }
            finally { setOtpLoading(false); }
          };

          const handleVerifyOtp = async (phone: string, code: string) => {
            setLoginError('');
            try {
              const data = await auth.verifyOtp(phone, code, tenant?.slug);
              setUserName(data.user.name); setUserPhone(data.user.phone || '');
              if (data.user.wallet) setWalletData({ goldGrams: data.user.wallet.gold_grams, silverGrams: data.user.wallet.silver_grams || 0, cashToman: data.user.wallet.cash_toman });
              setIsLoggedIn(true);
              const ctx = getAuthContext();
              if (ctx) { setUserPerms(ctx.permissions); setIsSuperadmin(ctx.is_superadmin); }
              setShowLoginPage(false);
              window.location.hash = loginRedirect === 'admin' ? '#/admin' : '#/';
              loadTransactions();
            } catch (err: any) { setLoginError(err.message || 'خطا در تأیید کد'); }
          };

      return (
        <LoginPage
          platformName={platformName}
          platformLogo={platformLogo}
          platformSubtitle={platformSubtitle}
          brandColor={brandColor}
          silverColor={silverColor}
          onLogin={handleLogin}
          onRequestOtp={handleRequestOtp}
          onVerifyOtp={handleVerifyOtp}
          loginMode={loginMode}
          setLoginMode={setLoginMode}
          loginPhone={loginPhone}
          setLoginPhone={setLoginPhone}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          loginError={loginError}
          setLoginError={setLoginError}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          otpSent={otpSent}
          setOtpSent={setOtpSent}
          otpLoading={otpLoading}
          setOtpLoading={setOtpLoading}
        />
      );
    }

    // ===== ADMIN PANEL =====
    // The tenant token cookie is only readable once the tenant effect has synced the API context.
    const tenantSyncPending = !!urlTenant && (tenantLoading || (!!tenant && syncedTenantSlug !== tenant.slug));
    if (showAdmin && !tenantSyncPending && !getToken()) {
      setShowAdmin(false);
      setShowLoginPage(true);
      setLoginRedirect('admin');
      window.location.hash = '#/login';
      return null;
    }
    if (showAdmin && !tenantSyncPending) return <AdminPanel onBack={() => { window.location.hash = '#/'; }} token={getToken() || ''} />;

    // ===== SERIAL VERIFICATION PAGE (public, no auth required) =====
    if (verifyHash) {
      return <SerialVerifyPage hash={verifyHash} onBack={() => { window.location.hash = '#/'; }} />;
    }

    // ===== STORE / MARKETPLACE LOADING (URL has tenant, or tenant resolved but auth loading) =====
  if ((tenantLoading && urlTenant) || (isLoading && tenant) || tenantSyncPending) {
    const cached = getCachedTenant(tenant?.slug || urlTenant?.slug || '');
    const displayName = tenant?.name || cached?.name || urlTenant?.slug || 'فروشگاه';
    const displayLogo = tenant?.logo ? apiAssetUrl(tenant.logo) : (cached?.logo ? apiAssetUrl(cached.logo) : null);
    const displayBrand = tenant?.brand_color || cached?.brand_color || '#ca8a04';
    const displayBrandLight = displayBrand + 'dd';

    return (
      <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          {displayLogo ? (
            <img src={displayLogo} alt={displayName} className="w-14 h-14 rounded-xl mx-auto mb-4 object-cover shadow-md animate-pulse" />
          ) : (
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md animate-pulse"
              style={{ background: `linear-gradient(135deg, ${displayBrand}, ${displayBrandLight})` }}>
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
          )}
          <p className="text-sm font-black text-slate-800 mb-3">{displayName}</p>
          <div className="w-28 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full rounded-full animate-[loadingBar_1.5s_ease-in-out_infinite]" style={{ width: '50%', background: `linear-gradient(90deg, ${displayBrand}, ${displayBrandLight})` }} />
          </div>
        </div>
      </div>
    );
  }

  // ===== LANDING PAGE LOADING (no tenant in URL) =====
  if (tenantLoading) return (
    <div dir="rtl" className="min-h-screen bg-white flex items-center justify-center font-sans">
      <div className="text-center">
        <img src="/talana_logo.png" alt="طلانا" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-md object-cover animate-pulse" />
        <p className="text-lg font-black text-slate-800 mb-3">طلانا</p>
        <div className="w-32 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
          <div className="h-full rounded-full animate-[loadingBar_1.5s_ease-in-out_infinite]" style={{width:'60%', background: 'linear-gradient(90deg, #ca8a04, #d97706)'}} />
        </div>
      </div>
    </div>
  );

  // ===== INSTALLER PAGE =====
  if (showInstaller) {
    return <InstallerPage
      onBack={() => setShowInstaller(false)}
      preselectedType={installerPreselectedType}
    />;
  };

    // ===== LANDING PAGE (no tenant) — cinematic showcase experience =====
    if (!tenant && !tenantLoading) {
      const enterMarketplace = () => { window.location.href = '/?tenant=talana'; };
      const enterStore = (slug: string) => { window.location.href = `/?tenant=${slug}`; };
      const startBuilding = (type?: 'marketplace' | 'store' | 'supplier') => {
        setInstallerPreselectedType(type);
        setShowInstaller(true);
      };
      return (
        <MainJewelryExperienceLanding
          rawGoldPerGramToman={goldPrice18k}
          onEnterMarketplace={enterMarketplace}
          onEnterStore={enterStore}
          onStartBuilding={startBuilding}
          onDirectPurchase={handleExperienceDirectPurchase}
        />
      );
    }

    // ===== SUPPLIER PUBLIC PAGE — no public storefront (only when NOT trying to access admin) =====
    if (tenant?.type === 'supplier' && !isLoggedIn && !showAdmin) {
      return (
        <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h1 className="text-lg font-black text-slate-800 mb-2">پنل تأمین‌کننده</h1>
            <p className="text-sm text-slate-400 mb-6">این یک پنل مدیریت خصوصی است و فروشگاه عمومی ندارد.</p>
            <a href={`/?tenant=${tenant.slug}#/login`}
              className="inline-block text-white px-6 py-3 rounded-2xl font-black text-sm"
              style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` }}>
              ورود به پنل مدیریت
            </a>
          </div>
        </div>
      );
    }

    // ===== LOGIN SCREEN (fallback for logged out users without tenant) =====
    if (!isLoggedIn) {
      setShowLoginPage(true);
      window.location.hash = '#/login';
      return <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center font-sans"><div className="text-center"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" /></div></div>;
    }

  if (showAdmin) return <AdminPanel onBack={goToApp} token={getToken() || ''} />;

  const sidebarHidden = false;

  // ===== MOBILE BOTTOM NAV =====
  const showMobileNav = ['home', 'vitrine', 'trade', 'services'].includes(activeTab) && !isProductDetailOpen && !isServicePageOpen;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 flex font-sans" style={{ ['--selection-bg' as any]: brandColor }}>
      <style>{`::selection{background-color:${brandColor};color:white}`}</style>
      {/* SIDEBAR — desktop only */}
      {!sidebarHidden && (
        <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:min-h-screen lg:bg-white lg:border-l lg:border-slate-100 lg:flex-shrink-0 lg:shadow-sm lg:sticky lg:top-0">
          {/* Logo */}
          <div className="p-5 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <img src={platformLogo} alt={platformName} className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <span className="text-sm font-black text-slate-800">{platformName}</span>
                <span className="text-[9px] text-slate-400 font-bold block">{toPersianDigits(userName)}</span>
              </div>
            </div>
          </div>
          {/* Wallet mini */}
          <div className="p-4 border-b border-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">طلای ۱۸ عیار</span>
              <span className="text-xs font-black" style={{ color: brandColor }}>{showBalances ? `${formatGram(walletData.goldGrams)} گرم` : '****'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">نقره ۹۹۹</span>
              <span className="text-xs font-black" style={{ color: silverColor }}>{showBalances ? `${formatGram(walletData.silverGrams)} گرم` : '****'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">کیف پول</span>
              <span className="text-xs font-black text-slate-700">{showBalances ? `${formatToman(walletData.cashToman)} تومان` : '****'}</span>
            </div>
          </div>
          {/* Metal toggle — desktop sidebar */}
          <div className="px-4 py-3 border-b border-slate-50">
            <div className="bg-slate-100 rounded-lg p-0.5 flex gap-0.5">
              <button
                onClick={() => setActiveMetal('gold')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-black transition-all ${
                  activeMetal === 'gold'
                    ? 'text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                style={activeMetal === 'gold' ? { background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` } : undefined}
              >
                <img src="/assets/gold.png" alt="" className={`w-5 h-5 object-contain ${activeMetal === 'gold' ? 'brightness-0 invert' : ''}`} />
                طلا
              </button>
              <button
                onClick={() => setActiveMetal('silver')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-black transition-all ${
                  activeMetal === 'silver'
                    ? 'text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                style={activeMetal === 'silver' ? { background: `linear-gradient(135deg, ${silverColor}, ${silverColor}dd)` } : undefined}
              >
                <img src="/assets/silver.png" alt="" className="w-5 h-5 object-contain" />
                نقره
              </button>
            </div>
            {/* Live price */}
            <div className="mt-2 text-center text-[9px] font-black rounded-lg py-1"
              style={{
                backgroundColor: activeMetal === 'gold' ? `${brandColor}18` : `${silverColor}18`,
                color: activeMetal === 'gold' ? brandColor : silverColor,
              }}>
              {formatToman(activeMetal === 'gold' ? goldPrice18k : silverPrice999)} تومان / گرم
            </div>
          </div>
          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => handleNavigateToTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all text-right ${activeTab === item.id ? '' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                style={activeTab === item.id ? {
                  backgroundColor: activeMetal === 'gold' ? `${brandColor}18` : `${silverColor}18`,
                  color: activeMetal === 'gold' ? brandColor : silverColor,
                } : undefined}
              >
                <item.icon className="w-5 h-5" /><span>{item.label}</span>
              </button>
            ))}
            <div className="border-t border-slate-50 my-2" />
            {can('admin.access') && (
            <button onClick={goToAdmin}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all text-right text-slate-500 hover:bg-slate-50 hover:text-slate-700">
              <Shield className="w-5 h-5" /><span>پنل مدیریت</span>
            </button>
            )}
            <button onClick={() => handleNavigateToTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all text-right ${activeTab === 'notifications' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <Bell className="w-5 h-5" /><span>اعلان‌ها</span>
            </button>
            <button onClick={() => handleNavigateToTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all text-right ${activeTab === 'profile' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
              <User className="w-5 h-5" /><span>پروفایل</span>
            </button>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black text-rose-500 hover:bg-rose-50 transition-all mt-4">
              <LogOut className="w-5 h-5" /><span>خروج</span>
            </button>
          </nav>
        </aside>
      )}

      {/* MAIN CONTENT */}
      <main className={`flex-1 w-full min-w-0 ${showMobileNav ? 'pb-18' : ''}`}>
        {/* Mobile Header — hidden on desktop */}
        {showMobileNav && (
          <div className="lg:hidden">
            <Header
              userName={userName}
              platformName={platformName}
              platformLogo={platformLogo}
              onNavigateToTab={handleNavigateToTab}
              activeMetal={activeMetal}
              onMetalChange={setActiveMetal}
              goldPrice18k={goldPrice18k}
              silverPrice999={silverPrice999}
              isMarketplace={isMarketplace}
              showAdminButton={can('admin.access')}
              onGoToAdmin={goToAdmin}
              silverTabColor={silverColor}
              brandColor={brandColor}
            />
          </div>
        )}

        <div className="lg:px-6 lg:py-4">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.08 }}>
              <Suspense fallback={<TabFallback />}>
                {activeTab === 'home' && <HomeDashboard wallet={walletData} goldPrice18k={goldPrice18k} silverPrice999={silverPrice999} priceTrend={priceTrend} activeMetal={activeMetal} showBalances={showBalances} onToggleBalances={toggleBalances} onNavigateToTab={handleNavigateToTab} onTransaction={handleNewTransaction} onServicePageToggle={setIsServicePageOpen} isMarketplace={isMarketplace} />}
                {activeTab === 'vitrine' && <MarketplaceTab wallet={walletData} goldPrice18k={goldPrice18k} silverPrice999={silverPrice999} activeMetal={activeMetal} onTransaction={handleNewTransaction} onProductDetailToggle={setIsProductDetailOpen} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} isStandaloneStore={isStore} platformName={platformName} platformLogo={platformLogo} />}
                {activeTab === 'trade' && <InvestmentTab wallet={walletData} goldPrice18k={goldPrice18k} silverPrice999={silverPrice999} priceTrend={priceTrend} activeMetal={activeMetal} onTransaction={handleNewTransaction} />}
                {activeTab === 'services' && <ServicesTab onNavigateToTab={handleNavigateToTab} activeMetal={activeMetal} wallet={walletData} goldPrice18k={goldPrice18k} silverPrice999={silverPrice999} onServicePageToggle={setIsServicePageOpen} onToast={() => {}} />}
                {activeTab === 'orders' && <OrdersTab transactions={txList} onBack={() => setActiveTab('home')} />}
                {activeTab === 'profile' && <ProfileTab wallet={walletData} userName={userName} userPhone={userPhone} onUpdateName={handleUpdateName} onUpdateWallet={setWalletData} onResetData={handleLogout} goldPrice18k={goldPrice18k} activeMetal={activeMetal} onBack={() => setActiveTab('home')} />}
                {activeTab === 'notifications' && <NotificationsTab onBack={() => setActiveTab('home')} />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav — hidden on desktop */}
      {showMobileNav && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white pb-2 pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.015)]">
          <div className="max-w-md mx-auto grid grid-cols-4 h-14 text-center text-[11px] font-black">
            {navItems.map(item => (
              <button key={item.id} onClick={() => handleNavigateToTab(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 transition-all focus:outline-none ${activeTab === item.id ? '' : 'text-slate-400 hover:text-slate-600'}`}
                style={activeTab === item.id ? { color: activeMetal === 'gold' ? brandColor : silverColor } : undefined}
              >
                {activeTab === item.id && <span className="absolute top-0 w-6 h-0.5 rounded-full"
                  style={{ backgroundColor: activeMetal === 'gold' ? brandColor : silverColor }} />}
                <item.icon className="w-6 h-6" /><span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
