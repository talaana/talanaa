import React, { useState, useEffect } from 'react';
import { admin } from '../api';
import { BarChart3, TrendingUp, Package, FileText, Calendar } from 'lucide-react';
import { formatToman, toPersianDigits, formatGram } from '../../utils';

type Tab = 'balance' | 'profit' | 'inventory' | 'transactions';

interface BalanceSheet {
  assets: {
    gold_grams: number;
    gold_value_toman: number;
    silver_grams: number;
    silver_value_toman: number;
    cash_toman: number;
    total_assets_toman: number;
  };
  rates: {
    gold_18k_per_gram: number;
    silver_999_per_gram: number;
  };
  trading: {
    total_purchases_toman: number;
    total_sales_toman: number;
    total_profit_toman: number;
    total_transactions: number;
  };
}

interface ProfitLoss {
  period: { from: string; to: string };
  summary: {
    total_income_toman: number;
    total_expense_toman: number;
    net_toman: number;
  };
  by_type: Array<{
    type: string;
    total_toman: number;
    transactions: number;
  }>;
}

interface Inventory {
  total_gold_grams: number;
  total_silver_grams: number;
  cash_toman: number;
  by_form: Array<{
    id: number;
    slug: string;
    name: string;
    metal: string;
    purity: number;
    estimated_grams: number;
    price_per_gram: number;
    estimated_value_toman: number;
  }>;
}

interface Transactions {
  accounting_entries: Array<{
    id: number;
    type: 'income' | 'expense';
    category: string;
    description: string;
    amount: number;
    balance_after: number;
    entry_date: string;
    user?: { name: string };
  }>;
}

const metalLabels: Record<string, string> = {
  gold: 'طلا',
  silver: 'نقره',
};

const typeLabels: Record<string, string> = {
  buy_gold: 'خرید طلا',
  sell_gold: 'فروش طلا',
  buy_silver: 'خرید نقره',
  sell_silver: 'فروش نقره',
};

export default function AdminReports() {
  const [tab, setTab] = useState<Tab>('balance');
  const [balance, setBalance] = useState<BalanceSheet | null>(null);
  const [profit, setProfit] = useState<ProfitLoss | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [transactions, setTransactions] = useState<Transactions | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (tab === 'balance' && !balance) loadBalance();
    if (tab === 'profit' && !profit) loadProfit();
    if (tab === 'inventory' && !inventory) loadInventory();
    if (tab === 'transactions' && !transactions) loadTransactions();
  }, [tab]);

  const loadBalance = async () => {
    setLoading(true);
    try {
      const data = await admin.reports.balanceSheet();
      setBalance(data);
    } catch {}
    finally { setLoading(false); }
  };

  const loadProfit = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const data = await admin.reports.profitLoss(params);
      setProfit(data);
    } catch {}
    finally { setLoading(false); }
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await admin.reports.inventory();
      setInventory(data);
    } catch {}
    finally { setLoading(false); }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await admin.reports.transactions({ limit: '50' });
      setTransactions(data);
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h2 className="text-lg lg:text-xl font-black text-slate-800">گزارشات مالی</h2>
        <p className="text-xs text-slate-400 mt-1">تحلیل عملکرد و وضعیت مالی</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <TabButton active={tab === 'balance'} onClick={() => setTab('balance')} icon={BarChart3} label="ترازنامه" />
        <TabButton active={tab === 'profit'} onClick={() => setTab('profit')} icon={TrendingUp} label="سود و زیان" />
        <TabButton active={tab === 'inventory'} onClick={() => setTab('inventory')} icon={Package} label="موجودی" />
        <TabButton active={tab === 'transactions'} onClick={() => setTab('transactions')} icon={FileText} label="تراکنش‌ها" />
      </div>

      {loading && (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      )}

      {!loading && tab === 'balance' && balance && <BalanceSheetView data={balance} />}
      {!loading && tab === 'profit' && profit && (
        <ProfitLossView data={profit} dateFrom={dateFrom} dateTo={dateTo} onDateFrom={setDateFrom} onDateTo={setDateTo} onReload={() => { setProfit(null); loadProfit(); }} />
      )}
      {!loading && tab === 'inventory' && inventory && <InventoryView data={inventory} />}
      {!loading && tab === 'transactions' && transactions && <TransactionsView data={transactions} />}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.FC<any>; label: string }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-colors ${active ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function BalanceSheetView({ data }: { data: BalanceSheet }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-5 border border-amber-200">
          <p className="text-xs text-amber-600 font-bold mb-2">موجودی طلا</p>
          <p className="text-2xl font-black text-amber-800">{formatGram(data.assets.gold_grams)} گرم</p>
          <p className="text-xs text-amber-600 mt-2">{formatToman(data.assets.gold_value_toman)} تومان</p>
        </div>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-200">
          <p className="text-xs text-slate-600 font-bold mb-2">موجودی نقره</p>
          <p className="text-2xl font-black text-slate-800">{formatGram(data.assets.silver_grams)} گرم</p>
          <p className="text-xs text-slate-600 mt-2">{formatToman(data.assets.silver_value_toman)} تومان</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-200">
          <p className="text-xs text-emerald-600 font-bold mb-2">موجودی نقدی</p>
          <p className="text-2xl font-black text-emerald-800">{formatToman(data.assets.cash_toman)} تومان</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-black text-slate-800 mb-4">قیمت‌های روز</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">طلای ۱۸ عیار (هر گرم)</p>
            <p className="text-lg font-black text-slate-800">{formatToman(data.rates.gold_18k_per_gram)} تومان</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">نقره ۹۹۹ (هر گرم)</p>
            <p className="text-lg font-black text-slate-800">{formatToman(data.rates.silver_999_per_gram)} تومان</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-black text-slate-800 mb-4">خلاصه معاملات</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">کل خریدها</p>
            <p className="text-sm font-black text-rose-600">{formatToman(data.trading.total_purchases_toman)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">کل فروش‌ها</p>
            <p className="text-sm font-black text-emerald-600">{formatToman(data.trading.total_sales_toman)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">سود خالص</p>
            <p className="text-sm font-black text-amber-600">{formatToman(data.trading.total_profit_toman)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">تعداد تراکنش</p>
            <p className="text-sm font-black text-slate-800">{toPersianDigits(data.trading.total_transactions)}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
        <p className="text-xs text-blue-600 font-bold mb-2">ارزش کل دارایی‌ها</p>
        <p className="text-3xl font-black text-blue-800">{formatToman(data.assets.total_assets_toman)} تومان</p>
      </div>
    </div>
  );
}

function ProfitLossView({ data, dateFrom, dateTo, onDateFrom, onDateTo, onReload }: { data: ProfitLoss; dateFrom: string; dateTo: string; onDateFrom: (s: string) => void; onDateTo: (s: string) => void; onReload: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-black text-slate-800">بازه زمانی</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="profit-date-from" className="block text-xs text-slate-500 mb-1">از</label>
            <input id="profit-date-from" type="date" value={dateFrom} onChange={e => onDateFrom(e.target.value)}
              className="w-full border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500" />
          </div>
          <div>
            <label htmlFor="profit-date-to" className="block text-xs text-slate-500 mb-1">تا</label>
            <input id="profit-date-to" type="date" value={dateTo} onChange={e => onDateTo(e.target.value)}
              className="w-full border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-amber-500" />
          </div>
        </div>
        <button onClick={onReload} className="mt-3 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-bold">
          اعمال فیلتر
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-bold mb-2">کل درآمد</p>
          <p className="text-xl font-black text-emerald-800">{formatToman(data.summary.total_income_toman)} تومان</p>
        </div>
        <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
          <p className="text-xs text-rose-600 font-bold mb-2">کل هزینه</p>
          <p className="text-xl font-black text-rose-800">{formatToman(data.summary.total_expense_toman)} تومان</p>
        </div>
        <div className={`rounded-2xl p-5 border ${data.summary.net_toman >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className={`text-xs font-bold mb-2 ${data.summary.net_toman >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>سود/زیان خالص</p>
          <p className={`text-xl font-black ${data.summary.net_toman >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>{formatToman(data.summary.net_toman)} تومان</p>
        </div>
      </div>

      {data.by_type && data.by_type.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 mb-4">تفکیک بر اساس نوع</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-600">نوع</th>
                  <th className="px-4 py-3 font-bold text-slate-600">مبلغ کل</th>
                  <th className="px-4 py-3 font-bold text-slate-600">تعداد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.by_type.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">{item.type === 'sale' ? 'فروش' : item.type === 'purchase' ? 'خرید' : item.type}</td>
                    <td className="px-4 py-3 font-bold">{formatToman(item.total_toman)}</td>
                    <td className="px-4 py-3">{toPersianDigits(item.transactions)}</td>
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

function InventoryView({ data }: { data: Inventory }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
          <p className="text-xs text-amber-600 font-bold mb-2">کل طلای موجود</p>
          <p className="text-xl font-black text-amber-800">{formatGram(data.total_gold_grams)} گرم</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <p className="text-xs text-slate-600 font-bold mb-2">کل نقره موجود</p>
          <p className="text-xl font-black text-slate-800">{formatGram(data.total_silver_grams)} گرم</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-bold mb-2">موجودی نقدی</p>
          <p className="text-xl font-black text-emerald-800">{formatToman(data.cash_toman)} تومان</p>
        </div>
      </div>

      {data.by_form.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 mb-4">تفکیک بر اساس نوع فلز</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-600">نام</th>
                  <th className="px-4 py-3 font-bold text-slate-600">فلز</th>
                  <th className="px-4 py-3 font-bold text-slate-600">عیار</th>
                  <th className="px-4 py-3 font-bold text-slate-600">وزن تخمینی</th>
                  <th className="px-4 py-3 font-bold text-slate-600">قیمت/گرم</th>
                  <th className="px-4 py-3 font-bold text-slate-600">ارزش کل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.by_form.map(form => (
                  <tr key={form.id}>
                    <td className="px-4 py-3 font-bold">{form.name}</td>
                    <td className="px-4 py-3">{metalLabels[form.metal] || form.metal}</td>
                    <td className="px-4 py-3">{toPersianDigits(form.purity)}</td>
                    <td className="px-4 py-3">{formatGram(form.estimated_grams)} گرم</td>
                    <td className="px-4 py-3 text-xs">{formatToman(form.price_per_gram)}</td>
                    <td className="px-4 py-3 font-bold text-amber-600">{formatToman(form.estimated_value_toman)}</td>
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

function TransactionsView({ data }: { data: Transactions }) {
  return (
    <div className="space-y-4">
      {data.accounting_entries.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-800 mb-4">ثبت‌های حسابداری</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-600">نوع</th>
                  <th className="px-4 py-3 font-bold text-slate-600">توضیحات</th>
                  <th className="px-4 py-3 font-bold text-slate-600">مبلغ</th>
                  <th className="px-4 py-3 font-bold text-slate-600">مانده</th>
                  <th className="px-4 py-3 font-bold text-slate-600">کاربر</th>
                  <th className="px-4 py-3 font-bold text-slate-600">تاریخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.accounting_entries.map(entry => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${entry.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {entry.type === 'income' ? 'درآمد' : 'هزینه'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{entry.description}</td>
                    <td className="px-4 py-3 font-bold">{formatToman(entry.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatToman(entry.balance_after)}</td>
                    <td className="px-4 py-3 text-xs">{entry.user?.name || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{entry.entry_date?.slice(0, 10)}</td>
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
