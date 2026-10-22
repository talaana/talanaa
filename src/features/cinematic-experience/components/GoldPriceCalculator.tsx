import React from 'react';
import type { GoldProduct } from '../types/goldProduct';
import {
  computePriceBreakdown,
  gramsToMesghal,
  gramsToSoot,
} from '../types/goldProduct';
import { toPersianDigits } from '../utils/jalali';

function fmtToman(n: number): string {
  return toPersianDigits(Math.round(n).toLocaleString('en-US'));
}

function fmtWeight(n: number): string {
  return toPersianDigits(n.toFixed(3));
}

interface Props {
  product: GoldProduct;
  rawGoldPerGramToman: number;
}

/**
 * Live gold price breakdown for a jewelry piece, following the gold union
 * formula: ((raw gram price + making wage) × weight) + gallery profit + tax.
 */
export default function GoldPriceCalculator({ product, rawGoldPerGramToman }: Props) {
  const b = computePriceBreakdown(product, rawGoldPerGramToman);
  const mesghal = gramsToMesghal(product.weightGrams);
  const soot = gramsToSoot(product.weightGrams);

  const rows: Array<{ label: string; value: string; strong?: boolean }> = [
    { label: 'قیمت هر گرم طلای خام', value: `${fmtToman(b.rawGoldPerGramToman)} تومان` },
    { label: 'اجرت ساخت هر گرم', value: `${fmtToman(product.makingWagePerGramToman)} تومان` },
    { label: 'ارزش طلای خام', value: `${fmtToman(b.rawGoldTotalToman)} تومان` },
    { label: 'اجرت ساخت کل', value: `${fmtToman(b.makingWageTotalToman)} تومان` },
    { label: 'سود گالری', value: `${fmtToman(b.galleryProfitToman)} تومان` },
    { label: 'مالیات بر ارزش افزوده', value: `${fmtToman(b.taxToman)} تومان` },
    { label: 'قیمت نهایی فاکتور', value: `${fmtToman(b.finalPriceToman)} تومان`, strong: true },
  ];

  return (
    <div className="space-y-2 text-xs" dir="rtl">
      <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
        <span className="text-slate-400 font-bold">وزن دقیق</span>
        <span className="font-black text-slate-700">
          {fmtWeight(product.weightGrams)} گرم · {fmtWeight(mesghal)} مثقال · {fmtWeight(soot)} سوت
        </span>
      </div>
      <div className="space-y-1.5 pt-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className={`${r.strong ? 'font-black text-amber-700' : 'text-slate-400 font-bold'}`}>{r.label}</span>
            <span className={`${r.strong ? 'font-black text-amber-600 text-sm' : 'font-bold text-slate-600'}`}>{r.value}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 leading-relaxed font-bold">
        اصل طلا از مالیات معاف است؛ مالیات صرفاً بر اجرت ساخت و سود گالری اعمال شده است.
      </p>
    </div>
  );
}
