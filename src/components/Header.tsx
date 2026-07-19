import React, { useState, useEffect } from 'react';
import { Bell, User, WifiOff } from 'lucide-react';
import { toPersianDigits, formatToman } from '../utils';

interface HeaderProps {
  userName: string;
  onNavigateToTab: (tabId: string) => void;
  activeMetal: 'gold' | 'silver';
  onMetalChange: (metal: 'gold' | 'silver') => void;
  goldPrice18k: number;
  silverPrice999: number;
}

export default function Header({ 
  userName, 
  onNavigateToTab, 
  activeMetal, 
  onMetalChange,
  goldPrice18k,
  silverPrice999
}: HeaderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const activePrice = activeMetal === 'gold' ? goldPrice18k : silverPrice999;
  const iconColor = activeMetal === 'gold' ? 'text-amber-600' : 'text-slate-600';
  const iconHover = activeMetal === 'gold' ? 'hover:text-amber-700' : 'hover:text-slate-700';

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-4 py-3 text-slate-800 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.015),0_4px_6px_-2px_rgba(0,0,0,0.005)]" id="app-header">
      <div className="max-w-md mx-auto flex items-center justify-between flex-row">
        
        {/* Visual Right in RTL: Profile icon */}
        <button 
          onClick={() => onNavigateToTab('profile')} 
          className={`${iconColor} ${iconHover} transition-colors duration-200 focus:outline-none p-1`}
          title="حساب کاربری"
          id="btn-header-profile"
        >
          <User className={`w-6 h-6 ${iconColor}`} />
        </button>

        {/* Visual Center: Brand Logo and Title */}
        <div className="flex items-center gap-2">
          {!isOnline && (
            <WifiOff className={`w-4 h-4 ${iconColor} animate-pulse`} title="آفلاین - حالت محلی" />
          )}
          <img 
            src="/talana_logo.png" 
            className="w-7 h-7 rounded-md object-contain shadow-xs" 
            alt="لوگو طلانا" 
            referrerPolicy="no-referrer" 
          />
          <span className="text-sm font-black text-slate-800 tracking-tight">طلانا</span>
        </div>

        {/* Visual Left in RTL: Notifications icon */}
        <button 
          onClick={() => onNavigateToTab('notifications')} 
          className="text-slate-500 hover:text-slate-700 transition-colors duration-200 relative focus:outline-none p-1"
          id="btn-header-bell"
          title="اطلاع‌رسانی"
        >
          <Bell className="w-6 h-6 text-slate-500" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
        </button>

      </div>

      {/* Segmented Metal Switcher Tab (طلا و نقره) */}
      <div className="max-w-md mx-auto mt-2">
        <div className="bg-slate-100/60 p-1 rounded-xl border border-slate-100/10 flex w-full gap-1" id="metal-switcher">
          {/* Gold Button: first (right in RTL) */}
          <button
            onClick={() => onMetalChange('gold')}
            className={`flex-1 py-2.5 text-sm font-black rounded-lg transition-all flex items-center justify-center gap-1.5 focus:outline-none ${
              activeMetal === 'gold'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <img src="/assets/gold.png" alt="طلا" className={`w-5 h-5 rounded-full object-contain ${activeMetal === 'gold' ? 'brightness-0 invert' : ''}`} />
            <span>طلا</span>
          </button>

          {/* Silver Button: second (left in RTL) */}
          <button
            onClick={() => onMetalChange('silver')}
            className={`flex-1 py-2.5 text-sm font-black rounded-lg transition-all flex items-center justify-center gap-1.5 focus:outline-none ${
              activeMetal === 'silver'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <img src="/assets/silver.png" alt="نقره" className="w-5 h-5 rounded-full object-contain" />
            <span>نقره</span>
          </button>
        </div>
      </div>

      {/* Real-time price display under the switcher */}
      <div className={`max-w-md mx-auto flex items-center justify-between mt-2 px-4 py-2.5 rounded-xl border text-xs font-bold ${
        activeMetal === 'gold'
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-900'
          : 'bg-slate-500/10 border-slate-500/20 text-slate-900'
      }`} id="header-live-price">
        <div className="flex items-center gap-2 flex-row">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeMetal === 'gold' ? 'bg-amber-400' : 'bg-slate-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${activeMetal === 'gold' ? 'bg-amber-500' : 'bg-slate-500'}`}></span>
          </span>
          <span className="font-black">نرخ لحظه‌ای {activeMetal === 'gold' ? 'طلا' : 'نقره'}:</span>
        </div>
        <div className="flex items-baseline gap-1.5 flex-row">
          <span className="text-sm font-black">{formatToman(activePrice)}</span>
          <span className={`text-[11px] font-bold ${activeMetal === 'gold' ? 'text-amber-700' : 'text-slate-600'}`}>تومان / گرم</span>
        </div>
      </div>

    </header>
  );
}
