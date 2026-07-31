import React, { useState } from 'react';
import { formatToman, toPersianDigits } from '../utils';
import { loans } from '../api';
import { ArrowRight, Check, AlertCircle } from 'lucide-react';

interface Props { wallet: any; activeMetal: 'gold' | 'silver'; goldPrice18k: number; silverPrice999: number; onBack: () => void; onToast: (msg: string) => void; }

export default function ServiceLoan({ wallet, activeMetal, goldPrice18k, silverPrice999, onBack, onToast }: Props) {
  const [grams, setGrams] = useState('');
  const [months, setMonths] = useState(1);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const isGold = activeMetal === 'gold';
  const accent = isGold ? 'amber' : 'slate';

  const handleCalculate = async () => {
    setError(''); setQuote(null);
    if (!grams || parseFloat(grams) <= 0) { setError('مقدار وثیقه را وارد کنید.'); return; }
    try {
      const q = await loans.calculate({ collateral_grams: parseFloat(grams), metal: activeMetal, duration_months: months });
      setQuote(q);
    } catch (e: any) { setError(e.message); }
  };

  const handleApply = async () => {
    try {
      const r = await loans.create({ collateral_grams: parseFloat(grams), metal: activeMetal, duration_months: months });
      onToast(`وام ${formatToman(r.loan.loan_amount_toman)} تومان با موفقیت دریافت شد.`);
      setSubmitted(true);
    } catch (e: any) { setError(e.message); }
  };

  if (submitted) return (
    <div className="space-y-6 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 p-1"><ArrowRight className="w-5 h-5" /></button>
        <span className="text-sm font-black text-slate-800">وام آنی</span><div className="w-6 h-6" />
      </div>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><Check className="w-8 h-8" /></div>
        <h3 className="text-sm font-black text-slate-800">درخواست وام با موفقیت ثبت شد</h3>
        <p className="text-[11px] text-slate-500">مبلغ وام به کیف پول ریالی شما اضافه گردید.</p>
        <button onClick={onBack} className={`px-8 py-3 rounded-2xl bg-${accent}-600 text-white text-xs font-black`}>بازگشت</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 p-1"><ArrowRight className="w-5 h-5" /></button>
        <span className="text-sm font-black text-slate-800">وام آنی {isGold ? 'طلا' : 'نقره'}</span><div className="w-6 h-6" />
      </div>
      <div className={`bg-${accent}-50 border border-${accent}-100 rounded-2xl p-4 text-[11px] text-slate-600 leading-relaxed`}>
        با قرار دادن طلای آب‌شده خود به عنوان وثیقه در صندوق طلانا، تا <span className="font-extrabold text-amber-700">۷۰٪</span> ارزش آن را به صورت وام نقدی فوری دریافت کنید. سود ماهانه ۲.۵٪.
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-black text-slate-600 block mb-1.5">میزان وثیقه (گرم {activeMetal === 'gold' ? 'طلا' : 'نقره'})</label>
          <input type="text" value={grams} onChange={e => {
            const v = e.target.value.replace(/[^0-9۰-۹.]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
            setGrams(v);
          }}
            placeholder="مثلاً ۱.۵" className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-amber-600 shadow-sm font-mono" dir="ltr" />
        </div>
        <div>
          <label className="text-[11px] font-black text-slate-600 block mb-1.5">مدت بازپرداخت (ماه)</label>
          <div className="grid grid-cols-4 gap-2">
            {[1,3,6,12].map(m => (
              <button key={m} onClick={() => setMonths(m)} className={`py-2.5 rounded-xl text-xs font-black transition-all ${months === m ? `bg-${accent}-600 text-white` : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{m} ماه</button>
            ))}
          </div>
        </div>
        <button onClick={handleCalculate} className={`w-full py-3.5 rounded-2xl bg-${accent}-600 text-white text-sm font-black shadow-md`}>محاسبه سقف وام</button>
      </div>
      {error && <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-3 rounded-xl">{error}</p>}
      {quote && (
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-700">نتیجه محاسبه وام</h4>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between"><span className="text-slate-400">ارزش وثیقه:</span><span className="font-extrabold">{formatToman(quote.collateral_value_toman)} تومان</span></div>
            <div className="flex justify-between"><span className="text-slate-400">حداکثر وام قابل دریافت:</span><span className="font-extrabold text-emerald-600">{formatToman(quote.max_loan_toman)} تومان</span></div>
            <div className="flex justify-between"><span className="text-slate-400">نرخ سود ماهانه:</span><span className="font-extrabold">{toPersianDigits(quote.monthly_rate_percent)}٪</span></div>
            <div className="flex justify-between"><span className="text-slate-400">قسط ماهانه:</span><span className="font-extrabold">{formatToman(quote.monthly_payment_toman)} تومان</span></div>
          </div>
          <button onClick={handleApply} className={`w-full py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black shadow-md`}>دریافت وام و واریز به کیف پول</button>
        </div>
      )}
    </div>
  );
}
