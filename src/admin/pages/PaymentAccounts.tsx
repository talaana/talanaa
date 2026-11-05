import React, { useState, useEffect } from 'react';
import { admin } from '../api';
import { CreditCard, Plus, Trash2, Edit2, Check, X, Star } from 'lucide-react';
import { toPersianDigits } from '../../utils';

interface PaymentAccount {
  id: number;
  account_type: 'bank_account' | 'card' | 'wallet';
  bank_name: string | null;
  account_number: string | null;
  card_number: string | null;
  iban: string | null;
  account_holder: string | null;
  is_default: boolean;
  is_active: boolean;
}

const typeLabels: Record<string, string> = {
  bank_account: 'حساب بانکی',
  card: 'کارت بانکی',
  wallet: 'کیف پول',
};

export default function PaymentAccounts() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PaymentAccount | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await admin.paymentAccounts.list();
      setAccounts(data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این حساب مطمئنید؟')) return;
    try {
      await admin.paymentAccounts.remove(id);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleSetDefault = async (account: PaymentAccount) => {
    try {
      await admin.paymentAccounts.update(account.id, { is_default: true });
      load();
    } catch (e: any) { alert(e.message); }
  };

  const handleEdit = (account: PaymentAccount) => {
    setEditing(account);
    setShowForm(true);
  };

  const handleCreated = () => {
    setShowForm(false);
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg lg:text-xl font-black text-slate-800">حساب‌های پرداخت</h2>
          <p className="text-xs text-slate-400 mt-1">مدیریت حساب‌ها و کارت‌های بانکی برای دریافت پرداخت</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" />
          حساب جدید
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="text-sm font-black text-slate-600">حسابی ثبت نشده</h3>
          <p className="text-xs text-slate-400 mt-2">حساب‌ها و کارت‌های بانکی خود را اضافه کنید تا مشتریان بتوانند به آنها پرداخت کنند.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map(account => (
            <div key={account.id} className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all ${account.is_default ? 'border-amber-500' : 'border-slate-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-black text-slate-800">{typeLabels[account.account_type]}</span>
                  {account.is_default && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      پیش‌فرض
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(account)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(account.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {account.bank_name && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-xs">بانک:</span>
                    <span className="font-bold text-slate-800">{account.bank_name}</span>
                  </div>
                )}
                {account.account_holder && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-xs">دارنده:</span>
                    <span className="font-bold text-slate-800">{account.account_holder}</span>
                  </div>
                )}
                {account.card_number && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-xs">شماره کارت:</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{account.card_number}</span>
                  </div>
                )}
                {account.account_number && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-xs">شماره حساب:</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{account.account_number}</span>
                  </div>
                )}
                {account.iban && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-xs">شبا:</span>
                    <span className="font-mono text-xs font-bold text-slate-800" dir="ltr">{account.iban}</span>
                  </div>
                )}
              </div>

              {!account.is_default && (
                <button onClick={() => handleSetDefault(account)}
                  className="mt-4 w-full py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors">
                  تنظیم به عنوان پیش‌فرض
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <AccountForm
          account={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

function AccountForm({ account, onClose, onCreated }: { account: PaymentAccount | null; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    account_type: account?.account_type || 'bank_account',
    bank_name: account?.bank_name || '',
    account_number: account?.account_number || '',
    card_number: account?.card_number || '',
    iban: account?.iban || '',
    account_holder: account?.account_holder || '',
    is_default: account?.is_default || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (account) {
        await admin.paymentAccounts.update(account.id, form);
      } else {
        await admin.paymentAccounts.create(form);
      }
      onCreated();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-800">
            {account ? 'ویرایش حساب' : 'حساب جدید'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">نوع حساب</label>
            <select value={form.account_type} onChange={e => setForm({...form, account_type: e.target.value as any})}
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500">
              <option value="bank_account">حساب بانکی</option>
              <option value="card">کارت بانکی</option>
              <option value="wallet">کیف پول</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">نام بانک</label>
            <input type="text" value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})}
              placeholder="مثلاً: ملت، ملی، پاسارگاد"
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">دارنده حساب</label>
            <input type="text" value={form.account_holder} onChange={e => setForm({...form, account_holder: e.target.value})}
              placeholder="نام و نام خانوادگی"
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          {form.account_type === 'card' && (
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">شماره کارت</label>
              <input type="text" value={form.card_number} onChange={e => setForm({...form, card_number: e.target.value})}
                placeholder="XXXX-XXXX-XXXX-XXXX" dir="ltr"
                className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-mono text-left focus:outline-none focus:border-amber-500" />
            </div>
          )}

          {form.account_type === 'bank_account' && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">شماره حساب</label>
                <input type="text" value={form.account_number} onChange={e => setForm({...form, account_number: e.target.value})}
                  dir="ltr"
                  className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-mono text-left focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">شبا (IBAN)</label>
                <input type="text" value={form.iban} onChange={e => setForm({...form, iban: e.target.value})}
                  placeholder="IR..." dir="ltr"
                  className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-mono text-left focus:outline-none focus:border-amber-500" />
              </div>
            </>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_default} onChange={e => setForm({...form, is_default: e.target.checked})}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
            <span className="text-sm font-bold text-slate-700">تنظیم به عنوان حساب پیش‌فرض</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
            انصراف
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            <Check className="w-4 h-4" />
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </div>
    </div>
  );
}
