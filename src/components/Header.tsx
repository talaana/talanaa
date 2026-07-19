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

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-4 py-2 text-slate-800 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.015),0_4px_6px_-2px_rgba(0,0,0,0.005)]" id="app-header">
      <div className="max-w-md mx-auto flex items-center justify-between flex-row">
        
        {/* Visual Right in RTL: Profile icon (User profile is high-importance) */}
        <button 
          onClick={() => onNavigateToTab('profile')} 
          className="text-amber-600 hover:text-amber-700 transition-colors duration-200 focus:outline-none p-1"
          title="حساب کاربری"
          id="btn-header-profile"
        >
          <User className="w-5 h-5 text-amber-600" />
        </button>

        {/* Visual Center: Brand Logo and Title */}
        <div className="flex items-center gap-1.5">
          {!isOnline && (
            <WifiOff className="w-3.5 h-3.5 text-amber-500 animate-pulse" title="آفلاین - حالت محلی" />
          )}
          <img 
            src="/logo.png" 
            className="w-5.5 h-5.5 rounded-md object-contain shadow-xs" 
            alt="لوگو طلانا" 
            referrerPolicy="no-referrer" 
          />
          <span className="text-xs font-black text-slate-800 tracking-tight">طلانا</span>
        </div>

        {/* Visual Left in RTL: Notifications icon */}
        <button 
          onClick={() => onNavigateToTab('notifications')} 
          className="text-slate-500 hover:text-slate-700 transition-colors duration-200 relative focus:outline-none p-1"
          id="btn-header-bell"
          title="اطلاع‌رسانی"
        >
          <Bell className="w-5 h-5 text-slate-500" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
        </button>

      </div>

      {/* Segmented Metal Switcher Tab (طلا و نقره) - Swapped positions, clean dot indicators */}
      <div className="max-w-md mx-auto mt-1.5">
        <div className="bg-slate-100/60 p-0.5 rounded-xl border border-slate-100/10 flex w-full gap-0.5" id="metal-switcher">
          {/* Gold Button: first (right in RTL) */}
          <button
            onClick={() => onMetalChange('gold')}
            className={`flex-1 py-1 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 focus:outline-none ${
              activeMetal === 'gold'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeMetal === 'gold' ? 'bg-white shadow-xs' : 'bg-amber-500'}`}></span>
            <span>طلا</span>
          </button>

          {/* Silver Button: second (left in RTL) */}
          <button
            onClick={() => onMetalChange('silver')}
            className={`flex-1 py-1 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 focus:outline-none ${
              activeMetal === 'silver'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeMetal === 'silver' ? 'bg-white shadow-xs' : 'bg-slate-400'}`}></span>
            <span>نقره</span>
          </button>
        </div>
      </div>

      {/* Real-time price display under the switcher, styled to match the home page compact price indicator */}
      <div className={`max-w-md mx-auto flex items-center justify-between mt-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold ${
        activeMetal === 'gold'
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-900'
          : 'bg-slate-500/10 border-slate-500/20 text-slate-900'
      }`} id="header-live-price">
        <div className="flex items-center gap-1.5 flex-row">
          <span className="relative flex h-1.5 w-1.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeMetal === 'gold' ? 'bg-amber-400' : 'bg-slate-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${activeMetal === 'gold' ? 'bg-amber-500' : 'bg-slate-500'}`}></span>
          </span>
          <span>نرخ لحظه‌ای و زنده {activeMetal === 'gold' ? 'طلا' : 'نقره'}:</span>
        </div>
        <div className="flex items-baseline gap-1 flex-row">
          <span className="text-xs font-black">{formatToman(activePrice)}</span>
          <span className={`text-[9px] ${activeMetal === 'gold' ? 'text-amber-700' : 'text-slate-600'}`}>تومان / گرم</span>
        </div>
      </div>

    </header>
  );
}
