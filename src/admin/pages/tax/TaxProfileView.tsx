import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, KeyRound, Loader2, Save, Shield } from 'lucide-react';
import { admin, type TaxProfile, type TaxProfileUpdate } from '../../api';
import { toPersianDigits } from '../../../utils';

function profileFields(profile: TaxProfile) {
  return {
    economic_code: profile.economic_code ?? '',
    tax_authority_id: profile.tax_authority_id ?? '',
    national_id: profile.national_id ?? '',
    register_number: profile.register_number ?? '',
    vat_rate_override: profile.vat_rate_override == null ? '' : String(profile.vat_rate_override),
    api_base_url: profile.api_base_url ?? '',
  };
}

const inputClass = 'w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50';

export default function TaxProfileView() {
  const [profile, setProfile] = useState<TaxProfile | null>(null);
  const [fields, setFields] = useState<ReturnType<typeof profileFields> | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    admin.tax.profile()
      .then(({ data }) => {
        if (active) {
          setProfile(data);
          setFields(profileFields(data));
        }
      })
      .catch((failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : 'بارگذاری پروفایل ناموفق بود. دوباره تلاش کنید.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [attempt]);

  const save = async (registered?: boolean) => {
    if (!fields || saving) return;
    setMessage('');
    if (profile?.is_registered && registered !== false && !fields.tax_authority_id.trim()) {
      setError('پروفایل ثبت‌شده باید شناسه یکتای حافظه مالیاتی داشته باشد؛ شناسه را وارد کنید یا ابتدا ثبت را لغو کنید.');
      return;
    }
    setSaving(true);
    setError('');
    const data: TaxProfileUpdate = registered === false ? { is_registered: false } : {
      economic_code: fields.economic_code.trim() || null,
      tax_authority_id: fields.tax_authority_id.trim() || null,
      national_id: fields.national_id.trim() || null,
      register_number: fields.register_number.trim() || null,
      vat_rate_override: fields.vat_rate_override === '' ? null : Number(fields.vat_rate_override),
      api_base_url: fields.api_base_url.trim() || null,
      ...(apiKey !== '' ? { api_key: apiKey } : {}),
      ...(registered === true ? { is_registered: true } : {}),
    };
    try {
      const { data: updated } = await admin.tax.updateProfile(data);
      setProfile(updated);
      setFields(profileFields(updated));
      setApiKey('');
      setMessage(registered === true ? 'پروفایل مالیاتی ثبت شد.' : registered === false ? 'ثبت پروفایل لغو شد؛ ارسال صورتحساب غیرفعال است.' : 'تغییرات ذخیره شد.');
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : 'ذخیره پروفایل ناموفق بود. دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div role="status" className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><Loader2 className="w-5 h-5 animate-spin motion-reduce:animate-none" />در حال بارگذاری پروفایل مالیاتی...</div>;
  }

  if (!profile || !fields) {
    return (
      <div className="space-y-4 rounded-2xl border border-red-100 bg-red-50 p-5">
        <p role="alert" className="text-sm text-red-700">{error}</p>
        <button type="button" onClick={() => setAttempt(current => current + 1)} className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2">تلاش دوباره</button>
      </div>
    );
  }

  const updateField = (name: keyof typeof fields, value: string) => {
    setFields({ ...fields, [name]: value });
    setMessage('');
  };

  return (
    <form aria-label="پروفایل مالیاتی" aria-busy={saving} onSubmit={event => { event.preventDefault(); void save(); }} className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-black text-slate-800"><Shield className="h-5 w-5 text-amber-600" />پروفایل مالیاتی فروشگاه</h3>
          <p className="mt-2 text-xs leading-6 text-slate-500">اطلاعات مالیاتی و دسترسی این فروشگاه به سامانه مؤدیان را مدیریت کنید.</p>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${profile.is_registered ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {profile.is_registered ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {profile.is_registered ? 'ثبت‌شده' : 'ثبت‌نشده'}
        </span>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p>}

      <fieldset disabled={saving} className="min-w-0 space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <legend className="sr-only">اطلاعات هویتی و مالیات</legend>
        <h4 className="font-bold text-slate-800">اطلاعات هویتی</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          {([
            ['economic_code', 'کد اقتصادی'],
            ['tax_authority_id', 'شناسه یکتای حافظه مالیاتی'],
            ['national_id', 'شناسه ملی'],
            ['register_number', 'شماره ثبت'],
          ] as const).map(([name, label]) => (
            <div key={name} className="min-w-0">
              <label htmlFor={`tax-profile-${name}`} className="mb-2 block text-xs font-bold text-slate-600">{label}</label>
              <input id={`tax-profile-${name}`} type="text" dir="ltr" maxLength={255} value={fields[name]} onChange={event => updateField(name, event.target.value)} className={inputClass} />
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-4">
          <label htmlFor="tax-profile-vat" className="mb-2 block text-xs font-bold text-slate-600">نرخ اختصاصی VAT (درصد)</label>
          <input id="tax-profile-vat" type="number" dir="ltr" min="0" max="100" step="0.01" value={fields.vat_rate_override} onChange={event => updateField('vat_rate_override', event.target.value)} aria-describedby="tax-profile-vat-help" className={`${inputClass} sm:max-w-48`} />
          <p id="tax-profile-vat-help" className="mt-2 text-xs leading-6 text-slate-500">برای استفاده از نرخ پیش‌فرض، این فیلد را خالی بگذارید.</p>
          <p className="mt-1 text-xs font-bold text-amber-700">نرخ فعلی: {toPersianDigits(profile.effective_vat_rate)}٪</p>
        </div>
      </fieldset>

      <fieldset disabled={saving} className="min-w-0 space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <legend className="sr-only">دسترسی سامانه مؤدیان</legend>
        <h4 className="flex items-center gap-2 font-bold text-slate-800"><KeyRound className="h-4 w-4 text-amber-600" />دسترسی سامانه مؤدیان</h4>
        <div>
          <label htmlFor="tax-profile-api-key" className="mb-2 block text-xs font-bold text-slate-600">کلید API</label>
          <input id="tax-profile-api-key" type="password" dir="ltr" autoComplete="new-password" maxLength={1000} value={apiKey} onChange={event => { setApiKey(event.target.value); setMessage(''); }} aria-describedby="tax-profile-key-help" className={inputClass} />
          <p id="tax-profile-key-help" className="mt-2 text-xs leading-6 text-slate-500">{profile.has_api_key ? 'کلید ذخیره شده است؛ برای تغییر، کلید جدید وارد کنید.' : 'برای ثبت پروفایل، کلید API سامانه مؤدیان را وارد کنید.'}</p>
        </div>
        <details className="border-t border-slate-100 pt-4">
          <summary className="cursor-pointer text-sm font-bold text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2">تنظیمات پیشرفته</summary>
          <div className="mt-4">
            <label htmlFor="tax-profile-api-url" className="mb-2 block text-xs font-bold text-slate-600">آدرس پایه API</label>
            <input id="tax-profile-api-url" type="url" dir="ltr" maxLength={255} value={fields.api_base_url} onChange={event => updateField('api_base_url', event.target.value)} className={inputClass} />
          </div>
        </details>
      </fieldset>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-lg text-xs leading-6 text-slate-500">{profile.is_registered ? 'ارسال صورتحساب برای این فروشگاه فعال است. با لغو ثبت، ارسال صورتحساب متوقف می‌شود.' : 'ذخیره اطلاعات به‌تنهایی ارسال صورتحساب را فعال نمی‌کند؛ برای فعال‌سازی، پروفایل را ثبت کنید.'}</p>
        <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row">
          <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Save className="h-4 w-4" />}ذخیره تغییرات
          </button>
          <button type="button" disabled={saving} onClick={() => void save(!profile.is_registered)} className={`rounded-xl border px-4 py-2.5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${profile.is_registered ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>
            {profile.is_registered ? 'لغو ثبت' : 'ثبت در سامانه مؤدیان'}
          </button>
        </div>
      </div>
    </form>
  );
}
