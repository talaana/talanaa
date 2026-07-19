import React from 'react';
import { ArrowRight, Bell, Sparkles, ShoppingBag, TrendingUp, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { toPersianDigits } from '../utils';

interface NotificationsTabProps {
  onBack: () => void;
}

export default function NotificationsTab({ onBack }: NotificationsTabProps) {
  const notifications = [
    { 
      id: 1, 
      title: 'افزایش قیمت طلا', 
      text: 'طلای ۱۸ عیار با رشد ۱.۲۵٪ به ۷,۴۵۲,۳۰۰ تومان رسید.', 
      unread: true, 
      time: '۱۰ دقیقه پیش',
      type: 'market',
      icon: <TrendingUp className="w-4 h-4 text-emerald-500" />
    },
    { 
      id: 2, 
      title: 'سفارش موفق زیورآلات', 
      text: 'خرید انگشتر طرح اسلیمی ثبت شد و آماده ارسال از گالری زرین است.', 
      unread: false, 
      time: 'دیروز',
      type: 'order',
      icon: <ShoppingBag className="w-4 h-4 text-amber-500" />
    },
    { 
      id: 3, 
      title: 'بروزرسانی بازار طلانا', 
      text: 'طلافروشی جدید «گالری مهر» به ویترین طلانا اضافه شد. از کارهای جدید دیدن کنید.', 
      unread: false, 
      time: '۲ روز پیش',
      type: 'info',
      icon: <Sparkles className="w-4 h-4 text-indigo-500" />
    },
    {
      id: 4,
      title: 'امنیت حساب کاربری',
      text: 'ورود با اثر انگشت برای امنیت بالاتر به بخش تنظیمات طلانا اضافه شد.',
      unread: false,
      time: '۴ روز پیش',
      type: 'system',
      icon: <Info className="w-4 h-4 text-slate-500" />
    }
  ];

  return (
    <div className="space-y-4 max-w-md mx-auto px-4 py-4 text-right" id="notifications-view">
      
      {/* Dedicated Header with Left aligned back button */}
      <div className="flex items-center justify-between pb-3 mb-2">
        <button 
          onClick={onBack}
          className="text-slate-600 hover:text-slate-800 transition-colors focus:outline-none p-1"
          title="بازگشت"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <span className="text-sm font-black text-slate-800">اطلاع‌رسانی و اخبار طلانا</span>
        <div className="w-6 h-6"></div> {/* Spacer for symmetry */}
      </div>

      <div className="space-y-3">
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-2xl border transition-all flex flex-row-reverse items-start gap-3.5 ${
              n.unread 
                ? 'bg-amber-50/50 border-amber-200/60 shadow-sm shadow-amber-50/20' 
                : 'bg-white border-slate-100 shadow-xs'
            }`}
          >
            {/* Visual Icon Badge */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              n.unread ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-600'
            }`}>
              {n.icon}
            </div>

            {/* Notification content */}
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-[9px] text-slate-400 font-bold">{toPersianDigits(n.time)}</span>
                <span className={`text-xs font-black ${n.unread ? 'text-amber-800' : 'text-slate-800'}`}>
                  {n.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                {toPersianDigits(n.text)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
