import React from 'react';
import { apiAssetUrl } from '../utils';
import { formatToman, formatGram, toPersianDigits } from '../utils';

interface Props {
  platformName: string;
  platformLogo: string;
  platformSubtitle: string;
  brandColor: string;
  silverColor: string;
  onLogin: (phone: string, password: string) => void;
  onRequestOtp: (phone: string) => void;
  onVerifyOtp: (phone: string, code: string) => void;
  loginMode: 'password' | 'otp';
  setLoginMode: (mode: 'password' | 'otp') => void;
  loginPhone: string;
  setLoginPhone: (phone: string) => void;
  loginPassword: string;
  setLoginPassword: (password: string) => void;
  loginError: string;
  setLoginError: (error: string) => void;
  otpCode: string;
  setOtpCode: (code: string) => void;
  otpSent: boolean;
  setOtpSent: (sent: boolean) => void;
  otpLoading: boolean;
  setOtpLoading: (loading: boolean) => void;
}

export default function LoginPage(props: Props) {
  const {
    platformName,
    platformLogo,
    platformSubtitle,
    brandColor,
    silverColor,
    onLogin,
    onRequestOtp,
    onVerifyOtp,
    loginMode,
    setLoginMode,
    loginPhone,
    setLoginPhone,
    loginPassword,
    setLoginPassword,
    loginError,
    setLoginError,
    otpCode,
    setOtpCode,
    otpSent,
    setOtpSent,
    otpLoading,
    setOtpLoading,
  } = props;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    onLogin(loginPhone, loginPassword);
  };

  const handleRequestOtp = () => {
    if (loginPhone.length !== 11) {
      setLoginError('شماره موبایل باید ۱۱ رقم باشد');
      return;
    }
    setLoginError('');
    setOtpLoading(true);
    onRequestOtp(loginPhone);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    onVerifyOtp(loginPhone, otpCode);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="text-center mb-6">
          <img src={platformLogo} alt={platformName} className="w-16 h-16 mx-auto rounded-xl mb-3" />
          <h1 className="text-lg font-black text-slate-800">{platformName}</h1>
          <p className="text-xs text-slate-400 font-bold mt-1">{platformSubtitle}</p>
        </div>

        {/* Login mode tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => { setLoginMode('password'); setLoginError(''); setOtpSent(false); }}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${loginMode === 'password' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
          >
            رمز عبور
          </button>
          <button
            onClick={() => { setLoginMode('otp'); setLoginError(''); setOtpSent(false); }}
            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${loginMode === 'otp' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
          >
            کد یکبار مصرف
          </button>
        </div>

        {/* Phone input (shared) */}
        <div className="mb-4">
          <label className="text-xs font-black text-slate-600 block mb-1.5">شماره موبایل</label>
          <input
            type="text"
            value={loginPhone}
            onChange={e => { setLoginPhone(e.target.value); setOtpSent(false); }}
            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-amber-600 font-mono"
            dir="ltr"
          />
        </div>

        {loginMode === 'password' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-600 block mb-1.5">رمز عبور</label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-left focus:outline-none focus:border-amber-600"
                dir="ltr"
              />
            </div>
            {loginError && <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl">{loginError}</p>}
            <button
              type="submit"
              className="w-full text-white py-3.5 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all"
              style={{ background: `linear-gradient(135deg, ${props.brandColor}, ${props.brandColor}dd)` }}
            >
              ورود به {platformName}
            </button>
            <p className="text-center text-[10px] text-slate-400 font-bold">demo: 09123456789 / password</p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {!otpSent ? (
              <>
                {loginError && <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl">{loginError}</p>}
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={otpLoading}
                  className="w-full text-white py-3.5 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${props.brandColor}, ${props.brandColor}dd)` }}
                >
                  {otpLoading ? 'در حال ارسال...' : 'دریافت کد تأیید'}
                </button>
                <p className="text-center text-[10px] text-slate-400 font-bold">کد به شماره شما ارسال می‌شود</p>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-black text-slate-600 block mb-1.5">کد تأیید ۶ رقمی</label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="111111"
                    maxLength={6}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm text-slate-800 text-center focus:outline-none focus:border-amber-600 font-mono tracking-widest"
                    dir="ltr"
                  />
                </div>
                {loginError && <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl">{loginError}</p>}
                <button
                  type="submit"
                  className="w-full text-white py-3.5 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all"
                  style={{ background: `linear-gradient(135deg, ${props.brandColor}, ${props.brandColor}dd)` }}
                >
                  تأیید و ورود
                </button>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtpCode(''); setLoginError(''); }}
                  className="w-full text-center text-[11px] text-slate-400 font-bold hover:text-slate-600"
                >
                  ارسال مجدد کد
                </button>
                <p className="text-center text-[10px] text-slate-400 font-bold">کد تست: 111111</p>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}