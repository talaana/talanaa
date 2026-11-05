import React, { useState, useEffect, useMemo } from 'react';
import { admin } from '../api';
import { Search, ArrowRight, ChevronUp, ChevronDown, ShoppingBag, FileText } from 'lucide-react';
import { toPersianDigits, formatToman } from '../../utils';

interface Order {
  id: number; type: string; title: string; date: string; status: string;
  amount_toman: number; weight_grams: number | null; invoice_id: number | null;
  user?: { id: number; name: string; phone: string };
}

interface Props { onClose?: () => void; }

type SortField = 'id' | 'title' | 'type' | 'amount_toman' | 'status' | 'date';
type SortDir = 'asc' | 'desc';

const statusLabels: Record<string, string> = {
  pending: 'در انتظار', completed: 'تکمیل شده', cancelled: 'لغو شده', failed: 'ناموفق',
};
const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600', completed: 'bg-emerald-50 text-emerald-600',
  cancelled: 'bg-rose-50 text-rose-600', failed: 'bg-slate-100 text-slate-500',
};

export default function AdminOrders({ onClose }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const load = async () => {
    setLoading(true);
    try {
      const data = await admin.orders.list({ search, sort: sortField, direction: sortDir });
      setOrders(data.data || data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortFn = (a: Order, b: Order) => {
    let va: any, vb: any;
    switch (sortField) {
      case 'id': va = a.id; vb = b.id; break;
      case 'title': va = a.title; vb = b.title; break;
      case 'type': va = a.type; vb = b.type; break;
      case 'amount_toman': va = a.amount_toman; vb = b.amount_toman; break;
      case 'status': va = a.status; vb = b.status; break;
      case 'date': va = a.date; vb = b.date; break;
      default: return 0;
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  };

  const filtered = useMemo(() => {
    let list = orders;
    if (search) list = list.filter(o => o.title.includes(search) || o.type.includes(search) || (o.user?.name || '').includes(search));
    return [...list].sort(sortFn);
  }, [orders, search, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-flex flex-col ml-1">
      <ChevronUp className={`w-3 h-3 -mb-1 ${sortField === field && sortDir === 'asc' ? 'text-amber-600' : 'text-slate-300'}`} />
      <ChevronDown className={`w-3 h-3 ${sortField === field && sortDir === 'desc' ? 'text-amber-600' : 'text-slate-300'}`} />
    </span>
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onClose && <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1"><ArrowRight className="w-5 h-5" /></button>}
          <div>
            <h2 className="text-lg lg:text-xl font-black text-slate-800">سفارشات</h2>
            <p className="text-xs text-slate-400 mt-1">مدیریت سفارشات مشتریان</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو در سفارشات..."
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-sm text-right focus:outline-none focus:border-amber-500" />
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-600">سفارشی ثبت نشده</h3>
          <p className="text-xs text-slate-400 mt-2">سفارشات جدید مشتریان در این بخش نمایش داده می‌شود.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-right py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('id')}># <SortIcon field="id" /></th>
                  <th className="text-right py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('title')}>عنوان <SortIcon field="title" /></th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('amount_toman')}>مبلغ <SortIcon field="amount_toman" /></th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('status')}>وضعیت <SortIcon field="status" /></th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500">فاکتور</th>
                  <th className="text-center py-3 px-4 text-[10px] font-black text-slate-500 cursor-pointer select-none" onClick={() => toggleSort('date')}>تاریخ <SortIcon field="date" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-slate-400" dir="ltr">#{o.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 text-xs">{o.title}</div>
                      {o.user && <div className="text-[10px] text-slate-400">{o.user.name || o.user.phone}</div>}
                    </td>
                    <td className="py-3 px-4 text-center text-xs font-black text-amber-600">{formatToman(o.amount_toman)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${statusColors[o.status] || 'bg-slate-100 text-slate-500'}`}>
                        {statusLabels[o.status] || o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {o.invoice_id ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                          <FileText className="w-3 h-3" />
                          دارد
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-[10px] text-slate-400">
                      {new Date(o.date).toLocaleDateString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
