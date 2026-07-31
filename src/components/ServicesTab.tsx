import React, { useState } from 'react';
import {
  CircleDollarSign, CalendarDays, Repeat, Hammer, Truck, History, Gift, Users, Sparkles, Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BannerSlider from './BannerSlider';
import ServiceLoan from './ServiceLoan';
import ServiceInstallment from './ServiceInstallment';
import ServiceAutoOrder from './ServiceAutoOrder';
import ServiceDelivery from './ServiceDelivery';
import ServiceGiftCard from './ServiceGiftCard';
import ServiceZargar from './ServiceZargar';

interface ServicesTabProps {
  onNavigateToTab: (tabId: string, categoryFilter?: string | null) => void;
  activeMetal: 'gold' | 'silver';
  wallet: any;
  goldPrice18k: number;
  silverPrice999: number;
  onServicePageToggle: (open: boolean) => void;
  onToast: (msg: string) => void;
}

export default function ServicesTab({ onNavigateToTab, activeMetal, wallet, goldPrice18k, silverPrice999, onServicePageToggle, onToast }: ServicesTabProps) {
  const [servicePage, setServicePage] = useState<string | null>(null);

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
    { id: 'deposit', label: 'واریز', sub: 'شارژ صندوق', icon: <Coins className="w-4.5 h-4.5" />, color: 'bg-slate-50 text-slate-600' },
    { id: 'withdraw', label: 'برداشت', sub: 'فروش و تسویه', icon: <CircleDollarSign className="w-4.5 h-4.5" />, color: 'bg-slate-50 text-slate-600' },
    { id: 'delivery', label: 'تحویل نقره', sub: 'شمش فیزیکی ۹۹۹', icon: <Truck className="w-4.5 h-4.5" />, color: 'bg-slate-50 text-slate-600' },
    { id: 'history', label: 'تاریخچه', sub: 'گزارش تراکنش‌ها', icon: <History className="w-4.5 h-4.5" />, color: 'bg-slate-50 text-slate-600' },
  ];

  const services = activeMetal === 'gold' ? goldServices : silverServices;

  const handleServiceClick = (id: string) => {
    // Navigation shortcuts
    if (id === 'history') { onNavigateToTab('orders'); return; }
    if (id === 'invite') { onNavigateToTab('profile'); return; }
    if (id === 'deposit' || id === 'withdraw') { onNavigateToTab('trade'); return; }
    if (id === 'zargar') { onServicePageToggle(true); setServicePage('zargar'); return; }
    // Service pages
    onServicePageToggle(true);
    setServicePage(id);
  };

  // Render service page full-screen
  if (servicePage === 'zargar') return <ServiceZargar wallet={wallet} activeMetal={activeMetal} goldPrice18k={goldPrice18k} silverPrice999={silverPrice999} onBack={() => { onServicePageToggle(false); setServicePage(null); }} onToast={onToast} />;
  if (servicePage === 'loan') return <ServiceLoan wallet={wallet} activeMetal={activeMetal} goldPrice18k={goldPrice18k} silverPrice999={silverPrice999} onBack={() => { onServicePageToggle(false); setServicePage(null); }} onToast={onToast} />;
  if (servicePage === 'installment') return <ServiceInstallment wallet={wallet} activeMetal={activeMetal} goldPrice18k={goldPrice18k} silverPrice999={silverPrice999} onBack={() => { onServicePageToggle(false); setServicePage(null); }} onToast={onToast} />;
  if (servicePage === 'auto') return <ServiceAutoOrder wallet={wallet} activeMetal={activeMetal} goldPrice18k={goldPrice18k} silverPrice999={silverPrice999} onBack={() => { onServicePageToggle(false); setServicePage(null); }} onToast={onToast} />;
  if (servicePage === 'delivery') return <ServiceDelivery wallet={wallet} activeMetal={activeMetal} onBack={() => { onServicePageToggle(false); setServicePage(null); }} onToast={onToast} />;
  if (servicePage === 'gift') return <ServiceGiftCard wallet={wallet} activeMetal={activeMetal} onBack={() => { onServicePageToggle(false); setServicePage(null); }} onToast={onToast} />;

  return (
    <div className="space-y-4 px-4 py-2 text-slate-800 pb-2 text-right max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6" id="services-view">

      {/* Banners */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-400 font-extrabold block">طرح‌ها و فرصت‌های فعال</span>
        <BannerSlider />
      </div>

      {/* Services Grid */}
      <div className="space-y-2.5">
        <span className="text-[10px] text-slate-400 font-extrabold block">
          {activeMetal === 'gold' ? 'لیست خدمات طلا' : 'لیست خدمات نقره'}
        </span>

        <div className="grid grid-cols-4 lg:grid-cols-8 gap-1.5" id={activeMetal === 'gold' ? 'gold-services-grid' : 'silver-services-grid'}>
          {services.map((srv) => (
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
      </div>
    </div>
  );
}
