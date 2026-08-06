import React, { useState } from 'react';
import { Store, Users, Shield, Zap, Sparkles, TrendingUp, ArrowLeft, Globe, ShoppingBag, Coins, Layers, Check, Package } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onEnterMarketplace: () => void;
  onEnterStore: (slug: string) => void;
  onStartBuilding: (type?: 'marketplace' | 'store' | 'supplier') => void;
}

const stores = [
  { slug: 'silver-bazaar', name: 'بازار نقره', desc: 'بازارچه تخصصی نقره و زیورآلات', type: 'marketplace', icon: '🪙' },
  { slug: 'diamond-gallery', name: 'گالری الماس', desc: 'فروشگاه تخصصی الماس و جواهرات', type: 'store', icon: '💎' },
  { slug: 'pars-gold', name: 'طلافروشی پارس', desc: 'فروشگاه طلای ۱۸ و ۲۴ عیار', type: 'store', icon: '👑' },
  { slug: 'tehran-jewelry', name: 'جواهری تهران', desc: 'زیورآلات دست‌ساز و سفارشی', type: 'store', icon: '🌸' },
];

const features = [
  { icon: Layers, title: 'بازارچه یا فروشگاه', desc: 'دو حالت کسب‌وکار: بازارچه چند فروشنده‌ای یا فروشگاه اختصاصی تک‌برندی. شما انتخاب می‌کنید.' },
  { icon: Globe, title: 'دامنه اختصاصی', desc: 'هر فروشگاه دامنه مخصوص خود را دارد. برند شما، آدرس شما، هویت شما.' },
  { icon: Shield, title: 'امن و قابل اعتماد', desc: 'احراز هویت sellers، بیمه تحویل فیزیکی، کیف پول امن با پشتوانه طلای واقعی.' },
  { icon: Zap, title: 'راه‌اندازی سریع', desc: 'در کمتر از ۵ دقیقه فروشگاه طلای آنلاین خود را بسازید. بدون نیاز به دانش فنی.' },
  { icon: ShoppingBag, title: 'مدیریت محصولات', desc: 'افزودن و مدیریت نامحدود محصولات طلا و نقره با قیمت‌گذاری خودکار بر اساس نرخ لحظه‌ای.' },
  { icon: TrendingUp, title: 'گزارشات هوشمند', desc: 'داشبورد تحلیلی فروش، موجودی، و عملکرد با نمودارهای لحظه‌ای و گزارش‌های قابل دانلود.' },
];

const plans = [
  { name: 'پایه', price: 'رایگان', period: 'ماهانه', features: ['۵ محصول', '۱ فروشنده', 'دامنه طلانا', 'پشتیبانی ایمیل'], cta: 'شروع رایگان', highlight: false },
  { name: 'حرفه‌ای', price: '۲.۵ میلیون', period: 'ماهانه', features: ['۵۰ محصول', '۵ فروشنده', 'دامنه اختصاصی', 'گزارشات پیشرفته', 'پنل مدیریت کامل', 'پشتیبانی ۲۴/۷'], cta: 'شروع حرفه‌ای', highlight: true },
  { name: 'سازمانی', price: 'تماس بگیرید', period: 'سفارشی', features: ['محصولات نامحدود', 'فروشندگان نامحدود', 'API اختصاصی', 'استقرار اختصاصی', 'مدیریت چند شعبه', 'SLA تضمینی'], cta: 'تماس با ما', highlight: false },
];

export default function LandingPage({ onEnterMarketplace, onEnterStore, onStartBuilding }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div dir="rtl" className="min-h-screen bg-white text-slate-800 font-sans selection:bg-amber-600 selection:text-white">

      {/* ====== NAVBAR ====== */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-black text-slate-800">طلانا</span>
            <span className="hidden sm:inline text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">SaaS</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-500">
            <a href="#features" className="hover:text-amber-600 transition-colors">ویژگی‌ها</a>
            <a href="#stores" className="hover:text-amber-600 transition-colors">فروشگاه‌های نمونه</a>
            <a href="#pricing" className="hover:text-amber-600 transition-colors">تعرفه‌ها</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onEnterMarketplace}
              className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all">
              ورود به بازارچه
            </button>
          </div>
        </div>
      </nav>

      {/* ====== HERO ====== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full mb-6">
              پلتفرم SaaS طلا و نقره
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
              بازارچه طلا و نقره‌ات را<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-yellow-500">در ۵ دقیقه</span> راه‌اندازی کن
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-bold max-w-xl mx-auto mb-8 leading-relaxed">
              طلانا پلتفرم جامع راه‌اندازی بازارچه و فروشگاه آنلاین طلا و نقره است. بدون کدنویسی،
              فروشگاه اختصاصی خود را با دامنه شخصی، مدیریت محصولات، و کیف پول دیجیتال طلا بسازید.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={onEnterMarketplace}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> ورود به بازارچه طلانا
              </button>
              <a href="#features"
                className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                مشاهده امکانات <ArrowLeft className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { value: '۵+', label: 'فروشگاه فعال' },
              { value: '۱۴+', label: 'محصول طلا و نقره' },
              { value: '۲۴/۷', label: 'پشتیبانی' },
              { value: '۹۹.۹٪', label: 'آپتایم' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="text-xl md:text-2xl font-black text-amber-600">{s.value}</div>
                <div className="text-[10px] font-bold text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== FEATURES ====== */}
      <section id="features" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-full">امکانات</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-4 mb-3">همه چیز برای راه‌اندازی فروشگاه طلا</h2>
            <p className="text-sm text-slate-500 font-bold max-w-lg mx-auto">از بازارچه چند فروشنده‌ای تا فروشگاه اختصاصی تک‌برندی — همه در یک پلتفرم</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                  <f.icon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-sm font-black text-slate-800 mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== STORE TYPES ====== */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-full">دو حالت کسب‌وکار</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-4 mb-3">بازارچه یا فروشگاه؟ انتخاب با شماست</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Marketplace card */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200 shadow-sm">
              <div className="text-3xl mb-3">🛒</div>
              <h3 className="text-lg font-black text-slate-800 mb-2">حالت بازارچه</h3>
              <p className="text-xs text-slate-600 font-bold leading-relaxed mb-4">
                چندین فروشنده محصولات خود را در پلتفرم شما عرضه می‌کنند. مناسب برای راه‌اندازی
                Marketplaces بزرگ طلا و نقره با تنوع بالای محصولات.
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-600">
                {['فروشندگان متعدد', 'رقابت قیمتی', 'تنوع بالای محصول', 'کمیسیون از فروش', 'خدمات سرمایه‌گذاری'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />{item}</li>
                ))}
              </ul>
              <button onClick={onEnterMarketplace}
                className="w-full mt-6 bg-amber-600 text-white py-3 rounded-xl text-sm font-black hover:bg-amber-500 transition-all">
                مشاهده بازارچه نمونه
              </button>
            </div>
            {/* Store card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-sm">
              <div className="text-3xl mb-3">🏪</div>
              <h3 className="text-lg font-black text-slate-800 mb-2">حالت فروشگاه</h3>
              <p className="text-xs text-slate-600 font-bold leading-relaxed mb-4">
                فروشگاه اختصاصی تک‌برندی با دامنه شخصی. مناسب برای طلافروشی‌ها و گالری‌هایی
                که می‌خواهند برند مستقل خود را آنلاین کنند.
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-600">
                {['دامنه اختصاصی', 'برند مستقل', 'مدیریت ساده', 'بدون کمیسیون', 'پنل مدیریت کامل'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />{item}</li>
                ))}
              </ul>
              <button onClick={() => onEnterStore('pars-gold')}
                className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-xl text-sm font-black hover:bg-emerald-500 transition-all">
                مشاهده فروشگاه نمونه
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ====== DEMO STORES ====== */}
      <section id="stores" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-full">نمونه فروشگاه‌ها</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-4 mb-3">فروشگاه‌های فعال روی طلانا</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stores.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                onClick={() => s.type === 'marketplace' ? onEnterMarketplace() : onEnterStore(s.slug)}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group">
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="text-sm font-black text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">{s.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold">{s.desc}</p>
                <span className={`inline-block mt-3 text-[9px] font-black px-2 py-0.5 rounded-full ${s.type === 'marketplace' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {s.type === 'marketplace' ? 'بازارچه' : 'فروشگاه'}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== SUPPLIER CTA ====== */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">پنل تأمین‌کنندگان</h2>
          <p className="text-sm text-slate-500 font-bold mb-4 max-w-lg mx-auto leading-relaxed">
            تأمین‌کننده طلا و نقره هستید؟ عضو اکوسیستم B2B طلانا شوید. موجودی خود را مدیریت کنید، قیمت‌گذاری کنید
            و مستقیماً به فروشگاه‌ها و بازارچه‌ها طلا و نقره تأمین کنید — بدون نیاز به فروشگاه عمومی.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {['مدیریت موجودی', 'قیمت‌گذاری هوشمند', 'پنل اختصاصی', 'گزارشات مالی', 'اتصال به فروشگاه‌ها'].map((f, i) => (
              <span key={i} className="text-[10px] font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{f}</span>
            ))}
          </div>
          <button onClick={() => { onStartBuilding('supplier'); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg hover:shadow-xl transition-all">
            ثبت‌نام به عنوان تأمین‌کننده
          </button>
        </div>
      </section>

      {/* ====== PRICING ====== */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-full">تعرفه‌ها</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-4 mb-3">قیمت‌گذاری شفاف و منصفانه</h2>
            <p className="text-sm text-slate-500 font-bold">با هر بودجه‌ای شروع کنید و با رشد کسب‌وکارتان ارتقا دهید</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {plans.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className={`relative rounded-2xl p-6 border-2 shadow-sm ${p.highlight ? 'border-amber-400 bg-white ring-2 ring-amber-100' : 'border-slate-100 bg-white'}`}>
                {p.highlight && (
                  <span className="absolute -top-3 right-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white text-[9px] font-black px-3 py-1 rounded-full">محبوب‌ترین</span>
                )}
                <h3 className="text-sm font-black text-slate-800 mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-slate-900">{p.price}</span>
                  <span className="text-[11px] text-slate-400 font-bold">/{p.period}</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => onStartBuilding()}
                  className={`w-full py-3 rounded-xl text-sm font-black transition-all ${p.highlight ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md hover:shadow-lg' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  {p.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-amber-600 to-amber-500">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-4">آماده‌ای فروشگاه طلایت رو بسازی؟</h2>
          <p className="text-sm text-amber-100 font-bold mb-8">همین حالا شروع کن — رایگان و بدون نیاز به کارت بانکی</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={onEnterMarketplace}
              className="w-full sm:w-auto bg-white text-amber-700 px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg hover:shadow-xl transition-all">
              ورود به بازارچه طلانا
            </button>
            <button onClick={() => onStartBuilding()}
              className="w-full sm:w-auto bg-amber-700 text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-amber-800 transition-all">
              ساخت فروشگاه جدید
            </button>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-black text-white">طلانا</span>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-bold">
              <a href="#features" className="hover:text-white transition-colors">ویژگی‌ها</a>
              <a href="#pricing" className="hover:text-white transition-colors">تعرفه‌ها</a>
              <span>تماس: info@talana.app</span>
            </div>
            <span className="text-[10px] font-bold">© ۱۴۰۴ طلانا — تمام حقوق محفوظ است</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
