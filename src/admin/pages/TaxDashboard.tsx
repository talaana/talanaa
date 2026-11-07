import React, { useState, useEffect, useCallback } from 'react';
import { admin } from '../api';
import TaxProfileView from './tax/TaxProfileView';
import { formatToman, toPersianDigits } from '../../utils';
import {
  Receipt, FileText, Download, Send, CheckCircle, XCircle, Clock,
  AlertTriangle, RefreshCw, Calculator, FileSpreadsheet, Calendar,
  TrendingUp, Shield, Eye,
} from 'lucide-react';

type Tab = 'overview' | 'electronic' | 'reports' | 'profile';

interface VatCalcResult {
  items: Array<{
    gold_value: number;
    wage_amount: number;
    profit_amount: number;
    commission_amount: number;
    vat_taxable_amount: number;
    vat_exempt_amount: number;
    vat_amount: number;
    total: number;
  }>;
  summary: {
    total_gold_value: number;
    total_wage: number;
    total_profit: number;
    total_commission: number;
    total_vat_taxable: number;
    total_vat_exempt: number;
    total_vat: number;
    grand_total: number;
  };
  vat_rate: number;
}

interface ElectronicInvoice {
  electronic_invoice_id: number;
  invoice_id: number;
  invoice_number: string;
  contact_name: string;
  status: string;
  total_amount: number;
  vat_amount: number;
  submission_id: string;
  reference_number: string;
  receipt_code: string;
  submitted_at: string;
  accepted_at: string;
}

interface QuarterlyReport {
  tax_period_id: number;
  type: string;
  year: number;
  quarter: number;
  start_date: string;
  end_date: string;
  summary: {
    total_sales: number;
    total_purchases: number;
    total_vat_taxable: number;
    total_vat_exempt: number;
    total_vat_amount: number;
    invoice_count: number;
  };
  status: string;
  invoices_count: number;
}

export default function AdminTaxDashboard() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg lg:text-xl font-black text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            سامانه مؤدیان و مالیات
          </h2>
          <p className="text-xs text-slate-400 mt-1">مدیریت مالیات بر ارزش افزوده و ارسال صورتحساب الکترونیکی</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 rounded-xl p-1">
        {([
          ['overview', 'محاسبه VAT', Calculator],
          ['electronic', 'فاکتورهای الکترونیکی', FileText],
          ['reports', 'گزارشات فصلی', TrendingUp],
          ['profile', 'پروفایل مالیاتی', Shield],
        ] as [Tab, string, React.FC<any>][]).map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === id ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <VatCalculatorView />}
      {tab === 'electronic' && <ElectronicInvoicesView />}
      {tab === 'reports' && <ReportsView />}
      {tab === 'profile' && <TaxProfileView />}
    </div>
  );
}

// ==================== VAT CALCULATOR ====================

function VatCalculatorView() {
  const [items, setItems] = useState([
    { description: '', weight_grams: '', tablo_price: '', wage_percentage: '12', profit_percentage: '7', commission_amount: '0' },
  ]);
  const [result, setResult] = useState<VatCalcResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addItem = () => {
    setItems([...items, { description: '', weight_grams: '', tablo_price: '', wage_percentage: '12', profit_percentage: '7', commission_amount: '0' }]);
  };

  const removeItem = (i: number) => {
    if (items.length > 1) setItems(items.filter((_, idx) => idx !== i));
  };

  const updateItem = (i: number, field: string, value: string) => {
    const copy = [...items];
    (copy[i] as any)[field] = value;
    setItems(copy);
  };

  const calculate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        items: items.map(i => ({
          description: i.description || 'آیتم',
          weight_grams: parseFloat(i.weight_grams) || undefined,
          tablo_price: parseInt(i.tablo_price) || undefined,
          wage_percentage: parseFloat(i.wage_percentage) || undefined,
          profit_percentage: parseFloat(i.profit_percentage) || undefined,
          commission_amount: parseInt(i.commission_amount) || undefined,
        })),
      };
      const res = await admin.tax.calculateVat(payload);
      setResult(res.data);
    } catch (e: any) {
      setError(e.message || 'خطا در محاسبه');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-600" />
          محاسبه‌گر VAT
        </h3>

        {items.map((item, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-4 mb-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600">قلم {toPersianDigits(i + 1)}</span>
              {items.length > 1 && (
                <button onClick={() => removeItem(i)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">حذف</button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">توضیحات</label>
                <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500" placeholder="مثلاً: انگشتر طلا" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">وزن (گرم)</label>
                <input type="number" step="0.01" value={item.weight_grams} onChange={e => updateItem(i, 'weight_grams', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-mono focus:outline-none focus:border-amber-500" placeholder="10.5" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">قیمت تابلو (ریال/گرم)</label>
                <input type="number" value={item.tablo_price} onChange={e => updateItem(i, 'tablo_price', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-mono focus:outline-none focus:border-amber-500" placeholder="8650000" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">اجرت (٪)</label>
                <input type="number" step="0.1" value={item.wage_percentage} onChange={e => updateItem(i, 'wage_percentage', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-mono focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">سود (٪)</label>
                <input type="number" step="0.1" value={item.profit_percentage} onChange={e => updateItem(i, 'profit_percentage', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-mono focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">حق‌العمل (تومان)</label>
                <input type="number" value={item.commission_amount} onChange={e => updateItem(i, 'commission_amount', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-mono focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-2 mt-3">
          <button onClick={addItem} className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
            + افزودن قلم
          </button>
          <button onClick={calculate} disabled={loading}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            محاسبه VAT
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            نتیجه محاسبه
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg mr-2">
              نرخ VAT: {toPersianDigits(result.vat_rate)}٪
            </span>
          </h3>

          {result.items.map((item, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm font-bold text-slate-700 mb-2">قلم {toPersianDigits(i + 1)}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-slate-400 block text-xs">ارزش طلا (معاف)</span><span className="font-mono font-bold text-slate-700">{formatToman(item.gold_value)}</span></div>
                <div><span className="text-slate-400 block text-xs">اجرت (مشمول)</span><span className="font-mono font-bold text-blue-700">{formatToman(item.wage_amount)}</span></div>
                <div><span className="text-slate-400 block text-xs">سود (مشمول)</span><span className="font-mono font-bold text-blue-700">{formatToman(item.profit_amount)}</span></div>
                <div><span className="text-slate-400 block text-xs">حق‌العمل</span><span className="font-mono font-bold text-slate-700">{formatToman(item.commission_amount)}</span></div>
                <div><span className="text-slate-400 block text-xs">مجموع مشمول</span><span className="font-mono font-bold text-amber-700">{formatToman(item.vat_taxable_amount)}</span></div>
                <div><span className="text-slate-400 block text-xs">مالیات</span><span className="font-mono font-bold text-rose-700">{formatToman(item.vat_amount)}</span></div>
                <div className="col-span-2"><span className="text-slate-400 block text-xs">جمع کل قلم</span><span className="font-mono font-bold text-emerald-700 text-lg">{formatToman(item.total)}</span></div>
              </div>
            </div>
          ))}

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
            <h4 className="font-black text-amber-800 mb-3">جمع کل فاکتور</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><span className="text-amber-600 block text-xs">ارزش طلا (معاف)</span><span className="font-mono font-bold text-amber-900">{formatToman(result.summary.total_vat_exempt)}</span></div>
              <div><span className="text-amber-600 block text-xs">مشمول VAT</span><span className="font-mono font-bold text-amber-900">{formatToman(result.summary.total_vat_taxable)}</span></div>
              <div><span className="text-amber-600 block text-xs">مالیات بر ارزش افزوده</span><span className="font-mono font-bold text-rose-700">{formatToman(result.summary.total_vat)}</span></div>
              <div><span className="text-amber-600 block text-xs">مبلغ نهایی</span><span className="font-mono font-black text-emerald-700 text-lg">{formatToman(result.summary.grand_total)}</span></div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <Shield className="w-4 h-4 inline ml-1" />
            طبق قانون مالیات بر ارزش افزوده ایران، مالیات فقط به اجرت، سود فروشنده و حق‌العمل تعلق می‌گیرد و اصل طلا معاف است.
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== ELECTRONIC INVOICES ====================

function ElectronicInvoicesView() {
  const [invoices, setInvoices] = useState<ElectronicInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, last_page: 1 });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (filterStatus) params.status = filterStatus;
      const res = await admin.tax.electronicInvoices(params);
      setInvoices(res.data.data || []);
      setPagination({ total: res.data.total, current_page: res.data.current_page, last_page: res.data.last_page });
    } catch {}
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const statusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: React.FC<any>; label: string }> = {
      pending: { color: 'bg-slate-100 text-slate-600', icon: Clock, label: 'در انتظار' },
      submitted: { color: 'bg-blue-100 text-blue-700', icon: Send, label: 'ارسال شده' },
      accepted: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'تأیید شده' },
      rejected: { color: 'bg-rose-100 text-rose-700', icon: XCircle, label: 'رد شده' },
      failed: { color: 'bg-rose-100 text-rose-700', icon: AlertTriangle, label: 'خطا' },
    };
    const cfg = map[status] || map.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.color}`}>
        <Icon className="w-3 h-3" /> {cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500">
            <option value="">همه وضعیت‌ها</option>
            <option value="pending">در انتظار</option>
            <option value="submitted">ارسال شده</option>
            <option value="accepted">تأیید شده</option>
            <option value="rejected">رد شده</option>
            <option value="failed">خطا</option>
          </select>
        </div>
        <button onClick={() => load(pagination.current_page)}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
          <RefreshCw className="w-4 h-4" /> بروزرسانی
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">هنوز فاکتور الکترونیکی ارسال نشده است.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">شماره فاکتور</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">مشتری</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">وضعیت</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">مبلغ</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">VAT</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">کد ارسال</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">تاریخ ارسال</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.electronic_invoice_id} className="border-b border-slate-50 hover:bg-slate-25">
                    <td className="py-3 px-4 font-mono text-xs">{toPersianDigits(inv.invoice_number)}</td>
                    <td className="py-3 px-4">{inv.contact_name || '-'}</td>
                    <td className="py-3 px-4">{statusBadge(inv.status)}</td>
                    <td className="py-3 px-4 font-mono">{formatToman(inv.total_amount)}</td>
                    <td className="py-3 px-4 font-mono text-rose-600">{formatToman(inv.vat_amount)}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-500">{inv.submission_id || '-'}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">{inv.submitted_at ? new Date(inv.submitted_at).toLocaleDateString('fa-IR') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.last_page > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => load(p)}
              className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${p === pagination.current_page ? 'bg-amber-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {toPersianDigits(p)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== REPORTS ====================

function ReportsView() {
  const [year, setYear] = useState(2026);
  const [quarter, setQuarter] = useState(1);
  const [report, setReport] = useState<QuarterlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const downloadReport = async (format: 'pdf' | 'excel') => {
    if (!report) return;
    setDownloading(true);
    setDownloadError('');
    try {
      if (format === 'pdf') {
        await admin.tax.downloadReportPdf(report.tax_period_id);
      } else {
        await admin.tax.downloadReportExcel(report.tax_period_id);
      }
    } catch (e: any) {
      setDownloadError(e.message || 'خطا در دانلود فایل');
    } finally {
      setDownloading(false);
    }
  };

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await admin.tax.quarterlyReport({ year, quarter });
      setReport(res.data);
    } catch (e: any) {
      setError(e.message || 'خطا در تولید گزارش');
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async () => {
    if (!report) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await admin.tax.submitReport({ tax_period_id: report.tax_period_id });
      setReport({ ...report, status: res.data?.status || 'submitted' });
    } catch (e: any) {
      setError(e.message || 'خطا در ارسال گزارش');
    } finally {
      setSubmitting(false);
    }
  };

  const quarterNames = ['', 'بهار', 'تابستان', 'پاییز', 'زمستان'];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600" />
          تولید گزارش فصلی VAT
        </h3>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">سال</label>
            <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || 2026)}
              className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-mono w-24 focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">فصل</label>
            <select value={quarter} onChange={e => setQuarter(parseInt(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500">
              <option value={1}>بهار</option>
              <option value={2}>تابستان</option>
              <option value={3}>پاییز</option>
              <option value={4}>زمستان</option>
            </select>
          </div>
          <button onClick={generate} disabled={loading}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            تولید گزارش
          </button>
        </div>
      </div>

      {(error || downloadError) && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error || downloadError}
        </div>
      )}

      {report && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                گزارش {quarterNames[report.quarter]} {toPersianDigits(report.year)}
              </h3>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                report.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                report.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                report.status === 'calculated' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {report.status === 'accepted' ? 'تأیید شده' :
                 report.status === 'submitted' ? 'ارسال شده' :
                 report.status === 'calculated' ? 'محاسبه شده' : report.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <span className="text-xs text-slate-400 block">جمع فروش</span>
                <span className="font-mono font-bold text-slate-800">{formatToman(report.summary.total_sales)}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <span className="text-xs text-slate-400 block">جمع خرید</span>
                <span className="font-mono font-bold text-slate-800">{formatToman(report.summary.total_purchases)}</span>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <span className="text-xs text-blue-400 block">مشمول VAT</span>
                <span className="font-mono font-bold text-blue-800">{formatToman(report.summary.total_vat_taxable)}</span>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <span className="text-xs text-amber-500 block">معاف</span>
                <span className="font-mono font-bold text-amber-800">{formatToman(report.summary.total_vat_exempt)}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-5 border border-rose-200 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-rose-500 block">مالیات بر ارزش افزوده قابل پرداخت</span>
                  <span className="font-mono font-black text-rose-800 text-2xl">{formatToman(report.summary.total_vat_amount)}</span>
                </div>
                <div className="text-left">
                  <span className="text-xs text-rose-500 block">تعداد فاکتورها</span>
                  <span className="font-mono font-bold text-rose-700">{toPersianDigits(report.invoices_count)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {(report.status === 'calculated' || report.status === 'open') && (
                <button onClick={submitReport} disabled={submitting}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  ارسال به سامانه مؤدیان
                </button>
              )}
              <button onClick={() => downloadReport('pdf')} disabled={downloading}
                className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                <Download className="w-4 h-4" /> دانلود PDF
              </button>
              <button onClick={() => downloadReport('excel')} disabled={downloading}
                className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                <FileSpreadsheet className="w-4 h-4" /> دانلود Excel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
