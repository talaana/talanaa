import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Gem, Scale } from 'lucide-react';
import type { GoldProduct } from '../types/goldProduct';
import { gramsToMesghal, gramsToSoot } from '../types/goldProduct';
import { toPersianDigits } from '../utils/jalali';
import GoldPriceCalculator from './GoldPriceCalculator';

interface Props {
  product: GoldProduct | null;
  rawGoldPerGramToman: number;
  onClose: () => void;
  onAddToBag: (product: GoldProduct) => void;
  onDirectPurchase: (product: GoldProduct) => void;
  onBookVip: () => void;
}

/**
 * Ultra-luxury detail modal: karat stamp, exact weight (g / mesghal / soot),
 * gemstone specs + certificate, live pricing breakdown, and action buttons.
 */
export default function HotspotDetailModal({
  product,
  rawGoldPerGramToman,
  onClose,
  onAddToBag,
  onDirectPurchase,
  onBookVip,
}: Props) {
  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-[#14100a] text-amber-50 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col shadow-2xl border border-amber-200/10"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          >
            {/* Header */}
            <div className="relative p-5 border-b border-amber-200/10 bg-gradient-to-l from-amber-500/10 to-transparent">
              <button onClick={onClose} className="absolute top-4 left-4 text-amber-200/60 hover:text-amber-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
              <span className="inline-block text-[10px] font-black text-amber-300 bg-amber-500/15 border border-amber-400/20 rounded-full px-2.5 py-1 mb-2">
                عیار {toPersianDigits(product.karat)}
              </span>
              <h3 className="text-lg font-black text-amber-50">{product.title}</h3>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Weight */}
              <div className="flex items-center gap-3 bg-amber-50/5 rounded-2xl p-3 border border-amber-200/10">
                <Scale className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div className="text-xs">
                  <div className="font-black text-amber-100">
                    {toPersianDigits(product.weightGrams.toFixed(3))} گرم
                  </div>
                  <div className="text-amber-200/50 font-bold text-[11px]">
                    {toPersianDigits(gramsToMesghal(product.weightGrams).toFixed(3))} مثقال ·{' '}
                    {toPersianDigits(gramsToSoot(product.weightGrams).toFixed(2))} سوت
                  </div>
                </div>
              </div>

              {/* Gemstone */}
              {product.gemstone && (
                <div className="bg-amber-50/5 rounded-2xl p-3 border border-amber-200/10">
                  <div className="flex items-center gap-2 text-amber-300 font-black text-xs mb-2">
                    <Gem className="w-4 h-4" /> مشخصات سنگ قیمتی
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                    <SpecRow label="قیراط" value={toPersianDigits(product.gemstone.carat)} />
                    <SpecRow label="رنگ" value={product.gemstone.color} />
                    <SpecRow label="شفافیت" value={product.gemstone.clarity} />
                    <SpecRow label="تراش" value={product.gemstone.cut} />
                  </dl>
                  <div className="mt-2 pt-2 border-t border-amber-200/10 text-[11px] font-bold text-amber-200/70">
                    گواهی {product.gemstone.certificate}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <GoldPriceCalculator product={product} rawGoldPerGramToman={rawGoldPerGramToman} />
            </div>

            {/* Actions */}
            <div className="p-5 pt-3 border-t border-amber-200/10 space-y-2.5">
              <div className="flex gap-2.5">
                <button
                  onClick={() => onAddToBag(product)}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-50/10 hover:bg-amber-50/20 border border-amber-300/30 text-amber-100 py-3 rounded-2xl font-black text-sm transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" /> افزودن به سبد
                </button>
                <button
                  onClick={() => onDirectPurchase(product)}
                  className="flex-1 bg-gradient-to-l from-amber-500 to-amber-400 text-black py-3 rounded-2xl font-black text-sm shadow-lg shadow-amber-900/30 hover:brightness-110 transition-all"
                >
                  خرید مستقیم
                </button>
              </div>
              <button
                onClick={onBookVip}
                className="w-full text-amber-200/70 hover:text-amber-100 text-xs font-bold py-2 transition-colors"
              >
                رزرو سالن VIP برای پرو این قطعه ↗
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-amber-200/50 font-bold">{label}</dt>
      <dd className="text-amber-100 font-black text-left">{value}</dd>
    </>
  );
}
