import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { UserWallet, Transaction } from './types';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import InstallerPage from './components/InstallerPage';
import { Home, Store, ArrowLeftRight, LayoutGrid, LogOut, Bell, User, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, wallet, prices, transactions, setToken, getToken, setTenantContext } from './api';
import { formatToman, formatGram, toPersianDigits } from './utils';
import { useTenant } from './tenant';
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
  const [installerPreselectedType, setInstallerPreselectedType] = useState<'marketplace' | 'store' | undefined>();
  const [userPerms, setUserPerms] = useState<string[]>([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  const can = (perm: string) => isSuperadmin || userPerms.includes(perm);

  // Sync tenant ID with API client
  useEffect(() => {
    if (tenant) {
      setTenantContext(tenant.id, tenant.slug);
    } else {
      setTenantContext(null, '');
    }
  }, [tenant]);

  // Determine store type and nav items
  const isMarketplace = !tenant || tenant?.type === 'marketplace' || tenant?.type === 'platform';
  const isStore = tenant?.type === 'store';
  const navItems = isStore ? storeNavItems : marketplaceNavItems;
  const platformName = tenant?.name || 'طلانا';
  const platformLogo = tenant?.logo || '/talana_logo.png';
  const platformSubtitle = isMarketplace
    ? 'بازارچه آنلاین طلا و نقره'
    : isStore
    ? 'فروشگاه آنلاین طلا و نقره'
    : 'سامانه هوشمند معاملات طلا و نقره';

  useEffect(() => {
    const onHashChange = () => setShowAdmin(window.location.hash === '#/admin');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const goToAdmin = () => { window.location.hash = '#/admin'; };
  const goToApp = () => { window.location.hash = '#/'; };

  useEffect(() => { if (getToken()) loadUserData(); }, []);

  const loadUserData = async () => {
    try {
      const profile = await auth.profile();
      const u = profile.user;
      setUserName(u.name);
      if (u.wallet) setWalletData({ goldGrams: u.wallet.gold_grams, silverGrams: u.wallet.silver_grams || 0, cashToman: u.wallet.cash_toman });
      setIsLoggedIn(true);
      // Load permissions for ACL
      try {
        const perms = await auth.permissions();
        setUserPerms(perms.permissions || []);
        setIsSuperadmin(perms.is_superadmin || false);
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

  const loadPermissions = async () => {
    try {
      const perms = await auth.permissions();
      setUserPerms(perms.permissions || []);
      setIsSuperadmin(perms.is_superadmin || false);
    } catch { setUserPerms([]); setIsSuperadmin(false); }
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
      setUserName(data.user.name);
      if (data.user.wallet) setWalletData({ goldGrams: data.user.wallet.gold_grams, silverGrams: data.user.wallet.silver_grams || 0, cashToman: data.user.wallet.cash_toman });
      setIsLoggedIn(true);
      loadTransactions();
      loadPermissions();
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
      setUserName(data.user.name);
      if (data.user.wallet) setWalletData({ goldGrams: data.user.wallet.gold_grams, silverGrams: data.user.wallet.silver_grams || 0, cashToman: data.user.wallet.cash_toman });
      setIsLoggedIn(true);
      loadTransactions();
      loadPermissions();
    } catch (err: any) { setLoginError(err.message || 'خطا در تأیید کد'); }
  };

  const handleLogout = async () => {
    try { await auth.logout(); } catch {}
    setToken(null); setIsLoggedIn(false); setWalletData({ goldGrams: 0, silverGrams: 0, cashToman: 0 }); setTxList([]); setUserName(''); setUserPerms([]); setIsSuperadmin(false);
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
  const tabAccent = activeMetal === 'gold' ? 'amber' : 'slate';

  // ===== TENANT LOADING =====
  if (tenantLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-black text-slate-600">در حال بارگذاری فروشگاه...</p>
      </div>
    </div>
  );

  // ===== LOADING STATE =====
  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>;

  // ===== INSTALLER PAGE =====
  if (showInstaller) {
    return <InstallerPage
      onBack={() => setShowInstaller(false)}
      preselectedType={installerPreselectedType}
    />;
  }

  // ===== LANDING PAGE (no tenant) =====
  if (!tenant && !tenantLoading) {
    const enterMarketplace = () => { window.location.href = '/?tenant=talana'; };
    const enterStore = (slug: string) => { window.location.href = `/?tenant=${slug}`; };
    const startBuilding = (type?: 'marketplace' | 'store') => {
      setInstallerPreselectedType(type);
      setShowInstaller(true);
    };
    return <LandingPage onEnterMarketplace={enterMarketplace} onEnterStore={enterStore} onStartBuilding={startBuilding} />;
  }

  // ===== LOGIN SCREEN =====
  if (!isLoggedIn) return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="text-center mb-6">
          {tenant?.logo ? (
            <img src={tenant.logo} alt={platformName} className="w-16 h-16 mx-auto rounded-xl mb-3 object-cover" />
          ) : (
            <img src={platformLogo} alt={platformName} className="w-16 h-16 mx-auto rounded-xl mb-3" />
          )}
          <h1 className="text-lg font-black text-slate-800">{platformName}</h1>
          <p className="text-xs text-slate-400 font-bold mt-1">{platformSubtitle}</p>
        </div>

        {/* Login mode tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
          <button onClick={() => { setLoginMode('password'); setLoginError(''); setOtpSent(false); }}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${loginMode === 'password' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
            رمز عبور
          </button>
          <button onClick={() => { setLoginMode('otp'); setLoginError(''); setOtpSent(false); }}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${loginMode === 'otp' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>
            کد یکبار مصرف
          </button>
        </div>

        {/* Phone input (shared) */}
        <div className="mb-4">
          <label className="text-xs font-black text-slate-600 block mb-1.5">شماره موبایل</label>
          <input type="text" value={loginPhone} onChange={e => { setLoginPhone(e.target.value); setOtpSent(false); }}
            placeholder="۰۹۱۲۳۴۵۶۷۸۹" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-amber-600 font-mono" dir="ltr" />
        </div>

        {loginMode === 'password' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="text-xs font-black text-slate-600 block mb-1.5">رمز عبور</label><input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-amber-600" dir="ltr" /></div>
            {loginError && <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl">{loginError}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white py-3.5 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all">ورود به {platformName}</button>
            <p className="text-center text-[10px] text-slate-400 font-bold">demo: 09123456789 / password</p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {!otpSent ? (
              <>
                {loginError && <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl">{loginError}</p>}
                <button type="button" onClick={handleRequestOtp} disabled={otpLoading}
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white py-3.5 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                  {otpLoading ? 'در حال ارسال...' : 'دریافت کد تأیید'}
                </button>
                <p className="text-center text-[10px] text-slate-400 font-bold">کد به شماره شما ارسال می‌شود</p>
              </>
            ) : (
              <>
                <div><label className="text-xs font-black text-slate-600 block mb-1.5">کد تأیید ۶ رقمی</label><input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} placeholder="111111" maxLength={6} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-center focus:outline-none focus:border-amber-600 font-mono tracking-widest" dir="ltr" /></div>
                {loginError && <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl">{loginError}</p>}
                <button type="submit" className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-white py-3.5 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all">تأیید و ورود</button>
                <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); setLoginError(''); }}
                  className="w-full text-center text-[11px] text-slate-400 font-bold hover:text-slate-600">ارسال مجدد کد</button>
                <p className="text-center text-[10px] text-slate-400 font-bold">کد تست: 111111</p>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );

  if (showAdmin) return <AdminPanel onBack={goToApp} token={getToken() || ''} />;

  const sidebarHidden = false;

  // ===== MOBILE BOTTOM NAV =====
  const showMobileNav = ['home', 'vitrine', 'trade', 'services'].includes(activeTab) && !isProductDetailOpen && !isServicePageOpen;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 flex font-sans selection:bg-amber-600 selection:text-white">
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
              <span className="text-xs font-black text-amber-600">{showBalances ? `${formatGram(walletData.goldGrams)} گرم` : '****'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400">نقره ۹۹۹</span>
              <span className="text-xs font-black text-slate-600">{showBalances ? `${formatGram(walletData.silverGrams)} گرم` : '****'}</span>
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
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <img src="/assets/gold.png" alt="" className={`w-5 h-5 object-contain ${activeMetal === 'gold' ? 'brightness-0 invert' : ''}`} />
                طلا
              </button>
              <button
                onClick={() => setActiveMetal('silver')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-black transition-all ${
                  activeMetal === 'silver'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <img src="/assets/silver.png" alt="" className="w-5 h-5 object-contain" />
                نقره
              </button>
            </div>
            {/* Live price */}
            <div className={`mt-2 text-center text-[9px] font-black rounded-lg py-1 ${
              activeMetal === 'gold' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {formatToman(activeMetal === 'gold' ? goldPrice18k : silverPrice999)} تومان / گرم
            </div>
          </div>
          {/* Nav */}
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => handleNavigateToTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all text-right ${activeTab === item.id ? (activeMetal === 'gold' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700') : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
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
            />
          </div>
        )}

        <div className="lg:px-6 lg:py-4">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.08 }}>
              <Suspense fallback={<TabFallback />}>
                {activeTab === 'home' && <HomeDashboard wallet={walletData} goldPrice18k={goldPrice18k} silverPrice999={silverPrice999} priceTrend={priceTrend} activeMetal={activeMetal} showBalances={showBalances} onToggleBalances={toggleBalances} onNavigateToTab={handleNavigateToTab} onTransaction={handleNewTransaction} onServicePageToggle={setIsServicePageOpen} isMarketplace={isMarketplace} />}
                {activeTab === 'vitrine' && <MarketplaceTab wallet={walletData} goldPrice18k={goldPrice18k} silverPrice999={silverPrice999} activeMetal={activeMetal} onTransaction={handleNewTransaction} onProductDetailToggle={setIsProductDetailOpen} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} isStandaloneStore={isStore} />}
                {activeTab === 'trade' && <InvestmentTab wallet={walletData} goldPrice18k={goldPrice18k} silverPrice999={silverPrice999} priceTrend={priceTrend} activeMetal={activeMetal} onTransaction={handleNewTransaction} />}
                {activeTab === 'services' && <ServicesTab onNavigateToTab={handleNavigateToTab} activeMetal={activeMetal} wallet={walletData} goldPrice18k={goldPrice18k} silverPrice999={silverPrice999} onServicePageToggle={setIsServicePageOpen} onToast={() => {}} />}
                {activeTab === 'orders' && <OrdersTab transactions={txList} onBack={() => setActiveTab('home')} />}
                {activeTab === 'profile' && <ProfileTab wallet={walletData} userName={userName} onUpdateName={handleUpdateName} onUpdateWallet={setWalletData} onResetData={handleLogout} goldPrice18k={goldPrice18k} activeMetal={activeMetal} onBack={() => setActiveTab('home')} />}
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
                className={`relative flex flex-col items-center justify-center gap-1 transition-all focus:outline-none ${activeTab === item.id ? (activeMetal === 'gold' ? 'text-amber-600' : 'text-slate-600') : 'text-slate-400 hover:text-slate-600'}`}>
                {activeTab === item.id && <span className={`absolute top-0 w-6 h-0.5 rounded-full ${activeMetal === 'gold' ? 'bg-amber-600' : 'bg-slate-600'}`} />}
                <item.icon className="w-6 h-6" /><span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
