import React, { useState, useEffect } from 'react';
import { admin } from '../api';
import { Receipt, Search, X, Check, ChevronDown, Eye } from 'lucide-react';
import { formatToman, toPersianDigits } from '../../utils';
import DocumentPreview from '../components/DocumentPreview';

interface Bill {
  id: number;
  tenant_id: number;
  contact_id: number;
  type: 'payable' | 'receivable';
  status: 'pending' | 'paid' | 'issued' | 'overdue' | 'partial';
  description: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  paid_at: string | null;
  reference: string;
  contact?: { id: number; name: string; phone: string; type: string };
}

const statusLabels: Record<string, string> = {
  pending: 'در انتظار',
  paid: 'پرداخت شده',
  issued: 'صادر شده',
  overdue: 'سررسید گذشته',
  partial: 'پرداخت جزئی',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  issued: 'bg-blue-50 text-blue-700',
  overdue: 'bg-rose-50 text-rose-700',
  partial: 'bg-sky-50 text-sky-700',
};

const typeLabels: Record<string, string> = {
  payable: 'پرداختنی',
  receivable: 'دریافتنی',
};

export default function AdminBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState<Bill | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<{ total_payable: number; total_receivable: number }>({ total_payable: 0, total_receivable: 0 });

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      const data = await admin.bills.list(params);
      setBills(data.data || []);
      if (data.additional) setStats(data.additional);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus, filterType]);

  const handlePay = async (amount: number) => {
    if (!showPay) return;
    try {
      await admin.bills.pay(showPay.id, { amount });
      setShowPay(null);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const filtered = bills.filter(b => {
    if (search) {
      return b.description.includes(search) ||
        b.reference.includes(search) ||
        b.contact?.name.includes(search);
    }
    return true;
  });

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg lg:text-xl font-black text-slate-800">اسناد مالی</h2>
          <p className="text-xs text-slate-400 mt-1">مدیریت پرداخت‌ها و دریافت‌ها</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
          <p className="text-xs text-rose-500 font-bold mb-1">کل پرداختنی</p>
          <p className="text-lg font-black text-rose-700">{formatToman(stats.total_payable)}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
          <p className="text-xs text-emerald-500 font-bold mb-1">کل دریافتنی</p>
          <p className="text-lg font-black text-emerald-700">{formatToman(stats.total_receivable)}</p>
        </div>
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
          <option value="payable">پرداختنی</option>
          <option value="receivable">دریافتنی</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:border-amber-500">
          <option value="">همه وضعیت‌ها</option>
          <option value="pending">در انتظار</option>
          <option value="partial">پرداخت جزئی</option>
          <option value="paid">پرداخت شده</option>
          <option value="issued">صادر شده</option>
          <option value="overdue">سررسید گذشته</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-600">سندی ثبت نشده</h3>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-600">نوع</th>
                  <th className="px-4 py-3 font-bold text-slate-600">توضیحات</th>
                  <th className="px-4 py-3 font-bold text-slate-600">مخاطب</th>
                  <th className="px-4 py-3 font-bold text-slate-600">مبلغ</th>
                  <th className="px-4 py-3 font-bold text-slate-600">پرداخت شده</th>
                  <th className="px-4 py-3 font-bold text-slate-600">وضعیت</th>
                  <th className="px-4 py-3 font-bold text-slate-600">سررسید</th>
                  <th className="px-4 py-3 font-bold text-slate-600">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(bill => (
                  <tr key={bill.id} onClick={() => setSelectedBill(bill)} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${bill.type === 'payable' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {typeLabels[bill.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{bill.description}</td>
                    <td className="px-4 py-3">{bill.contact?.name || '—'}</td>
                    <td className="px-4 py-3 font-bold">{formatToman(bill.amount)}</td>
                    <td className="px-4 py-3 text-emerald-600">{formatToman(bill.paid_amount || 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusColors[bill.status]}`}>
                        {statusLabels[bill.status] || bill.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{bill.due_date?.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedBill(bill); }}
                          className="text-slate-500 hover:text-slate-700 text-xs font-bold flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> مشاهده
                        </button>
                        {bill.status !== 'paid' && (
                          <button onClick={(e) => { e.stopPropagation(); setShowPay(bill); }}
                            className="text-amber-600 hover:text-amber-700 text-xs font-bold">
                            پرداخت
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
        <PayModal bill={showPay} onClose={() => setShowPay(null)} onPay={handlePay} />
      )}

      {selectedBill && (
        <DocumentPreview
          kind="bill"
          document={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
}

function PayModal({ bill, onClose, onPay }: { bill: Bill; onClose: () => void; onPay: (amount: number) => void }) {
  const remaining = bill.amount - (bill.paid_amount || 0);
  const [amount, setAmount] = useState(remaining.toString());

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-800">پرداخت سند</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">توضیحات:</span>
            <span className="font-bold text-xs">{bill.description}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">نوع:</span>
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${bill.type === 'payable' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {typeLabels[bill.type]}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">مبلغ کل:</span>
            <span className="font-bold">{formatToman(bill.amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">پرداخت شده:</span>
            <span className="text-emerald-600 font-bold">{formatToman(bill.paid_amount || 0)}</span>
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
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">انصراف</button>
          <button onClick={() => onPay(parseInt(amount) || 0)} className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            پرداخت
          </button>
        </div>
      </div>
    </div>
  );
}
