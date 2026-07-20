import React, { useState } from 'react';
import { Transaction } from '../types';
import { ShoppingBag, ArrowUpRight, ArrowDownLeft, Truck, ShieldCheck, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatToman, formatGram, toPersianDigits } from '../utils';

interface OrdersTabProps {
  transactions: Transaction[];
  onBack: () => void;
}

export default function OrdersTab({ transactions, onBack }: OrdersTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'investment' | 'physical'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'all') return true;
    if (filterType === 'investment') return tx.type === 'buy_gold' || tx.type === 'sell_gold';
    if (filterType === 'physical') return tx.type === 'buy_product';
    return true;
  });

  return (
    <div className="space-y-4 max-w-md mx-auto px-4 py-4 text-right" id="orders-view">
      
      {/* Subpage Header */}
      <div className="flex items-center justify-between pb-3 mb-2">
        <button 
          onClick={onBack}
          className="text-slate-600 hover:text-slate-800 transition-colors focus:outline-none p-1"
          title="بازگشت"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <span className="text-sm font-black text-slate-800">تاریخچه معاملات و فاکتورها</span>
        <div className="w-6 h-6"></div> {/* Spacer to keep title centered */}
      </div>

      {/* Title */}
      <div className="flex items-center justify-between text-right flex-row-reverse">
        <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full font-bold">
          تعداد کل: {toPersianDigits(transactions.length.toString())} مورد
        </span>
        <h3 className="text-xs font-black text-slate-700">فاکتورها</h3>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${filterType === 'all' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          همه
        </button>
        <button
          onClick={() => setFilterType('investment')}
          className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${filterType === 'investment' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          سرمایه‌گذاری
        </button>
        <button
          onClick={() => setFilterType('physical')}
          className={`flex-1 py-2 rounded-xl text-center font-bold transition-all ${filterType === 'physical' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          ویترین زیورآلات
        </button>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.map((tx) => {
          const isExpanded = expandedId === tx.id;
          
          return (
            <div 
              key={tx.id}
              className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all duration-200"
            >
              {/* Header Accordion */}
              <div 
                onClick={() => toggleExpand(tx.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>

                <div className="flex items-center gap-3 flex-row-reverse text-right">
                  {/* Icon Indicator based on transaction type */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border ${
                    tx.type === 'buy_gold' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                    tx.type === 'sell_gold' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                    'bg-amber-50 border-amber-100 text-amber-600'
                  }`}>
                    {tx.type === 'buy_gold' && <ArrowDownLeft className="w-5 h-5" />}
                    {tx.type === 'sell_gold' && <ArrowUpRight className="w-5 h-5" />}
                    {tx.type === 'buy_product' && <ShoppingBag className="w-5 h-5" />}
                  </div>

                  <div className="flex flex-col text-right">
                    <span className="text-xs font-extrabold text-slate-700">{toPersianDigits(tx.title)}</span>
                    <span className="text-[9px] text-slate-400 font-bold mt-0.5">{toPersianDigits(tx.date)}</span>
                  </div>
                </div>
              </div>

              {/* Collapsible Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-100 bg-slate-50/30 p-4 text-right text-xs space-y-3"
                  >
                    {/* If there is a product image */}
                    {tx.image && (
                      <div className="flex justify-end mb-2">
                        <img 
                          src={tx.image} 
                          alt={tx.title}
                          referrerPolicy="no-referrer" 
                          className="w-16 h-16 rounded-xl object-cover border border-slate-100 shadow-sm bg-white"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 flex-row-reverse text-right">
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] text-slate-400 font-bold">کد رهگیری تراکنش</span>
                        <span className="font-mono text-slate-600 font-bold mt-0.5">{toPersianDigits(tx.id)}</span>
                      </div>
                      
                      <div className="flex flex-col text-right">
                        <span className="text-[9px] text-slate-400 font-bold">وضعیت سند فاکتور</span>
                        <span className="text-emerald-600 font-extrabold flex items-center justify-end gap-1 mt-0.5">
                          تأیید شده صنف طلا <ShieldCheck className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      {tx.weightGrams !== undefined && (
                        <div className="flex flex-col text-right">
                          <span className="text-[9px] text-slate-400 font-bold">وزن ناخالص طلا</span>
                          <span className="text-slate-600 font-black mt-0.5">
                            {formatGram(tx.weightGrams)} گرم
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col text-right">
                        <span className="text-[9px] text-slate-400 font-bold">مبلغ نهایی تراکنش</span>
                        <span className="text-amber-700 font-black mt-0.5">
                          {formatToman(tx.amountToman)} تومان
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl leading-relaxed border border-slate-100/50">
                      {toPersianDigits(tx.details)}
                    </p>

                    {/* Delivery simulation for physical jewelry */}
                    {tx.type === 'buy_product' && (
                      <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between text-amber-800 font-extrabold text-[10px] flex-row-reverse">
                          <span>وضعیت ارسال مرسوله فیزیکی</span>
                          <Truck className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 flex-row-reverse">
                          <div className="flex flex-col items-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 mb-1"></span>
                            <span className="text-amber-700 font-bold">ثبت غرفه</span>
                          </div>
                          <div className="h-0.5 flex-1 bg-amber-200 mx-1"></div>
                          <div className="flex flex-col items-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 mb-1"></span>
                            <span>بیمه صنف طلا</span>
                          </div>
                          <div className="h-0.5 flex-1 bg-slate-100 mx-1"></div>
                          <div className="flex flex-col items-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 mb-1"></span>
                            <span>ارسال با پست</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs font-bold bg-white rounded-2xl border border-slate-100 shadow-sm">
            هنوز تراکنشی در این دسته‌بندی ثبت نشده است.
          </div>
        )}
      </div>

    </div>
  );
}

