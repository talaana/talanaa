import React, { useState } from 'react';
import { UserWallet } from '../types';
import { 
  User, 
  Plus, 
  RotateCcw, 
  X, 
  CreditCard, 
  Activity, 
  ShieldCheck, 
  Lock, 
  Fingerprint, 
  MapPin, 
  FileText, 
  HelpCircle, 
  LogOut,
  ChevronLeft,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatToman, toPersianDigits } from '../utils';

interface ProfileTabProps {
  wallet: UserWallet;
  userName: string;
  onUpdateName: (name: string) => void;
  onUpdateWallet: (wallet: UserWallet) => void;
  onResetData: () => void;
  goldPrice18k: number;
  activeMetal: 'gold' | 'silver';
  onBack: () => void;
}

export default function ProfileTab({ 
  wallet, 
  userName, 
  onUpdateName, 
  onUpdateWallet, 
  onResetData, 
  goldPrice18k,
  activeMetal,
  onBack 
}: ProfileTabProps) {
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [showSimModal, setShowSimModal] = useState<string | null>(null);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateName(tempName);
    setEditMode(false);
  };

  const isGold = activeMetal === 'gold';

  return (
    <div className="space-y-4 max-w-md mx-auto px-4 py-4 text-right" id="profile-view" dir="rtl">
      
      {/* 1. Header with 'X' button on the RIGHT side of the screen */}
      <div className="flex items-center justify-between pb-3 mb-2">
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 transition-colors focus:outline-none p-1"
          title="بستن و بازگشت"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-sm font-black text-slate-800">پروفایل کاربری طلانا</span>
        <div className="w-6 h-6"></div> {/* Spacer for symmetry on the left */}
      </div>

      {/* 2. User Info in a theme-colored box (Standard RTL flow) */}
      <div className={`bg-gradient-to-br ${isGold ? 'from-amber-600 via-amber-500 to-yellow-500' : 'from-slate-600 via-slate-500 to-slate-400'} text-white p-5 rounded-3xl shadow-sm space-y-4`} id="profile-user-card">
        {editMode ? (
          <form onSubmit={handleSaveName} className="space-y-3">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-2 px-3 text-right text-xs text-white placeholder-white/50 focus:outline-none focus:border-white"
              placeholder="نام کاربری..."
            />
            <div className="flex gap-2 justify-start">
              <button 
                type="submit"
                className="bg-white text-amber-900 px-4 py-1.5 rounded-lg text-[10px] font-black shadow-sm"
              >
                ذخیره نام
              </button>
              <button 
                type="button" 
                onClick={() => setEditMode(false)}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[10px] font-black"
              >
                لغو
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xs">
                <User className="w-6 h-6 text-yellow-100" />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-sm font-black tracking-tight">{toPersianDigits(userName) || 'کاربر طلانا'}</span>
                <span className="text-[10px] text-yellow-100 font-extrabold mt-0.5">{toPersianDigits('۰۹۱۲ ۳۴۵ ۶۷۸۹')}</span>
              </div>
            </div>
            <button 
              onClick={() => { setTempName(userName); setEditMode(true); }}
              className="text-[10px] bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-xl text-white font-extrabold transition-all"
            >
              ویرایش
            </button>
          </div>
        )}

        <div className="pt-3 border-t border-white/20 flex justify-between items-center text-[10px]">
          <span className={`font-extrabold ${isGold ? 'text-amber-50' : 'text-slate-200'}`}>سطح احراز هویت صمت</span>
          <span className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-emerald-100 font-black">
            تایید شده و فعال
          </span>
        </div>
      </div>

      {/* 3. Referral Section: "Invite Friends" */}
      <div 
        onClick={() => setShowSimModal('invite')}
        className={`${isGold ? 'bg-amber-500/5 hover:bg-amber-500/10 border border-amber-200/50' : 'bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200/50'} p-4 rounded-3xl flex items-center justify-between cursor-pointer transition-all`}
        id="profile-referral-card"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${isGold ? 'bg-amber-600' : 'bg-slate-600'} text-white flex items-center justify-center shadow-xs`}>
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col text-right">
            <span className={`text-xs font-black ${isGold ? 'text-amber-900' : 'text-slate-800'}`}>دعوت از دوستان و هدیه طلایی</span>
            <span className={`text-[9.5px] ${isGold ? 'text-amber-700' : 'text-slate-600'} font-extrabold mt-0.5`}>دریافت طلا به محض ثبت‌نام دوستان شما</span>
          </div>
        </div>
        <ChevronLeft className={`w-4 h-4 ${isGold ? 'text-amber-600' : 'text-slate-600'}`} />
      </div>

      {/* 4. Finance Section: Clickable bordered group */}
      <div className="bg-white border border-slate-100 rounded-3xl p-1 shadow-sm overflow-hidden" id="profile-finance-section">
        <div 
          onClick={() => setShowSimModal('accounts')}
          className="p-3.5 hover:bg-slate-50 border-b border-slate-50 flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3.5">
            <CreditCard className="w-4.5 h-4.5 text-slate-500" />
            <span className="text-xs font-black text-slate-700">حساب‌های بانکی و کارت‌های شتاب</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-400 font-black">{toPersianDigits('۲ کارت متصل')}</span>
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        <div 
          onClick={() => setShowSimModal('limits')}
          className="p-3.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3.5">
            <Activity className="w-4.5 h-4.5 text-slate-500" />
            <span className="text-xs font-black text-slate-700">سقف‌های معامله و تراکنش روزانه</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* 5. Settings Section: Clickable bordered group */}
      <div className="bg-white border border-slate-100 rounded-3xl p-1 shadow-sm overflow-hidden" id="profile-settings-section">
        <div 
          onClick={() => setShowSimModal('account-settings')}
          className="p-3.5 hover:bg-slate-50 border-b border-slate-50 flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3.5">
            <ShieldCheck className="w-4.5 h-4.5 text-slate-500" />
            <span className="text-xs font-black text-slate-700">تنظیمات اطلاعات حساب کاربری</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </div>

        <div 
          onClick={() => setShowSimModal('security')}
          className="p-3.5 hover:bg-slate-50 border-b border-slate-50 flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3.5">
            <Lock className="w-4.5 h-4.5 text-slate-500" />
            <span className="text-xs font-black text-slate-700">رمز عبور و امنیت ورود دو مرحله‌ای</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </div>

        {/* Fingerprint Toggle (default false) */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Fingerprint className="w-4.5 h-4.5 text-slate-500" />
            <div className="flex flex-col text-right">
              <span className="text-xs font-black text-slate-700">ورود سریع با اثر انگشت</span>
              <span className="text-[8px] text-slate-400 font-extrabold mt-0.5">فعالسازی بیومتریک برای موبایل</span>
            </div>
          </div>
          
          {/* Custom iOS style switch */}
          <button 
            onClick={() => setFingerprintEnabled(!fingerprintEnabled)}
            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-250 focus:outline-none ${fingerprintEnabled ? (isGold ? 'bg-amber-600' : 'bg-slate-600') : 'bg-slate-200'}`}
            dir="ltr"
          >
            <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform duration-250 ${fingerprintEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* 6. General Information Section */}
      <div className="bg-white border border-slate-100 rounded-3xl p-1 shadow-sm overflow-hidden" id="profile-general-section">
        <div 
          onClick={() => setShowSimModal('branches')}
          className="p-3.5 hover:bg-slate-50 border-b border-slate-50 flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3.5">
            <MapPin className="w-4.5 h-4.5 text-slate-500" />
            <span className="text-xs font-black text-slate-700">شعبه‌ها و مراکز تحویل حضوری طلانا</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </div>

        <div 
          onClick={() => setShowSimModal('licenses')}
          className="p-3.5 hover:bg-slate-50 border-b border-slate-50 flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3.5">
            <ShieldCheck className="w-4.5 h-4.5 text-slate-500" />
            <span className="text-xs font-black text-slate-700">مجوزها، استانداردها و تضامین حقوقی</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </div>

        <div 
          onClick={() => setShowSimModal('rules')}
          className="p-3.5 hover:bg-slate-50 border-b border-slate-50 flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3.5">
            <FileText className="w-4.5 h-4.5 text-slate-500" />
            <span className="text-xs font-black text-slate-700">قوانین، مقررات و حقوق مشتریان طلانا</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </div>

        <div 
          onClick={() => setShowSimModal('support')}
          className="p-3.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-all"
        >
          <div className="flex items-center gap-3.5">
            <HelpCircle className="w-4.5 h-4.5 text-slate-500" />
            <span className="text-xs font-black text-slate-700">پشتیبانی آنلاین و شماره تماس‌های فوری</span>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* 7. Reset Simulation Data */}
      <div className="text-center pt-1.5">
        <button
          onClick={() => {
            if (confirm('آیا مایل به بازنشانی اطلاعات دمو به حالت اولیه هستید؟')) {
              onResetData();
            }
          }}
          className="inline-flex items-center gap-1.5 text-[9px] text-slate-400 hover:text-slate-500 font-bold transition-colors"
          id="btn-reset-data"
        >
          <RotateCcw className="w-3 h-3" />
          <span>پاکسازی حافظه دمو طلانا</span>
        </button>
      </div>

      {/* 8. Logout Button (Alert Color: Rose Red) */}
      <button 
        onClick={() => {
          if (confirm('آیا می‌خواهید از حساب کاربری خود خارج شوید؟')) {
            alert('خروج آزمایشی با موفقیت انجام شد!');
          }
        }}
        className="w-full bg-rose-50 border border-rose-100/60 hover:bg-rose-100/30 text-rose-600 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all focus:outline-none shadow-xs mt-3"
        id="btn-logout"
      >
        <LogOut className="w-4 h-4 text-rose-500" />
        <span>خروج از حساب کاربری</span>
      </button>

      {/* Interactive Simulation Drawer / Popups */}
      <AnimatePresence>
        {showSimModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" dir="rtl">
            <div className="fixed inset-0 animate-fade-in" onClick={() => setShowSimModal(null)}></div>
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 max-w-xs w-full text-right relative z-10 shadow-2xl space-y-4"
              id="profile-sim-modal"
            >
              <div className={`w-11 h-11 rounded-full ${isGold ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'} flex items-center justify-center mx-auto shadow-xs`}>
                <ShieldCheck className={`w-5 h-5 ${isGold ? 'text-amber-500' : 'text-slate-500'}`} />
              </div>

              <h4 className="text-xs font-black text-slate-800 text-center">
                {showSimModal === 'invite' && 'طرح دعوت از دوستان طلایی'}
                {showSimModal === 'accounts' && 'حساب‌ها و کارت‌های بانکی'}
                {showSimModal === 'limits' && 'سقف‌های مالی و تراکنش'}
                {showSimModal === 'account-settings' && 'تنظیمات حساب کاربری'}
                {showSimModal === 'security' && 'امنیت حساب کاربری'}
                {showSimModal === 'branches' && 'شعب فیزیکی طلانا'}
                {showSimModal === 'licenses' && 'مجوزها و تضامین قانونی'}
                {showSimModal === 'rules' && 'قوانین و مقررات طلانا'}
                {showSimModal === 'support' && 'پشتیبانی فوری طلانا'}
              </h4>

              <div className="text-[11px] text-slate-500 leading-relaxed font-medium space-y-2">
                {showSimModal === 'invite' && (
                  <p>کد دعوت اختصاصی شما آماده است. با اشتراک‌گذاری این کد با دوستان خود، پس از ثبت‌نام و اولین معامله، هدیه نقدی معادل {toPersianDigits('۵۰,۰۰۰')} تومان طلا به کیف پول هر دو نفر واریز خواهد شد.</p>
                )}
                {showSimModal === 'accounts' && (
                  <p>تعداد {toPersianDigits('۲')} کارت شتابی تایید شده به نام شما موجود است. برای افزودن کارت یا شبای جدید نیاز به تطبیق کد ملی با نام کارت می‌باشد.</p>
                )}
                {showSimModal === 'limits' && (
                  <p>سقف خرید روزانه ریالی با درگاه پرداخت بانکی {toPersianDigits('۵۰,۰۰۰,۰۰۰')} تومان و سقف تسویه نقدی به حساب شبا معادل {toPersianDigits('۱۰۰,۰۰۰,۰۰۰')} تومان روزانه می‌باشد.</p>
                )}
                {showSimModal === 'account-settings' && (
                  <p>اطلاعات کاربری ثبت شده طبق اطلاعات ثبت‌احوال صمت بوده و در صورت نیاز به هرگونه تغییر در مشخصات هویتی با پشتیبانی طلانا تماس بگیرید.</p>
                )}
                {showSimModal === 'security' && (
                  <p>حساب کاربری شما مجهز به احراز هویت دو مرحله‌ای پیامکی است. هر ورود جدید نیاز به رمز موقت تایید خواهد داشت.</p>
                )}
                {showSimModal === 'branches' && (
                  <p>طلانا دارای دو شعبه اصلی تحویل حضوری طلا و نقره در تهران (ساختمان صنف طلا) و اصفهان (کارگاه ساخت زرین) با هماهنگی قبلی می‌باشد.</p>
                )}
                {showSimModal === 'licenses' && (
                  <p>طلانا تحت نظارت مستقیم اتحادیه کشوری طلا، جواهر و نقره بوده و دارای نماد اعتماد الکترونیکی ۵ ستاره و مجوز کشوری ساماندهی صنف می‌باشد.</p>
                )}
                {showSimModal === 'rules' && (
                  <p>تمام تراکنش‌ها منطبق بر قوانین صنف طلا و پولشویی کشور بوده و قیمت‌گذاری‌ها به صورت زنده بر اساس نرخ بازار آزاد طلا اعمال می‌گردد.</p>
                )}
                {showSimModal === 'support' && (
                  <p>پشتیبانی ۲۴ ساعته تلفنی طلانا با شماره {toPersianDigits('۰۲۱-۹۱۰۰۱۲۳۴')} و پشتیبانی چت زنده از شنبه تا پنج‌شنبه در خدمت شماست.</p>
                )}
              </div>

              <button
                onClick={() => setShowSimModal(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-black transition-colors focus:outline-none"
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
