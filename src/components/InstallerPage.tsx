import React, { useState } from 'react';
import { Store, Users, ArrowRight, ArrowLeft, Check, Sparkles, Package, Upload, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { setToken } from '../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface InstallerPageProps {
  onBack: () => void;
  preselectedType?: 'marketplace' | 'store' | 'supplier';
}

type WizardType = 'marketplace' | 'store' | 'supplier';

export default function InstallerPage({ onBack, preselectedType }: InstallerPageProps) {
  const [step, setStep] = useState(preselectedType === 'supplier' ? 2 : 1);
  const [type, setType] = useState<WizardType>(preselectedType || 'marketplace');
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [brandColor, setBrandColor] = useState('#ca8a04');
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);

  const handleNameChange = (name: string) => {
    setTenantName(name);
    // Auto-generate slug from name
    if (!tenantSlug || tenantSlug === slugify(tenantName)) {
      setTenantSlug(slugify(name));
    }
  };

  const slugify = (text: string) =>
    text
      .replace(/[^\w\s]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .substring(0, 40);

  const canNextStep1 = !!type;
  const canNextStep2 = tenantName.trim() && tenantSlug.trim();
  const canNextStep3 = true; // brand color always has a default
  const canNextStep4 = adminName.trim() && adminPhone.trim().length === 11 && adminPassword.trim().length >= 6;

  const isSupp = type === 'supplier';
  const isMkt = type === 'marketplace';
  const isStr = type === 'store';

  // Per-type labels
  const typeLabel = isSupp ? 'تأمین‌کننده' : isMkt ? 'بازارچه' : 'فروشگاه';
  const typeEntity = isSupp ? 'پنل تأمین‌کننده' : isMkt ? 'بازارچه' : 'فروشگاه';
  const typeColor = isSupp ? 'blue' : 'amber';
  const TypeIcon = isSupp ? Package : isMkt ? Users : Store;
  // Color classes map
  const colorBg = isSupp ? 'bg-blue-50' : 'bg-amber-50';
  const colorBg2 = isSupp ? 'bg-blue-100' : 'bg-amber-100';
  const colorText = isSupp ? 'text-blue-600' : 'text-amber-600';
  const colorBorder = isSupp ? 'border-blue-400' : 'border-amber-400';
  const colorRing = isSupp ? 'ring-blue-100' : 'ring-amber-100';
  const colorBtn = isSupp
    ? 'bg-gradient-to-r from-blue-600 to-blue-500'
    : 'bg-gradient-to-r from-amber-600 to-amber-500';
  const colorBtnHover = isSupp ? 'hover:from-blue-700 hover:to-blue-600' : 'hover:from-amber-700 hover:to-amber-600';
  const colorDot = isSupp ? 'bg-blue-600' : 'bg-amber-600';
  const colorStepBg = isSupp ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white';
  const doneIconBg = isSupp ? 'bg-blue-100' : 'bg-emerald-100';
  const doneIconColor = isSupp ? 'text-blue-600' : 'text-emerald-600';
  const colorFocus = isSupp ? 'focus:border-blue-500' : 'focus:border-amber-500';
  const colorBadgeBg = isSupp ? 'bg-blue-50' : 'bg-amber-50';
  const colorBadgeText = isSupp ? 'text-blue-600' : 'text-amber-600';

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/tenants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_name: tenantName,
          tenant_slug: tenantSlug,
          tenant_type: type,
          admin_name: adminName,
          admin_phone: adminPhone,
          admin_password: adminPassword,
          domain: domain || null,
          brand_color: brandColor,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || Object.values(err.errors || {}).flat().join(', ') || `خطا در ساخت ${typeEntity}`);
      }

      const data = await res.json();
      setResult(data);
      // Auto-login: save token so user doesn't need to re-enter credentials
      if (data.token) setToken(data.token);
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goToStore = () => {
    if (result?.tenant?.slug) {
      // Suppliers have no public storefront — go directly to their admin panel
      if (result.tenant.type === 'supplier') {
        window.location.href = `/?tenant=${result.tenant.slug}#/admin`;
      } else {
        window.location.href = `/?tenant=${result.tenant.slug}`;
      }
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600 p-1">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center">
              <img src="/talana_logo.png" alt="طلانا" className="w-7 h-7 rounded-lg object-cover" />
            </div>
            <span className="text-sm font-black">طلانا</span>
          </div>
          <div className="w-6" />
        </div>

        {/* Step indicators */}
        {!done && (
          <div className="max-w-xl mx-auto px-4 pb-3 flex items-center gap-2">
            {(isSupp ? [2, 3, 4] : [1, 2, 3, 4]).map((s, i) => {
              const steps = isSupp ? [2, 3, 4] : [1, 2, 3, 4];
              const total = steps.length;
              const isLast = i === total - 1;
              return (
              <div key={s} className={`flex items-center gap-2 ${!isLast ? 'flex-1' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step >= s ? colorStepBg : 'bg-slate-100 text-slate-400'}`}>
                  {step > s ? <Check className="w-3 h-3" /> : isSupp ? i + 1 : s}
                </div>
                {!isLast && <div className={`flex-1 h-0.5 rounded ${step > s ? colorDot : 'bg-slate-200'}`} />}
              </div>
            )})}
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className={`w-20 h-20 rounded-full ${doneIconBg} flex items-center justify-center mx-auto mb-6`}>
                <Sparkles className={`w-10 h-10 ${doneIconColor}`} />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">{isSupp ? '🎉 پنل تأمین‌کننده شما ساخته شد!' : `🎉 ${typeEntity} شما ساخته شد!`}</h2>
              <p className="text-sm text-slate-500 font-bold mb-2">{tenantName}</p>
              <p className="text-xs text-slate-400 mb-8">
                {isSupp ? 'حالا می‌توانید موجودی طلا و نقره را مدیریت کرده و به فروشگاه‌ها و بازارچه‌ها تأمین کنید.' :
                 isMkt ? 'حالا می‌توانید فروشندگان را دعوت کنید و محصولات را مدیریت کنید.' :
                 'حالا می‌توانید محصولات خود را اضافه کرده و فروش را شروع کنید.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={goToStore}
                  className={`${colorBtn} text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg hover:shadow-xl transition-all ${colorBtnHover}`}>
                  {isSupp ? 'ورود به پنل تأمین‌کننده' : `ورود به ${typeEntity}`}
                </button>
                <button onClick={onBack}
                  className="bg-white border border-slate-200 text-slate-600 px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">
                  بازگشت به صفحه اصلی
                </button>
              </div>
              {result && (
                <div className="mt-8 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-right">
                  <h3 className="text-xs font-black text-slate-500 mb-3">اطلاعات ورود</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">شماره:</span><span className="font-mono font-bold" dir="ltr">{adminPhone}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">آدرس:</span><span className="font-mono font-bold text-[11px]" dir="ltr">localhost:5175/?tenant={tenantSlug}</span></div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Step 1: Choose type */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 mb-2">چه نوع فروشگاهی می‌خواهید؟</h2>
                    <p className="text-xs text-slate-400 font-bold">نوع فروشگاه خود را انتخاب کنید</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => { setType('marketplace'); setStep(2); }}
                      className={`text-right p-5 rounded-2xl border-2 transition-all ${type === 'marketplace' ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-800 mb-1">بازارچه (Marketplace)</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">چندین فروشنده محصولات خود را در پلتفرم شما می‌فروشند. شما مدیر بازارچه هستید.</p>
                          <div className="flex gap-2 mt-3">
                            {['چند فروشنده', 'رقابت قیمتی', 'تنوع بالا', 'خدمات سرمایه‌گذاری'].map((f, i) => (
                              <span key={i} className="text-[9px] font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{f}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>

                    <button onClick={() => { setType('store'); setStep(2); }}
                      className={`text-right p-5 rounded-2xl border-2 transition-all ${type === 'store' ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Store className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-800 mb-1">فروشگاه مستقل (Store)</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">فروشگاه اختصاصی تک‌برندی با دامنه شخصی. شما صاحب برند هستید.</p>
                          <div className="flex gap-2 mt-3">
                            {['دامنه اختصاصی', 'برند مستقل', 'مدیریت ساده', 'چند شعبه'].map((f, i) => (
                              <span key={i} className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{f}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Business info */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 mb-2">اطلاعات {typeLabel}</h2>
                    <p className="text-xs text-slate-400 font-bold">
                      {isSupp ? 'نام و مشخصات کسب‌وکار تأمین‌کننده را وارد کنید' : 'نام و آدرس فروشگاه خود را وارد کنید'}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-600 block mb-1.5">
                        نام {typeLabel}
                      </label>
                      <input value={tenantName} onChange={e => handleNameChange(e.target.value)}
                        placeholder={isSupp ? 'مثال: زرگران اصفهان' : isMkt ? 'مثال: بازار طلای تهران' : 'مثال: گالری طلای مینا'}
                        className={`w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-right focus:outline-none ${colorFocus}`} />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-600 block mb-1.5">آدرس اینترنتی (slug)</label>
                      <input value={tenantSlug} onChange={e => setTenantSlug(e.target.value.replace(/[^a-z0-9_-]/g, ''))}
                        placeholder={isSupp ? 'my-supplier' : 'my-store'}
                        className={`w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-left focus:outline-none ${colorFocus} font-mono`} dir="ltr" />
                      <p className="text-[10px] text-slate-400 mt-1">فقط حروف انگلیسی، اعداد، خط تیره و آندرلاین. مثال: my_gold_supplier</p>
                    </div>
                    {!isSupp && (
                      <div>
                        <label className="text-xs font-black text-slate-600 block mb-1.5">دامنه اختصاصی (اختیاری)</label>
                        <input value={domain} onChange={e => setDomain(e.target.value)}
                          placeholder="my-store.com"
                          className={`w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-left focus:outline-none ${colorFocus} font-mono`} dir="ltr" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Brand identity — logo upload + color picker */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 mb-2">هویت بصری برند</h2>
                    <p className="text-xs text-slate-400 font-bold">لوگو و رنگ برند {typeLabel} خود را انتخاب کنید</p>
                  </div>

                  {/* Logo upload */}
                  <div>
                    <label className="text-xs font-black text-slate-600 block mb-2">لوگوی برند</label>
                    <div className="flex items-start gap-4">
                      {/* Preview */}
                      <div className={`w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center flex-shrink-0 overflow-hidden ${brandLogoPreview ? 'border-transparent' : 'border-slate-200'}`}
                        style={brandLogoPreview ? {} : {}}>
                        {brandLogoPreview ? (
                          <img src={brandLogoPreview} alt="پیش‌نمایش لوگو" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                            <span className="text-[9px] font-bold text-slate-300">لوگو</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all border border-slate-200 hover:bg-slate-50`}>
                          <Upload className="w-4 h-4" />
                          بارگذاری لوگو
                          <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => setBrandLogoPreview(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }} />
                        </label>
                        <p className="text-[9px] text-slate-400 mt-1.5">PNG, JPEG, SVG یا WebP — حداکثر ۲ مگابایت</p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100" />

                  {/* Brand color picker */}
                  <div>
                    <label className="text-xs font-black text-slate-600 block mb-2">
                      <Palette className="w-4 h-4 inline-block ml-1" />
                      رنگ برند
                    </label>

                    {/* Color input + live preview */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <input type="color" value={brandColor}
                          onChange={e => setBrandColor(e.target.value)}
                          className="w-12 h-12 rounded-xl cursor-pointer border-2 border-slate-200 p-0.5" />
                      </div>
                      <input value={brandColor}
                        onChange={e => setBrandColor(e.target.value)}
                        className="bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-sm font-mono text-left focus:outline-none focus:border-amber-500 w-28"
                        dir="ltr" maxLength={7} />
                      <span className="text-xs text-slate-400 font-bold">کد HEX رنگ اصلی</span>
                    </div>

                    {/* Preset color swatches */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['#ca8a04', '#d97706', '#e11d48', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#4f46e5', '#1e293b'].map(c => (
                        <button key={c} onClick={() => setBrandColor(c)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${brandColor === c ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: c }} title={c} />
                      ))}
                    </div>

                    {/* Live preview card */}
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-2.5 flex items-center gap-2" style={{ backgroundColor: brandColor }}>
                        <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
                          <span className="text-white text-[8px] font-black">T</span>
                        </div>
                        <span className="text-xs font-black text-white">{tenantName || 'نام برند'}</span>
                      </div>
                      <div className="p-4 space-y-2" style={{ backgroundColor: `${brandColor}10` }}>
                        <div className="flex gap-2">
                          <div className="h-2 rounded flex-1" style={{ backgroundColor: brandColor }} />
                          <div className="h-2 rounded w-12" style={{ backgroundColor: `${brandColor}60` }} />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-5 rounded w-2/3" style={{ backgroundColor: `${brandColor}25` }} />
                        </div>
                        <div className="flex gap-2">
                          <div className="h-5 rounded w-1/2" style={{ backgroundColor: `${brandColor}15` }} />
                          <div className="h-5 rounded w-1/3" style={{ backgroundColor: `${brandColor}15` }} />
                        </div>
                      </div>
                      <div className="px-4 py-1.5 flex items-center gap-1.5" style={{ backgroundColor: `${brandColor}08` }}>
                        <span className="text-[9px] font-bold" style={{ color: brandColor }}>رنگ اصلی: {brandColor}</span>
                        <span className="text-[9px] text-slate-400">|</span>
                        <span className="text-[9px] text-slate-400">پس‌زمینه: تینت ۱۰٪</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Admin account */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 mb-2">حساب مدیریت</h2>
                    <p className="text-xs text-slate-400 font-bold">اطلاعات مدیر {typeLabel} را وارد کنید</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-600 block mb-1.5">نام مدیر</label>
                      <input value={adminName} onChange={e => setAdminName(e.target.value)}
                        placeholder="نام و نام خانوادگی"
                        className={`w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-right focus:outline-none ${colorFocus}`} />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-600 block mb-1.5">شماره موبایل</label>
                      <input value={adminPhone} onChange={e => setAdminPhone(e.target.value.replace(/\D/g, '').substring(0, 11))}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        className={`w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-left focus:outline-none ${colorFocus} font-mono`} dir="ltr" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-600 block mb-1.5">رمز عبور</label>
                      <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                        placeholder="حداقل ۶ کاراکتر"
                        className={`w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-left focus:outline-none ${colorFocus}`} dir="ltr" />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600">{error}</div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button onClick={() => setStep(s => s - 1)}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-xl text-sm font-black hover:bg-slate-50 transition-all">
                    <ArrowRight className="w-4 h-4" /> قبلی
                  </button>
                )}
                {step < 4 ? (
                  <button onClick={() => setStep(s => s + 1)}
                    disabled={step === 1 ? !canNextStep1 : step === 2 ? !canNextStep2 : !canNextStep3}
                    className={`flex-1 flex items-center justify-center gap-2 ${colorBtn} text-white py-3 rounded-xl text-sm font-black shadow-md hover:shadow-lg transition-all disabled:opacity-50`}>
                    بعدی <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading || !canNextStep4}
                    className={`flex-1 flex items-center justify-center gap-2 ${colorBtn} text-white py-3 rounded-xl text-sm font-black shadow-md hover:shadow-lg transition-all disabled:opacity-50`}>
                    {loading ? 'در حال ساخت...' : `ساخت ${typeEntity}`}
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
