import React, { useState } from 'react';
import { formatToman, toPersianDigits } from '../utils';
import { giftCards } from '../api';
import { ArrowRight, Gift, Check } from 'lucide-react';

interface Props { wallet: any; activeMetal: 'gold' | 'silver'; onBack: () => void; onToast: (msg: string) => void; }

export default function ServiceGiftCard({ wallet, activeMetal, onBack, onToast }: Props) {
  const [form, setForm] = useState({ name: '', phone: '', amount: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [cardCode, setCardCode] = useState('');
  const [error, setError] = useState('');
  const isGold = activeMetal === 'gold';
  const accents = ['from-rose-500 to-pink-500', 'from-violet-500 to-purple-500', 'from-amber-500 to-orange-500'];
  const selectedAccent = accents[Math.floor(Math.random() * accents.length)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const amount = parseInt(form.amount);
    if (!amount || amount < 100000) { setError('حداقل مبلغ کارت هدیه ۱۰۰,۰۰۰ تومان است.'); return; }
    if (!form.name || !form.phone) { setError('نام و شماره گیرنده را وارد کنید.'); return; }
    if (amount > wallet.cash_toman) { setError('موجودی کیف پول کافی نیست.'); return; }
    try {
      const r = await giftCards.create({ recipient_name: form.name, recipient_phone: form.phone, amount_toman: amount, message: form.message });
      setCardCode(r.gift_card.code);
      setSubmitted(true);
      onToast('کارت هدیه با موفقیت صادر شد.');
    } catch (err: any) { setError(err.message); }
  };

  if (submitted) return (
    <div className="space-y-6 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 p-1"><ArrowRight className="w-5 h-5" /></button>
        <span className="text-sm font-black text-slate-800">کارت هدیه</span><div className="w-6 h-6" />
      </div>
      <div className="text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto"><Check className="w-8 h-8" /></div>
        <h3 className="text-sm font-black text-slate-800">کارت هدیه صادر شد!</h3>
        <div className={`bg-gradient-to-r ${selectedAccent} text-white rounded-3xl p-6 shadow-lg`}>
          <Gift className="w-10 h-10 mx-auto mb-3 opacity-80" />
          <div className="text-2xl font-black tracking-widest font-mono" dir="ltr">{cardCode}</div>
          <p className="text-[11px] opacity-80 mt-2">مبلغ: {formatToman(parseInt(form.amount))} تومان</p>
          <p className="text-[10px] opacity-70 mt-1">گیرنده: {toPersianDigits(form.name)}</p>
        </div>
        <button onClick={onBack} className="px-8 py-3 rounded-2xl bg-rose-600 text-white text-xs font-black">بازگشت</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 p-1"><ArrowRight className="w-5 h-5" /></button>
        <span className="text-sm font-black text-slate-800">کارت هدیه طلایی</span><div className="w-6 h-6" />
      </div>
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-[11px] text-slate-600 leading-relaxed">
        یک کارت هدیه طلایی برای دوستان و عزیزان خود صادر کنید. معادل ریالی آن از کیف پول شما کسر و به صورت کد اختصاصی در اختیار گیرنده قرار می‌گیرد.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><input type="text" required value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} placeholder="نام گیرنده هدیه" className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-right focus:outline-none focus:border-rose-400 shadow-sm" /></div>
        <div><input type="text" required maxLength={11} value={form.phone} onChange={e => setForm(f=>({...f, phone: e.target.value.replace(/[^0-9]/g, '')}))} placeholder="شماره موبایل گیرنده" dir="ltr" className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-rose-400 shadow-sm font-mono" /></div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1.5">مبلغ هدیه (تومان) — موجودی: {formatToman(wallet.cash_toman)} تومان</label>
          <div className="flex gap-2 flex-wrap mb-2">
            {[500000, 1000000, 2000000, 5000000].map(a => (
              <button key={a} type="button" onClick={() => setForm(f=>({...f, amount: String(a)}))} className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${form.amount === String(a) ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                {formatToman(a)}
              </button>
            ))}
          </div>
          <input type="text" value={form.amount} onChange={e => {
            const v = e.target.value.replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
            setForm(f=>({...f, amount: v}));
          }}
            placeholder="مبلغ دلخواه" dir="ltr" className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-rose-400 shadow-sm font-mono" />
        </div>
        <div><textarea value={form.message} onChange={e => setForm(f=>({...f, message: e.target.value}))} placeholder="پیام تبریک (اختیاری)" rows={2} className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-right focus:outline-none focus:border-rose-400 shadow-sm" /></div>
        {error && <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-3 rounded-xl">{error}</p>}
        <button type="submit" className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-500 text-white text-sm font-black shadow-md flex items-center justify-center gap-2"><Gift className="w-5 h-5" /> صدور کارت هدیه</button>
      </form>
    </div>
  );
}
