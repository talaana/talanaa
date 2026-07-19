import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { UserWallet, Transaction } from './types';
import Header from './components/Header';
import HomeDashboard from './components/HomeDashboard';
import { Home, Store, ArrowLeftRight, LayoutGrid } from 'lucide-react';
import { BASE_GOLD_PRICE_18K, BASE_SILVER_PRICE_999 } from './data';
import { productPlaceholder } from './utils';
import { motion, AnimatePresence } from 'motion/react';

const MarketplaceTab = lazy(() => import('./components/MarketplaceTab'));
const InvestmentTab = lazy(() => import('./components/InvestmentTab'));
const ServicesTab = lazy(() => import('./components/ServicesTab'));
const OrdersTab = lazy(() => import('./components/OrdersTab'));
const ProfileTab = lazy(() => import('./components/ProfileTab'));
const NotificationsTab = lazy(() => import('./components/NotificationsTab'));

const TabFallback = () => (
  <div className="max-w-md mx-auto px-4 py-12 text-center">
    <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
  </div>
);

const INITIAL_WALLET: UserWallet = {
  goldGrams: 2.458,
  cashToman: 8450000,
};

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'buy_gold',
    title: 'خرید طلای آب‌شده سرمایه‌گذاری',
    date: '۱۴۰۵/۰۴/۲۷ ۱۲:۳۰',
    amountToman: 5000000,
    weightGrams: 0.6709,
    status: 'completed',
    details: 'خرید طلای آب‌شده ۱۸ عیار از بخش معاملات سریع طلانا به نرخ ۷,۴۵۲,۳۰۰ تومان به ازای هر گرم.',
  },
  {
    id: 'tx-2',
    type: 'buy_product',
    title: 'خرید انگشتر طلای طرح اسلیمی',
    date: '۱۴۰۵/۰۴/۲۵ ۱۵:۴۰',
    amountToman: 3500000,
    weightGrams: 4.25,
    status: 'completed',
    details: 'خرید فیزیکی انگشتر طرح اسلیمی از غرفه «گالری زرین». ارسال شده از تهران با پست پیشتاز و بیمه رسمی اتحادیه طلا و نقره.',
    image: productPlaceholder('ring'),
  }
];

export default function App() {
  // Global States loaded from LocalStorage
  const [wallet, setWallet] = useState<UserWallet>(() => {
    const saved = localStorage.getItem('talana_wallet');
    return saved ? JSON.parse(saved) : INITIAL_WALLET;
  });

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('talana_name') || 'احسان مرادی';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('talana_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Main active tab controller
  const [activeTab, setActiveTab] = useState<string>('home');
  
  // Real-time market metrics
  const [goldPrice18k, setGoldPrice18k] = useState<number>(BASE_GOLD_PRICE_18K);
  const [silverPrice999, setSilverPrice999] = useState<number>(BASE_SILVER_PRICE_999);
  const [priceTrend, setPriceTrend] = useState<'up' | 'down' | 'stable'>('stable');

  // Toggle Visibility for cash/metal amounts
  const [showBalances, setShowBalances] = useState<boolean>(() => {
    const saved = localStorage.getItem('talana_show_balances');
    return saved !== null ? saved === 'true' : true;
  });

  // Switcher between gold and silver
  const [activeMetal, setActiveMetal] = useState<'gold' | 'silver'>('gold');

  // Full page view indicator for products detail (hides header and bottom nav)
  const [isProductDetailOpen, setIsProductDetailOpen] = useState<boolean>(false);

  // Category filter state lifted to synchronize home categories click with marketplace
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('talana_wallet', JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem('talana_name', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('talana_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('talana_show_balances', String(showBalances));
  }, [showBalances]);

  // Simulate dynamic real-time gold price fluctuation (reduced frequency)
  useEffect(() => {
    const interval = setInterval(() => {
      const changePercent = (Math.random() * 0.1 - 0.05) / 100;
      const changeValue = Math.round(goldPrice18k * changePercent);
      if (Math.abs(changeValue) > 100) {
        setGoldPrice18k((prev) => prev + changeValue);
        setPriceTrend(changeValue > 0 ? 'up' : 'down');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Simulate dynamic real-time silver price fluctuation (reduced frequency)
  useEffect(() => {
    const interval = setInterval(() => {
      const changePercent = (Math.random() * 0.1 - 0.05) / 100;
      const changeValue = Math.round(silverPrice999 * changePercent);
      if (Math.abs(changeValue) > 5) {
        setSilverPrice999((prev) => prev + changeValue);
      }
    }, 35000);

    return () => clearInterval(interval);
  }, []);

  // Handle transaction processing
  const handleNewTransaction = useCallback((tx: Transaction) => {
    setTransactions((prev) => [tx, ...prev]);

    if (tx.type === 'buy_gold') {
      const isSilver = tx.title.includes('نقره');
      if (isSilver) {
        setWallet((prev) => ({
          ...prev,
          cashToman: prev.cashToman - tx.amountToman,
        }));
      } else {
        setWallet((prev) => ({
          goldGrams: prev.goldGrams + (tx.weightGrams || 0),
          cashToman: prev.cashToman - tx.amountToman,
        }));
      }
    } else if (tx.type === 'sell_gold') {
      const isSilver = tx.title.includes('نقره');
      if (isSilver) {
        setWallet((prev) => ({
          ...prev,
          cashToman: prev.cashToman + tx.amountToman,
        }));
      } else {
        setWallet((prev) => ({
          goldGrams: prev.goldGrams - (tx.weightGrams || 0),
          cashToman: prev.cashToman + tx.amountToman,
        }));
      }
    } else if (tx.type === 'buy_product') {
      if (tx.details?.includes('مبادله')) {
        setWallet((prev) => ({
          goldGrams: prev.goldGrams - (tx.weightGrams || 0),
          cashToman: prev.cashToman - tx.amountToman,
        }));
      } else {
        setWallet((prev) => ({
          ...prev,
          cashToman: prev.cashToman - tx.amountToman,
        }));
      }
    }
  }, []);

  // Reset demo simulation data
  const handleResetData = () => {
    setWallet(INITIAL_WALLET);
    setUserName('احسان مرادی');
    setTransactions(INITIAL_TRANSACTIONS);
    setGoldPrice18k(BASE_GOLD_PRICE_18K);
    setSilverPrice999(BASE_SILVER_PRICE_999);
    setActiveTab('home');
    setIsProductDetailOpen(false);
  };

  const handleUpdateWallet = (newWallet: UserWallet) => {
    setWallet(newWallet);
  };

  const handleUpdateName = (newName: string) => {
    setUserName(newName);
  };

  const handleNavigateToTab = useCallback((tabId: string, categoryFilter: string | null = null) => {
    setIsProductDetailOpen(false);
    setActiveTab(tabId);
    if (tabId === 'vitrine') {
      setSelectedCategory(categoryFilter);
    }
  }, []);

  // Toggle Visibility for cash/metal amounts - stable reference
  const toggleBalances = useCallback(() => setShowBalances((prev) => !prev), []);

    // Determine whether the main persistent Header and Bottom Nav should render
  const showHeaderAndNav = ['home', 'vitrine', 'trade', 'services'].includes(activeTab) && !isProductDetailOpen;
  const tabActiveColor = activeMetal === 'gold' ? 'text-amber-600' : 'text-slate-600';

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-amber-600 selection:text-white">
      
      {/* Dynamic Header - Shown only on persistent layout views */}
      {showHeaderAndNav && (
        <Header 
          userName={userName} 
          onNavigateToTab={handleNavigateToTab}
          activeMetal={activeMetal}
          onMetalChange={setActiveMetal}
          goldPrice18k={goldPrice18k}
          silverPrice999={silverPrice999}
        />
      )}

      {/* Main Tab Render Container */}
      <main className={`flex-1 w-full max-w-md mx-auto relative ${showHeaderAndNav ? 'pb-18' : 'py-2 pb-10'}`} id="app-main">
        <AnimatePresence>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="w-full h-full"
          >
            <Suspense fallback={<TabFallback />}>
            {activeTab === 'home' && (
              <HomeDashboard
                wallet={wallet}
                goldPrice18k={goldPrice18k}
                silverPrice999={silverPrice999}
                priceTrend={priceTrend}
                activeMetal={activeMetal}
                showBalances={showBalances}
                onToggleBalances={toggleBalances}
                onNavigateToTab={handleNavigateToTab}
                onTransaction={handleNewTransaction}
              />
            )}

            {activeTab === 'vitrine' && (
              <MarketplaceTab
                wallet={wallet}
                goldPrice18k={goldPrice18k}
                silverPrice999={silverPrice999}
                activeMetal={activeMetal}
                onTransaction={handleNewTransaction}
                onProductDetailToggle={setIsProductDetailOpen}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            )}

            {activeTab === 'trade' && (
              <InvestmentTab
                wallet={wallet}
                goldPrice18k={goldPrice18k}
                silverPrice999={silverPrice999}
                priceTrend={priceTrend}
                activeMetal={activeMetal}
                onTransaction={handleNewTransaction}
              />
            )}

            {activeTab === 'services' && (
              <ServicesTab
                onNavigateToTab={handleNavigateToTab}
                activeMetal={activeMetal}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersTab 
                transactions={transactions} 
                onBack={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileTab
                wallet={wallet}
                userName={userName}
                onUpdateName={handleUpdateName}
                onUpdateWallet={handleUpdateWallet}
                onResetData={handleResetData}
                goldPrice18k={goldPrice18k}
                activeMetal={activeMetal}
                onBack={() => setActiveTab('home')}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsTab
                onBack={() => setActiveTab('home')}
              />
            )}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent Bottom Nav Bar - Shown on core tabs when detail page is closed */}
      {showHeaderAndNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg pb-2 pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.015)]" id="app-bottom-nav">
          <div className="max-w-md mx-auto grid grid-cols-4 h-14 text-center text-[11px] font-black">
            
            <button
              onClick={() => handleNavigateToTab('home')}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 focus:outline-none ${activeTab === 'home' ? `${tabActiveColor} font-black` : 'text-slate-400 hover:text-slate-600'}`}
              id="nav-btn-home"
            >
              {activeTab === 'home' && <span className={`absolute top-0 w-6 h-0.5 rounded-full ${activeMetal === 'gold' ? 'bg-amber-600' : 'bg-slate-600'}`} />}
              <Home className="w-6 h-6" />
              <span>خانه</span>
            </button>

            <button
              onClick={() => handleNavigateToTab('vitrine')}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 focus:outline-none ${activeTab === 'vitrine' ? `${tabActiveColor} font-black` : 'text-slate-400 hover:text-slate-600'}`}
              id="nav-btn-vitrine"
            >
              {activeTab === 'vitrine' && <span className={`absolute top-0 w-6 h-0.5 rounded-full ${activeMetal === 'gold' ? 'bg-amber-600' : 'bg-slate-600'}`} />}
              <Store className="w-6 h-6" />
              <span>ویترین</span>
            </button>

            <button
              onClick={() => handleNavigateToTab('trade')}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 focus:outline-none ${activeTab === 'trade' ? `${tabActiveColor} font-black` : 'text-slate-400 hover:text-slate-600'}`}
              id="nav-btn-trade"
            >
              {activeTab === 'trade' && <span className={`absolute top-0 w-6 h-0.5 rounded-full ${activeMetal === 'gold' ? 'bg-amber-600' : 'bg-slate-600'}`} />}
              <ArrowLeftRight className="w-6 h-6" />
              <span>خرید و فروش</span>
            </button>

            <button
              onClick={() => handleNavigateToTab('services')}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 focus:outline-none ${activeTab === 'services' ? `${tabActiveColor} font-black` : 'text-slate-400 hover:text-slate-600'}`}
              id="nav-btn-services"
            >
              {activeTab === 'services' && <span className={`absolute top-0 w-6 h-0.5 rounded-full ${activeMetal === 'gold' ? 'bg-amber-600' : 'bg-slate-600'}`} />}
              <LayoutGrid className="w-6 h-6" />
              <span>خدمات</span>
            </button>

          </div>
        </nav>
      )}

    </div>
  );
}
