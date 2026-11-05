import React, { useState, useEffect } from 'react';
import { UserWallet } from '../types';
import {
  User, Plus, X, CreditCard, Activity, ShieldCheck, Lock,
  Fingerprint, MapPin, FileText, CircleQuestionMark, LogOut,
  ChevronLeft, Check, Copy, Trash2, Loader2, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatToman, toPersianDigits } from '../utils';
import { auth, bankAccounts, branches } from '../api';

interface ProfileTabProps {
  wallet: UserWallet;
  userName: string;
  userPhone: string;
  onUpdateName: (name: string) => void;
  onUpdateWallet: (wallet: UserWallet) => void;
  onResetData: () => void;
  goldPrice18k: number;
  activeMetal: 'gold' | 'silver';
  onBack: () => void;
}

type Page = null | 'invite' | 'accounts' | 'limits' | 'account-settings' | 'security' | 'branches' | 'licenses' | 'rules' | 'support';

export default function ProfileTab({
  wallet, userName, userPhone, onUpdateName, onUpdateWallet, onResetData,
  goldPrice18k, activeMetal, onBack,
}: ProfileTabProps) {
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [activePage, setActivePage] = useState<Page>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Bank accounts
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [addCardForm, setAddCardForm] = useState({ card_number: '', bank_name: '', owner_name: '', is_default: false });

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError] = useState('');

  // Branches
  const [branchList, setBranchList] = useState<any[]>([]);

  const isGold = activeMetal === 'gold';
  const referralCode = 'TLNA001';

  useEffect(() => {
    if (activePage === 'accounts') loadAccounts();
    if (activePage === 'branches') loadBranches();
  }, [activePage]);

  const loadAccounts = async () => { setAccountsLoading(true); try { setAccounts(await bankAccounts.list()); } catch {} setAccountsLoading(false); };
  const loadBranches = async () => { try { setBranchList(await branches.list()); } catch {} };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bankAccounts.create(addCardForm);
      setToast('کارت بانکی با موفقیت اضافه شد.');
      setAddCardForm({ card_number: '', bank_name: '', owner_name: '', is_default: false });
      loadAccounts();
    } catch (err: any) { setToast(err.message || 'خطا'); }
  };

  const handleRemoveCard = async (id: number) => {
    try { await bankAccounts.remove(id); loadAccounts(); setToast('کارت حذف شد.'); } catch { setToast('خطا'); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError('');
    if (pwForm.newPw !== pwForm.confirm) { setPwError('رمز جدید با تکرار آن مطابقت ندارد.'); return; }
    if (pwForm.newPw.length < 6) { setPwError('رمز جدید حداقل ۶ کاراکتر باشد.'); return; }
    try {
      await auth.updatePassword(pwForm.current, pwForm.newPw);
      setToast('رمز عبور با موفقیت تغییر کرد.');
      setActivePage(null);
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err: any) { setPwError(err.message || 'خطا در تغییر رمز'); }
  };

  const handleSaveName = (e: React.FormEvent) => { e.preventDefault(); onUpdateName(tempName); setEditMode(false); setToast('نام ذخیره شد.'); };
  const handleCopyReferral = () => { navigator.clipboard?.writeText(referralCode); setToast('کد دعوت کپی شد.'); };
  const handleLogout = () => onResetData();
  const formatCard = (num: string) => num.replace(/(\d{4})/g, '$1 ').trim();
  const goBack = () => { setActivePage(null); setPwError(''); };

  // Page header component
  const PageHeader = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between mb-6">
      <button onClick={goBack} className="text-slate-500 hover:text-slate-800 transition-colors focus:outline-none p-1" title="بازگشت">
        <ArrowRight className="w-5 h-5" />
      </button>
      <span className="text-sm font-black text-slate-800">{title}</span>
      <div className="w-6 h-6" />
    </div>
  );

  // ===== SUB-PAGES =====

  if (activePage === 'invite') return (
    <div className="space-y-5 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <PageHeader title="دعوت از دوستان" />
      <div className={`w-14 h-14 rounded-full ${isGold ? 'bg-amber-100' : 'bg-slate-100'} flex items-center justify-center mx-auto`}>
        <Plus className={`w-7 h-7 ${isGold ? 'text-amber-600' : 'text-slate-600'}`} />
      </div>
      <p className="text-[11px] text-slate-500 text-center leading-relaxed">
        با دعوت دوستان خود به طلانا، پس از اولین معامله آن‌ها، مبلغ <span className="font-extrabold text-amber-600">۵۰,۰۰۰ تومان</span> اعتبار طلا به کیف پول هر دو نفر هدیه داده می‌شود.
      </p>
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-center">
        <span className="text-[10px] text-slate-400 font-bold">کد دعوت اختصاصی شما:</span>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xl font-black text-slate-800 tracking-widest font-mono" dir="ltr">{referralCode}</span>
          <button onClick={handleCopyReferral} className={`p-2 rounded-xl ${isGold ? 'bg-amber-600 text-white' : 'bg-slate-600 text-white'} hover:opacity-90`}>
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[{ label: 'دعوت‌های موفق', val: '۰', color: 'text-amber-600' }, { label: 'معاملات دوستان', val: '۰', color: 'text-amber-600' }, { label: 'هدیه دریافتی', val: '۰ تومان', color: 'text-emerald-600' }].map((s, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className={`text-lg font-black ${s.color}`}>{toPersianDigits(s.val)}</div>
            <div className="text-[9px] text-slate-400 font-bold mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (activePage === 'accounts') return (
    <div className="space-y-4 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <PageHeader title="حساب‌های بانکی و کارت‌های شتاب" />
      {accountsLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : accounts.length === 0 ? (
        <p className="text-[11px] text-slate-400 text-center py-8">هیچ کارت بانکی ثبت نشده است.</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((a: any) => (
            <div key={a.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <button onClick={() => handleRemoveCard(a.id)} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 className="w-4 h-4" /></button>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {a.is_default && <span className="bg-amber-100 text-amber-700 text-[8px] px-1.5 py-0.5 rounded-md font-extrabold">پیش‌فرض</span>}
                  <span className="text-xs font-black text-slate-800">{a.bank_name}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block" dir="ltr">{formatCard(a.card_number)}</span>
                <span className="text-[9px] text-slate-400 font-bold mt-0.5 block">{toPersianDigits(a.owner_name)}</span>
              </div>
              <CreditCard className={`w-8 h-8 ${isGold ? 'text-amber-500' : 'text-slate-500'}`} />
            </div>
          ))}
        </div>
      )}
      <form onSubmit={handleAddCard} className="space-y-3 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
        <h5 className="text-xs font-black text-slate-700">افزودن کارت جدید</h5>
        <input type="text" required maxLength={16} value={addCardForm.card_number} onChange={e => setAddCardForm(f => ({ ...f, card_number: e.target.value }))}
          placeholder="شماره ۱۶ رقمی کارت" dir="ltr"
          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs text-slate-800 text-left focus:outline-none focus:border-amber-600 font-mono" />
        <input type="text" required value={addCardForm.bank_name} onChange={e => setAddCardForm(f => ({ ...f, bank_name: e.target.value }))}
          placeholder="نام بانک (مثلاً بانک ملی)" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs text-slate-800 text-right focus:outline-none focus:border-amber-600" />
        <input type="text" required value={addCardForm.owner_name} onChange={e => setAddCardForm(f => ({ ...f, owner_name: e.target.value }))}
          placeholder="نام صاحب کارت" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs text-slate-800 text-right focus:outline-none focus:border-amber-600" />
        <label className="flex items-center gap-2 text-[10px] text-slate-500 font-bold cursor-pointer">
          <input type="checkbox" checked={addCardForm.is_default} onChange={e => setAddCardForm(f => ({ ...f, is_default: e.target.checked }))} className="accent-amber-600" /> کارت پیش‌فرض
        </label>
        <button type="submit" className={`w-full py-2.5 rounded-xl text-white text-xs font-black ${isGold ? 'bg-amber-600' : 'bg-slate-600'}`}>ثبت کارت بانکی</button>
      </form>
    </div>
  );

  if (activePage === 'limits') return (
    <div className="space-y-4 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <PageHeader title="سقف‌های معامله و تراکنش" />
      {[
        { label: 'سقف خرید روزانه (ریالی)', value: '۵۰,۰۰۰,۰۰۰ تومان', icon: '💳' },
        { label: 'سقف فروش روزانه (ریالی)', value: '۱۰۰,۰۰۰,۰۰۰ تومان', icon: '💰' },
        { label: 'حداقل خرید طلای آب‌شده', value: '۰.۱ گرم', icon: '⚖️' },
        { label: 'حداکثر خرید طلای آب‌شده', value: '۵۰ گرم در روز', icon: '📊' },
        { label: 'سقف برداشت نقدی به شبا', value: '۱۰۰,۰۰۰,۰۰۰ تومان', icon: '🏦' },
        { label: 'کارمزد معاملات طلانا', value: '۰٪ (رایگان)', icon: '🎁' },
      ].map((l, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <span className="text-xs font-extrabold text-slate-700">{l.label}</span>
          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5"><span>{l.icon}</span> {toPersianDigits(l.value)}</span>
        </div>
      ))}
    </div>
  );

  if (activePage === 'account-settings') return (
    <div className="space-y-4 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <PageHeader title="تنظیمات اطلاعات حساب" />
      {[
        { label: 'نام و نام خانوادگی', value: userName },
        { label: 'شماره موبایل', value: toPersianDigits(userPhone) },
        { label: 'کد ملی', value: '۰۰۱۲۳۴۵۶۷۸' },
        { label: 'تاریخ عضویت', value: '۱۴۰۲/۰۸/۱۵' },
        { label: 'وضعیت احراز هویت', value: 'تایید شده (سطح ۲)', green: true },
      ].map((f, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex justify-between items-center shadow-sm">
          <span className="text-xs font-extrabold text-slate-700">{f.label}</span>
          <span className={`text-[11px] font-black ${f.green ? 'text-emerald-600' : 'text-slate-800'}`}>{toPersianDigits(f.value)}</span>
        </div>
      ))}
      <p className="text-[10px] text-slate-400 text-center">برای تغییر اطلاعات هویتی با پشتیبانی طلانا تماس بگیرید.</p>
    </div>
  );

  if (activePage === 'security') return (
    <div className="space-y-4 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <PageHeader title="تغییر رمز عبور" />
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="text-[11px] font-black text-slate-600 block mb-1.5">رمز عبور فعلی</label>
          <input type="password" required value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
            placeholder="••••••" dir="ltr" className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-amber-600 shadow-sm" />
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 block mb-1.5">رمز عبور جدید</label>
          <input type="password" required value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
            placeholder="حداقل ۶ کاراکتر" dir="ltr" className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-amber-600 shadow-sm" />
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 block mb-1.5">تکرار رمز عبور جدید</label>
          <input type="password" required value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
            placeholder="••••••" dir="ltr" className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-amber-600 shadow-sm" />
        </div>
        {pwError && <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-3 rounded-xl">{pwError}</p>}
        <button type="submit" className={`w-full py-3.5 rounded-2xl text-white text-sm font-black shadow-md ${isGold ? 'bg-amber-600' : 'bg-slate-600'}`}>ذخیره رمز عبور جدید</button>
      </form>
      <div className="bg-white border border-slate-100 rounded-2xl p-4 mt-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div><span className="text-xs font-black text-slate-700">ورود دو مرحله‌ای</span><p className="text-[9px] text-slate-400 mt-0.5">کد تایید پیامکی برای ورود</p></div>
          <div className="w-10 h-5.5 rounded-full p-0.5 bg-slate-200" dir="ltr"><div className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" /></div>
        </div>
      </div>
    </div>
  );

  if (activePage === 'branches') return (
    <div className="space-y-4 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <PageHeader title="شعب و مراکز تحویل حضوری" />
      {branchList.length === 0 ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : branchList.map((b: any) => (
        <div key={b.id} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black text-slate-800">{toPersianDigits(b.name)}</span>
            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">{toPersianDigits(b.city)}</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">{toPersianDigits(b.address)}</p>
          <div className="flex items-center gap-4 text-[10px] text-slate-600 font-bold flex-wrap">
            <span>📞 {toPersianDigits(b.phone)}</span>
            <span>🕐 {toPersianDigits(b.working_hours)}</span>
          </div>
        </div>
      ))}
    </div>
  );

  if (activePage === 'licenses') return (
    <div className="space-y-4 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <PageHeader title="مجوزها و تضامین حقوقی" />
      {[
        { title: 'نماد اعتماد الکترونیکی (اینماد)', desc: 'دارای نماد اعتماد الکترونیکی ۵ ستاره از وزارت صمت', icon: '🛡️' },
        { title: 'اتحادیه طلا و جواهر', desc: 'عضو رسمی اتحادیه کشوری طلا، جواهر و نقره ایران', icon: '💍' },
        { title: 'مجوز ساماندهی صنف', desc: 'دارای پروانه رسمی کسب از اتحادیه صنف طلافروشان', icon: '📜' },
        { title: 'گواهی SSL / امنیت', desc: 'تمامی ارتباطات با رمزنگاری ۲۵۶-bit و گواهی امنیتی', icon: '🔒' },
        { title: 'بیمه مسئولیت مدنی', desc: 'تحت پوشش بیمه سرقت، مفقودی و خسارت فیزیکی مرسولات', icon: '🏛️' },
      ].map((l, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <span className="text-xl mt-0.5">{l.icon}</span>
          <div><h5 className="text-xs font-black text-slate-800">{l.title}</h5><p className="text-[10px] text-slate-500 mt-1">{l.desc}</p></div>
        </div>
      ))}
    </div>
  );

  if (activePage === 'rules') return (
    <div className="space-y-4 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <PageHeader title="قوانین و مقررات" />
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm text-[11px] text-slate-600 leading-relaxed space-y-3">
        <p>۱. تمامی تراکنش‌ها در سامانه طلانا مطابق با قوانین جمهوری اسلامی ایران و اتحادیه کشوری طلا و جواهر انجام می‌شود.</p>
        <p>۲. قیمت‌گذاری طلا و نقره به صورت لحظه‌ای بر اساس نرخ تابلو بازار آزاد ایران انجام می‌شود و طلانا هیچ کارمزدی بابت خرید و فروش طلای آب‌شده دریافت نمی‌کند.</p>
        <p>۳. خریدار موظف است اطلاعات هویتی خود را به صورت کامل و صحیح ثبت نماید. هرگونه مغایرت باعث توقف تراکنش و مسدودی موقت حساب می‌شود.</p>
        <p>۴. تحویل فیزیکی طلا منوط به احراز هویت کامل و با بیمه رسمی انجام می‌شود. زمان تحویل بین ۲۴ تا ۷۲ ساعت کاری است.</p>
        <p>۵. مبادله طلای آب‌شده با مصنوعات طلا در ویترین به نرخ روز و صرفاً با پرداخت کارمزد ساخت و سود گالری امکان‌پذیر است.</p>
        <p>۶. طلانا مطابق با قوانین مبارزه با پولشویی، موظف به گزارش تراکنش‌های مشکوک به مراجع ذیصلاح می‌باشد.</p>
        <p>۷. در صورت بروز هرگونه اختلاف، مرجع رسیدگی دادگاه‌های عمومی حقوقی تهران و اتحادیه صنف طلا خواهد بود.</p>
      </div>
    </div>
  );

  if (activePage === 'support') return (
    <div className="space-y-4 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <PageHeader title="پشتیبانی طلانا" />
      {[
        { label: 'تلفن پشتیبانی', value: '۰۲۱-۹۱۰۰۱۲۳۴', sub: 'شنبه تا پنجشنبه ۸:۰۰ تا ۲۲:۰۰', icon: '📞' },
        { label: 'واتس‌اپ پشتیبانی', value: '۰۹۱۰۱۲۳۴۵۶۷', sub: 'پاسخگویی ۲۴ ساعته', icon: '💬' },
        { label: 'ایمیل رسمی', value: 'support@talana.ir', sub: 'پاسخ در کمتر از ۴ ساعت کاری', icon: '📧' },
        { label: 'چت آنلاین', value: 'فعال در اپلیکیشن', sub: 'شنبه تا پنجشنبه ۹:۰۰ تا ۱۷:۰۰', icon: '💻' },
      ].map((s, i) => (
        <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><span className="text-lg">{s.icon}</span><span className="text-xs font-black text-slate-800">{toPersianDigits(s.label)}</span></div>
          <span className="text-sm font-extrabold text-amber-600 block mt-1" dir="ltr">{toPersianDigits(s.value)}</span>
          <span className="text-[9px] text-slate-400 font-bold">{toPersianDigits(s.sub)}</span>
        </div>
      ))}
    </div>
  );

  // ===== MAIN LIST VIEW =====

  return (
    <div className="space-y-4 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" id="profile-view" dir="rtl">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-slate-800 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg"
            onAnimationComplete={() => setTimeout(() => setToast(null), 2000)}>{toast}</motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 transition-colors focus:outline-none p-1"><X className="w-5 h-5" /></button>
        <span className="text-sm font-black text-slate-800">پروفایل کاربری طلانا</span>
        <div className="w-6 h-6" />
      </div>

      {/* User Card */}
      <div className={`bg-gradient-to-br ${isGold ? 'from-amber-600 via-amber-500 to-yellow-500' : 'from-slate-600 via-slate-500 to-slate-400'} text-white p-5 rounded-3xl shadow-sm space-y-4`}>
        {editMode ? (
          <form onSubmit={handleSaveName} className="space-y-3">
            <input type="text" value={tempName} onChange={e => setTempName(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-2 px-3 text-right text-xs text-white placeholder-white/50 focus:outline-none focus:border-white" />
            <div className="flex gap-2 justify-start">
              <button type="submit" className="bg-white text-amber-900 px-4 py-1.5 rounded-lg text-[10px] font-black shadow-sm">ذخیره نام</button>
              <button type="button" onClick={() => setEditMode(false)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[10px] font-black">لغو</button>
            </div>
          </form>
        ) : (
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center"><User className="w-6 h-6 text-yellow-100" /></div>
              <div className="flex flex-col text-right">
                <span className="text-sm font-black tracking-tight">{toPersianDigits(userName) || 'کاربر طلانا'}</span>
                <span dir="ltr" className="text-[10px] text-yellow-100 font-extrabold mt-0.5">{toPersianDigits(userPhone.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3'))}</span>
              </div>
            </div>
            <button onClick={() => { setTempName(userName); setEditMode(true); }} className="text-[10px] bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-xl text-white font-extrabold transition-all">ویرایش</button>
          </div>
        )}
        <div className="pt-3 border-t border-white/20 flex justify-between items-center text-[10px]">
          <span className="font-extrabold text-amber-50">سطح احراز هویت صمت</span>
          <span className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-emerald-100 font-black">تایید شده و فعال</span>
        </div>
      </div>

      {/* Referral */}
      <div onClick={() => setActivePage('invite')}
        className={`${isGold ? 'bg-amber-500/5 hover:bg-amber-500/10 border border-amber-200/50' : 'bg-slate-500/5 hover:bg-slate-500/10 border border-slate-200/50'} p-4 rounded-3xl flex items-center justify-between cursor-pointer transition-all`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl ${isGold ? 'bg-amber-600' : 'bg-slate-600'} text-white flex items-center justify-center shadow-xs`}><Plus className="w-5 h-5 text-white" /></div>
          <div className="flex flex-col text-right">
            <span className={`text-xs font-black ${isGold ? 'text-amber-900' : 'text-slate-800'}`}>دعوت از دوستان و هدیه طلایی</span>
            <span className={`text-[9.5px] ${isGold ? 'text-amber-700' : 'text-slate-600'} font-extrabold mt-0.5`}>دریافت طلا به محض ثبت‌نام دوستان شما</span>
          </div>
        </div>
        <ChevronLeft className={`w-4 h-4 ${isGold ? 'text-amber-600' : 'text-slate-600'}`} />
      </div>

      {/* Finance + Settings — 2-col on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Finance */}
      <div className="bg-white border border-slate-100 rounded-3xl p-1 shadow-sm overflow-hidden">
        <div onClick={() => setActivePage('accounts')} className="p-3.5 hover:bg-slate-50 border-b border-slate-50 flex items-center justify-between cursor-pointer transition-all">
          <div className="flex items-center gap-3.5"><CreditCard className="w-4.5 h-4.5 text-slate-500" /><span className="text-xs font-black text-slate-700">حساب‌های بانکی و کارت‌های شتاب</span></div>
          <div className="flex items-center gap-2"><span className="text-[9px] text-slate-400 font-black">{toPersianDigits('۲ کارت متصل')}</span><ChevronLeft className="w-4 h-4 text-slate-400" /></div>
        </div>
        <div onClick={() => setActivePage('limits')} className="p-3.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-all">
          <div className="flex items-center gap-3.5"><Activity className="w-4.5 h-4.5 text-slate-500" /><span className="text-xs font-black text-slate-700">سقف‌های معامله و تراکنش روزانه</span></div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white border border-slate-100 rounded-3xl p-1 shadow-sm overflow-hidden">
        <div onClick={() => setActivePage('account-settings')} className="p-3.5 hover:bg-slate-50 border-b border-slate-50 flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3.5"><ShieldCheck className="w-4.5 h-4.5 text-slate-500" /><span className="text-xs font-black text-slate-700">تنظیمات اطلاعات حساب کاربری</span></div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </div>
        <div onClick={() => setActivePage('security')} className="p-3.5 hover:bg-slate-50 border-b border-slate-50 flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3.5"><Lock className="w-4.5 h-4.5 text-slate-500" /><span className="text-xs font-black text-slate-700">رمز عبور و امنیت ورود دو مرحله‌ای</span></div>
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </div>
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Fingerprint className="w-4.5 h-4.5 text-slate-500" />
            <div className="flex flex-col text-right"><span className="text-xs font-black text-slate-700">ورود سریع با اثر انگشت</span><span className="text-[8px] text-slate-400 font-extrabold mt-0.5">فعالسازی بیومتریک برای موبایل</span></div>
          </div>
          <button onClick={() => setFingerprintEnabled(!fingerprintEnabled)}
            className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-250 focus:outline-none ${fingerprintEnabled ? (isGold ? 'bg-amber-600' : 'bg-slate-600') : 'bg-slate-200'}`} dir="ltr">
            <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-xs transition-transform duration-250 ${fingerprintEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
      </div>

      {/* General */}
      <div className="bg-white border border-slate-100 rounded-3xl p-1 shadow-sm overflow-hidden">
        {[
          { id: 'branches' as Page, icon: <MapPin className="w-4.5 h-4.5 text-slate-500" />, label: 'شعبه‌ها و مراکز تحویل حضوری طلانا' },
          { id: 'licenses' as Page, icon: <ShieldCheck className="w-4.5 h-4.5 text-slate-500" />, label: 'مجوزها، استانداردها و تضامین حقوقی' },
          { id: 'rules' as Page, icon: <FileText className="w-4.5 h-4.5 text-slate-500" />, label: 'قوانین، مقررات و حقوق مشتریان طلانا' },
          { id: 'support' as Page, icon: <CircleQuestionMark className="w-4.5 h-4.5 text-slate-500" />, label: 'پشتیبانی آنلاین و شماره تماس‌های فوری' },
        ].map((item, i, arr) => (
          <div key={item.id} onClick={() => setActivePage(item.id)}
            className={`p-3.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-all ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}>
            <div className="flex items-center gap-3.5">{item.icon}<span className="text-xs font-black text-slate-700">{item.label}</span></div>
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </div>
        ))}
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full bg-rose-50 border border-rose-100/60 hover:bg-rose-100/30 text-rose-600 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all focus:outline-none shadow-xs mt-3">
        <LogOut className="w-4 h-4 text-rose-500" /><span>خروج از حساب کاربری</span>
      </button>
    </div>
  );
}
