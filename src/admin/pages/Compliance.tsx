import React, { useState, useEffect, useCallback } from 'react';
import { amlApi } from '../api';
import { toPersianDigits } from '../../utils';
import {
  Search, Shield, AlertTriangle, FileText, Settings, Eye, Upload,
  CheckCircle, XCircle, Download, Plus, Trash2, X, RefreshCw,
} from 'lucide-react';

type Tab = 'customers' | 'alerts' | 'reports' | 'settings';

const tabLabels: Record<Tab, string> = {
  customers: 'مشتریان',
  alerts: 'هشدارها',
  reports: 'گزارش‌ها',
  settings: 'تنظیمات',
};

const tabIcons: Record<Tab, React.FC<any>> = {
  customers: Shield,
  alerts: AlertTriangle,
  reports: FileText,
  settings: Settings,
};

// ─── KYC Status Badge ───────────────────────────────────────────────
const kycStatusMap: Record<string, { label: string; cls: string }> = {
  none: { label: 'شروع نشده', cls: 'bg-slate-100 text-slate-500' },
  pending: { label: 'در انتظار', cls: 'bg-amber-100 text-amber-700' },
  approved: { label: 'تأیید شده', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'رد شده', cls: 'bg-rose-100 text-rose-600' },
  expired: { label: 'منقضی', cls: 'bg-slate-100 text-slate-500' },
};

function KycBadge({ status }: { status: string }) {
  const s = kycStatusMap[status] || kycStatusMap.none;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Severity Badge ─────────────────────────────────────────────────
const severityMap: Record<string, { label: string; cls: string }> = {
  low: { label: 'کم', cls: 'bg-slate-100 text-slate-600' },
  medium: { label: 'متوسط', cls: 'bg-amber-100 text-amber-700' },
  high: { label: 'زیاد', cls: 'bg-orange-100 text-orange-600' },
  critical: { label: 'بحرانی', cls: 'bg-rose-100 text-rose-600' },
};

function SeverityBadge({ severity }: { severity: string }) {
  const s = severityMap[severity] || severityMap.low;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Alert Status Badge ─────────────────────────────────────────────
const alertStatusMap: Record<string, { label: string; cls: string }> = {
  open: { label: 'باز', cls: 'bg-rose-100 text-rose-600' },
  reviewing: { label: 'در بررسی', cls: 'bg-amber-100 text-amber-700' },
  closed: { label: 'بسته', cls: 'bg-emerald-100 text-emerald-700' },
};

function AlertStatusBadge({ status }: { status: string }) {
  const s = alertStatusMap[status] || alertStatusMap.open;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Report Status Badge ────────────────────────────────────────────
const reportStatusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: 'پیش‌نویس', cls: 'bg-slate-100 text-slate-600' },
  approved: { label: 'تأیید شده', cls: 'bg-emerald-100 text-emerald-700' },
  filed: { label: 'ثبت ارسال', cls: 'bg-blue-100 text-blue-700' },
  dismissed: { label: 'مختومه', cls: 'bg-slate-100 text-slate-400' },
};

function ReportStatusBadge({ status }: { status: string }) {
  const s = reportStatusMap[status] || reportStatusMap.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function AdminCompliance({ can }: { can: (perm: string) => boolean }) {
  const [tab, setTab] = useState<Tab>('customers');

  if (!can('compliance.view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-slate-500">شما دسترسی به بخش انطباق ندارید.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800">انطباق و احراز هویت (AML/KYC)</h2>
        <p className="text-xs text-slate-400 mt-1">مدیریت احراز هویت مشتریان، هشدارها و گزارش‌های انطباق</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 overflow-x-auto">
        {(Object.keys(tabLabels) as Tab[]).map(t => {
          if (t === 'settings' && !can('compliance.manage')) return null;
          const Icon = tabIcons[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                tab === t
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tabLabels[t]}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'customers' && <CustomersTab can={can} />}
      {tab === 'alerts' && <AlertsTab can={can} />}
      {tab === 'reports' && <ReportsTab can={can} />}
      {tab === 'settings' && can('compliance.manage') && <SettingsTab />}
    </div>
  );
}

// ─── Customers Tab ──────────────────────────────────────────────────
function CustomersTab({ can }: { can: (perm: string) => boolean }) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    amlApi.listContacts(search ? { search } : undefined)
      .then(d => setContacts(d.data || d.contacts || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="جستجو بر اساس نام، موبایل یا کد ملی..."
          className="w-full bg-white border border-slate-100 rounded-xl py-2.5 pr-10 pl-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">در حال بارگذاری...</div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">موردی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-right py-3 px-4 font-bold text-slate-600">نام</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">موبایل</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">کد ملی</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">وضعیت KYC</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{c.full_name || c.name || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{toPersianDigits(c.phone || '—')}</td>
                    <td className="py-3 px-4 text-slate-600">{toPersianDigits(c.national_code || '—')}</td>
                    <td className="py-3 px-4"><KycBadge status={c.kyc_status || 'none'} /></td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedContact(c)}
                        className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" /> جزئیات
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedContact && (
        <ContactDetailModal
          contact={selectedContact}
          can={can}
          onClose={() => setSelectedContact(null)}
          onRefresh={load}
        />
      )}
    </div>
  );
}

// ─── Contact Detail Modal ───────────────────────────────────────────
function ContactDetailModal({ contact, can, onClose, onRefresh }: {
  contact: any;
  can: (perm: string) => boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [kycForm, setKycForm] = useState({ national_code: '', full_name: '', father_name: '', birth_date: '' });
  const [docType, setDocType] = useState('national_card');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    amlApi.getContact(contact.id)
      .then(d => {
        setDetail(d);
        const kyc = d.kyc;
        if (kyc) {
          setKycForm({
            national_code: kyc.national_code || '',
            full_name: kyc.full_name || '',
            father_name: kyc.father_name || '',
            birth_date: kyc.birth_date || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contact.id]);

  const handleInitiateKyc = async () => {
    setActionLoading(true);
    try {
      await amlApi.initiateKyc(contact.id, kycForm);
      onRefresh();
      // Reload detail
      const d = await amlApi.getContact(contact.id);
      setDetail(d);
    } catch {}
    setActionLoading(false);
  };

  const handleUpload = async () => {
    if (!docFile || !detail?.kyc?.id) return;
    setActionLoading(true);
    try {
      await amlApi.uploadDocument(detail.kyc.id, docType, docFile);
      setDocFile(null);
      const d = await amlApi.getContact(contact.id);
      setDetail(d);
    } catch {}
    setActionLoading(false);
  };

  const handleApprove = async () => {
    if (!detail?.kyc?.id) return;
    setActionLoading(true);
    try {
      await amlApi.approveKyc(detail.kyc.id, notes || undefined);
      onRefresh();
      onClose();
    } catch {}
    setActionLoading(false);
  };

  const handleReject = async () => {
    if (!detail?.kyc?.id || !rejectReason) return;
    setActionLoading(true);
    try {
      await amlApi.rejectKyc(detail.kyc.id, rejectReason);
      onRefresh();
      setShowRejectForm(false);
      setRejectReason('');
      const d = await amlApi.getContact(contact.id);
      setDetail(d);
    } catch {}
    setActionLoading(false);
  };

  const kyc = detail?.kyc;
  const documents = kyc?.documents || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800">جزئیات احراز هویت</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contact info */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">نام</span>
            <span className="text-sm font-bold text-slate-800">{contact.full_name || contact.name || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">موبایل</span>
            <span className="text-sm font-bold text-slate-800">{toPersianDigits(contact.phone || '—')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">وضعیت KYC</span>
            <KycBadge status={kyc?.status || contact.kyc_status || 'none'} />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 text-sm py-4">در حال بارگذاری...</div>
        ) : (
          <>
            {/* KYC Form */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700">فرم احراز هویت</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">کد ملی</label>
                  <input
                    value={kycForm.national_code}
                    onChange={e => setKycForm(f => ({ ...f, national_code: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="کد ملی"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">نام و نام خانوادگی</label>
                  <input
                    value={kycForm.full_name}
                    onChange={e => setKycForm(f => ({ ...f, full_name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="نام کامل"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">نام پدر</label>
                  <input
                    value={kycForm.father_name}
                    onChange={e => setKycForm(f => ({ ...f, father_name: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    placeholder="نام پدر"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">تاریخ تولد</label>
                  <input
                    value={kycForm.birth_date}
                    onChange={e => setKycForm(f => ({ ...f, birth_date: e.target.value }))}
                    type="date"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>
              {!kyc && (
                <button
                  onClick={handleInitiateKyc}
                  disabled={actionLoading || !kycForm.national_code || !kycForm.full_name}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-black transition-all"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  شروع فرآیند KYC
                </button>
              )}
            </div>

            {/* Document upload */}
            {kyc && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-700">مدارک</h4>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">نوع مدرک</label>
                    <select
                      value={docType}
                      onChange={e => setDocType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      <option value="national_card">کارت ملی</option>
                      <option value="birth_certificate">شناسنامه</option>
                      <option value="selfie">سلفی</option>
                      <option value="proof_of_address">مدرک سکونت</option>
                      <option value="other">سایر</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 mb-1 block">فایل</label>
                    <input
                      type="file"
                      onChange={e => setDocFile(e.target.files?.[0] || null)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm file:ml-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-700"
                    />
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={actionLoading || !docFile}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-xs font-black transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" /> آپلود
                  </button>
                </div>

                {/* Documents list */}
                {documents.length > 0 && (
                  <div className="space-y-2">
                    {documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">{doc.type}</span>
                          <span className="text-[10px] text-slate-400">{doc.status}</span>
                        </div>
                        <button
                          onClick={() => amlApi.downloadDocument(kyc.id, doc.id)}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Approve / Reject */}
                {can('compliance.review') && kyc.status === 'pending' && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">یادداشت</label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                        placeholder="یادداشت اختیاری..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-black transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> تأیید
                      </button>
                      <button
                        onClick={() => setShowRejectForm(!showRejectForm)}
                        className="flex items-center gap-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-xl text-xs font-black transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" /> رد کردن
                      </button>
                    </div>
                    {showRejectForm && (
                      <div className="flex gap-2">
                        <input
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="دلیل رد..."
                          className="flex-1 bg-rose-50 border border-rose-100 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                        />
                        <button
                          onClick={handleReject}
                          disabled={actionLoading || !rejectReason}
                          className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-black transition-all"
                        >
                          ثبت رد
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Alerts Tab ─────────────────────────────────────────────────────
function AlertsTab({ can }: { can: (perm: string) => boolean }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [reviewingAlert, setReviewingAlert] = useState<any>(null);
  const [decision, setDecision] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = {};
    if (filterStatus) params.status = filterStatus;
    if (filterSeverity) params.severity = filterSeverity;
    amlApi.listAlerts(params)
      .then(d => setAlerts(d.data || d.alerts || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterStatus, filterSeverity]);

  useEffect(() => { load(); }, [load]);

  const handleReview = async () => {
    if (!reviewingAlert || !decision) return;
    setActionLoading(true);
    try {
      await amlApi.reviewAlert(reviewingAlert.id, decision, reviewNotes || undefined);
      setReviewingAlert(null);
      setDecision('');
      setReviewNotes('');
      load();
    } catch {}
    setActionLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border border-slate-100 rounded-xl py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="open">باز</option>
          <option value="reviewing">در بررسی</option>
          <option value="closed">بسته</option>
        </select>
        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value)}
          className="bg-white border border-slate-100 rounded-xl py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          <option value="">همه شدت‌ها</option>
          <option value="low">کم</option>
          <option value="medium">متوسط</option>
          <option value="high">زیاد</option>
          <option value="critical">بحرانی</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">در حال بارگذاری...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">هشداری یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-right py-3 px-4 font-bold text-slate-600">قانون</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">شدت</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">وضعیت</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">مشتری</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">تاریخ</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a: any) => (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{a.rule || a.rule_name || '—'}</td>
                    <td className="py-3 px-4"><SeverityBadge severity={a.severity} /></td>
                    <td className="py-3 px-4"><AlertStatusBadge status={a.status} /></td>
                    <td className="py-3 px-4 text-slate-600">{a.contact_name || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{a.created_at ? new Date(a.created_at).toLocaleDateString('fa-IR') : '—'}</td>
                    <td className="py-3 px-4">
                      {can('compliance.review') && a.status === 'open' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { setReviewingAlert(a); setDecision('close'); }}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg"
                          >
                            بستن
                          </button>
                          <button
                            onClick={() => { setReviewingAlert(a); setDecision('false_positive'); }}
                            className="text-[10px] font-bold text-slate-600 hover:text-slate-700 bg-slate-50 px-2 py-1 rounded-lg"
                          >
                            مثبت کاذب
                          </button>
                          <button
                            onClick={() => { setReviewingAlert(a); setDecision('create_str'); }}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded-lg"
                          >
                            ساخت STR
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReviewingAlert(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">بررسی هشدار</h3>
              <button onClick={() => setReviewingAlert(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
              <div>قانون: <span className="font-bold">{reviewingAlert.rule || reviewingAlert.rule_name}</span></div>
              <div>شدت: <SeverityBadge severity={reviewingAlert.severity} /></div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1 block">یادداشت</label>
              <textarea
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                placeholder="توضیحات..."
              />
            </div>
            <button
              onClick={handleReview}
              disabled={actionLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-black transition-all"
            >
              {actionLoading ? 'در حال پردازش...' : 'ثبت تصمیم'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reports Tab ─────────────────────────────────────────────────────
function ReportsTab({ can }: { can: (perm: string) => boolean }) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filingReport, setFilingReport] = useState<any>(null);
  const [authorityRef, setAuthorityRef] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params: any = {};
    if (filterStatus) params.status = filterStatus;
    if (filterType) params.type = filterType;
    amlApi.listReports(params)
      .then(d => setReports(d.data || d.reports || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterStatus, filterType]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await amlApi.approveReport(id);
      load();
    } catch {}
    setActionLoading(false);
  };

  const handleFile = async () => {
    if (!filingReport || !authorityRef) return;
    setActionLoading(true);
    try {
      await amlApi.fileReport(filingReport.id, authorityRef);
      setFilingReport(null);
      setAuthorityRef('');
      load();
    } catch {}
    setActionLoading(false);
  };

  const handleDismiss = async (id: number) => {
    const reason = prompt('دلیل مختومه کردن:');
    if (!reason) return;
    setActionLoading(true);
    try {
      await amlApi.dismissReport(id, reason);
      load();
    } catch {}
    setActionLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border border-slate-100 rounded-xl py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="draft">پیش‌نویس</option>
          <option value="approved">تأیید شده</option>
          <option value="filed">ثبت ارسال</option>
          <option value="dismissed">مختومه</option>
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="bg-white border border-slate-100 rounded-xl py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          <option value="">همه انواع</option>
          <option value="STR">STR</option>
          <option value="CTR">CTR</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">در حال بارگذاری...</div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">گزارشی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-right py-3 px-4 font-bold text-slate-600">شماره</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">نوع</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">وضعیت</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">مهلت</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">مشتری</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-600">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r: any) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{toPersianDigits(r.report_number || r.id)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.type === 'STR' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-700'}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="py-3 px-4"><ReportStatusBadge status={r.status} /></td>
                    <td className="py-3 px-4 text-slate-600">{r.deadline ? new Date(r.deadline).toLocaleDateString('fa-IR') : '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{r.contact_name || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => amlApi.downloadReportPdf(r.id)}
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-1 rounded-lg"
                        >
                          PDF
                        </button>
                        {can('compliance.review') && r.status === 'draft' && (
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={actionLoading}
                            className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg"
                          >
                            تأیید
                          </button>
                        )}
                        {can('compliance.review') && r.status === 'approved' && (
                          <button
                            onClick={() => setFilingReport(r)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg"
                          >
                            ثبت ارسال
                          </button>
                        )}
                        {can('compliance.review') && r.status === 'draft' && (
                          <button
                            onClick={() => handleDismiss(r.id)}
                            disabled={actionLoading}
                            className="text-[10px] font-bold text-slate-600 hover:text-slate-700 bg-slate-50 px-2 py-1 rounded-lg"
                          >
                            مختومه
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filing modal */}
      {filingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilingReport(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">ثبت ارسال گزارش</h3>
              <button onClick={() => setFilingReport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1 block">شماره مرجع مقام قضایی</label>
              <input
                value={authorityRef}
                onChange={e => setAuthorityRef(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                placeholder="شماره مرجع..."
              />
            </div>
            <button
              onClick={handleFile}
              disabled={actionLoading || !authorityRef}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-black transition-all"
            >
              {actionLoading ? 'در حال پردازش...' : 'ثبت ارسال'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ───────────────────────────────────────────────────
function SettingsTab() {
  const [settings, setSettings] = useState<any>({
    identification_threshold: '',
    cash_threshold: '',
    velocity_daily_limit: '',
    enforce_kyc_block: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    amlApi.getSettings()
      .then(d => {
        setSettings({
          identification_threshold: d.identification_threshold ?? '',
          cash_threshold: d.cash_threshold ?? '',
          velocity_daily_limit: d.velocity_daily_limit ?? '',
          enforce_kyc_block: d.enforce_kyc_block ?? false,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await amlApi.updateSettings({
        identification_threshold: Number(settings.identification_threshold) || 0,
        cash_threshold: Number(settings.cash_threshold) || 0,
        velocity_daily_limit: Number(settings.velocity_daily_limit) || 0,
        enforce_kyc_block: settings.enforce_kyc_block,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">در حال بارگذاری...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 max-w-lg">
      <h3 className="text-sm font-black text-slate-800">تنظیمات انطباق</h3>

      <div>
        <label className="text-[10px] font-bold text-slate-500 mb-1 block">آستانه شناسایی (ریال)</label>
        <input
          type="number"
          value={settings.identification_threshold}
          onChange={e => setSettings((s: any) => ({ ...s, identification_threshold: e.target.value }))}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-500 mb-1 block">آستانه وجه نقد (ریال)</label>
        <input
          type="number"
          value={settings.cash_threshold}
          onChange={e => setSettings((s: any) => ({ ...s, cash_threshold: e.target.value }))}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-500 mb-1 block">محدودیت سرعت روزانه</label>
        <input
          type="number"
          value={settings.velocity_daily_limit}
          onChange={e => setSettings((s: any) => ({ ...s, velocity_daily_limit: e.target.value }))}
          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.enforce_kyc_block}
          onChange={e => setSettings((s: any) => ({ ...s, enforce_kyc_block: e.target.checked }))}
          className="w-4 h-4 rounded border-slate-200 text-amber-600 focus:ring-amber-500"
          id="enforce-kyc-block"
        />
        <label htmlFor="enforce-kyc-block" className="text-sm font-bold text-slate-700 cursor-pointer">
          مسدودسازی مشتریان بدون KYC
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          ذخیره تنظیمات
        </button>
        {saved && <span className="text-xs text-emerald-600 font-bold">ذخیره شد</span>}
      </div>
    </div>
  );
}
