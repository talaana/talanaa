import React, { useState, useEffect } from 'react';
import { formatToman, toPersianDigits, formatGram } from '../utils';
import { autoOrders } from '../api';
import { ArrowRight, ToggleLeft, ToggleRight, Trash2, Clock } from 'lucide-react';

interface Props { wallet: any; activeMetal: 'gold' | 'silver'; goldPrice18k: number; silverPrice999: number; onBack: () => void; onToast: (msg: string) => void; }

export default function ServiceAutoOrder({ wallet, activeMetal, goldPrice18k, silverPrice999, onBack, onToast }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [grams, setGrams] = useState('');
  const [maxSpend, setMaxSpend] = useState('');
  const [interval, setInterval] = useState('weekly');
  const isGold = activeMetal === 'gold';
  const accent = isGold ? 'amber' : 'slate';
  const intervalLabels: Record<string, string> = { daily: 'روزانه', weekly: 'هفتگی', biweekly: 'دوهفته‌ای', monthly: 'ماهانه' };

  const loadOrders = async () => { try { setOrders(await autoOrders.list()); } catch {} };
  useEffect(() => { loadOrders(); }, []);

  const handleCreate = async () => {
    if (!grams || parseFloat(grams) <= 0) { onToast('مقدار گرم را وارد کنید.'); return; }
    try {
      await autoOrders.create({ metal: activeMetal, grams: parseFloat(grams), max_spend_toman: maxSpend ? parseInt(maxSpend) : undefined, interval });
      onToast('سفارش خودکار با موفقیت ایجاد شد.');
      setGrams(''); setMaxSpend('');
      loadOrders();
    } catch (e: any) { onToast(e.message); }
  };

  const handleToggle = async (id: number) => {
    try { await autoOrders.toggle(id); loadOrders(); } catch {}
  };

  const handleRemove = async (id: number) => {
    try { await autoOrders.remove(id); loadOrders(); onToast('سفارش خودکار حذف شد.'); } catch {}
  };

  return (
    <div className="space-y-5 max-w-md mx-auto lg:max-w-none lg:mx-0 lg:px-6 px-4 py-4 text-right" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 p-1"><ArrowRight className="w-5 h-5" /></button>
        <span className="text-sm font-black text-slate-800">سفارش خودکار</span><div className="w-6 h-6" />
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-[11px] text-slate-600 leading-relaxed">
        با فعال‌سازی خرید خودکار، طلانا به صورت دوره‌ای برای شما {activeMetal === 'gold' ? 'طلا' : 'نقره'} خریداری می‌کند. روشی هوشمند برای پس‌انداز تدریجی.
      </div>

      {/* Active Orders */}
      {orders.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-black text-slate-700">سفارش‌های فعال</h4>
          {orders.map((o: any) => (
            <div key={o.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(o.id)}>{o.is_active ? <ToggleRight className={`w-6 h-6 text-${accent}-600`} /> : <ToggleLeft className="w-6 h-6 text-slate-300" />}</button>
                <button onClick={() => handleRemove(o.id)} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-slate-800">{formatGram(o.grams)} گرم {o.metal === 'gold' ? 'طلا' : 'نقره'}</span>
                <span className="text-[9px] text-slate-400 font-bold block">{intervalLabels[o.interval] || o.interval}</span>
                {o.max_spend_toman && <span className="text-[8px] text-slate-400 block">حداکثر {formatToman(o.max_spend_toman)} تومان</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-black text-slate-700">ایجاد سفارش جدید</h4>
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1.5">مقدار هر خرید (گرم)</label>
          <input type="text" value={grams} onChange={e => {
            const v = e.target.value.replace(/[^0-9۰-۹.]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
            setGrams(v);
          }}
            placeholder="مثلاً ۰.۵" dir="ltr" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-blue-500 font-mono" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1.5">حداکثر مبلغ (اختیاری - تومان)</label>
          <input type="text" value={maxSpend} onChange={e => {
            const v = e.target.value.replace(/[^0-9۰-۹]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
            setMaxSpend(v);
          }}
            placeholder="مثلاً ۱۰,۰۰۰,۰۰۰" dir="ltr" className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-blue-500 font-mono" />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 block mb-1.5">بازه زمانی</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(intervalLabels).map(([k, v]) => (
              <button key={k} onClick={() => setInterval(k)} className={`py-2.5 rounded-xl text-[10px] font-black transition-all ${interval === k ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{v}</button>
            ))}
          </div>
        </div>
        <button onClick={handleCreate} className="w-full py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-black shadow-md">فعال‌سازی خرید خودکار</button>
      </div>
    </div>
  );
}
