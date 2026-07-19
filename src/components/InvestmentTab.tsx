import React, { useState, useEffect } from 'react';
import { UserWallet, Transaction } from '../types';
import { TrendingUp, RefreshCw, Info, Check, AlertCircle, ArrowDownLeft, ArrowUpRight, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPersianDigits, formatToman, formatGram } from '../utils';

interface InvestmentTabProps {
  wallet: UserWallet;
  goldPrice18k: number;
  silverPrice999: number;
  priceTrend: 'up' | 'down' | 'stable';
  activeMetal: 'gold' | 'silver';
  onTransaction: (tx: Transaction) => void;
}

export default function InvestmentTab({ 
  wallet, 
  goldPrice18k, 
  silverPrice999, 
  priceTrend, 
  activeMetal, 
  onTransaction 
}: InvestmentTabProps) {
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  
  // Trade Inputs
  const [gramsInput, setGramsInput] = useState<string>('');
  const [tomanInput, setTomanInput] = useState<string>('');
  
  // Success/Error Feedback Modal
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activePrice = activeMetal === 'gold' ? goldPrice18k : silverPrice999;
  const activeMetalLabel = activeMetal === 'gold' ? 'طلای ۱۸ عیار' : 'نقره ۹۹۹';
  const activeMetalUnit = 'گرم';

  const inputFocus = activeMetal === 'gold'
    ? 'focus:border-amber-600 focus:ring-amber-600'
    : 'focus:border-slate-600 focus:ring-slate-600';
  const accentColor = activeMetal === 'gold' ? 'text-amber-600' : 'text-slate-600';
  const presetHover = activeMetal === 'gold'
    ? '${presetHover}'
    : 'hover:border-slate-200 hover:bg-slate-50/20';

  // Specific user wallet holdings in metals
  const silverWalletHolding = 42.500;
  const activeMetalHolding = activeMetal === 'gold' ? wallet.goldGrams : silverWalletHolding;

  // Sync inputs
  const handleGramsChange = (val: string) => {
    const rawVal = val.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    setGramsInput(rawVal);
    if (!rawVal || isNaN(Number(rawVal))) {
      setTomanInput('');
      return;
    }
    const calculated = Math.round(Number(rawVal) * activePrice);
    setTomanInput(calculated.toString());
  };

  const handleTomanChange = (val: string) => {
    const rawVal = val.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    setTomanInput(rawVal);
    if (!rawVal || isNaN(Number(rawVal))) {
      setGramsInput('');
      return;
    }
    const calculated = Number(rawVal) / activePrice;
    setGramsInput(calculated.toFixed(4));
  };

  // Set preset buttons
  const setPresetGrams = (grams: number) => {
    handleGramsChange(grams.toString());
  };

  const setPresetToman = (toman: number) => {
    handleTomanChange(toman.toString());
  };

  // Reset inputs when active metal changes
  useEffect(() => {
    setGramsInput('');
    setTomanInput('');
  }, [activeMetal]);

  // Execute trade
  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const grams = Number(gramsInput);
    const toman = Number(tomanInput);

    if (!grams || grams <= 0 || !toman || toman <= 0) {
      setStatusMessage({ type: 'error', text: 'لطفاً مقدار معتبری وارد کنید.' });
      return;
    }

    const currentFormattedDate = toPersianDigits(
      new Date().toLocaleDateString('fa-IR') + ' ' + 
      new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    );

    if (tradeType === 'buy') {
      if (toman > wallet.cashToman) {
        setStatusMessage({ 
          type: 'error', 
          text: `موجودی ریالی شما کافی نیست. حداکثر امکان خرید: ${formatGram(wallet.cashToman / activePrice)} گرم` 
        });
        return;
      }

      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        type: 'buy_gold',
        title: `خرید ${activeMetalLabel} سرمایه‌گذاری`,
        date: currentFormattedDate,
        amountToman: toman,
        weightGrams: grams,
        status: 'completed',
        details: `خرید ${activeMetalLabel} آب‌شده از صرافی سریع طلانا به نرخ هر گرم ${formatToman(activePrice)} تومان`
      };
      onTransaction(newTx);
      setStatusMessage({ type: 'success', text: `با موفقیت ${formatGram(grams)} گرم ${activeMetalLabel} خریداری شد!` });
      setGramsInput('');
      setTomanInput('');

    } else {
      if (grams > activeMetalHolding) {
        setStatusMessage({ 
          type: 'error', 
          text: `موجودی ${activeMetalLabel} شما کافی نیست. حداکثر مقدار برای فروش: ${formatGram(activeMetalHolding)} گرم` 
        });
        return;
      }

      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        type: 'sell_gold',
        title: `فروش ${activeMetalLabel} سرمایه‌گذاری`,
        date: currentFormattedDate,
        amountToman: toman,
        weightGrams: grams,
        status: 'completed',
        details: `فروش ${activeMetalLabel} آب‌شده به صرافی سریع طلانا به نرخ هر گرم ${formatToman(activePrice)} تومان`
      };
      onTransaction(newTx);
      setStatusMessage({ type: 'success', text: `با موفقیت ${formatGram(grams)} گرم ${activeMetalLabel} فروخته شد!` });
      setGramsInput('');
      setTomanInput('');
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto px-4 py-4 text-slate-800 pb-2 text-right" dir="rtl" id="investment-view">
      
      {/* Trading Form Cards (Gold and Silver) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm" id="gold-trade-card">
        {/* Toggle buy/sell without emojis */}
        <div className="flex bg-slate-50 p-1 rounded-xl mb-5 relative" dir="rtl">
          <button
            onClick={() => { setTradeType('buy'); setGramsInput(''); setTomanInput(''); }}
            className={`flex-1 py-2.5 rounded-lg text-center text-xs font-black transition-all flex items-center justify-center gap-1.5 focus:outline-none ${
              tradeType === 'buy' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>خرید {activeMetal === 'gold' ? 'طلا' : 'نقره'}</span>
          </button>
          <button
            onClick={() => { setTradeType('sell'); setGramsInput(''); setTomanInput(''); }}
            className={`flex-1 py-2.5 rounded-lg text-center text-xs font-black transition-all flex items-center justify-center gap-1.5 focus:outline-none ${
              tradeType === 'sell' 
                ? 'bg-rose-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>فروش {activeMetal === 'gold' ? 'طلا' : 'نقره'}</span>
          </button>
        </div>

        <form onSubmit={handleExecuteTrade} className="space-y-4">
          
          {/* Wealth limits indicators */}
          <div className="flex justify-between items-center text-[10px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-100/80 flex-row font-bold shadow-xs" dir="rtl">
            {tradeType === 'buy' ? (
              <>
                <span>موجودی کیف پول:</span>
                <span className="font-extrabold text-slate-800">
                  {formatToman(wallet.cashToman)} تومان
                </span>
              </>
            ) : (
              <>
                <span>{activeMetalLabel} قابل معامله:</span>
                <span className="font-extrabold text-slate-800">
                  {formatGram(activeMetalHolding)} {activeMetalUnit}
                </span>
              </>
            )}
          </div>

          {/* Grams Input */}
          <div className="space-y-1.5" dir="rtl">
            <label className="text-xs font-black text-slate-600 block text-right">وزن درخواستی ({activeMetalUnit}):</label>
            <div className="relative">
              <input
                type="text"
                value={gramsInput ? toPersianDigits(gramsInput) : ''}
                onChange={(e) => handleGramsChange(e.target.value)}
                placeholder={toPersianDigits("مثلاً ۰.۵")}
                className={`w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-right font-black text-slate-800 focus:outline-none ${inputFocus} transition-all text-sm`}
                dir="rtl"
                id="input-trade-grams"
              />
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black ${accentColor}`}>گرم</span>
            </div>
          </div>

          {/* Toman Input */}
          <div className="space-y-1.5" dir="rtl">
            <label className="text-xs font-black text-slate-600 block text-right">معادل ارزش فاکتور (تومان):</label>
            <div className="relative">
              <input
                type="text"
                value={tomanInput ? toPersianDigits(tomanInput) : ''}
                onChange={(e) => handleTomanChange(e.target.value)}
                placeholder={toPersianDigits("مثلاً ۵,۰۰۰,۰۰۰")}
                className={`w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-right font-black text-slate-800 focus:outline-none ${inputFocus} transition-all text-sm`}
                dir="rtl"
                id="input-trade-toman"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">تومان</span>
            </div>
          </div>

          {/* Fast Presets */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 block text-right font-black">مقادیر پیشنهادی سریع:</span>
            <div className="grid grid-cols-4 gap-1.5 text-[10px] font-black">
              {tradeType === 'buy' ? (
                <>
                  <button type="button" onClick={() => setPresetToman(1000000)} className={`bg-slate-50 border border-slate-100 text-slate-600 ${presetHover} py-2.5 rounded-xl transition-all focus:outline-none`}>۱ میلیون</button>
                  <button type="button" onClick={() => setPresetToman(5000000)} className={`bg-slate-50 border border-slate-100 text-slate-600 ${presetHover} py-2.5 rounded-xl transition-all focus:outline-none`}>۵ میلیون</button>
                  <button type="button" onClick={() => setPresetGrams(activeMetal === 'gold' ? 0.5 : 5)} className={`bg-slate-50 border border-slate-100 text-slate-600 ${presetHover} py-2.5 rounded-xl transition-all focus:outline-none`}>
                    {activeMetal === 'gold' ? '۰.۵ گرم' : '۵ گرم'}
                  </button>
                  <button type="button" onClick={() => setPresetGrams(activeMetal === 'gold' ? 1 : 10)} className={`bg-slate-50 border border-slate-100 text-slate-600 ${presetHover} py-2.5 rounded-xl transition-all focus:outline-none`}>
                    {activeMetal === 'gold' ? '۱ گرم' : '۱۰ گرم'}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setPresetGrams(activeMetalHolding * 0.25)} className={`bg-slate-50 border border-slate-100 text-slate-600 ${presetHover} py-2.5 rounded-xl transition-all focus:outline-none`}>۲۵٪ موجودی</button>
                  <button type="button" onClick={() => setPresetGrams(activeMetalHolding * 0.50)} className={`bg-slate-50 border border-slate-100 text-slate-600 ${presetHover} py-2.5 rounded-xl transition-all focus:outline-none`}>۵۰٪ موجودی</button>
                  <button type="button" onClick={() => setPresetGrams(activeMetalHolding)} className={`bg-slate-50 border border-slate-100 text-slate-600 ${presetHover} py-2.5 rounded-xl transition-all focus:outline-none`}>کل موجودی</button>
                  <button type="button" onClick={() => setPresetGrams(activeMetal === 'gold' ? 0.1 : 1)} className={`bg-slate-50 border border-slate-100 text-slate-600 ${presetHover} py-2.5 rounded-xl transition-all focus:outline-none`}>
                    {activeMetal === 'gold' ? '۰.۱ گرم' : '۱ گرم'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-3.5 rounded-2xl font-black transition-all shadow-md text-white mt-2 hover:-translate-y-0.5 active:translate-y-0 text-xs focus:outline-none ${
              tradeType === 'buy' 
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:shadow-emerald-100' 
                : 'bg-gradient-to-r from-rose-600 to-orange-500 hover:shadow-rose-100'
            }`}
            id="btn-trade-submit"
          >
            {tradeType === 'buy' ? `تأیید خرید ${activeMetalLabel}` : `تأیید فروش ${activeMetalLabel}`}
          </button>
        </form>
      </div>

      {/* FAQ Info Box */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 text-xs text-slate-500 flex gap-3 text-right shadow-sm">
        <Info className={`w-5 h-5 ${accentColor} flex-shrink-0 mt-0.5`} />
        <div className="space-y-1">
          <p className="font-extrabold text-slate-800">مکانیزم معاملات امن طلانا چگونه است؟</p>
          <p className="leading-relaxed text-[11px] text-slate-500 font-medium">
            تمام خریدهای طلا و نقره به صورت سرمایه‌گذاری بدون کارمزد شمش آب‌شده ۱۸ عیار و ۹۹۹ در صندوق امانات طلانا ثبت می‌گردند. شما هر لحظه می‌توانید دارایی آنلاین خود را به صورت فیزیکی تحویل بگیرید یا در بخش «ویترین» با زیورآلات طلا معاوضه نمایید.
          </p>
        </div>
      </div>

      {/* Transaction Result Modal */}
      <AnimatePresence>
        {statusMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl"
              id="status-modal"
            >
              {statusMessage.type === 'success' ? (
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Check className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <AlertCircle className="w-6 h-6" />
                </div>
              )}
              
              <h4 className={`text-sm font-black mb-2 ${statusMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                {statusMessage.type === 'success' ? 'عملیات موفقیت‌آمیز بود' : 'خطا در عملیات'}
              </h4>
              
              <p className="text-[11px] text-slate-500 leading-relaxed mb-5">
                {statusMessage.text}
              </p>

              <button
                onClick={() => setStatusMessage(null)}
                className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 py-2.5 rounded-xl text-xs font-bold transition-colors focus:outline-none"
                id="btn-status-modal-close"
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
