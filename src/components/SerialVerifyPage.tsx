import React, { useEffect, useState } from 'react';
import { ArrowLeft, Shield, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface SerialVerifyData {
  serial_number: string;
  product_type: string;
  metal_type: string;
  weight_grams: number;
  purity: number;
  status: string;
  is_authenticated: boolean;
  has_certificate: boolean;
  certificate_number?: string;
  current_owner_type?: string;
  authenticated_at?: string;
}

interface SerialVerifyPageProps {
  hash: string;
  onBack: () => void;
}

export default function SerialVerifyPage({ hash, onBack }: SerialVerifyPageProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SerialVerifyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySerial = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE}/verify/${hash}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        const result = await response.json();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.message || 'سریال یافت نشد');
        }
      } catch (err: any) {
        setError(err.message || 'خطا در بررسی سریال');
      } finally {
        setLoading(false);
      }
    };

    verifySerial();
  }, [hash]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'melted': return 'bg-red-100 text-red-800';
      case 'lost': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'فعال';
      case 'sold': return 'فروش رفته';
      case 'melted': return 'ذوب شده';
      case 'lost': return 'مفقود';
      case 'stolen': return 'سرقت شده';
      default: return status;
    }
  };

  const getProductTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ring: 'انگشتر',
      necklace: 'گردنبند',
      bracelet: 'دستبند',
      earring: 'گوشواره',
      pendant: 'آویز',
      coin: 'سکه',
      bar: 'شمش',
      chain: 'زنجیر',
      bangle: 'دستبند بسته',
      brooch: 'سنجاق سینه',
    };
    return labels[type] || type;
  };

  const getMetalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      gold: 'طلا',
      silver: 'نقره',
      platinum: 'پلاتین',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">در حال بررسی سریال...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">سریال یافت نشد</h2>
          <p className="text-gray-600 mb-6">{error || 'اطلاعاتی برای این سریال وجود ندارد'}</p>
          <button
            onClick={onBack}
            className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          بازگشت
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">بررسی اصالت سریال</h1>
              {data.is_authenticated ? (
                <ShieldCheck className="w-12 h-12" />
              ) : (
                <Shield className="w-12 h-12 opacity-50" />
              )}
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="text-sm opacity-90 mb-1">شماره سریال</p>
              <p className="text-xl font-mono font-bold">{data.serial_number}</p>
            </div>
          </div>

          {/* Authentication Status */}
          <div className="p-6 border-b">
            <div className={`inline-flex items-center px-4 py-2 rounded-full font-medium ${
              data.is_authenticated
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {data.is_authenticated ? (
                <>
                  <ShieldCheck className="w-5 h-5 ml-2" />
                  اصالت تأیید شده
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 ml-2" />
                  اصالت تأیید نشده
                </>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">مشخصات محصول</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">نوع محصول</p>
                <p className="font-medium text-gray-900">{getProductTypeLabel(data.product_type)}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">جنس</p>
                <p className="font-medium text-gray-900">{getMetalTypeLabel(data.metal_type)}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">وزن (گرم)</p>
                <p className="font-medium text-gray-900">{data.weight_grams.toFixed(2)}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">عیار</p>
                <p className="font-medium text-gray-900">{data.purity}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">وضعیت</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(data.status)}`}>
                {getStatusLabel(data.status)}
              </span>
            </div>

            {data.has_certificate && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium mb-1">✓ دارای گواهی اصالت</p>
                {data.certificate_number && (
                  <p className="text-sm text-green-700">شماره گواهی: {data.certificate_number}</p>
                )}
              </div>
            )}

            {data.authenticated_at && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">تاریخ تأیید اصالت</p>
                <p className="font-medium text-gray-900">
                  {new Date(data.authenticated_at).toLocaleDateString('fa-IR')}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-600">
              این اطلاعات توسط سیستم ردیابی سریال طلای طَلَنَا ارائه شده است
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
