import React, { useState, useEffect, memo } from 'react';
import { Product, UserWallet, Transaction } from '../types';
import { CATEGORIES, PRODUCTS, SELLERS } from '../data';
import { calculateGoldProductPrice, formatToman, formatGram, toPersianDigits, productPlaceholder } from '../utils';
import { Search, MapPin, Sparkles, ShoppingBag, Check, X, ShieldAlert, ArrowLeftRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CategoryIcon from './CategoryIcon';

interface MarketplaceTabProps {
  wallet: UserWallet;
  goldPrice18k: number;
  silverPrice999: number;
  activeMetal: 'gold' | 'silver';
  onTransaction: (tx: Transaction) => void;
  onProductDetailToggle: (isOpen: boolean) => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

const MarketplaceTab = memo(function MarketplaceTab({ 
  wallet, 
  goldPrice18k, 
  silverPrice999,
  activeMetal,
  onTransaction, 
  onProductDetailToggle,
  selectedCategory,
  onSelectCategory
}: MarketplaceTabProps) {
  const basePrice = activeMetal === 'silver' ? silverPrice999 : goldPrice18k;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFilterSecondHand, setShowFilterSecondHand] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);

  // Custom order state
  const [customName, setCustomName] = useState('');
  const [customWeight, setCustomWeight] = useState('3.5');
  const [customDescription, setCustomDescription] = useState('');

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notify parent on product select change so it can hide the dashboard header
  useEffect(() => {
    onProductDetailToggle(selectedProduct !== null);
  }, [selectedProduct, onProductDetailToggle]);

  // Filter products
  const filteredProducts = PRODUCTS.filter((product) => {
    const isProductSilver = product.metal === 'silver';
    const matchesMetal = activeMetal === 'silver' ? isProductSilver : !isProductSilver;
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sellerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSecondHand = (activeMetal === 'gold' && showFilterSecondHand) ? product.isSecondHand === true : true;
    return matchesMetal && matchesCategory && matchesSearch && matchesSecondHand;
  });

  // Handle Buy Product with Toman
  const handleBuyWithToman = (product: Product, priceDetails: any) => {
    if (wallet.cashToman < priceDetails.finalPrice) {
      setStatusMessage({
        type: 'error',
        text: `موجودی کیف پول ریالی شما کافی نیست. مابه‌تفاوت مورد نیاز: ${formatToman(priceDetails.finalPrice - wallet.cashToman)} تومان`
      });
      return;
    }

    const currentFormattedDate = toPersianDigits(
      new Date().toLocaleDateString('fa-IR') + ' ' + 
      new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    );

    const tx: Transaction = {
      id: 'tx-' + Date.now(),
      type: 'buy_product',
      title: `خرید ${product.title}`,
      date: currentFormattedDate,
      amountToman: priceDetails.finalPrice,
      weightGrams: product.weight,
      status: 'completed',
      details: `خرید فیزیکی محصول ${activeMetal === 'gold' ? 'طلا' : 'نقره'} از غرفه «${product.sellerName}» در شهر ${product.city}. تحویل با بیمه پیشتاز صنف ${activeMetal === 'gold' ? 'طلا' : 'نقره'}.`,
      image: product.image
    };

    onTransaction(tx);
    setSelectedProduct(null);
    setStatusMessage({
      type: 'success',
      text: `سفارش فیزیکی ${product.title} با موفقیت ثبت شد! فاکتور رسمی به همراه بیمه‌نامه پست خواهد شد.`
    });
  };

  // Handle Exchange with Investment Gold + Cash for Wages
  const handleExchangeWithGold = (product: Product, priceDetails: any) => {
    const goldNeeded = product.weight;
    const cashNeeded = priceDetails.wageVal + priceDetails.profitVal + priceDetails.taxVal;

    if (wallet.goldGrams < goldNeeded) {
      setStatusMessage({
        type: 'error',
        text: `موجودی طلای آب‌شده شما کافی نیست. طلا موجود: ${formatGram(wallet.goldGrams)} گرم، طلا مورد نیاز: ${formatGram(goldNeeded)} گرم`
      });
      return;
    }

    if (wallet.cashToman < cashNeeded) {
      setStatusMessage({
        type: 'error',
        text: `موجودی ریالی شما برای پرداخت اجرت و مالیات کافی نیست. ریال مورد نیاز: ${formatToman(cashNeeded)} تومان`
      });
      return;
    }

    const currentFormattedDate = toPersianDigits(
      new Date().toLocaleDateString('fa-IR') + ' ' + 
      new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    );

    const tx: Transaction = {
      id: 'tx-' + Date.now(),
      type: 'buy_product',
      title: `مبادله طلا با ${product.title}`,
      date: currentFormattedDate,
      amountToman: cashNeeded,
      weightGrams: goldNeeded,
      status: 'completed',
      details: `مبادله ${formatGram(goldNeeded)} گرم طلای آب‌شده به عنوان اصل طلا + پرداخت نقدی ${formatToman(cashNeeded)} تومان بابت اجرت، سود و مالیات به غرفه «${product.sellerName}».`,
      image: product.image
    };

    onTransaction(tx);
    setSelectedProduct(null);
    setStatusMessage({
      type: 'success',
      text: `مبادله هوشمند طلای شما با موفقیت انجام شد! ${formatGram(goldNeeded)} گرم از طلای آب‌شده شما کسر گردید و محصول آماده تحویل است.`
    });
  };

  // Custom Order Submit
  const handleCustomOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customWeight) {
      setStatusMessage({ type: 'error', text: 'لطفاً نام یا وزن دلخواه را تکمیل کنید.' });
      return;
    }

    const customWeightNum = Number(customWeight.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()));
    const mockProduct: Product = {
      id: 'custom-' + Date.now(),
      title: `طراحی سفارشی پلاک طلا با نام «${customName}»`,
      category: 'custom',
      weight: customWeightNum,
      wagePercentage: 25,
      taxPercentage: 9,
      sellerName: 'گالری زرین',
      sellerRating: 4.9,
      city: 'تهران',
      image: productPlaceholder('custom'),
      description: customDescription || 'پلاک سفارشی طراحی شده توسط بخش سفارش‌سازی طلانا.'
    };

    const priceDetails = calculateGoldProductPrice(customWeightNum, basePrice, 25, 9);
    handleBuyWithToman(mockProduct, priceDetails);
    setShowCustomModal(false);
    setCustomName('');
    setCustomDescription('');
  };

  // helper to get initials for sellers instead of emojis
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + ' ' + parts[1][0];
    }
    return name.slice(0, 2);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto px-4 py-4 text-right" id="marketplace-view">
      
      {/* Dynamic Render: Full Page Detail View if a product is selected */}
      {selectedProduct ? (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          className="space-y-5"
          id="product-detail-page"
        >
          {/* Custom Header: Back button strictly on the LEFT, title on the right */}
          <div className="flex items-center justify-between pb-3 mb-4">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="text-slate-600 hover:text-slate-800 transition-colors focus:outline-none p-1"
              title="بازگشت به ویترین"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <span className="text-sm font-black text-slate-800">جزئیات و ساخت فاکتور رسمی</span>
            <div className="w-6 h-6"></div> {/* Symmetry spacer */}
          </div>

          <div className="space-y-4">
            {/* Image */}
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl text-xs font-black text-amber-800 border border-slate-100 shadow-sm">
                {formatGram(selectedProduct.weight)} گرم طلا
              </span>
            </div>

            {/* Title & Brand */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100/80 shadow-xs space-y-1.5">
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-[9px] bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-black">عیار ۱۸ (۷۵۰)</span>
                <span className="text-[10px] text-slate-400 font-extrabold">غرفه: {toPersianDigits(selectedProduct.sellerName)}</span>
              </div>
              <h3 className="text-sm font-black text-slate-800">{toPersianDigits(selectedProduct.title)}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1.5 border-t border-slate-50 mt-1.5 font-medium">
                {toPersianDigits(selectedProduct.description)}
              </p>
            </div>

            {/* Price breakdown according to Union Formula */}
            {(() => {
              const breakdown = calculateGoldProductPrice(selectedProduct.weight, goldPrice18k, selectedProduct.wagePercentage, selectedProduct.taxPercentage);
              return (
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
                    <span className="text-slate-400">اجرت ساخت کارمزد ({toPersianDigits(selectedProduct.wagePercentage)}٪):</span>
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
                    <span className={`font-black text-sm ${activeMetal === 'gold' ? 'text-amber-600' : 'text-slate-600'}`}>
                      {formatToman(breakdown.finalPrice)} تومان
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Transaction Execution Actions */}
            {(() => {
              const priceDetails = calculateGoldProductPrice(selectedProduct.weight, basePrice, selectedProduct.wagePercentage, selectedProduct.taxPercentage);
              const wagesAndTaxes = priceDetails.wageVal + priceDetails.profitVal + priceDetails.taxVal;
              return (
                <div className="space-y-3">
                  {/* Option 1: Buy with Direct Cash */}
                  <button
                    onClick={() => handleBuyWithToman(selectedProduct, priceDetails)}
                    className={`w-full bg-gradient-to-r ${activeMetal === 'gold' ? 'from-amber-600 to-amber-500' : 'from-slate-600 to-slate-500'} text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all focus:outline-none`}
                    id="btn-buy-toman"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>پرداخت آنلاین نقدی فاکتور ({formatToman(priceDetails.finalPrice)} تومان)</span>
                  </button>

                  {/* Option 2: Exchange with Investment Gold (Only for gold!) */}
                  {activeMetal === 'gold' && (
                    <div className="bg-white border border-slate-100 rounded-3xl p-4 space-y-3 text-right shadow-xs">
                      <div className="flex items-center justify-between text-xs font-black text-slate-800 flex-row-reverse">
                        <span className="text-amber-800 text-[11px]">مبادله بدون کارمزد با طلای آب‌شده</span>
                        <ArrowLeftRight className="w-4 h-4 text-amber-600" />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                        با کسر دقیق {formatGram(selectedProduct.weight)} گرم از موجودی طلای آب‌شده شما، فقط مابه‌التفاوت اجرت ساخت، سود و مالیات معادل <span className="text-amber-700 font-extrabold">{formatToman(wagesAndTaxes)} تومان</span> را از کیف پول پرداخت نمایید.
                      </p>
                      <button
                        onClick={() => handleExchangeWithGold(selectedProduct, priceDetails)}
                        className="w-full bg-slate-50 hover:bg-slate-100 text-amber-800 border border-amber-500/20 py-3 rounded-2xl text-[10.5px] font-black transition-all focus:outline-none"
                        id="btn-exchange-gold"
                      >
                        کسر گرم طلای آب‌شده + پرداخت نقدی کارمزد
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

          </div>
        </motion.div>
      ) : (
        <>
          {/* Banner / Premium Intro */}
          <div className={`bg-gradient-to-l ${activeMetal === 'gold' ? 'from-amber-600/10 to-amber-500/5 border-amber-100 text-amber-500' : 'from-slate-600/10 to-slate-500/5 border-slate-100 text-slate-500'} border rounded-3xl p-4 flex justify-between items-center relative overflow-hidden flex-row-reverse text-right`}>
            <div className="space-y-1 z-10 font-sans">
              <span className={`text-[9px] ${activeMetal === 'gold' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'} px-2.5 py-0.5 rounded-full font-bold`}>ویترین آنلاین {activeMetal === 'gold' ? 'طلا' : 'نقره'}</span>
              <h3 className="text-xs font-black text-slate-800">مارکت‌پلیس زیورآلات {activeMetal === 'gold' ? 'طلایی' : 'نقره‌ای'} طلانا</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                {activeMetal === 'gold' 
                  ? 'طلاهای سرمایه‌گذاری آب‌شده خود را به زیباترین مصنوعات طلا و شمش فیزیکی تبدیل کنید.' 
                  : 'نقره‌های سرمایه‌گذاری خود را به زیباترین مصنوعات نقره و شمش فیزیکی تبدیل کنید.'}
              </p>
            </div>
            <div>
              <img src="/talana_logo.png" alt="طلانا" className="w-9 h-9 rounded-lg object-contain opacity-90" />
            </div>
          </div>

          {/* Search bar and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در بین محصولات، فروشگاه‌ها..."
                className={`w-full bg-white border border-slate-100 rounded-2xl py-3 pl-4 pr-11 text-xs text-slate-800 focus:outline-none ${activeMetal === 'gold' ? 'focus:border-amber-600 focus:ring-1 focus:ring-amber-600' : 'focus:border-slate-600 focus:ring-1 focus:ring-slate-600'} shadow-sm text-right font-black`}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            {/* Categories Horizontal Showcase using Custom CategoryIcon */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-600 block text-right">دسته‌بندی‌های اصلی بازارچه:</span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x justify-start" dir="rtl">
                <button
                  onClick={() => onSelectCategory(null)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all focus:outline-none ${selectedCategory === null ? `${activeMetal === 'gold' ? 'bg-amber-600' : 'bg-slate-600'} text-white shadow-sm` : 'bg-white border border-slate-100 text-slate-500 hover:text-slate-800'}`}
                >
                  همه دسته‌ها
                </button>
                {CATEGORIES.filter(cat => activeMetal === 'gold' || cat.id !== 'secondhand').map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 snap-start focus:outline-none ${selectedCategory === cat.id ? `${activeMetal === 'gold' ? 'bg-amber-600' : 'bg-slate-600'} text-white shadow-sm` : 'bg-white border border-slate-100 text-slate-500 hover:text-slate-800'}`}
                  >
                    <CategoryIcon id={cat.id} className="w-3.5 h-3.5" />
                    <span>{toPersianDigits(cat.name)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Second Hand filter and custom name design */}
            <div className="flex gap-2 flex-row-reverse items-center justify-between">
              {activeMetal === 'gold' ? (
                <button
                  onClick={() => setShowFilterSecondHand(!showFilterSecondHand)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all flex items-center gap-1.5 focus:outline-none ${showFilterSecondHand ? 'bg-rose-50 border-rose-200 text-rose-800 font-black' : 'bg-white border-slate-100 text-slate-500 shadow-sm'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${showFilterSecondHand ? 'bg-rose-600 animate-pulse' : 'bg-slate-300'}`}></span>
                  <span>طلاهای بدون اجرت (دست‌دوم)</span>
                </button>
              ) : (
                <div />
              )}
              
              <button
                onClick={() => setShowCustomModal(true)}
                className={`${activeMetal === 'gold' ? 'bg-amber-50 border-amber-100 text-amber-700 hover:border-amber-300' : 'bg-slate-50 border-slate-100 text-slate-700 hover:border-slate-300'} px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all shadow-sm focus:outline-none`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${activeMetal === 'gold' ? 'text-amber-600' : 'text-slate-600'} animate-pulse`} />
                <span>سفارش پلاک با اسم دلخواه ({activeMetal === 'gold' ? 'طلا' : 'نقره'})</span>
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 gap-3" id="products-grid">
            {filteredProducts.map((product) => {
              const priceDetails = calculateGoldProductPrice(product.weight, basePrice, product.wagePercentage, product.taxPercentage);
              return (
                <motion.div
                  key={product.id}
                  layout
                  onClick={() => setSelectedProduct(product)}
                  className={`bg-white border border-slate-100 rounded-2xl overflow-hidden cursor-pointer ${activeMetal === 'gold' ? 'hover:border-amber-200' : 'hover:border-slate-300'} transition-all flex flex-col group relative shadow-xs`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${product.title}، ${formatGram(product.weight)} گرم`}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelectedProduct(product); }}
                >
                  {/* Image Container */}
                  <div className="relative aspect-square overflow-hidden bg-slate-50">
                    <img
                      src={product.image}
                      alt={product.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {product.isFeatured && (
                        <span className={`bg-gradient-to-r ${activeMetal === 'gold' ? 'from-amber-600 to-amber-500' : 'from-slate-600 to-slate-500'} text-white text-[8px] px-1.5 py-0.5 rounded-md font-extrabold shadow-sm`}>
                          ★ منتخب
                        </span>
                      )}
                      {product.isSecondHand && (
                        <span className="bg-rose-600 text-white text-[8px] px-1.5 py-0.5 rounded-md font-extrabold shadow-sm">
                          بدون اجرت
                        </span>
                      )}
                    </div>

                    <div className={`absolute bottom-1.5 right-1.5 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[9px] ${activeMetal === 'gold' ? 'text-amber-800' : 'text-slate-800'} font-bold border border-slate-100`}>
                      {formatGram(product.weight)} گرم
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between text-right">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 font-extrabold">{toPersianDigits(product.sellerName)}</span>
                      <h4 className="text-[10.5px] font-black text-slate-700 line-clamp-1">{toPersianDigits(product.title)}</h4>
                    </div>

                    <div className="mt-2 border-t border-slate-50 pt-2 flex flex-col">
                      <span className="text-[8px] text-slate-400 font-bold">قیمت با اجرت و مالیات:</span>
                      <span className={`text-xs font-black ${activeMetal === 'gold' ? 'text-amber-600' : 'text-slate-600'} mt-0.5`}>
                        {formatToman(priceDetails.finalPrice)} <span className="text-[9px] text-slate-400 font-bold">تومان</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-2 text-center py-10 text-slate-400 text-xs font-bold">
                محصولی با فیلترهای مشخص شده یافت نشد.
              </div>
            )}
          </div>

          {/* Top Goldsmiths Showcase without Emojis */}
          {!selectedCategory && (
            <div className="bg-white border border-slate-100 rounded-3xl p-4 text-right shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 justify-end flex-row-reverse border-b border-slate-50 pb-2">
                <span>طلافروشی‌ها و همکاران رسمی طلانا</span>
              </h4>
              <div className="space-y-2.5">
                {SELLERS.map((seller) => (
                  <div key={seller.id} className="flex items-center justify-between flex-row-reverse bg-slate-50 p-2.5 rounded-2xl border border-slate-100/50">
                    <button 
                      onClick={() => setSearchQuery(seller.name)}
                      className={`bg-white border border-slate-100 px-3 py-1.5 rounded-xl text-[9px] transition-colors font-black shadow-sm focus:outline-none ${activeMetal === 'gold' ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-700'}`}
                    >
                      مشاهده غرفه
                    </button>
                    <div className="flex items-center gap-2.5 flex-row-reverse">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br shadow-xs flex items-center justify-center font-black text-xs text-white ${activeMetal === 'gold' ? 'from-amber-500 to-amber-600' : 'from-slate-500 to-slate-600'}`}>
                        {getInitials(seller.name)}
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[11px] font-black text-slate-700">{toPersianDigits(seller.name)}</span>
                        <span className="text-[8.5px] text-slate-400 font-extrabold flex items-center gap-1 justify-end flex-row-reverse">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          <span>{toPersianDigits(seller.city)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Custom design Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="fixed inset-0" onClick={() => setShowCustomModal(false)}></div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl p-5 max-w-sm w-full text-right z-10 shadow-2xl"
              id="custom-order-modal"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
                <button onClick={() => setShowCustomModal(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                  <X className="w-4 h-4" />
                </button>
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <Sparkles className={`w-3.5 h-3.5 ${activeMetal === 'gold' ? 'text-amber-600' : 'text-slate-600'} animate-spin`} /> سفارش طراحی اختصاصی پلاک
                </h4>
              </div>

              <form onSubmit={handleCustomOrderSubmit} className="space-y-4 font-bold">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block">اسم دلخواه برای طراحی (فارسی یا انگلیسی):</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="مثلاً: علی، مهسا، Love..."
                    className={`w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-right text-xs text-slate-800 focus:outline-none ${activeMetal === 'gold' ? 'focus:border-amber-600' : 'focus:border-slate-600'}`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block">وزن طلای حدودی مد نظر (گرم):</label>
                  <input
                    type="text"
                    required
                    value={customWeight ? toPersianDigits(customWeight) : ''}
                    onChange={(e) => setCustomWeight(e.target.value)}
                    placeholder="مثلاً: ۳.۵"
                    className={`w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-left text-xs text-slate-800 focus:outline-none ${activeMetal === 'gold' ? 'focus:border-amber-600' : 'focus:border-slate-600'} font-mono`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 block">توضیحات فونت یا طرح پیشنهادی (اختیاری):</label>
                  <textarea
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="مثلاً: طرح نستعلیق دارای قاب گل..."
                    rows={2}
                    className={`w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-right text-xs text-slate-800 focus:outline-none ${activeMetal === 'gold' ? 'focus:border-amber-600' : 'focus:border-slate-600'}`}
                  />
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl text-[10px] text-slate-500 border border-slate-100/60 space-y-1">
                  <p className="font-extrabold text-slate-700">نکته درباره ساخت سفارشی:</p>
                  <p className="leading-relaxed font-medium">
                    اجرت ساخت طلاهای سفارش شخصی ۲۵٪ ارزش طلای خام به همراه سود و مالیات خواهد بود. مدت تحویل ۳ تا ۵ روز کاری به همراه فاکتور رسمی اتحادیه است.
                  </p>
                </div>

                <button
                  type="submit"
                  className={`w-full bg-gradient-to-r ${activeMetal === 'gold' ? 'from-amber-600 to-amber-500' : 'from-slate-600 to-slate-500'} text-white py-3.5 rounded-2xl font-black text-xs shadow-md focus:outline-none`}
                >
                  ثبت طرح اختصاصی و پیش‌فاکتور
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Simple Status Message Alert (Shared) */}
      <AnimatePresence>
        {statusMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="fixed inset-0" onClick={() => setStatusMessage(null)}></div>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 max-w-xs w-full text-center shadow-2xl z-10"
              id="status-modal"
            >
              {statusMessage.type === 'success' ? (
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Check className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <ShieldAlert className="w-6 h-6" />
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
              >
                متوجه شدم
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
});

export default MarketplaceTab;
