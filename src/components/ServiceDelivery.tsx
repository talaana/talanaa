import React, { useState } from 'react';
import { formatGram, toPersianDigits } from '../utils';
import { deliveryRequests } from '../api';
import { ArrowRight, Check, Truck, ShieldCheck } from 'lucide-react';

interface Props { wallet: any; activeMetal: 'gold' | 'silver'; onBack: () => void; onToast: (msg: string) => void; }

export default function ServiceDelivery({ wallet, activeMetal, onBack, onToast }: Props) {
  const [form, setForm] = useState({ grams: '', name: '', address: '', phone: '', postal: '', insurance: true });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const isGold = activeMetal === 'gold';
  const metalField = activeMetal === 'gold' ? 'gold_grams' : 'silver_grams';
  const available = wallet[metalField] || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const g = parseFloat(form.grams);
    if (!g || g <= 0) { setError('مقدار گرم را وارد کنید.'); return; }
    if (g > available) { setError(`موجودی ${activeMetal === 'gold' ? 'طلا' : 'نقره'} کافی نیست. حداکثر: ${formatGram(available)} گرم`); return; }
    if (!form.name || !form.address || !form.phone || !form.postal) { setError('تمام فیلدها را تکمیل کنید.'); return; }
    try {
      await deliveryRequests.create({
        metal: activeMetal, grams: g, recipient_name: form.name,
        address: form.address, phone: form.phone, postal_code: form.postal, insurance: form.insurance,
      });
      setSubmitted(true);
      onToast('درخواست تحویل با موفقیت ثبت شد.');
    } catch (err: any) { setError(err.message); }
  };

  if (submitted) return (
    <div className="space-y-6 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 p-1"><ArrowRight className="w-5 h-5" /></button>
        <span className="text-sm font-black text-slate-800">تحویل {isGold ? 'طلا' : 'نقره'}</span><div className="w-6 h-6" />
      </div>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto"><Check className="w-8 h-8" /></div>
        <h3 className="text-sm font-black text-slate-800">درخواست تحویل ثبت شد</h3>
        <p className="text-[11px] text-slate-500">مرسوله شما پس از بسته‌بندی بیمه‌شده ارسال و کد رهگیری پیامک خواهد شد.</p>
        <button onClick={onBack} className="px-8 py-3 rounded-2xl bg-teal-600 text-white text-xs font-black">بازگشت</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 p-1"><ArrowRight className="w-5 h-5" /></button>
        <span className="text-sm font-black text-slate-800">تحویل فیزیکی {isGold ? 'طلا' : 'نقره'}</span><div className="w-6 h-6" />
      </div>
      <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 text-[11px] text-slate-600 leading-relaxed">
        <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-teal-600" /><span className="font-extrabold text-teal-700">موجودی قابل تحویل: {formatGram(available)} گرم {isGold ? 'طلا' : 'نقره'}</span></div>
        <p className="mt-2">تحویل فیزیکی با بسته‌بندی امنیتی، بیمه رسمی اتحادیه و پست پیشتاز انجام می‌شود. زمان تحویل ۲۴ تا ۷۲ ساعت کاری.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-black text-slate-600 block mb-1.5">مقدار درخواستی (گرم)</label>
          <input type="text" value={form.grams} onChange={e => {
            const v = e.target.value.replace(/[^0-9۰-۹.]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
            setForm(f=>({...f, grams: v}));
          }}
            placeholder={`حداکثر ${formatGram(available)} گرم`} dir="ltr" className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-teal-500 shadow-sm font-mono" />
        </div>
        <div><input type="text" required value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} placeholder="نام و نام خانوادگی گیرنده" className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-right focus:outline-none focus:border-teal-500 shadow-sm" /></div>
        <div><textarea required value={form.address} onChange={e => setForm(f=>({...f, address: e.target.value}))} placeholder="آدرس کامل پستی" rows={2} className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-right focus:outline-none focus:border-teal-500 shadow-sm" /></div>
        <div className="grid grid-cols-2 gap-3">
          <input type="text" required maxLength={11} value={form.phone} onChange={e => setForm(f=>({...f, phone: e.target.value.replace(/[^0-9]/g, '')}))} placeholder="شماره تماس" dir="ltr" className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-teal-500 shadow-sm font-mono" />
          <input type="text" required maxLength={10} value={form.postal} onChange={e => setForm(f=>({...f, postal: e.target.value.replace(/[^0-9]/g, '')}))} placeholder="کد پستی ۱۰ رقمی" dir="ltr" className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-teal-500 shadow-sm font-mono" />
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
          <input type="checkbox" checked={form.insurance} onChange={e => setForm(f=>({...f, insurance: e.target.checked}))} className="accent-teal-600 w-4 h-4" />
          <ShieldCheck className="w-4 h-4 text-teal-600" /> بیمه رسمی اتحادیه طلا و جواهر (رایگان)
        </label>
        {error && <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-3 rounded-xl">{error}</p>}
        <button type="submit" className="w-full py-3.5 rounded-2xl bg-teal-600 text-white text-sm font-black shadow-md flex items-center justify-center gap-2"><Truck className="w-5 h-5" /> ثبت درخواست تحویل فیزیکی</button>
      </form>
    </div>
  );
}
