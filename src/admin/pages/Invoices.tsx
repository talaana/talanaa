import React, { useState, useEffect } from 'react';
import { admin, amlApi } from '../api';
import { FileText, Plus, Search, ChevronDown, X, Check, CreditCard, Banknote, ArrowLeftRight, Eye, Edit, Trash2, Send, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { formatToman, toPersianDigits } from '../../utils';
import DocumentPreview from '../components/DocumentPreview';

interface Invoice {
  id: number;
  invoice_number: string;
  type: 'sale' | 'purchase' | 'service';
  status: 'issued' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  issued_at: string;
  paid_at: string | null;
  notes: string | null;
  // VAT breakdown fields (tax_version=2)
  gold_value: number;
  wage_amount: number;
  profit_amount: number;
  commission_amount: number;
  vat_taxable_amount: number;
  vat_exempt_amount: number;
  tax_version: number;
  vat_rate_applied: number;
  electronic_invoice?: {
    id: number;
    status: string;
    submission_id: string | null;
    reference_number: string | null;
  } | null;
  contact?: { id: number; name: string; phone: string; type: string };
  user?: { id: number; name: string };
  items?: Array<{
    description: string;
    amount?: number;
    weight_grams?: number;
    tablo_price?: number;
    wage_percentage?: number;
    profit_percentage?: number;
    commission_amount?: number;
  }>;
  template_snapshot?: {
    blocks: any[];
    styles: Record<string, any> | null;
    template_id: number;
    template_slug: string;
    snapshot_at: string;
  } | null;
}

interface Contact {
  id: number;
  name: string;
  phone: string;
  type: string;
}

const statusLabels: Record<string, string> = {
  issued: 'صادر شده',
  paid: 'پرداخت شده',
  overdue: 'سررسید گذشته',
  cancelled: 'لغو شده',
};

const statusColors: Record<string, string> = {
  issued: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-rose-50 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const typeLabels: Record<string, string> = {
  sale: 'فروش',
  purchase: 'خرید',
  service: 'خدمات',
};

const authorityStatusLabels: Record<string, string> = {
  pending: 'در انتظار',
  submitted: 'ارسال شده',
  accepted: 'تأیید شده',
  rejected: 'رد شده',
  failed: 'خطا',
};

const authorityStatusColors: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  submitted: 'bg-blue-100 text-blue-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  failed: 'bg-rose-100 text-rose-700',
};

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Invoice | null>(null);
  const [showPay, setShowPay] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      const data = await admin.invoices.list(params);
      setInvoices(data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const loadContacts = async () => {
    try {
      const data = await admin.contacts.list();
      setContacts(data.data || data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [filterStatus, filterType]);
  useEffect(() => { loadContacts(); }, []);

  const handlePay = async (amount: number, method: string, accountId?: number) => {
    if (!showPay) return;
    try {
      await admin.invoices.pay(showPay.id, { amount, payment_method: method, payment_account_id: accountId });
      setShowPay(null);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleEdit = async (data: any) => {
    if (!showEdit) return;
    try {
      await admin.invoices.update(showEdit.id, data);
      setShowEdit(null);
      load();
    } catch (e: any) {
      if (e.code === 'aml_kyc_required') {
        setNotice({ tone: 'error', text: 'برای ویرایش فاکتور با این مبلغ، احراز هویت مشتری الزامی است.' });
        // Keep modal open; EditModal's own kycCheck useEffect will show the banner
      } else {
        alert(e.message);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await admin.invoices.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleSendToAuthority = async (invoice: Invoice) => {
    setSendingId(invoice.id);
    setNotice(null);
    try {
      const res = await admin.tax.submitInvoice({ invoice_id: invoice.id });
      setNotice({
        tone: 'success',
        text: `فاکتور ${toPersianDigits(invoice.invoice_number)} با کد ارسال ${toPersianDigits(res.data?.submission_id || '')} به سامانه مؤدیان ارسال شد.`,
      });
      load();
    } catch (e: any) {
      setNotice({ tone: 'error', text: e.message || 'خطا در ارسال به سامانه مؤدیان' });
    } finally {
      setSendingId(null);
    }
  };

  const filtered = invoices.filter(inv => {
    if (search) {
      return inv.invoice_number.includes(search) ||
        inv.contact?.name.includes(search) ||
        inv.contact?.phone.includes(search);
    }
    return true;
  });

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg lg:text-xl font-black text-slate-800">فاکتورها</h2>
          <p className="text-xs text-slate-400 mt-1">مدیریت فاکتورهای فروش و خرید</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" />
          فاکتور جدید
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-sm text-right focus:outline-none focus:border-amber-500" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-amber-500">
          <option value="">همه انواع</option>
          <option value="sale">فروش</option>
          <option value="purchase">خرید</option>
          <option value="service">خدمات</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-amber-500">
          <option value="">همه وضعیت‌ها</option>
          <option value="issued">صادر شده</option>
          <option value="paid">پرداخت شده</option>
          <option value="overdue">سررسید گذشته</option>
          <option value="cancelled">لغو شده</option>
        </select>
      </div>

      {notice && (
        <div className={`rounded-xl p-3.5 text-sm font-bold border flex items-center gap-2 ${
          notice.tone === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {notice.tone === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {notice.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-600">فاکتوری ثبت نشده</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-600">شماره</th>
                  <th className="px-4 py-3 font-bold text-slate-600">نوع</th>
                  <th className="px-4 py-3 font-bold text-slate-600">مخاطب</th>
                  <th className="px-4 py-3 font-bold text-slate-600">مبلغ کل</th>
                  <th className="px-4 py-3 font-bold text-slate-600">مالیات</th>
                  <th className="px-4 py-3 font-bold text-slate-600">پرداخت شده</th>
                  <th className="px-4 py-3 font-bold text-slate-600">وضعیت</th>
                  <th className="px-4 py-3 font-bold text-slate-600">سامانه مؤدیان</th>
                  <th className="px-4 py-3 font-bold text-slate-600">سررسید</th>
                  <th className="px-4 py-3 font-bold text-slate-600">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(inv => (
                  <tr key={inv.id} onClick={() => setSelectedInvoice(inv)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{toPersianDigits(inv.invoice_number)}</td>
                    <td className="px-4 py-3">{typeLabels[inv.type] || inv.type}</td>
                    <td className="px-4 py-3">{inv.contact?.name || '—'}</td>
                    <td className="px-4 py-3 font-bold">{formatToman(inv.total_amount)}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <span className="font-bold text-amber-600">{formatToman(inv.tax_amount || 0)}</span>
                        {inv.tax_version === 2 && (
                          <span className="block text-[10px] text-slate-400">ارزش افزوده</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-emerald-600">{formatToman(inv.paid_amount || 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusColors[inv.status]}`}>
                        {statusLabels[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.electronic_invoice ? (
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${authorityStatusColors[inv.electronic_invoice.status] || authorityStatusColors.pending}`}>
                          {authorityStatusLabels[inv.electronic_invoice.status] || inv.electronic_invoice.status}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.due_date?.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }}
                          className="text-slate-500 hover:text-slate-700 text-xs font-bold flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> مشاهده
                        </button>
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); setShowPay(inv); }}
                              className="text-amber-600 hover:text-amber-700 text-xs font-bold">
                              پرداخت
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setShowEdit(inv); }}
                              className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1">
                              <Edit className="w-3.5 h-3.5" /> ویرایش
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(inv); }}
                              className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1">
                              <Trash2 className="w-3.5 h-3.5" /> حذف
                            </button>
                          </>
                        )}
                        {inv.status !== 'cancelled' &&
                          !(inv.electronic_invoice && ['submitted', 'accepted'].includes(inv.electronic_invoice.status)) && (
                          <button onClick={(e) => { e.stopPropagation(); handleSendToAuthority(inv); }}
                            disabled={sendingId === inv.id}
                            className="text-indigo-600 hover:text-indigo-700 text-xs font-bold flex items-center gap-1 disabled:opacity-50">
                            {sendingId === inv.id
                              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              : <Send className="w-3.5 h-3.5" />}
                            ارسال به مؤدیان
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPay && (
        <PayModal invoice={showPay} onClose={() => setShowPay(null)} onPay={handlePay} />
      )}

      {showCreate && (
        <CreateModal contacts={contacts} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      )}

      {showEdit && (
        <EditModal invoice={showEdit} contacts={contacts} onClose={() => setShowEdit(null)} onSaved={handleEdit} />
      )}

      {deleteConfirm && (
        <DeleteConfirmModal invoice={deleteConfirm} onClose={() => setDeleteConfirm(null)} onDelete={handleDelete} />
      )}

      {selectedInvoice && (
        <DocumentPreview
          kind="invoice"
          document={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}

interface PaymentAccount {
  id: number;
  account_type: 'bank_account' | 'card' | 'wallet';
  bank_name: string | null;
  account_number: string | null;
  card_number: string | null;
  account_holder: string | null;
  is_default: boolean;
}

function PayModal({ invoice, onClose, onPay }: { invoice: Invoice; onClose: () => void; onPay: (amount: number, method: string, accountId?: number) => void }) {
  const remaining = invoice.total_amount - (invoice.paid_amount || 0);
  const [amount, setAmount] = useState(remaining.toString());
  const [method, setMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);

  useEffect(() => {
    if (method === 'transfer') {
      admin.paymentAccounts.list().then(data => {
        setAccounts(data || []);
        const defaultAccount = (data || []).find((a: PaymentAccount) => a.is_default);
        if (defaultAccount) setSelectedAccount(defaultAccount.id);
      }).catch(() => {});
    }
  }, [method]);

  const handlePay = () => {
    onPay(parseInt(amount) || 0, method, method === 'transfer' ? selectedAccount || undefined : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-800">پرداخت فاکتور</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">شماره فاکتور:</span>
            <span className="font-mono font-bold">{toPersianDigits(invoice.invoice_number)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">مبلغ کل:</span>
            <span className="font-bold">{formatToman(invoice.total_amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">پرداخت شده:</span>
            <span className="text-emerald-600 font-bold">{formatToman(invoice.paid_amount || 0)}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-3">
            <span className="text-slate-500">باقی‌مانده:</span>
            <span className="text-amber-600 font-black">{formatToman(remaining)}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-600 mb-2">مبلغ پرداخت (تومان)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-full border border-slate-200 rounded-xl py-3 px-4 text-right focus:outline-none focus:border-amber-500" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-600 mb-3">روش پرداخت</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMethod('cash')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${method === 'cash' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <Banknote className={`w-6 h-6 ${method === 'cash' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className={`text-xs font-bold ${method === 'cash' ? 'text-amber-700' : 'text-slate-600'}`}>نقدی</span>
            </button>
            <button
              onClick={() => setMethod('card')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${method === 'card' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <CreditCard className={`w-6 h-6 ${method === 'card' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className={`text-xs font-bold ${method === 'card' ? 'text-amber-700' : 'text-slate-600'}`}>کارت‌خوان</span>
            </button>
            <button
              onClick={() => setMethod('transfer')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${method === 'transfer' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <ArrowLeftRight className={`w-6 h-6 ${method === 'transfer' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className={`text-xs font-bold ${method === 'transfer' ? 'text-amber-700' : 'text-slate-600'}`}>کارت به کارت</span>
            </button>
          </div>
        </div>

        {method === 'transfer' && accounts.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-600 mb-2">حساب مقصد</label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {accounts.map(account => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccount(account.id)}
                  className={`w-full text-right p-3 rounded-xl border-2 transition-all ${selectedAccount === account.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-800">{account.bank_name || 'حساب بانکی'}</span>
                    {account.is_default && <span className="text-[10px] font-black text-amber-600">پیش‌فرض</span>}
                  </div>
                  {account.card_number && (
                    <div className="font-mono text-xs text-slate-600" dir="ltr">{account.card_number}</div>
                  )}
                  {account.account_holder && (
                    <div className="text-xs text-slate-500 mt-1">{account.account_holder}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {method === 'transfer' && accounts.length === 0 && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700 font-bold">حسابی برای دریافت وجه تعریف نشده است. لطفاً ابتدا در بخش "حساب‌های پرداخت" حساب خود را اضافه کنید.</p>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">انصراف</button>
          <button onClick={handlePay} disabled={method === 'transfer' && !selectedAccount}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Check className="w-4 h-4" />
            پرداخت
          </button>
        </div>
      </div>
    </div>
  );
}

interface InvoiceItem {
  description: string;
  amount: number;
  // Gold-specific fields
  is_gold?: boolean;
  weight_grams?: number;
  tablo_price?: number;
  wage_percentage?: number;
  profit_percentage?: number;
  commission_amount?: number;
}

interface VatBreakdown {
  gold_value: number;
  wage_amount: number;
  profit_amount: number;
  commission_amount: number;
  vat_taxable_amount: number;
  vat_exempt_amount: number;
  vat_amount: number;
  total: number;
}

function CreateModal({ contacts, onClose, onCreated }: { contacts: Contact[]; onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState<'sale' | 'purchase'>('sale');
  const [contactId, setContactId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', amount: 0, is_gold: false }]);
  const [discount, setDiscount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [vatBreakdown, setVatBreakdown] = useState<VatBreakdown[] | null>(null);
  const [vatSummary, setVatSummary] = useState<{ total_vat: number; total_vat_taxable: number; total_vat_exempt: number; grand_total: number } | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [vatError, setVatError] = useState(false);
  const [kycCheck, setKycCheck] = useState<any>(null);

  const addItem = () => setItems([...items, { description: '', amount: 0, is_gold: false }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    const next = [...items];
    (next[i] as any)[field] = value;
    setItems(next);
  };

  const calculateVat = async () => {
    if (items.length === 0 || items.every(i => !i.description)) return;
    setCalculating(true);
    try {
      const apiItems = items.map(i => {
        if (i.is_gold) {
          return {
            description: i.description,
            weight_grams: i.weight_grams || 0,
            tablo_price: i.tablo_price || 0,
            wage_percentage: i.wage_percentage || 0,
            profit_percentage: i.profit_percentage || 0,
            commission_amount: i.commission_amount || 0,
          };
        }
        return { description: i.description, amount: i.amount || 0 };
      });
      const result = await admin.tax.calculateVat({ items: apiItems });
      setVatBreakdown(result.data.items);
      setVatSummary(result.data.summary);
      setVatError(false);
    } catch {
      // The server owns both the rate and the taxable base. Report that the figure is
      // unavailable instead of inventing one; the invoice is still priced by the server on submit.
      setVatBreakdown(null);
      setVatSummary(null);
      setVatError(true);
    } finally {
      setCalculating(false);
    }
  };

  // Calculate VAT when items change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (items.some(i => i.description)) {
        calculateVat();
      } else {
        setVatBreakdown(null);
        setVatSummary(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [items]);

  const subtotal = vatSummary ? vatSummary.total_vat_exempt + vatSummary.total_vat_taxable : items.reduce((s, i) => s + (i.amount || 0), 0);
  // No client-side VAT formula. The rate is versioned per tax year on the server and the taxable
  // base excludes raw gold (ماده ۲۶). The old `subtotal * 0.09` guess used a stale rate, taxed
  // exempt gold, and fed that wrong figure into the KYC pre-check below.
  const tax = vatSummary ? vatSummary.total_vat : null;
  const total = vatSummary ? vatSummary.grand_total - (discount || 0) : null;

  // KYC pre-check when contact and amount are set. Only the server-priced total is checked;
  // an estimate would either block a permitted invoice or clear one that needs identification.
  useEffect(() => {
    if (contactId && total !== null && total > 0) {
      amlApi.check(parseInt(contactId), total).then((r) => setKycCheck(r)).catch(() => setKycCheck(null));
    } else {
      setKycCheck(null);
    }
  }, [contactId, total]);

  const handleSubmit = async () => {
    if (!contactId) { alert('مخاطب را انتخاب کنید'); return; }
    if (items.some(i => !i.description || (!i.amount && !i.is_gold))) { alert('تمام آیتم‌ها را پر کنید'); return; }
    setLoading(true);
    try {
      const apiItems = items.map(i => {
        if (i.is_gold) {
          return {
            description: i.description,
            weight_grams: i.weight_grams || 0,
            tablo_price: i.tablo_price || 0,
            wage_percentage: i.wage_percentage || 0,
            profit_percentage: i.profit_percentage || 0,
            commission_amount: i.commission_amount || 0,
          };
        }
        return { description: i.description, amount: i.amount || 0 };
      });
      await admin.invoices.create({
        type,
        contact_id: parseInt(contactId),
        items: apiItems,
        discount_amount: discount || 0,
        due_date: dueDate || undefined,
        notes: notes || undefined,
      });
      onCreated();
    } catch (e: any) {
      if (e.code === 'aml_kyc_required') {
        if (total !== null) {
          amlApi.check(parseInt(contactId), total).then((r) => setKycCheck(r)).catch(() => {});
        }
      } else {
        alert(e.message);
      }
    }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-800">فاکتور جدید</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="invoice-type" className="block text-sm font-bold text-slate-600 mb-2">نوع فاکتور</label>
            <select id="invoice-type" value={type} onChange={e => setType(e.target.value as any)}
              className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500">
              <option value="sale">فروش</option>
              <option value="purchase">خرید</option>
            </select>
          </div>

          <div>
            <label htmlFor="invoice-contact" className="block text-sm font-bold text-slate-600 mb-2">مخاطب</label>
            <select id="invoice-contact" value={contactId} onChange={e => setContactId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500">
              <option value="">انتخاب کنید...</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-600">آیتم‌ها</label>
              <button onClick={addItem} className="text-amber-600 hover:text-amber-700 text-xs font-bold">+ افزودن</button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={item.is_gold || false} onChange={e => updateItem(i, 'is_gold', e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                      طلایی
                    </label>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-rose-500 hover:text-rose-600 mr-auto"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                      placeholder="توضیح" className="flex-1 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500" />
                    {!item.is_gold && (
                      <input type="number" value={item.amount || ''} onChange={e => updateItem(i, 'amount', parseInt(e.target.value) || 0)}
                        placeholder="مبلغ (تومان)" className="w-40 border border-slate-200 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                    )}
                  </div>
                  {item.is_gold && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <input type="number" step="0.01" value={item.weight_grams || ''} onChange={e => updateItem(i, 'weight_grams', parseFloat(e.target.value) || 0)}
                        placeholder="وزن (گرم)" className="border border-slate-200 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                      <input type="number" value={item.tablo_price || ''} onChange={e => updateItem(i, 'tablo_price', parseInt(e.target.value) || 0)}
                        placeholder="قیمت تابلو" className="border border-slate-200 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                      <input type="number" step="0.1" value={item.wage_percentage || ''} onChange={e => updateItem(i, 'wage_percentage', parseFloat(e.target.value) || 0)}
                        placeholder="درصد اجرت %" className="border border-slate-200 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                      <input type="number" step="0.1" value={item.profit_percentage || ''} onChange={e => updateItem(i, 'profit_percentage', parseFloat(e.target.value) || 0)}
                        placeholder="درصد سود %" className="border border-slate-200 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                      <input type="number" value={item.commission_amount || ''} onChange={e => updateItem(i, 'commission_amount', parseInt(e.target.value) || 0)}
                        placeholder="کمیسیون (تومان)" className="border border-slate-200 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="invoice-discount" className="block text-sm font-bold text-slate-600 mb-2">تخفیف (تومان)</label>
              <input id="invoice-discount" type="number" value={discount || ''} onChange={e => setDiscount(parseInt(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded-xl py-3 px-4 text-right focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label htmlFor="invoice-due-date" className="block text-sm font-bold text-slate-600 mb-2">سررسید</label>
              <input id="invoice-due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          <div>
            <label htmlFor="invoice-notes" className="block text-sm font-bold text-slate-600 mb-2">یادداشت</label>
            <textarea id="invoice-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          {/* VAT Breakdown Summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">جمع کل:</span>
              <span className="font-bold">{formatToman(subtotal)}</span>
            </div>
            {vatSummary && vatSummary.total_vat_exempt > 0 && (
              <div className="flex justify-between text-xs text-slate-400">
                <span>ارزش طلا (معاف):</span>
                <span>{formatToman(vatSummary.total_vat_exempt)}</span>
              </div>
            )}
            {vatSummary && vatSummary.total_vat_taxable > 0 && (
              <div className="flex justify-between text-xs text-slate-400">
                <span>مشمول مالیات:</span>
                <span>{formatToman(vatSummary.total_vat_taxable)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">مالیات بر ارزش افزوده:</span>
              <span className="font-bold text-amber-600">{calculating ? '...' : tax === null ? (vatError ? 'محاسبه نشد' : '—') : formatToman(tax)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">تخفیف:</span>
                <span className="text-rose-600 font-bold">-{formatToman(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="font-black text-slate-700">مبلغ نهایی:</span>
              <span className="font-black text-amber-600">{calculating ? '...' : total === null ? (vatError ? 'محاسبه نشد' : '—') : formatToman(total)}</span>
            </div>
          </div>

          {kycCheck && !kycCheck.allowed && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-4">
              برای صدور فاکتور با این مبلغ، احراز هویت مشتری الزامی است.
              <a href={`#/admin/compliance?contact=${contactId}`} className="underline mr-2">ثبت احراز هویت</a>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">انصراف</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-50">
              {loading ? 'در حال ثبت...' : 'ثبت فاکتور'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditModal({ invoice, contacts, onClose, onSaved }: { invoice: Invoice; contacts: Contact[]; onClose: () => void; onSaved: (data: any) => void }) {
  const [type, setType] = useState<'sale' | 'purchase' | 'service'>(invoice.type);
  const [contactId, setContactId] = useState(invoice.contact?.id.toString() || '');
  const [items, setItems] = useState<InvoiceItem[]>(invoice.items?.length ? invoice.items.map(it => ({ description: it.description || '', amount: it.amount || 0, is_gold: !!it.weight_grams, weight_grams: it.weight_grams, tablo_price: it.tablo_price, wage_percentage: it.wage_percentage, profit_percentage: it.profit_percentage, commission_amount: it.commission_amount })) : [{ description: '', amount: 0, is_gold: false }]);
  const [discount, setDiscount] = useState(invoice.discount_amount || 0);
  const [dueDate, setDueDate] = useState(invoice.due_date?.slice(0, 10) || '');
  const [notes, setNotes] = useState(invoice.notes || '');
  const [loading, setLoading] = useState(false);
  const [vatBreakdown, setVatBreakdown] = useState<VatBreakdown[] | null>(null);
  const [vatSummary, setVatSummary] = useState<{ total_vat: number; total_vat_taxable: number; total_vat_exempt: number; grand_total: number } | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [vatError, setVatError] = useState(false);
  const [kycCheck, setKycCheck] = useState<any>(null);

  const addItem = () => setItems([...items, { description: '', amount: 0, is_gold: false }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    const next = [...items];
    (next[i] as any)[field] = value;
    setItems(next);
  };

  const calculateVat = async () => {
    if (items.length === 0 || items.every(i => !i.description)) return;
    setCalculating(true);
    try {
      const apiItems = items.map(i => {
        if (i.is_gold) {
          return {
            description: i.description,
            weight_grams: i.weight_grams || 0,
            tablo_price: i.tablo_price || 0,
            wage_percentage: i.wage_percentage || 0,
            profit_percentage: i.profit_percentage || 0,
            commission_amount: i.commission_amount || 0,
          };
        }
        return { description: i.description, amount: i.amount || 0 };
      });
      const result = await admin.tax.calculateVat({ items: apiItems });
      setVatBreakdown(result.data.items);
      setVatSummary(result.data.summary);
      setVatError(false);
    } catch {
      // The server owns both the rate and the taxable base. Report that the figure is
      // unavailable instead of inventing one; the invoice is still priced by the server on submit.
      setVatBreakdown(null);
      setVatSummary(null);
      setVatError(true);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (items.some(i => i.description)) {
        calculateVat();
      } else {
        setVatBreakdown(null);
        setVatSummary(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [items]);

  const subtotal = vatSummary ? vatSummary.total_vat_exempt + vatSummary.total_vat_taxable : items.reduce((s, i) => s + (i.amount || 0), 0);
  // No client-side VAT formula. The rate is versioned per tax year on the server and the taxable
  // base excludes raw gold (ماده ۲۶). The old `subtotal * 0.09` guess used a stale rate, taxed
  // exempt gold, and fed that wrong figure into the KYC pre-check below.
  const tax = vatSummary ? vatSummary.total_vat : null;
  const total = vatSummary ? vatSummary.grand_total - (discount || 0) : null;

  // KYC pre-check when contact and amount are set. Only the server-priced total is checked;
  // an estimate would either block a permitted invoice or clear one that needs identification.
  useEffect(() => {
    if (contactId && total !== null && total > 0) {
      amlApi.check(parseInt(contactId), total).then((r) => setKycCheck(r)).catch(() => setKycCheck(null));
    } else {
      setKycCheck(null);
    }
  }, [contactId, total]);

  const handleSubmit = async () => {
    if (!contactId) { alert('مخاطب را انتخاب کنید'); return; }
    setLoading(true);
    try {
      const data: any = {
        discount_amount: discount || 0,
        due_date: dueDate || undefined,
        notes: notes || undefined,
      };
      if (items.length > 0 && items.some(i => i.description)) {
        data.items = items.map(i => {
          if (i.is_gold) {
            return {
              description: i.description,
              weight_grams: i.weight_grams || 0,
              tablo_price: i.tablo_price || 0,
              wage_percentage: i.wage_percentage || 0,
              profit_percentage: i.profit_percentage || 0,
              commission_amount: i.commission_amount || 0,
            };
          }
          return { description: i.description, amount: i.amount || 0 };
        });
      }
      await onSaved(data);
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-800">ویرایش فاکتور</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="edit-invoice-type" className="block text-sm font-bold text-slate-600 mb-2">نوع فاکتور</label>
            <select id="edit-invoice-type" value={type} onChange={e => setType(e.target.value as any)}
              className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500">
              <option value="sale">فروش</option>
              <option value="purchase">خرید</option>
              <option value="service">خدمات</option>
            </select>
          </div>

          <div>
            <label htmlFor="edit-invoice-contact" className="block text-sm font-bold text-slate-600 mb-2">مخاطب</label>
            <select id="edit-invoice-contact" value={contactId} onChange={e => setContactId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500">
              <option value="">انتخاب کنید...</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-600">آیتم‌ها</label>
              <button onClick={addItem} className="text-amber-600 hover:text-amber-700 text-xs font-bold">+ افزودن</button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer">
                      <input type="checkbox" checked={item.is_gold || false} onChange={e => updateItem(i, 'is_gold', e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                      طلایی
                    </label>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-rose-500 hover:text-rose-600 mr-auto"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                      placeholder="توضیح" className="flex-1 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500" />
                    {!item.is_gold && (
                      <input type="number" value={item.amount || ''} onChange={e => updateItem(i, 'amount', parseInt(e.target.value) || 0)}
                        placeholder="مبلغ (تومان)" className="w-40 border border-slate-200 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                    )}
                  </div>
                  {item.is_gold && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <input type="number" step="0.01" value={item.weight_grams || ''} onChange={e => updateItem(i, 'weight_grams', parseFloat(e.target.value) || 0)}
                        placeholder="وزن (گرم)" className="border border-slate-200 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                      <input type="number" value={item.tablo_price || ''} onChange={e => updateItem(i, 'tablo_price', parseInt(e.target.value) || 0)}
                        placeholder="قیمت تابلو" className="border border-slate-200 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                      <input type="number" step="0.1" value={item.wage_percentage || ''} onChange={e => updateItem(i, 'wage_percentage', parseFloat(e.target.value) || 0)}
                        placeholder="درصد اجرت %" className="border border-slate-200 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                      <input type="number" step="0.1" value={item.profit_percentage || ''} onChange={e => updateItem(i, 'profit_percentage', parseFloat(e.target.value) || 0)}
                        placeholder="درصد سود %" className="border border-slate-200 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                      <input type="number" value={item.commission_amount || ''} onChange={e => updateItem(i, 'commission_amount', parseInt(e.target.value) || 0)}
                        placeholder="کمیسیون (تومان)" className="border border-slate-200 rounded-xl py-2 px-3 text-sm text-right focus:outline-none focus:border-amber-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-invoice-discount" className="block text-sm font-bold text-slate-600 mb-2">تخفیف (تومان)</label>
              <input id="edit-invoice-discount" type="number" value={discount || ''} onChange={e => setDiscount(parseInt(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded-xl py-3 px-4 text-right focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label htmlFor="edit-invoice-due-date" className="block text-sm font-bold text-slate-600 mb-2">سررسید</label>
              <input id="edit-invoice-due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-amber-500" />
            </div>
          </div>

          <div>
            <label htmlFor="edit-invoice-notes" className="block text-sm font-bold text-slate-600 mb-2">یادداشت</label>
            <textarea id="edit-invoice-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          {/* VAT Breakdown Summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">جمع کل:</span>
              <span className="font-bold">{formatToman(subtotal)}</span>
            </div>
            {vatSummary && vatSummary.total_vat_exempt > 0 && (
              <div className="flex justify-between text-xs text-slate-400">
                <span>ارزش طلا (معاف):</span>
                <span>{formatToman(vatSummary.total_vat_exempt)}</span>
              </div>
            )}
            {vatSummary && vatSummary.total_vat_taxable > 0 && (
              <div className="flex justify-between text-xs text-slate-400">
                <span>مشمول مالیات:</span>
                <span>{formatToman(vatSummary.total_vat_taxable)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">مالیات بر ارزش افزوده:</span>
              <span className="font-bold text-amber-600">{calculating ? '...' : tax === null ? (vatError ? 'محاسبه نشد' : '—') : formatToman(tax)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">تخفیف:</span>
                <span className="text-rose-600 font-bold">-{formatToman(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="font-black text-slate-700">مبلغ نهایی:</span>
              <span className="font-black text-amber-600">{calculating ? '...' : total === null ? (vatError ? 'محاسبه نشد' : '—') : formatToman(total)}</span>
            </div>
          </div>

          {kycCheck && !kycCheck.allowed && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl mb-4">
              برای صدور فاکتور با این مبلغ، احراز هویت مشتری الزامی است.
              <a href={`#/admin/compliance?contact=${contactId}`} className="underline mr-2">ثبت احراز هویت</a>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">انصراف</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm disabled:opacity-50">
              {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ invoice, onClose, onDelete }: { invoice: Invoice; onClose: () => void; onDelete: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-800">حذف فاکتور</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-600 mb-3">آیا از حذف فاکتور زیر اطمینان دارید؟</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">شماره فاکتور:</span>
              <span className="font-mono font-bold">{toPersianDigits(invoice.invoice_number)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">مخاطب:</span>
              <span className="font-bold">{invoice.contact?.name || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">مبلغ کل:</span>
              <span className="font-bold">{formatToman(invoice.total_amount)}</span>
            </div>
          </div>
          <p className="text-xs text-rose-600 mt-3 font-bold">این عملیات قابل بازگشت نیست.</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">انصراف</button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm disabled:opacity-50">
            {loading ? 'در حال حذف...' : 'حذف فاکتور'}
          </button>
        </div>
      </div>
    </div>
  );
}
