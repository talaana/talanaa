import React, { useState, useEffect } from 'react';
import { formatToman, toPersianDigits } from '../utils';
import { installments, products as productsApi } from '../api';
import { ArrowRight } from 'lucide-react';

interface Props { wallet: any; activeMetal: 'gold' | 'silver'; goldPrice18k: number; silverPrice999: number; onBack: () => void; onToast: (msg: string) => void; }

export default function ServiceInstallment({ wallet, activeMetal, goldPrice18k, silverPrice999, onBack, onToast }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [months, setMonths] = useState(6);
  const [downPct, setDownPct] = useState(20);
  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState('');
  const isGold = activeMetal === 'gold';

  useEffect(() => { productsApi.list({ metal: activeMetal }).then(d => setProducts(d.data.slice(0, 10))).catch(()=>{}); }, [activeMetal]);

  const handleCalculate = async () => {
    setError(''); setQuote(null);
    if (!selectedProduct) { setError('محصول را انتخاب کنید.'); return; }
    try {
      setQuote(await installments.calculate({ product_id: selectedProduct, total_months: months, down_payment_percent: downPct }));
    } catch (e: any) { setError(e.message); }
  };

  const handleApply = async () => {
    try {
      await installments.create({ product_id: selectedProduct!, total_months: months, down_payment_percent: downPct });
      onToast('طرح خرید قسطی با موفقیت ثبت شد.');
      onBack();
    } catch (e: any) { setError(e.message); }
  };

  const selectedName = products.find(p => p.id === selectedProduct)?.title || '';

  return (
    <div className="space-y-5 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 p-1"><ArrowRight className="w-5 h-5" /></button>
        <span className="text-sm font-black text-slate-800">خرید قسطی</span><div className="w-6 h-6" />
      </div>
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-[11px] text-slate-600 leading-relaxed">
        محصول مورد نظر خود را انتخاب کنید و با پرداخت <span className="font-extrabold text-emerald-700">۲۰٪ پیش‌پرداخت</span>، الباقی را در اقساط ۳ تا ۲۴ ماهه پرداخت نمایید. سود سالانه ۱.۵٪.
      </div>
      <div>
        <label className="text-[11px] font-black text-slate-600 block mb-2">انتخاب محصول:</label>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {products.map((p: any) => (
            <div key={p.id} onClick={() => setSelectedProduct(p.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all text-right ${selectedProduct === p.id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
              <span className="text-xs font-black text-slate-700">{p.title}</span>
              <span className="text-[10px] text-slate-400 font-bold mr-2">{p.weight} گرم</span>
              {p.seller && <span className="text-[9px] text-slate-400 block mt-0.5">غرفه: {p.seller.name}</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1.5">تعداد اقساط (ماه)</label>
          <select value={months} onChange={e => setMonths(+e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl py-3 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500">
            {[3,6,9,12,18,24].map(m => <option key={m} value={m}>{toPersianDigits(m)} ماه</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1.5">پیش‌پرداخت (٪)</label>
          <select value={downPct} onChange={e => setDownPct(+e.target.value)} className="w-full bg-white border border-slate-100 rounded-xl py-3 px-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-500">
            {[10,20,30,50].map(p => <option key={p} value={p}>{toPersianDigits(p)}٪</option>)}
          </select>
        </div>
      </div>
      <button onClick={handleCalculate} className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white text-sm font-black shadow-md">محاسبه اقساط</button>
      {error && <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-3 rounded-xl">{error}</p>}
      {quote && (
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-700">برنامه اقساط</h4>
          <div className="space-y-2 text-[11px]">
            <div className="flex justify-between"><span className="text-slate-400">مبلغ کل محصول:</span><span className="font-extrabold">{formatToman(quote.full_price_toman)} تومان</span></div>
            <div className="flex justify-between"><span className="text-slate-400">مبلغ کل با سود:</span><span className="font-extrabold">{formatToman(quote.total_with_interest)} تومان</span></div>
            <div className="flex justify-between"><span className="text-slate-400">پیش‌پرداخت:</span><span className="font-extrabold text-rose-600">{formatToman(quote.down_payment_toman)} تومان</span></div>
            <div className="flex justify-between"><span className="text-slate-400">قسط ماهانه:</span><span className="font-extrabold text-emerald-600">{formatToman(quote.monthly_payment_toman)} تومان × {toPersianDigits(months)} ماه</span></div>
          </div>
          <button onClick={handleApply} className="w-full py-3 rounded-2xl bg-emerald-600 text-white text-xs font-black shadow-md">ثبت درخواست خرید قسطی</button>
        </div>
      )}
    </div>
  );
}
