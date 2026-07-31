import React, { useEffect, useState } from 'react';
import { admin } from '../api';
import { toPersianDigits } from '../../utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { admin.stats().then(setStats).catch(()=>{}); }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-800">داشبورد مدیریت</h2>
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'کل کاربران', value: stats.total_users, color: 'bg-blue-500' },
            { label: 'فروشگاه‌ها', value: stats.total_tenants, color: 'bg-purple-500' },
            { label: 'تراکنش‌ها', value: stats.total_transactions, color: 'bg-emerald-500' },
            { label: 'درآمد کل (تومان)', value: `${toPersianDigits(Math.round(stats.total_revenue/1000000))}M`, color: 'bg-amber-500' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <span className="text-white text-lg font-black">{toPersianDigits(String(s.value))}</span>
              </div>
              <span className="text-sm font-black text-slate-700">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
