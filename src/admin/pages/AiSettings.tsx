import { useState, useEffect } from 'react';
import { admin } from '../api';
import { Sparkles, Save, AlertCircle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface TenantAiSettings {
  id: number;
  name: string;
  slug: string;
  chatgpt_connected: boolean;
  ai_settings: {
    mode: string;
    enabled: boolean;
    openrouter_api_key?: string;
    openai_api_key?: string;
  };
}

export default function AiSettings({ isSuperadmin }: { isSuperadmin?: boolean }) {
  const [tenants, setTenants] = useState<TenantAiSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantAiSettings | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Check for OAuth callback messages
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
    const oauthSuccess = urlParams.get('oauth_success');
    const oauthError = urlParams.get('oauth_error');
    
    if (oauthSuccess) {
      setMessage({ type: 'success', text: '✅ ChatGPT با موفقیت متصل شد!' });
      window.location.hash = '#/admin/ai-settings'; // Clean URL
    } else if (oauthError) {
      setMessage({ type: 'error', text: '❌ خطا در اتصال ChatGPT: ' + decodeURIComponent(oauthError) });
      window.location.hash = '#/admin/ai-settings'; // Clean URL
    }
  }, []);

  useEffect(() => {
    if (isSuperadmin) {
      loadTenants();
    }
  }, [isSuperadmin]);

  const loadTenants = async () => {
    try {
      const data = await admin.aiSettings.list();
      setTenants(data);
      setLoading(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'خطا در بارگذاری تنظیمات: ' + error.message });
      setLoading(false);
    }
  };

  const handleSelectTenant = (tenant: TenantAiSettings) => {
    setSelectedTenant(tenant);
    setFormData({
      mode: tenant.ai_settings.mode || 'openrouter_free',
      enabled: tenant.ai_settings.enabled ?? true,
      openrouter_api_key: tenant.ai_settings.openrouter_api_key || '',
      openai_api_key: tenant.ai_settings.openai_api_key || '',
    });
    setMessage(null);
  };

  const handleSave = async () => {
    if (!selectedTenant) return;

    setSaving(true);
    try {
      await admin.aiSettings.update(selectedTenant.id, formData);
      setMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره شد!' });
      loadTenants(); // Refresh list
    } catch (error: any) {
      setMessage({ type: 'error', text: 'خطا در ذخیره تنظیمات: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleConnectChatGpt = async () => {
    if (!selectedTenant) return;

    setConnecting(true);
    try {
      const result = await admin.aiSettings.connectChatGpt(selectedTenant.id);
      if (result.authorization_url) {
        // Open OAuth flow in new window
        window.open(result.authorization_url, '_blank', 'width=600,height=700');
        setMessage({ type: 'success', text: 'پنجره لاگین ChatGPT باز شد. لطفاً وارد شوید و اجازه دسترسی بدهید.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'خطا در شروع فرآیند اتصال: ' + error.message });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectChatGpt = async () => {
    if (!selectedTenant) return;

    if (!confirm('آیا از قطع اتصال ChatGPT مطمئنید؟')) return;

    setConnecting(true);
    try {
      await admin.aiSettings.disconnectChatGpt(selectedTenant.id);
      setMessage({ type: 'success', text: 'ChatGPT با موفقیت قطع شد.' });
      loadTenants(); // Refresh list
      handleSelectTenant(selectedTenant); // Refresh selected tenant
    } catch (error: any) {
      setMessage({ type: 'error', text: 'خطا در قطع اتصال: ' + error.message });
    } finally {
      setConnecting(false);
    }
  };

  if (!isSuperadmin) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">دسترسی محدود</p>
            <p className="text-xs text-amber-700 mt-1">فقط سوپرادمین می‌تواند به تنظیمات AI دسترسی داشته باشد.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          تنظیمات AI
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          مدیریت نحوه استفاده از AI برای تولید قالب فاکتور در هر فروشگاه
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-sm font-bold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.text}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-black text-slate-800">فروشگاه‌ها</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-400">در حال بارگذاری...</div>
              ) : tenants.length === 0 ? (
                <div className="p-8 text-center text-slate-400">هیچ فروشگاهی یافت نشد</div>
              ) : (
                tenants.map(tenant => (
                  <button
                    key={tenant.id}
                    onClick={() => handleSelectTenant(tenant)}
                    className={`w-full text-right p-4 hover:bg-purple-50 transition-colors ${
                      selectedTenant?.id === tenant.id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{tenant.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{tenant.slug}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {tenant.chatgpt_connected && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              ChatGPT متصل
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        tenant.ai_settings.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tenant.ai_settings.enabled ? 'فعال' : 'غیرفعال'}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-2">
          {selectedTenant ? (
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-sm font-black text-slate-800">
                  تنظیمات AI برای «{selectedTenant.name}»
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-slate-800">فعال‌سازی AI</label>
                    <p className="text-xs text-slate-500 mt-1">آیا این فروشگاه می‌تواند از AI استفاده کند؟</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={e => setFormData({...formData, enabled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Mode Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">حالت AI</label>
                  <select
                    value={formData.mode}
                    onChange={e => setFormData({...formData, mode: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="chatgpt_oauth">⭐ ChatGPT OAuth (رایگان - پیشنهادی)</option>
                    <option value="openrouter_free">OpenRouter رایگان</option>
                    <option value="openai_api">OpenAI API (پولی)</option>
                    <option value="claude_cli">Claude CLI (محلی)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">
                    {formData.mode === 'chatgpt_oauth' && 'استفاده از اشتراک ChatGPT کاربر - رایگان، بدون API key'}
                    {formData.mode === 'openrouter_free' && 'رایگان با محدودیت روزانه - نیاز به API key رایگان'}
                    {formData.mode === 'openai_api' && 'نیاز به API key - کیفیت بالاتر، هزینه دارد'}
                    {formData.mode === 'claude_cli' && 'استفاده از Claude CLI محلی (اگر نصب شده باشد)'}
                  </p>
                </div>

                {/* ChatGPT OAuth Connection */}
                {formData.mode === 'chatgpt_oauth' && (
                  <div className="bg-gradient-to-l from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-green-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          اتصال به ChatGPT
                        </h3>
                        <p className="text-xs text-green-700 mt-1">
                          با اتصال به ChatGPT، از اشتراک موجود کاربر استفاده می‌شود (رایگان)
                        </p>
                        {selectedTenant?.chatgpt_connected ? (
                          <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-bold">متصل شده ✓</span>
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center gap-2 text-sm text-amber-700">
                            <XCircle className="w-5 h-5" />
                            <span className="font-bold">متصل نشده</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {selectedTenant?.chatgpt_connected ? (
                          <button
                            onClick={handleDisconnectChatGpt}
                            disabled={connecting}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            {connecting ? 'در حال قطع...' : 'قطع اتصال'}
                          </button>
                        ) : (
                          <button
                            onClick={handleConnectChatGpt}
                            disabled={connecting}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {connecting ? 'در حال اتصال...' : 'اتصال به ChatGPT'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-green-600">
                        💡 <strong>نکته:</strong> کاربر یک بار لاگین می‌کند، توکن‌ها ذخیره می‌شوند و خودکار refresh می‌شوند.
                      </p>
                    </div>
                  </div>
                )}

                {/* API Keys (conditional) */}
                {formData.mode === 'openrouter_free' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">OpenRouter API Key</label>
                    <input
                      type="password"
                      value={formData.openrouter_api_key || ''}
                      onChange={e => setFormData({...formData, openrouter_api_key: e.target.value})}
                      placeholder="sk-or-v1-..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                        دریافت API key رایگان از OpenRouter
                      </a>
                    </p>
                  </div>
                )}

                {formData.mode === 'openai_api' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-2">OpenAI API Key</label>
                    <input
                      type="password"
                      value={formData.openai_api_key || ''}
                      onChange={e => setFormData({...formData, openai_api_key: e.target.value})}
                      placeholder="sk-..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg text-sm font-bold disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">یک فروشگاه را از لیست انتخاب کنید</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
