import React from 'react';
import { Product, UserWallet, Transaction } from '../types';
import { calculateGoldProductPrice, formatToman, formatGram, toPersianDigits } from '../utils';
import { ArrowRight, Sparkles, ShoppingBag, ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductDetailProps {
  product: Product;
  wallet: UserWallet;
  goldPrice18k: number;
  silverPrice999: number;
  activeMetal: 'gold' | 'silver';
  basePrice: number;
  onBack: () => void;
  onTransaction: (tx: Transaction) => void;
}

export default function ProductDetail({ product, wallet, goldPrice18k, silverPrice999, activeMetal, basePrice, onBack, onTransaction }: ProductDetailProps) {

  const handleBuyWithToman = () => {
    const priceDetails = calculateGoldProductPrice(product.weight, basePrice, product.wagePercentage, product.taxPercentage);
    if (wallet.cashToman < priceDetails.finalPrice) {
      alert(`موجودی کیف پول ریالی شما کافی نیست.`);
      return;
    }
    const date = toPersianDigits(new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
    onTransaction({
      id: 'tx-' + Date.now(), type: 'buy_product', title: `خرید ${product.title}`, date,
      amountToman: priceDetails.finalPrice, weightGrams: product.weight, status: 'completed',
      details: `خرید فیزیکی محصول ${activeMetal === 'gold' ? 'طلا' : 'نقره'} از غرفه «${product.sellerName}».`,
      image: product.image
    });
    onBack();
  };

  const handleExchangeWithGold = () => {
    const priceDetails = calculateGoldProductPrice(product.weight, basePrice, product.wagePercentage, product.taxPercentage);
    const wagesAndTaxes = priceDetails.wageVal + priceDetails.profitVal + priceDetails.taxVal;
    if (wallet.goldGrams < product.weight) {
      alert(`موجودی طلای آب‌شده شما کافی نیست.`);
      return;
    }
    if (wallet.cashToman < wagesAndTaxes) {
      alert(`موجودی ریالی شما برای پرداخت اجرت و مالیات کافی نیست.`);
      return;
    }
    const date = toPersianDigits(new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
    onTransaction({
      id: 'tx-' + Date.now(), type: 'buy_product', title: `مبادله طلا با ${product.title}`, date,
      amountToman: wagesAndTaxes, weightGrams: product.weight, status: 'completed',
      details: `مبادله ${formatGram(product.weight)} گرم طلای آب‌شده + ${formatToman(wagesAndTaxes)} تومان اجرت.`,
      image: product.image
    });
    onBack();
  };

  const breakdown = calculateGoldProductPrice(product.weight, goldPrice18k, product.wagePercentage, product.taxPercentage);
  const priceDetails = calculateGoldProductPrice(product.weight, basePrice, product.wagePercentage, product.taxPercentage);
  const wagesAndTaxes = priceDetails.wageVal + priceDetails.profitVal + priceDetails.taxVal;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.12, ease: 'easeOut' }} className="space-y-5" id="product-detail-page">
      <div className="flex items-center justify-between pb-3 mb-4">
        <button onClick={onBack} className="text-slate-600 hover:text-slate-800 transition-colors focus:outline-none p-1" title="بازگشت به ویترین">
          <ArrowRight className="w-5 h-5" />
        </button>
        <span className="text-sm font-black text-slate-800">جزئیات و ساخت فاکتور رسمی</span>
        <div className="w-6 h-6"></div>
      </div>

      <div className="space-y-4">
        <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
          <img src={product.image} alt={product.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          <span className="absolute bottom-3 right-3 bg-white/95 px-2.5 py-1 rounded-xl text-xs font-black text-amber-800 border border-slate-100 shadow-sm">
            {formatGram(product.weight)} گرم طلا
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100/80 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-[9px] bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-black">عیار ۱۸ (۷۵۰)</span>
            <span className="text-[10px] text-slate-400 font-extrabold">غرفه: {toPersianDigits(product.sellerName)}</span>
          </div>
          <h3 className="text-sm font-black text-slate-800">{toPersianDigits(product.title)}</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed pt-1.5 border-t border-slate-50 mt-1.5 font-medium">{toPersianDigits(product.description)}</p>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-3 text-xs font-medium shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-row-reverse">
            <h5 className="text-slate-800 font-black text-xs">فرمول رسمی صنف طلا و جواهر</h5>
            <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">اتحادیه طلا</span>
          </div>
          <div className="flex justify-between items-center flex-row-reverse text-[11px]">
            <span className="text-slate-400">ارزش طلای خام ۱۸ عیار:</span>
            <span className="font-extrabold text-slate-700">{formatToman(breakdown.rawGoldVal)} تومان</span>
          </div>
          <div className="flex justify-between items-center flex-row-reverse text-[11px]">
            <span className="text-slate-400">اجرت ساخت کارمزد ({toPersianDigits(product.wagePercentage)}٪):</span>
            <span className="font-extrabold text-slate-700">{formatToman(breakdown.wageVal)} تومان</span>
          </div>
          <div className="flex justify-between items-center flex-row-reverse text-[11px]">
            <span className="text-slate-400">سود گالری طلا (۷٪ اتحادیه):</span>
            <span className="font-extrabold text-slate-700">{formatToman(breakdown.profitVal)} تومان</span>
          </div>
          <div className="flex justify-between items-center flex-row-reverse text-[11px]">
            <span className="text-slate-400">مالیات بر ارزش افزوده (۹٪ از سود و اجرت):</span>
            <span className="font-extrabold text-slate-700">{formatToman(breakdown.taxVal)} تومان</span>
          </div>
          <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl text-[9.5px] leading-relaxed flex gap-2 items-start font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>قانون معافیت مالیاتی {activeMetal === 'gold' ? 'طلا' : 'نقره'}: طبق مصوبه رسمی صنف، اصل {activeMetal === 'gold' ? 'طلا' : 'نقره'} از مالیات معاف بوده و مالیات صرفاً بر روی سود و اجرت گالری اعمال شده است.</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-sm flex-row-reverse">
            <span className="font-black text-slate-800 text-xs">قیمت نهایی فاکتور رسمی:</span>
            <span className={`font-black text-sm ${activeMetal === 'gold' ? 'text-amber-600' : 'text-slate-600'}`}>{formatToman(breakdown.finalPrice)} تومان</span>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={handleBuyWithToman} className={`w-full bg-gradient-to-r ${activeMetal === 'gold' ? 'from-amber-600 to-amber-500' : 'from-slate-600 to-slate-500'} text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all focus:outline-none`}>
            <ShoppingBag className="w-4 h-4" />
            <span>پرداخت آنلاین نقدی فاکتور ({formatToman(priceDetails.finalPrice)} تومان)</span>
          </button>
          {activeMetal === 'gold' && (
            <div className="bg-white border border-slate-100 rounded-3xl p-4 space-y-3 text-right shadow-xs">
              <div className="flex items-center justify-between text-xs font-black text-slate-800 flex-row-reverse">
                <span className="text-amber-800 text-[11px]">مبادله بدون کارمزد با طلای آب‌شده</span>
                <ArrowLeftRight className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                با کسر دقیق {formatGram(product.weight)} گرم از موجودی طلای آب‌شده شما، فقط مابه‌التفاوت اجرت ساخت، سود و مالیات معادل <span className="text-amber-700 font-extrabold">{formatToman(wagesAndTaxes)} تومان</span> را از کیف پول پرداخت نمایید.
              </p>
              <button onClick={handleExchangeWithGold} className="w-full bg-slate-50 hover:bg-slate-100 text-amber-800 border border-amber-500/20 py-3 rounded-2xl text-[10.5px] font-black transition-all focus:outline-none">
                کسر گرم طلای آب‌شده + پرداخت نقدی کارمزد
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
