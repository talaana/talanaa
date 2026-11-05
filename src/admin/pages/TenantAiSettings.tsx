import { useState, useEffect } from 'react';
import { admin } from '../api';
import { Sparkles, Save, AlertCircle, CheckCircle, Info, X, Link2, Unlink } from 'lucide-react';

interface TenantAiConfig {
  mode: string;
  enabled: boolean;
  openrouter_api_key?: string;
  openai_api_key?: string;
}

export default function TenantAiSettings() {
  const [config, setConfig] = useState<TenantAiConfig>({
    mode: 'chatgpt_oauth',
    enabled: true,
  });
  const [chatgptConnected, setChatgptConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadConfig();
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = () => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    if (params.get('oauth_success') === '1') {
      setChatgptConnected(true);
      setMessage({ type: 'success', text: 'ChatGPT با موفقیت متصل شد!' });
      window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
    }
    const oauthError = params.get('oauth_error');
    if (oauthError) {
      setMessage({ type: 'error', text: 'خطا در اتصال ChatGPT: ' + oauthError });
      window.history.replaceState({}, '', window.location.pathname + window.location.hash.split('?')[0]);
    }
  };

  const loadConfig = async () => {
    try {
      const data = await admin.aiSettings.getOwn();
      setConfig(data.settings);
      setChatgptConnected(data.chatgpt_connected);
      setLoading(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'خطا در بارگذاری تنظیمات: ' + error.message });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await admin.aiSettings.updateOwn(config);
      setMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره شد!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'خطا در ذخیره تنظیمات: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleConnectChatGpt = async () => {
    try {
      const result = await admin.aiSettings.connectChatGptOwn();
      if (result.authorization_url) {
        window.open(result.authorization_url, '_blank', 'width=600,height=700');
        setMessage({ type: 'success', text: 'پنجره لاگین باز شد. لطفاً وارد شوید.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDisconnectChatGpt = async () => {
    try {
      await admin.aiSettings.disconnectChatGptOwn();
      setChatgptConnected(false);
      setMessage({ type: 'success', text: 'ChatGPT قطع شد.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-400">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          تنظیمات هوش مصنوعی
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          نحوه استفاده از AI برای ساخت قالب فاکتور را تنظیم کنید
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm font-bold flex-1 ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.text}
          </p>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-900 mb-1">پیشنهاد ما</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            حالت پیش‌فرض (ChatGPT) رایگان است و نیازی به API key ندارد.
            فقط کافیست یک بار با حساب ChatGPT خود وارد شوید.
          </p>
        </div>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-bold text-slate-800">فعال‌سازی هوش مصنوعی</label>
            <p className="text-xs text-slate-500 mt-1">آیا می‌خواهید از AI برای ساخت قالب فاکتور استفاده کنید؟</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={e => setConfig({...config, enabled: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>

      {/* Mode Selection */}
      {config.enabled && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">حالت هوش مصنوعی</label>
            <select
              value={config.mode}
              onChange={e => setConfig({...config, mode: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="chatgpt_oauth">ChatGPT (رایگان - پیشنهادی)</option>
              <option value="openrouter_free">OpenRouter (رایگان با محدودیت)</option>
              <option value="openai_api">OpenAI API (پولی - کیفیت بالا)</option>
            </select>
          </div>

          {/* ChatGPT OAuth */}
          {config.mode === 'chatgpt_oauth' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-bold text-green-900 mb-2">رایگان و ساده</p>
              <p className="text-xs text-green-700 mb-3">
                از اشتراک ChatGPT خودتان استفاده می‌شود. فقط یک بار وارد شوید.
              </p>
              {chatgptConnected ? (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    ChatGPT متصل است
                  </span>
                  <button
                    onClick={handleDisconnectChatGpt}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-bold"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    قطع اتصال
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectChatGpt}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  اتصال به ChatGPT
                </button>
              )}
            </div>
          )}

          {/* OpenRouter API Key */}
          {config.mode === 'openrouter_free' && (
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                OpenRouter API Key
                <span className="text-xs font-normal text-slate-500 mr-2">(اختیاری)</span>
              </label>
              <input
                type="password"
                value={config.openrouter_api_key || ''}
                onChange={e => setConfig({...config, openrouter_api_key: e.target.value})}
                placeholder="sk-or-v1-..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                dir="ltr"
              />
              <p className="text-xs text-slate-500 mt-2">
                بدون کلید هم کار می‌کند (با محدودیت روزانه). کلید خودتان را وارد کنید برای استفاده بیشتر.
              </p>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-purple-600 hover:underline"
              >
                دریافت API key از OpenRouter
              </a>
            </div>
          )}

          {/* OpenAI API Key */}
          {config.mode === 'openai_api' && (
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                OpenAI API Key
                <span className="text-xs font-normal text-red-500 mr-2">(الزامی - هزینه دارد)</span>
              </label>
              <input
                type="password"
                value={config.openai_api_key || ''}
                onChange={e => setConfig({...config, openai_api_key: e.target.value})}
                placeholder="sk-..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                dir="ltr"
              />
              <p className="text-xs text-slate-500 mt-2">
                این حالت بر اساس مصرف هزینه دارد. فقط در صورت نیاز استفاده کنید.
              </p>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-purple-600 hover:underline"
              >
                دریافت API key از OpenAI
              </a>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg text-sm font-bold disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </button>
      </div>
    </div>
  );
}
