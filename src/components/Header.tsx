import React, { useState, useEffect } from 'react';
import { Bell, User, WifiOff, Shield } from 'lucide-react';
import { toPersianDigits, formatToman } from '../utils';

interface HeaderProps {
  userName: string;
  onNavigateToTab: (tabId: string) => void;
  activeMetal: 'gold' | 'silver';
  onMetalChange: (metal: 'gold' | 'silver') => void;
  goldPrice18k: number;
  silverPrice999: number;
  platformName?: string;
  platformLogo?: string;
  isMarketplace?: boolean;
  showAdminButton?: boolean;
  onGoToAdmin?: () => void;
  silverTabColor?: string;
  brandColor?: string;
}

export default function Header({ 
  userName, 
  onNavigateToTab, 
  activeMetal, 
  onMetalChange,
  goldPrice18k,
  silverPrice999,
  platformName = 'طلانا',
  platformLogo = '/talana_logo.png',
  isMarketplace = true,
  showAdminButton = false,
  onGoToAdmin,
  silverTabColor = '#475569',
  brandColor = '#ca8a04',
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
    <header className="sticky top-0 z-50 bg-white px-4 py-3 text-slate-800 transform-gpu shadow-[0_2px_15px_-3px_rgba(0,0,0,0.015)]" id="app-header" role="banner">
      <div className="max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 flex items-center justify-between flex-row">
        
        {/* Visual Right in RTL: Profile icon */}
        <button 
          onClick={() => onNavigateToTab('profile')} 
          className="transition-colors duration-200 focus:outline-none p-1"
          style={{ color: activeMetal === 'gold' ? brandColor : silverTabColor }}
          title="حساب کاربری"
          aria-label="پروفایل کاربری"
          id="btn-header-profile"
        >
          <User className="w-6 h-6" style={{ color: activeMetal === 'gold' ? brandColor : silverTabColor }} aria-hidden="true" />
        </button>

        {/* Visual Center: Brand Logo and Title */}
        <div className="flex items-center gap-2">
          {!isOnline && (
            <WifiOff className="w-4 h-4 animate-pulse" style={{ color: activeMetal === 'gold' ? brandColor : silverTabColor }} title="آفلاین - حالت محلی" aria-label="آفلاین" />
          )}
          <img 
            src={platformLogo} 
            className="w-7 h-7 rounded-md object-cover shadow-xs" 
            alt={`لوگو ${platformName}`} 
            referrerPolicy="no-referrer"
            width="28"
            height="28"
          />
          <span className="text-sm font-black text-slate-800 tracking-tight">{platformName}</span>
        </div>

        {/* Visual Left in RTL: Admin + Notifications */}
        <div className="flex items-center gap-1">
          {showAdminButton && onGoToAdmin && (
            <button
              onClick={onGoToAdmin}
              className="text-slate-500 hover:text-amber-600 transition-colors duration-200 focus:outline-none p-1"
              title="پنل مدیریت"
              aria-label="پنل مدیریت"
            >
              <Shield className="w-5 h-5" aria-hidden="true" />
            </button>
          )}
          <button 
            onClick={() => onNavigateToTab('notifications')} 
            className="text-slate-500 hover:text-slate-700 transition-colors duration-200 relative focus:outline-none p-1"
            id="btn-header-bell"
            title="اطلاع‌رسانی"
            aria-label="اعلان‌ها"
          >
            <Bell className="w-6 h-6 text-slate-500" aria-hidden="true" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" aria-hidden="true"></span>
          </button>
        </div>

      </div>

      {/* Segmented Metal Switcher Tab (طلا و نقره) */}
      <div className="max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 mt-2">
        <div className="bg-slate-100/60 p-1 rounded-xl border border-slate-100/10 flex w-full gap-1" id="metal-switcher" role="group" aria-label="انتخاب فلز">
          {/* Gold Button: first (right in RTL) */}
          <button
            onClick={() => onMetalChange('gold')}
            aria-pressed={activeMetal === 'gold'}
            className={`flex-1 py-1.5 text-sm font-black rounded-lg transition-all flex items-center justify-center gap-1.5 focus:outline-none ${
              activeMetal === 'gold'
                ? 'text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            style={activeMetal === 'gold' ? { background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` } : undefined}
          >
            <img src="/assets/gold.png" alt="طلا" className={`w-8 h-8 object-contain ${activeMetal === 'gold' ? 'brightness-0 invert' : ''}`} />
            <span>طلا</span>
          </button>

          {/* Silver Button: second (left in RTL) */}
          <button
            onClick={() => onMetalChange('silver')}
            aria-pressed={activeMetal === 'silver'}
            className={`flex-1 py-1.5 text-sm font-black rounded-lg transition-all flex items-center justify-center gap-1.5 focus:outline-none ${
              activeMetal === 'silver'
                ? 'text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
            style={activeMetal === 'silver' ? { background: `linear-gradient(135deg, ${silverTabColor}, ${silverTabColor}dd)` } : undefined}
          >
            <img src="/assets/silver.png" alt="نقره" className="w-8 h-8 object-contain" />
            <span>نقره</span>
          </button>
        </div>
      </div>

      {/* Real-time price display under the switcher */}
      <div className="max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 flex items-center justify-between mt-2 px-4 py-2.5 rounded-xl border text-xs font-bold"
        style={{
          backgroundColor: activeMetal === 'gold' ? `${brandColor}10` : `${silverTabColor}10`,
          borderColor: activeMetal === 'gold' ? `${brandColor}20` : `${silverTabColor}20`,
          color: activeMetal === 'gold' ? brandColor : silverTabColor,
        }} id="header-live-price">
        <div className="flex items-center gap-2 flex-row">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: activeMetal === 'gold' ? brandColor : silverTabColor }}></span>
          </span>
          <span className="font-black">نرخ لحظه‌ای {activeMetal === 'gold' ? 'طلا' : 'نقره'}:</span>
        </div>
        <div className="flex items-baseline gap-1.5 flex-row">
          <span className="text-sm font-black">{formatToman(activePrice)}</span>
          <span className="text-[11px] font-bold" style={{ color: activeMetal === 'gold' ? brandColor : silverTabColor }}>تومان / گرم</span>
        </div>
      </div>

    </header>
  );
}
