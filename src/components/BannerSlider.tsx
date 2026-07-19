import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Sparkles, Shield, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPersianDigits } from '../utils';

interface Banner {
  id: number;
  title: string;
  description: string;
  badge: string;
  gradient: string;
  icon: React.ReactNode;
}

export default function BannerSlider() {
  const [current, setCurrent] = useState(0);

  const banners: Banner[] = [
    {
      id: 1,
      title: 'طلای آب‌شده بدون کارمزد طلانا',
      description: 'سرمایه‌گذاری هوشمند و امن طلا با مجوز رسمی از اتحادیه طلا و جواهر کشور.',
      badge: 'سرمایه‌گذاری',
      gradient: 'from-amber-600 to-yellow-500',
      icon: <Sparkles className="w-7 h-7 text-yellow-100" />
    },
    {
      id: 2,
      title: 'طرح تحویل فیزیکی شمش ۱۸ عیار',
      description: 'تبدیل آسان دارایی دیجیتال طلا به شمش فیزیکی هولوگرام‌دار در شعب طلانا.',
      badge: 'تحویل طلا',
      gradient: 'from-emerald-600 to-teal-500',
      icon: <Shield className="w-7 h-7 text-emerald-100" />
    },
    {
      id: 3,
      title: 'معاوضه طلا در ویترین آنلاین',
      description: 'بدون پرداخت ریالی وجه نقد اضافی، طلای خود را با زیباترین زیورآلات معاوضه کنید.',
      badge: 'ویترین زیورآلات',
      gradient: 'from-amber-700 to-orange-600',
      icon: <RefreshCw className="w-7 h-7 text-amber-100" />
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-xs h-28" id="banner-slider">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          className={`absolute inset-0 bg-gradient-to-br ${banners[current].gradient} text-white p-4 flex flex-col justify-between text-right`}
        >
          {/* Top Info */}
          <div className="flex justify-between items-start flex-row-reverse">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold tracking-wide">
              {banners[current].badge}
            </span>
            <div className="opacity-90">{banners[current].icon}</div>
          </div>

          {/* Bottom Info */}
          <div className="space-y-0.5">
            <h3 className="text-xs font-black tracking-tight">{banners[current].title}</h3>
            <p className="text-[9.5px] text-white/85 leading-relaxed font-medium line-clamp-1">
              {toPersianDigits(banners[current].description)}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators */}
      <div className="absolute bottom-3 left-4 flex gap-1 z-10 flex-row-reverse">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-350 ${current === i ? 'bg-white w-4' : 'bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}
