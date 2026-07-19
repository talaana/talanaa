import React, { useState } from 'react';
import { 
  CircleDollarSign, 
  CalendarDays, 
  Repeat, 
  Hammer, 
  Truck, 
  History, 
  Gift, 
  Users,
  Sparkles,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BannerSlider from './BannerSlider';

interface ServicesTabProps {
  onNavigateToTab: (tabId: string) => void;
  activeMetal: 'gold' | 'silver';
}

export default function ServicesTab({ onNavigateToTab, activeMetal }: ServicesTabProps) {
  const [activeSim, setActiveSim] = useState<string | null>(null);

  const goldServices = [
    { id: 'loan', label: 'وام آنی', sub: 'بدون ضامن', icon: <CircleDollarSign className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
    { id: 'installment', label: 'خرید قسطی', sub: 'بیمه صنف طلا', icon: <CalendarDays className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'auto', label: 'سفارش خودکار', sub: 'خرید پس‌انداز', icon: <Repeat className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
    { id: 'zargar', label: 'طرح زرگر', sub: 'سفارش آنلاین ملزومات', icon: <Hammer className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600' },
    { id: 'delivery', label: 'تحویل طلا', sub: 'پست بیمه‌شده', icon: <Truck className="w-5 h-5" />, color: 'bg-teal-50 text-teal-600' },
    { id: 'history', label: 'تاریخچه', sub: 'تراکنش‌ها', icon: <History className="w-5 h-5" />, color: 'bg-slate-50 text-slate-600' },
    { id: 'gift', label: 'کارت هدیه', sub: 'طرح شکیل سفارشی', icon: <Gift className="w-5 h-5" />, color: 'bg-rose-50 text-rose-600' },
    { id: 'invite', label: 'دعوت از دوستان', sub: 'کد هدیه طلایی', icon: <Users className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600' },
  ];

  const silverServices = [
    { id: 'deposit', label: 'واریز نقره', sub: 'شارژ صندوق', icon: <Coins className="w-4.5 h-4.5" />, color: 'bg-slate-50 text-slate-600' },
    { id: 'withdraw', label: 'برداشت نقره', sub: 'فروش و تسویه', icon: <CircleDollarSign className="w-4.5 h-4.5" />, color: 'bg-slate-50 text-slate-600' },
    { id: 'delivery', label: 'تحویل نقره', sub: 'شمش فیزیکی ۹۹۹', icon: <Truck className="w-4.5 h-4.5" />, color: 'bg-slate-50 text-slate-600' },
    { id: 'history', label: 'تاریخچه', sub: 'گزارش تراکنش‌ها', icon: <History className="w-4.5 h-4.5" />, color: 'bg-slate-50 text-slate-600' },
  ];

  const activeServices = activeMetal === 'gold' ? goldServices : silverServices;

  const handleServiceClick = (id: string) => {
    if (id === 'history') {
      onNavigateToTab('orders');
    } else if (id === 'invite') {
      onNavigateToTab('profile');
    } else {
      setActiveSim(id);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto px-4 py-2 text-slate-800 pb-2 text-right" id="services-view">
      
      {/* 1. Banners Slider Section on top */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-400 font-extrabold block">طرح‌ها و فرصت‌های فعال</span>
        <BannerSlider />
      </div>

      {/* 2. Quick Services Grid below (Dynamic layout based on metal) */}
      <div className="space-y-2.5">
        <span className="text-[10px] text-slate-400 font-extrabold block">
          {activeMetal === 'gold' ? 'لیست خدمات طلا' : 'لیست خدمات نقره'}
        </span>
        
        {activeMetal === 'gold' ? (
          <div className="grid grid-cols-4 gap-1.5" id="gold-services-grid">
            {goldServices.map((srv) => (
              <button
                key={srv.id}
                onClick={() => handleServiceClick(srv.id)}
                className="bg-white p-2.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-102 ${srv.color}`}>
                  {srv.icon}
                </div>
                <span className="text-[9.5px] font-black text-slate-700 leading-tight block mt-0.5">{srv.label}</span>
                <span className="text-[7px] font-bold text-slate-400 tracking-tight leading-none block mt-0.5">{srv.sub}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5" id="silver-services-grid">
            {silverServices.map((srv) => (
              <button
                key={srv.id}
                onClick={() => handleServiceClick(srv.id)}
                className="bg-white p-2.5 rounded-2xl flex flex-col items-center justify-center text-center gap-1 shadow-xs transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform bg-slate-50 text-slate-600`}>
                  {srv.icon}
                </div>
                <span className="text-[9.5px] font-black text-slate-700 leading-tight block mt-1">{srv.label}</span>
                <span className="text-[7.5px] font-medium text-slate-400 tracking-tight leading-none block mt-0.5">{srv.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Services Simulation Modal */}
      <AnimatePresence>
        {activeSim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                {activeServices.find(s => s.id === activeSim)?.label || 'خدمت'} طلانا
              </h4>

              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                این خدمت هوشمند شامل شرایط استثنایی و سرعت پردازش آنلاین در سامانه‌ی طلانا است. در بروزرسانی‌های بعدی، فرم‌های الکترونیکی و جزئیات بیشتر در اختیار شما قرار خواهند گرفت.
              </p>

              <button
                onClick={() => setActiveSim(null)}
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
}
