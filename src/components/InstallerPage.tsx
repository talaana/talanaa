import React, { useState } from 'react';
import { Store, Users, ArrowRight, ArrowLeft, Check, Sparkles, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { setToken } from '../api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface InstallerPageProps {
  onBack: () => void;
  preselectedType?: 'marketplace' | 'store';
}

export default function InstallerPage({ onBack, preselectedType }: InstallerPageProps) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<'marketplace' | 'store'>(preselectedType || 'marketplace');
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
  const canNextStep3 = adminName.trim() && adminPhone.trim().length === 11 && adminPassword.trim().length >= 6;

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
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || Object.values(err.errors || {}).flat().join(', ') || 'خطا در ساخت فروشگاه');
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
      window.location.href = `/?tenant=${result.tenant.slug}`;
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
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center">
              <Coins className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-black">طلانا</span>
          </div>
          <div className="w-6" />
        </div>

        {/* Step indicators */}
        {!done && (
          <div className="max-w-xl mx-auto px-4 pb-3 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step >= s ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {step > s ? <Check className="w-3 h-3" /> : s}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 rounded ${step > s ? 'bg-amber-600' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2">🎉 {type === 'marketplace' ? 'بازارچه' : 'فروشگاه'} شما ساخته شد!</h2>
              <p className="text-sm text-slate-500 font-bold mb-2">{tenantName}</p>
              <p className="text-xs text-slate-400 mb-8">
                {type === 'marketplace' ? 'حالا می‌توانید فروشندگان را دعوت کنید و محصولات را مدیریت کنید.' : 'حالا می‌توانید محصولات خود را اضافه کرده و فروش را شروع کنید.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={goToStore}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg hover:shadow-xl transition-all">
                  ورود به {type === 'marketplace' ? 'بازارچه' : 'فروشگاه'}
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
                    <h2 className="text-xl font-black text-slate-800 mb-2">چه نوع کسب‌وکاری می‌خواهید؟</h2>
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
                          <p className="text-xs text-slate-500 leading-relaxed">چندین فروشنده محصولات خود را در پلتفرم شما می‌فروشند. شما مدیر بازارچه هستید و از فروش هر غرفه کمیسیون می‌گیرید.</p>
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
                          <p className="text-xs text-slate-500 leading-relaxed">فروشگاه اختصاصی تک‌برندی با دامنه شخصی. شما صاحب برند هستید و محصولات خود را مستقیماً می‌فروشید.</p>
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
                    <h2 className="text-xl font-black text-slate-800 mb-2">اطلاعات {type === 'marketplace' ? 'بازارچه' : 'فروشگاه'}</h2>
                    <p className="text-xs text-slate-400 font-bold">نام و آدرس فروشگاه خود را وارد کنید</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-600 block mb-1.5">
                        نام {type === 'marketplace' ? 'بازارچه' : 'فروشگاه'}
                      </label>
                      <input value={tenantName} onChange={e => handleNameChange(e.target.value)}
                        placeholder={type === 'marketplace' ? 'مثال: بازار طلای تهران' : 'مثال: گالری طلای مینا'}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-right focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-600 block mb-1.5">آدرس اینترنتی (slug)</label>
                      <input value={tenantSlug} onChange={e => setTenantSlug(e.target.value.replace(/[^a-z0-9-]/g, ''))}
                        placeholder="my-store"
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-left focus:outline-none focus:border-amber-500 font-mono" dir="ltr" />
                      <p className="text-[10px] text-slate-400 mt-1">فقط حروف انگلیسی، اعداد و خط تیره. مثال: my-gold-store</p>
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-600 block mb-1.5">دامنه اختصاصی (اختیاری)</label>
                      <input value={domain} onChange={e => setDomain(e.target.value)}
                        placeholder="my-store.com"
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-left focus:outline-none focus:border-amber-500 font-mono" dir="ltr" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Admin account */}
              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 mb-2">حساب مدیریت</h2>
                    <p className="text-xs text-slate-400 font-bold">اطلاعات مدیر {type === 'marketplace' ? 'بازارچه' : 'فروشگاه'} را وارد کنید</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-slate-600 block mb-1.5">نام مدیر</label>
                      <input value={adminName} onChange={e => setAdminName(e.target.value)}
                        placeholder="نام و نام خانوادگی"
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-right focus:outline-none focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-600 block mb-1.5">شماره موبایل</label>
                      <input value={adminPhone} onChange={e => setAdminPhone(e.target.value.replace(/\D/g, '').substring(0, 11))}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-left focus:outline-none focus:border-amber-500 font-mono" dir="ltr" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-600 block mb-1.5">رمز عبور</label>
                      <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                        placeholder="حداقل ۶ کاراکتر"
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-left focus:outline-none focus:border-amber-500" dir="ltr" />
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
                {step < 3 ? (
                  <button onClick={() => setStep(s => s + 1)}
                    disabled={step === 1 ? !canNextStep1 : !canNextStep2}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white py-3 rounded-xl text-sm font-black shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                    بعدی <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading || !canNextStep3}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white py-3 rounded-xl text-sm font-black shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                    {loading ? 'در حال ساخت...' : `ساخت ${type === 'marketplace' ? 'بازارچه' : 'فروشگاه'}`}
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
