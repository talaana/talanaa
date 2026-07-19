import React, { useState, memo } from 'react';
import { UserWallet, Transaction } from '../types';
import { CATEGORIES, PRODUCTS } from '../data';
import { calculateGoldProductPrice, formatToman, formatGram, toPersianDigits } from '../utils';
import { 
  ChevronLeft, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Coins, 
  Wallet, 
  TrendingUp, 
  ChevronRight,
  CircleDollarSign,
  CalendarDays,
  Repeat,
  Hammer,
  Truck,
  History,
  Gift,
  Users,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BannerSlider from './BannerSlider';
import CategoryIcon from './CategoryIcon';

interface HomeDashboardProps {
  wallet: UserWallet;
  goldPrice18k: number;
  silverPrice999: number;
  priceTrend: 'up' | 'down' | 'stable';
  activeMetal: 'gold' | 'silver';
  showBalances: boolean;
  onToggleBalances: () => void;
  onNavigateToTab: (tabId: string, categoryFilter?: string | null) => void;
  onTransaction: (tx: Transaction) => void;
}

const HomeDashboard = memo(function HomeDashboard({
  wallet,
  goldPrice18k,
  silverPrice999,
  priceTrend,
  activeMetal,
  showBalances,
  onToggleBalances,
  onNavigateToTab,
  onTransaction,
}: HomeDashboardProps) {
  const [selectedInterval, setSelectedInterval] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [activeServiceSim, setActiveServiceSim] = useState<string | null>(null);

  // Live metal price and label based on active tab
  const activePrice = activeMetal === 'gold' ? goldPrice18k : silverPrice999;
  const activeMetalLabel = activeMetal === 'gold' ? 'طلای ۱۸ عیار' : 'نقره ۹۹۹';
  const activeMetalUnit = 'گرم';

  // Specific user wallet holdings in metals
  // Let's assume user has 2.4580 grams of Gold and 42.5000 grams of Silver
  const silverWalletHolding = 42.500;
  const activeMetalHolding = activeMetal === 'gold' ? wallet.goldGrams : silverWalletHolding;

  // Gold vault has total balance vs withdrawable balance
  const activeTotalMetal = activeMetal === 'gold' ? 2.858 : 48.500;
  const activeWithdrawableMetal = activeMetalHolding;

  // Chart price history in Tomans
  const goldHistory = {
    daily: [
      { date: '۰۸:۰۰', price: 8590000 },
      { date: '۱۰:۰۰', price: 8610000 },
      { date: '۱۲:۰۰', price: 8625000 },
      { date: '۱۴:۰۰', price: 8615000 },
      { date: '۱۶:۰۰', price: 8638000 },
      { date: '۱۸:۰۰', price: 8620000 },
      { date: '۲۰:۰۰', price: 8642000 },
      { date: '۲۲:۰۰', price: goldPrice18k },
    ],
    weekly: [
      { date: 'شنبه', price: 8480000 },
      { date: 'یکشنبه', price: 8520000 },
      { date: 'دوشنبه', price: 8570000 },
      { date: 'سه‌شنبه', price: 8540000 },
      { date: 'چهارشنبه', price: 8610000 },
      { date: 'پنجشنبه', price: 8620000 },
      { date: 'جمعه', price: goldPrice18k },
    ],
    monthly: [
      { date: 'هفته اول', price: 8120000 },
      { date: 'هفته دوم', price: 8290000 },
      { date: 'هفته سوم', price: 8450000 },
      { date: 'هفته چهارم', price: 8580000 },
      { date: 'هفته پنجم', price: goldPrice18k },
    ]
  };

  const silverHistory = {
    daily: [
      { date: '۰۸:۰۰', price: 122600 },
      { date: '۱۰:۰۰', price: 123100 },
      { date: '۱۲:۰۰', price: 123900 },
      { date: '۱۴:۰۰', price: 123500 },
      { date: '۱۶:۰۰', price: 124400 },
      { date: '۱۸:۰۰', price: 123800 },
      { date: '۲۰:۰۰', price: 124600 },
      { date: '۲۲:۰۰', price: silverPrice999 },
    ],
    weekly: [
      { date: 'شنبه', price: 119800 },
      { date: 'یکشنبه', price: 121200 },
      { date: 'دوشنبه', price: 122500 },
      { date: 'سه‌شنبه', price: 121900 },
      { date: 'چهارشنبه', price: 123800 },
      { date: 'پنجشنبه', price: 124150 },
      { date: 'جمعه', price: silverPrice999 },
    ],
    monthly: [
      { date: 'هفته اول', price: 109500 },
      { date: 'هفته دوم', price: 114200 },
      { date: 'هفته سوم', price: 119400 },
      { date: 'هفته چهارم', price: 122800 },
      { date: 'هفته پنجم', price: silverPrice999 },
    ]
  };

  const activeHistory = activeMetal === 'gold' ? goldHistory[selectedInterval] : silverHistory[selectedInterval];

  // SVG Chart Calculations
  const chartWidth = 380;
  const chartHeight = 140;
  const paddingX = 40;
  const paddingY = 15;

  const prices = activeHistory.map(h => h.price);
  const minPrice = Math.min(...prices) * 0.997;
  const maxPrice = Math.max(...prices) * 1.003;
  const priceRange = maxPrice - minPrice;

  const points = pointsForChart(activeHistory, minPrice, priceRange, chartWidth, chartHeight, paddingX, paddingY);

  function pointsForChart(history: any[], minPrice: number, priceRange: number, width: number, height: number, px: number, py: number) {
    return history.map((pt, index) => {
      const x = px + ((history.length - 1 - index) / (history.length - 1)) * (width - px * 2);
      const y = height - py - ((pt.price - minPrice) / priceRange) * (height - py * 2);
      return { x, y, data: pt };
    });
  }

  const pathD = points.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z` : '';

  const firstPrice = activeHistory[0].price;
  const lastPrice = activeHistory[activeHistory.length - 1].price;
  const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  const percentSign = percentChange >= 0 ? '+' : '';
  const percentColor = percentChange >= 0 ? 'text-emerald-500' : 'text-rose-500';
  const intervalLabel = selectedInterval === 'daily' ? 'روزانه' : selectedInterval === 'weekly' ? 'هفتگی' : 'ماهانه';

  const activeDisplayPoint = hoveredIndex !== null ? points[hoveredIndex].data : activeHistory[activeHistory.length - 1];

  // Services Grid Mapping
  const servicesList = [
    { id: 'loan', label: 'وام آنی', sub: 'بدون ضامن', icon: <CircleDollarSign className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { id: 'installment', label: 'خرید قسطی', sub: 'بیمه صنف طلا', icon: <CalendarDays className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'auto', label: 'سفارش خودکار', sub: 'خرید پس‌انداز', icon: <Repeat className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'zargar', label: 'طرح زرگر', sub: 'سفارش آنلاین ملزومات', icon: <Hammer className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { id: 'delivery', label: 'تحویل طلا', sub: 'پست بیمه‌شده', icon: <Truck className="w-5 h-5" />, color: 'bg-teal-50 text-teal-600 border-teal-100' },
    { id: 'history', label: 'تاریخچه', sub: 'تراکنش‌ها', icon: <History className="w-5 h-5" />, color: 'bg-slate-50 text-slate-600 border-slate-100' },
    { id: 'gift', label: 'کارت هدیه', sub: 'طرح شکیل سفارشی', icon: <Gift className="w-5 h-5" />, color: 'bg-rose-50 text-rose-600 border-rose-100' },
    { id: 'invite', label: 'دعوت از دوستان', sub: 'کد هدیه طلایی', icon: <Users className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  ];

  const handleServiceClick = (id: string) => {
    if (id === 'history') {
      onNavigateToTab('orders');
    } else if (id === 'invite') {
      onNavigateToTab('profile');
    } else {
      setActiveServiceSim(id);
    }
  };

  // Compact Vitrine featured products
  const compactProducts = PRODUCTS.slice(0, 3);

  return (
    <div className="space-y-3.5 max-w-md mx-auto px-4 py-2 text-slate-800 pb-2 text-right" id="home-dashboard">
      
      {/* 1. Unified User Authenticated Wallet Box */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden" id="wealth-card">
        {/* Section A: Metal Balance (Above Cash Balance) with down arrow */}
        <div className="flex items-center justify-between">
          {/* Label on the right (renders on right in RTL) */}
          <div>
            <button 
              onClick={() => setShowVaultModal(true)}
              className="flex items-center gap-1.5 text-slate-400 font-extrabold text-[11px] bg-slate-50 border border-slate-100/60 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all focus:outline-none"
            >
              <span>{activeMetal === 'gold' ? 'طلای در دسترس' : 'نقره در دسترس'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Value and eye icon on the left (renders on left in RTL) */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end text-right">
              <div className="text-lg font-black text-slate-800 flex items-baseline gap-1">
                {showBalances ? (
                  <>
                    <span>{formatGram(activeMetalHolding)}</span>
                    <span className="text-xs font-bold text-slate-400">{activeMetalUnit}</span>
                  </>
                ) : (
                  <span className="text-sm leading-none tracking-widest font-black">****</span>
                )}
              </div>
              {/* Show price equivalent under grams */}
              {showBalances ? (
                <div className={`text-xs font-extrabold ${activeMetal === 'gold' ? 'text-amber-600' : 'text-slate-500'} mt-0.5`} dir="rtl">
                  {formatToman(Math.round(activeMetalHolding * activePrice))} تومان
                </div>
              ) : (
                <div className="text-[10px] font-bold text-slate-300 mt-0.5">****</div>
              )}
            </div>

            {/* The eye button right next to the grams */}
            <button 
              onClick={onToggleBalances}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-all focus:outline-none"
              title={showBalances ? "مخفی کردن مبالغ" : "نمایش مبالغ"}
            >
              {showBalances ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Section B: Cash Balance (Below Metal Balance) */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-slate-400 font-extrabold text-[11px]">موجودی کیف پول</span>
          <div className="text-sm font-extrabold text-slate-700 flex items-baseline gap-1">
            {showBalances ? (
              <>
                <span>{formatToman(wallet.cashToman)}</span>
                <span className="text-xs font-bold text-slate-400">تومان</span>
              </>
            ) : (
              <span className="text-xs leading-none tracking-widest font-black">****</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Quick Services 2x4 Grid (Gold) or 1x4 Grid (Silver) */}
      {activeMetal === 'gold' ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-3.5 shadow-sm" id="services-grid-section">
          <h3 className="text-xs font-black text-slate-700 mb-2.5 text-right">دسترسی سریع و خدمات طلانا</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {servicesList.map((srv) => (
              <button
                key={srv.id}
                onClick={() => handleServiceClick(srv.id)}
                className="bg-slate-50 border border-slate-100/60 hover:border-amber-200/80 hover:bg-amber-50/10 p-2 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-102 border ${srv.color}`}>
                  {srv.icon}
                </div>
                <span className="text-[9.5px] font-black text-slate-700 leading-tight block mt-0.5">{srv.label}</span>
                <span className="text-[7px] font-bold text-slate-400 tracking-tight leading-none block mt-0.5">{srv.sub}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl p-3.5 shadow-sm" id="silver-services-grid-section">
          <h3 className="text-xs font-black text-slate-700 mb-2.5 text-right">خدمات نقره طلانا</h3>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => handleServiceClick('deposit')}
              className="bg-slate-50 border border-slate-100/60 hover:border-slate-200 hover:bg-slate-100/40 p-2 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600 border border-slate-200/50">
                <Coins className="w-4.5 h-4.5 text-slate-500" />
              </div>
              <span className="text-[9.5px] font-black text-slate-700 leading-tight block mt-1">واریز</span>
            </button>

            <button
              onClick={() => handleServiceClick('withdraw')}
              className="bg-slate-50 border border-slate-100/60 hover:border-slate-200 hover:bg-slate-100/40 p-2 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600 border border-slate-200/50">
                <CircleDollarSign className="w-4.5 h-4.5 text-slate-500" />
              </div>
              <span className="text-[9.5px] font-black text-slate-700 leading-tight block mt-1">برداشت</span>
            </button>

            <button
              onClick={() => handleServiceClick('delivery')}
              className="bg-slate-50 border border-slate-100/60 hover:border-slate-200 hover:bg-slate-100/40 p-2 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600 border border-slate-200/50">
                <Truck className="w-4.5 h-4.5 text-slate-500" />
              </div>
              <span className="text-[9.5px] font-black text-slate-700 leading-tight block mt-1">تحویل نقره</span>
            </button>

            <button
              onClick={() => handleServiceClick('history')}
              className="bg-slate-50 border border-slate-100/60 hover:border-slate-200 hover:bg-slate-100/40 p-2 rounded-2xl flex flex-col items-center justify-center text-center gap-1 transition-all focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600 border border-slate-200/50">
                <History className="w-4.5 h-4.5 text-slate-500" />
              </div>
              <span className="text-[9.5px] font-black text-slate-700 leading-tight block mt-1">تاریخچه</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Banner Slider Section */}
      <BannerSlider />

      {/* 5. Pricing Chart Section (Daily, Weekly, Monthly) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm" id="gold-chart-card">
        <div className="flex items-center justify-between mb-4 flex-row">
          <h3 className="text-xs font-black text-slate-700 flex items-center gap-1 flex-row">
            <span>نمودار قیمت {activeMetal === 'gold' ? 'طلا' : 'نقره'}</span>
          </h3>
          
          {/* Real-time interval percentage change display or hovered price */}
          <div className="text-[10px] font-black text-slate-500">
            {hoveredIndex !== null && activeHistory[hoveredIndex] ? (
              <span className={activeMetal === 'gold' ? 'text-amber-600' : 'text-slate-600'}>
                {toPersianDigits(`${activeHistory[hoveredIndex].date}: ${formatToman(activeHistory[hoveredIndex].price)} تومان`)}
              </span>
            ) : (
              <span className={percentColor}>
                تغییرات {intervalLabel}: {toPersianDigits(`${percentSign}${percentChange.toFixed(2)}٪`)}
              </span>
            )}
          </div>
        </div>

        {/* Interactive SVG Chart */}
        <div className="relative h-36 flex items-center justify-center">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full cursor-crosshair"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clientX = e.clientX - rect.left;
              const chartContentWidth = chartWidth - paddingX * 2;
              const step = chartContentWidth / (activeHistory.length - 1);
              const rawIdx = Math.min(
                activeHistory.length - 1,
                Math.max(0, Math.round((clientX - paddingX) / step))
              );
              const idx = activeHistory.length - 1 - rawIdx;
              setHoveredIndex(idx);
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="metalChartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={activeMetal === 'gold' ? '#ca8a04' : '#64748b'} stopOpacity="0.12" />
                <stop offset="100%" stopColor={activeMetal === 'gold' ? '#ca8a04' : '#64748b'} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#f8fafc" />
            <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#f1f5f9" strokeDasharray="3,3" />
            <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#f1f5f9" />

            {/* Area path */}
            <path d={areaD} fill="url(#metalChartGradient)" />

            {/* Main price path */}
            <path d={pathD} fill="none" stroke={activeMetal === 'gold' ? '#ca8a04' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Hover tooltip guide line & dot */}
            {hoveredIndex !== null && points[hoveredIndex] && (
              <>
                <line
                  x1={points[hoveredIndex].x}
                  y1={paddingY}
                  x2={points[hoveredIndex].x}
                  y2={chartHeight - paddingY}
                  stroke={activeMetal === 'gold' ? '#ca8a04' : '#64748b'}
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <circle
                  cx={points[hoveredIndex].x}
                  cy={points[hoveredIndex].y}
                  r="4.5"
                  fill={activeMetal === 'gold' ? '#ca8a04' : '#64748b'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </>
            )}

            {/* Start & End Price Labels instead of dates */}
            <text
              x={chartWidth - paddingX}
              y={chartHeight - 3}
              textAnchor="end"
              dir="ltr"
              className="fill-slate-400 font-bold text-[9.5px] [direction:ltr]"
            >
              {toPersianDigits(formatToman(activeHistory[0].price))}
            </text>
            <text
              x={paddingX}
              y={chartHeight - 3}
              textAnchor="start"
              dir="ltr"
              className={`font-black text-[9.5px] [direction:ltr] ${activeMetal === 'gold' ? 'fill-amber-600' : 'fill-slate-600'}`}
            >
              {toPersianDigits(formatToman(activeHistory[activeHistory.length - 1].price))}
            </text>
          </svg>
        </div>

        {/* Time range switcher brought below the chart (borderless style) */}
        <div className="flex bg-slate-50/80 p-1 rounded-xl text-[10px] font-extrabold flex-row justify-center max-w-[220px] mx-auto mt-2">
          <button
            onClick={() => setSelectedInterval('daily')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${selectedInterval === 'daily' ? `${activeMetal === 'gold' ? 'bg-amber-600' : 'bg-slate-600'} text-white font-extrabold shadow-xs` : 'text-slate-400 hover:text-slate-700'}`}
          >
            روزانه
          </button>
          <button
            onClick={() => setSelectedInterval('weekly')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${selectedInterval === 'weekly' ? `${activeMetal === 'gold' ? 'bg-amber-600' : 'bg-slate-600'} text-white font-extrabold shadow-xs` : 'text-slate-400 hover:text-slate-700'}`}
          >
            هفتگی
          </button>
          <button
            onClick={() => setSelectedInterval('monthly')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${selectedInterval === 'monthly' ? `${activeMetal === 'gold' ? 'bg-amber-600' : 'bg-slate-600'} text-white font-extrabold shadow-xs` : 'text-slate-400 hover:text-slate-700'}`}
          >
            ماهانه
          </button>
        </div>
      </div>

      {/* 6. Compact Vitrine Section at the bottom */}
      <div className="space-y-3" id="home-compact-vitrine">
        <div className="flex justify-between items-center flex-row">
          <h3 className="text-xs font-black text-slate-700">ویترین</h3>
          <button 
            onClick={() => onNavigateToTab('vitrine', null)}
            className={`text-[10px] ${activeMetal === 'gold' ? 'text-amber-600 hover:text-amber-700' : 'text-slate-600 hover:text-slate-700'} font-extrabold flex items-center gap-0.5 focus:outline-none`}
          >
            مشاهده ویترین کامل <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.filter(cat => activeMetal === 'gold' || cat.id !== 'secondhand').slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigateToTab('vitrine', cat.id)}
              className={`bg-white border border-slate-100 ${activeMetal === 'gold' ? 'hover:border-amber-200/80 hover:bg-amber-50/10' : 'hover:border-slate-300 hover:bg-slate-50'} p-2 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none group shadow-xs`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeMetal === 'gold' ? 'bg-amber-500/5 border border-amber-500/10 text-amber-600 group-hover:bg-amber-500/15 group-hover:text-amber-700' : 'bg-slate-500/5 border border-slate-500/10 text-slate-600 group-hover:bg-slate-500/15 group-hover:text-slate-700'} transition-all duration-200 group-hover:scale-103`}>
                <CategoryIcon id={cat.id} className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black text-slate-700 leading-tight block mt-0.5">{toPersianDigits(cat.name)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 7. Vault Modal Bottom Sheet */}
      <AnimatePresence>
        {showVaultModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 bg-black/60 backdrop-blur-xs">
            {/* Backdrop Closer */}
            <div className="fixed inset-0" onClick={() => setShowVaultModal(false)} />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white border-t border-slate-100 rounded-t-[32px] w-full max-w-md p-6 text-right shadow-2xl relative z-10 space-y-5"
              id="vault-bottom-sheet"
            >
              {/* Header inside Bottom Sheet with Eye toggle on the right */}
              <div className="flex justify-between items-center border-b border-slate-50 pb-3 flex-row-reverse">
                <h4 className="text-sm font-black text-slate-800">
                  {activeMetal === 'gold' ? 'موجودی صندوق طلای ۱۸ عیار' : 'موجودی صندوق نقره ۹۹۹'}
                </h4>
                {/* Eye toggle on the right side of bottom sheet header as requested */}
                <button 
                  onClick={onToggleBalances}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 focus:outline-none flex items-center justify-center"
                  title="مخفی‌سازی مبالغ"
                >
                  {showBalances ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Two fields: موجودی کل & طلای قابل برداشت */}
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center flex-row-reverse shadow-xs">
                  <span className="text-[11px] text-slate-500 font-extrabold">موجودی کل در صندوق</span>
                  <div className="font-black text-slate-800 text-sm flex items-baseline gap-1 flex-row-reverse">
                    {showBalances ? (
                      <>
                        <span>{formatGram(activeTotalMetal)}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{activeMetalUnit}</span>
                      </>
                    ) : (
                      <span>****</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center flex-row-reverse shadow-xs">
                  <span className="text-[11px] text-slate-500 font-extrabold">قابل برداشت / معامله</span>
                  <div className={`font-black ${activeMetal === 'gold' ? 'text-amber-600' : 'text-slate-600'} text-sm flex items-baseline gap-1 flex-row-reverse`}>
                    {showBalances ? (
                      <>
                        <span>{formatGram(activeWithdrawableMetal)}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{activeMetalUnit}</span>
                      </>
                    ) : (
                      <span>****</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Green "Got it" Button at bottom */}
              <button
                onClick={() => setShowVaultModal(false)}
                className="w-full py-3.5 rounded-2xl text-white font-black text-xs bg-gradient-to-r from-emerald-600 to-teal-500 hover:shadow-lg hover:shadow-emerald-100 transition-all focus:outline-none"
                id="btn-close-vault-modal"
              >
                متوجه شدم
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Quick Services Simulation Modal */}
      <AnimatePresence>
        {activeServiceSim && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                <Sparkles className="w-6 h-6 text-amber-500" />
              </div>

              <h4 className="text-sm font-black text-slate-800">
                {servicesList.find(s => s.id === activeServiceSim)?.label} طلانا
              </h4>

              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                این خدمت هوشمند شامل شرایط استثنایی و سرعت پردازش لحظه‌ای در سامانه‌ی طلانا است. در بروزرسانی‌های بعدی، فرم‌های درخواست و جزئیات مالی در دسترس شما قرار می‌گیرند.
              </p>

              <button
                onClick={() => setActiveServiceSim(null)}
                className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 py-3 rounded-2xl text-xs font-black transition-colors focus:outline-none"
              >
                متوجه شدم
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
});

export default HomeDashboard;
