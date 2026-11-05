import React, { useState, useEffect } from 'react';
import { admin } from '../api';
import { Wallet, TrendingUp, TrendingDown, Search, Plus, Minus, Check, X } from 'lucide-react';
import { formatToman, formatGram, toPersianDigits } from '../../utils';

interface User {
  id: number;
  name: string;
  phone?: string;
}

interface WalletData {
  user: User;
  gold_grams: number;
  silver_grams: number;
  cash_toman: number;
}

type OperationType = 'deposit' | 'withdraw';
type MetalType = 'gold' | 'silver' | 'cash';

export default function AdminWallet() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [operation, setOperation] = useState<OperationType>('deposit');
  const [metal, setMetal] = useState<MetalType>('cash');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    try {
      const data = await admin.users.list();
      setUsers(data.data || data || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const loadWallet = async (user: User) => {
    setLoading(true);
    setError('');
    try {
      const data = await admin.wallet.show(user.id);
      setWallet(data);
      setSelectedUser(user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        metal: metal,
        amount: parseFloat(amount),
        description: description || undefined,
      };

      if (operation === 'deposit') {
        await admin.wallet.deposit(selectedUser.id, payload);
      } else {
        await admin.wallet.withdraw(selectedUser.id, payload);
      }

      setSuccess(operation === 'deposit' ? 'واریز با موفقیت انجام شد' : 'برداشت با موفقیت انجام شد');
      setShowForm(false);
      setAmount('');
      setDescription('');
      await loadWallet(selectedUser);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg lg:text-xl font-black text-slate-800">مدیریت کیف پول</h2>
          <p className="text-xs text-slate-400 mt-1">واریز و برداشت از کیف پول کاربران</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <X className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* User List */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجوی کاربر..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-sm text-right focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                onClick={() => loadWallet(user)}
                className={`w-full text-right p-3 rounded-xl transition-all ${
                  selectedUser?.id === user.id
                    ? 'bg-amber-50 border-amber-200 border'
                    : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                {user.phone && <p className="text-xs text-slate-500 mt-1" dir="ltr">{user.phone}</p>}
              </button>
            ))}
          </div>
        </div>

        {/* Wallet Details */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
              <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : wallet ? (
            <>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-800">{wallet.user.name}</h3>
                    {wallet.user.phone && <p className="text-xs text-slate-500 mt-1" dir="ltr">{wallet.user.phone}</p>}
                  </div>
                  <button
                    onClick={() => { setOperation('deposit'); setShowForm(true); }}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  >
                    <Plus className="w-4 h-4" /> واریز
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-amber-600" />
                      <p className="text-xs text-amber-600 font-bold">طلا</p>
                    </div>
                    <p className="text-xl font-black text-amber-800">{formatGram(wallet.gold_grams)} گرم</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-slate-600" />
                      <p className="text-xs text-slate-600 font-bold">نقره</p>
                    </div>
                    <p className="text-xl font-black text-slate-800">{formatGram(wallet.silver_grams)} گرم</p>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <p className="text-xs text-emerald-600 font-bold">نقدی</p>
                    </div>
                    <p className="text-xl font-black text-emerald-800">{formatToman(wallet.cash_toman)} تومان</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setOperation('withdraw'); setShowForm(true); }}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-xl text-sm font-bold transition-colors"
              >
                <Minus className="w-4 h-4" /> برداشت از کیف پول
              </button>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
              <Wallet className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-sm font-black text-slate-600">کاربری انتخاب نشده</h3>
              <p className="text-xs text-slate-400 mt-2">یک کاربر از لیست سمت راست انتخاب کنید</p>
            </div>
          )}
        </div>
      </div>

      {/* Operation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-800">
                {operation === 'deposit' ? 'واریز به کیف پول' : 'برداشت از کیف پول'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">نوع</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'gold', 'silver'] as MetalType[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetal(m)}
                      className={`py-2 rounded-xl text-sm font-bold transition-all ${
                        metal === m
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {m === 'cash' ? 'نقدی' : m === 'gold' ? 'طلا' : 'نقره'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  مبلغ {metal === 'cash' ? '(تومان)' : '(گرم)'}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-right focus:outline-none focus:border-amber-500"
                  placeholder={metal === 'cash' ? '۱۰۰۰۰۰۰' : '۱.۵'}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">توضیحات (اختیاری)</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-right focus:outline-none focus:border-amber-500"
                  placeholder="توضیحات عملیات..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-bold transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 text-white py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    operation === 'deposit'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  } disabled:opacity-50`}
                >
                  {loading ? 'در حال انجام...' : operation === 'deposit' ? 'واریز' : 'برداشت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
