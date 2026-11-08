import React, { useState } from 'react';
import { formatToman, toPersianDigits } from '../utils';
import { Hammer, ArrowRight, Check, Upload, Info } from 'lucide-react';
import { transactions } from '../api';

interface Props {
  wallet: any;
  activeMetal: 'gold' | 'silver';
  goldPrice18k: number;
  silverPrice999: number;
  onBack: () => void;
  onToast: (msg: string) => void;
}

export default function ServiceZargar({ wallet, activeMetal, goldPrice18k, silverPrice999, onBack, onToast }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    category: '',
    weight: '',
    design: '',
    font: 'nastaliq',
    details: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const isGold = activeMetal === 'gold';
  const accent = isGold ? 'amber' : 'slate';
  const activePrice = isGold ? goldPrice18k : silverPrice999;

  const categories = [
    { id: 'plaque', label: 'پلاک اسم', icon: '🏷️' },
    { id: 'necklace', label: 'گردنبند اختصاصی', icon: '📿' },
    { id: 'bracelet', label: 'دستبند سفارشی', icon: '✨' },
    { id: 'ring', label: 'انگشتر اختصاصی', icon: '💍' },
    { id: 'earring', label: 'گوشواره سفارشی', icon: '💎' },
    { id: 'other', label: 'سایر طرح‌ها', icon: '🎨' },
  ];

  const fonts = [
    { id: 'nastaliq', label: 'نستعلیق' },
    { id: 'naskh', label: 'نسخ' },
    { id: 'latin', label: 'لاتین' },
    { id: 'sols', label: 'ثلث' },
  ];

  const weight = parseFloat(form.weight) || 0;
  const rawValue = Math.round(weight * activePrice);
  const wageValue = Math.round(rawValue * 0.25);
  const profitValue = Math.round((rawValue + wageValue) * 0.07);
  // TODO: This entire estimate is client-side with hardcoded rates. The backend
  // /prices/calculate endpoint is authoritative. Refactor to fetch the estimate
  // from the server so wage, profit, and VAT rate are not duplicated here.
  // The statutory VAT rate for tax year 1405 is 10% (was 9% for 1400-1404).
  const taxValue = Math.round((wageValue + profitValue) * 0.10);
  const estimatedTotal = rawValue + wageValue + profitValue + taxValue;

  const handleSubmit = async () => {
    if (!form.category || !form.weight || !form.design) {
      onToast('لطفاً همه فیلدهای ضروری را تکمیل کنید.');
      return;
    }
    if (estimatedTotal > wallet.cash_toman) {
      onToast('موجودی کیف پول برای این سفارش کافی نیست.');
      return;
    }

    try {
      await transactions.create({
        type: 'buy_product',
        title: `طراحی سفارشی زرگر — ${form.design}`,
        amount_toman: estimatedTotal,
        weight_grams: weight,
        metal: activeMetal,
        details: `سفارش زرگری: ${categories.find(c => c.id === form.category)?.label} | طرح: ${form.design} | فونت: ${fonts.find(f => f.id === form.font)?.label} | توضیحات: ${form.details || 'ندارد'}`,
      });
      setSubmitted(true);
      onToast('سفارش طرح زرگر با موفقیت ثبت شد.');
    } catch (err: any) {
      onToast(err.message || 'خطا در ثبت سفارش');
    }
  };

  if (submitted) return (
    <div className="space-y-6 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 p-1"><ArrowRight className="w-5 h-5" /></button>
        <span className="text-sm font-black text-slate-800">طرح زرگر</span><div className="w-6 h-6" />
      </div>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto"><Check className="w-8 h-8" /></div>
        <h3 className="text-sm font-black text-slate-800">سفارش زرگری ثبت شد</h3>
        <p className="text-[11px] text-slate-500">کارشناسان ما ظرف ۲۴ ساعت با شما تماس گرفته و طرح نهایی را تأیید می‌کنند. زمان ساخت ۳ تا ۷ روز کاری.</p>
        <button onClick={onBack} className="px-8 py-3 rounded-2xl bg-purple-600 text-white text-xs font-black">بازگشت</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 p-1"><ArrowRight className="w-5 h-5" /></button>
        <span className="text-sm font-black text-slate-800">طرح زرگر</span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold ${step === 1 ? 'text-purple-600' : 'text-slate-300'}`}>۱</span>
          <span className="text-slate-300">/</span>
          <span className={`text-[10px] font-bold ${step === 2 ? 'text-purple-600' : 'text-slate-300'}`}>۲</span>
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-[11px] text-slate-600 leading-relaxed">
        <div className="flex items-center gap-2 mb-1"><Hammer className="w-4 h-4 text-purple-600" /><span className="font-extrabold text-purple-700">سفارش آنلاین نزد زرگر</span></div>
        <p>طرح دلخواه خود را به صورت آنلاین سفارش دهید. زرگران ماهر طلانا طرح شما را با بهترین کیفیت می‌سازند. اجرت ساخت ۲۵٪ + سود ۷٪ + مالیات ۹٪.</p>
      </div>

      {/* Step 1: Choose category & weight */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-slate-700 block mb-2">نوع مصنوع {isGold ? 'طلا' : 'نقره'}:</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map(c => (
                <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))}
                  className={`p-3 rounded-2xl border text-center transition-all ${form.category === c.id ? 'border-purple-300 bg-purple-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                  <span className="text-xl block">{c.icon}</span>
                  <span className="text-[10px] font-black text-slate-700 mt-1 block">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-slate-700 block mb-2">وزن تقریبی (گرم):</label>
            <input type="text" value={form.weight} onChange={e => {
              const v = e.target.value.replace(/[^0-9۰-۹.]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
              setForm(f => ({ ...f, weight: v }));
            }}
              placeholder={`مثلاً ۳.۵ گرم ${isGold ? 'طلا' : 'نقره'}`} dir="ltr"
              className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-purple-500 shadow-sm font-mono" />
          </div>
          <button onClick={() => { if (form.category && form.weight) setStep(2); else onToast('نوع مصنوع و وزن را انتخاب کنید.'); }}
            className="w-full py-3.5 rounded-2xl bg-purple-600 text-white text-sm font-black shadow-md">ادامه ←</button>
        </div>
      )}

      {/* Step 2: Design details & submit */}
      {step === 2 && (
        <div className="space-y-4">
          <button onClick={() => setStep(1)} className="text-[10px] text-purple-600 font-black">← بازگشت به انتخاب طرح</button>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-2">طرح یا اسم مورد نظر:</label>
            <input type="text" required value={form.design}
              onChange={e => setForm(f => ({ ...f, design: e.target.value }))}
              placeholder="مثلاً: علی، مهسا، LOVE، طرح اسلیمی..."
              className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-right focus:outline-none focus:border-purple-500 shadow-sm" />
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-2">فونت و تایپوگرافی:</label>
            <div className="grid grid-cols-4 gap-2">
              {fonts.map(f => (
                <button key={f.id} onClick={() => setForm(fa => ({ ...fa, font: f.id }))}
                  className={`py-2.5 rounded-xl text-[10px] font-black transition-all ${form.font === f.id ? 'bg-purple-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{f.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-2">توضیحات تکمیلی (اختیاری):</label>
            <textarea value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
              placeholder="توضیح طرح، ابعاد، رنگ، نگین‌های خاص..."
              rows={3} className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-right focus:outline-none focus:border-purple-500 shadow-sm" />
          </div>

          {/* Price estimate */}
          {weight > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2 shadow-sm">
              <h5 className="text-[11px] font-black text-slate-700">برآورد هزینه (تومان)</h5>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between"><span className="text-slate-400">ارزش {isGold ? 'طلای' : 'نقره'} خام ({form.weight} گرم):</span><span className="font-extrabold">{formatToman(rawValue)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">اجرت ساخت (۲۵٪):</span><span className="font-extrabold">{formatToman(wageValue)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">سود زرگر (۷٪):</span><span className="font-extrabold">{formatToman(profitValue)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">مالیات (۹٪):</span><span className="font-extrabold">{formatToman(taxValue)}</span></div>
                <div className="flex justify-between border-t border-slate-100 pt-2"><span className="font-black text-slate-800">جمع تقریبی:</span><span className="font-black text-purple-600">{formatToman(estimatedTotal)}</span></div>
              </div>
              <div className="bg-amber-50 rounded-xl p-2.5 text-[10px] text-amber-700 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>قیمت نهایی پس از تأیید کارشناس و بر اساس وزن دقیق محاسبه می‌شود. موجودی شما: <b>{formatToman(wallet.cash_toman)} تومان</b></span>
              </div>
            </div>
          )}

          <button onClick={handleSubmit}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-black shadow-md flex items-center justify-center gap-2">
            <Hammer className="w-5 h-5" /> ثبت سفارش زرگری ({estimatedTotal > 0 ? formatToman(estimatedTotal) : '---'} تومان)
          </button>
        </div>
      )}
    </div>
  );
}
