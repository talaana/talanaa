import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAYS,
  jalaliMonthDays,
  jalaliWeekday,
  todayJalali,
  formatJalali,
  toPersianDigits,
} from '../utils/jalali';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional pre-filled product for bespoke consultation. */
  productTitle?: string;
}

const SALONS = [
  'سالن اختصاصی الماس',
  'سالن خصوصی VIP',
  'اتاق مشاوره طراحی سه‌بعدی',
];

const CONSULT_TYPES = [
  'رزرو پرو قطعه',
  'طراحی سفارشی سه‌بعدی',
  'مشاوره سرمایه‌گذاری طلا',
];

/**
 * VIP appointment & bespoke consultation wizard with a Jalali datepicker,
 * salon lounge reservation and 3D design consultation request.
 */
export default function VipAppointmentWizard({ open, onClose, productTitle }: Props) {
  const today = useMemo(() => todayJalali(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewDate, setViewDate] = useState({ year: today.year, month: today.month });
  const [salon, setSalon] = useState(SALONS[0]);
  const [consultType, setConsultType] = useState(CONSULT_TYPES[0]);
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const grid = useMemo(() => buildMonthGrid(viewDate.year, viewDate.month), [viewDate]);

  const prevMonth = () => {
    setViewDate((v) => (v.month === 1 ? { year: v.year - 1, month: 12 } : { year: v.year, month: v.month - 1 }));
  };
  const nextMonth = () => {
    setViewDate((v) => (v.month === 12 ? { year: v.year + 1, month: 1 } : { year: v.year, month: v.month + 1 }));
  };

  const submit = () => {
    if (phone.replace(/\D/g, '').length !== 11) {
      setError('شماره موبایل باید ۱۱ رقم باشد.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  const reset = () => {
    setSubmitted(false);
    setSelectedDate(today);
    setSalon(SALONS[0]);
    setConsultType(CONSULT_TYPES[0]);
    setPhone('');
  };

  const close = () => {
    onClose();
    // Defer reset so the exit animation doesn't flash empty content.
    window.setTimeout(reset, 250);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-[#14100a] text-amber-50 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] flex flex-col border border-amber-200/10 shadow-2xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          >
            <div className="flex items-center justify-between p-5 border-b border-amber-200/10">
              <div>
                <h3 className="font-black text-amber-100">رزرو VIP و مشاوره اختصاصی</h3>
                {productTitle && <p className="text-[11px] text-amber-200/50 font-bold mt-0.5">{productTitle}</p>}
              </div>
              <button onClick={close} className="text-amber-200/60 hover:text-amber-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {submitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-2xl mx-auto">✓</div>
                  <h4 className="font-black text-amber-100">درخواست شما ثبت شد</h4>
                  <p className="text-xs text-amber-200/60 font-bold leading-relaxed">
                    رزرو «{salon}» برای تاریخ {formatJalali(selectedDate)} ثبت شد. همکاران ما برای تأیید نهایی با شما تماس می‌گیرند.
                  </p>
                  <button onClick={reset} className="text-amber-300 font-black text-sm hover:text-amber-200">
                    ثبت درخواست جدید
                  </button>
                </div>
              ) : (
                <>
                  {/* Consultation type */}
                  <div>
                    <label className="text-[11px] font-black text-amber-200/60 mb-2 block">نوع درخواست</label>
                    <div className="flex flex-wrap gap-2">
                      {CONSULT_TYPES.map((c) => (
                        <button
                          key={c}
                          onClick={() => setConsultType(c)}
                          className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                            consultType === c ? 'bg-amber-400 text-black border-amber-400' : 'bg-black/20 border-amber-200/15 text-amber-100/70 hover:border-amber-200/40'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Salon */}
                  <div>
                    <label className="text-[11px] font-black text-amber-200/60 mb-2 block">سالن اختصاصی</label>
                    <div className="space-y-1.5">
                      {SALONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSalon(s)}
                          className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                            salon === s ? 'bg-amber-400/15 border-amber-400/40 text-amber-200' : 'bg-black/20 border-amber-200/10 text-amber-100/60 hover:border-amber-200/30'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Jalali datepicker */}
                  <div>
                    <label className="text-[11px] font-black text-amber-200/60 mb-2 block">تاریخ رزرو (شمسی)</label>
                    <div className="bg-black/20 border border-amber-200/10 rounded-2xl p-3">
                      <div className="flex items-center justify-between mb-3">
                        <button onClick={prevMonth} className="p-1 text-amber-200/60 hover:text-amber-100"><ChevronRight className="w-4 h-4" /></button>
                        <span className="text-sm font-black text-amber-100">
                          {JALALI_MONTH_NAMES[viewDate.month - 1]} {toPersianDigits(viewDate.year)}
                        </span>
                        <button onClick={nextMonth} className="p-1 text-amber-200/60 hover:text-amber-100"><ChevronLeft className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {JALALI_WEEKDAYS.map((d) => (
                          <span key={d} className="text-[9px] font-black text-amber-200/40 py-1">{d.slice(0, 1)}</span>
                        ))}
                        {grid.map((cell, i) =>
                          cell === null ? (
                            <span key={i} />
                          ) : (
                            <button
                              key={i}
                              onClick={() => setSelectedDate({ year: viewDate.year, month: viewDate.month, day: cell })}
                              className={`aspect-square rounded-lg text-[11px] font-bold transition-all ${
                                selectedDate.year === viewDate.year && selectedDate.month === viewDate.month && selectedDate.day === cell
                                  ? 'bg-amber-400 text-black'
                                  : 'text-amber-100/60 hover:bg-amber-400/10'
                              }`}
                            >
                              {toPersianDigits(cell)}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-[11px] font-black text-amber-200/60 mb-2 block">شماره موبایل</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      dir="ltr"
                      className="w-full bg-black/20 border border-amber-200/15 rounded-xl px-4 py-3 text-sm text-amber-50 text-left font-mono focus:outline-none focus:border-amber-400/50"
                    />
                    {error && <p className="text-[11px] text-rose-400 font-bold mt-1.5">{error}</p>}
                  </div>
                </>
              )}
            </div>

            {!submitted && (
              <div className="p-5 pt-3 border-t border-amber-200/10">
                <button
                  onClick={submit}
                  className="w-full bg-gradient-to-l from-amber-500 to-amber-400 text-black py-3.5 rounded-2xl font-black text-sm shadow-lg hover:brightness-110 transition-all"
                >
                  تأیید رزرو {formatJalali(selectedDate)}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Build a 6×7 day grid (null = blank cells) for the Jalali month, Sat-first. */
function buildMonthGrid(year: number, month: number): Array<number | null> {
  const daysInMonth = jalaliMonthDays(year, month);
  const start = jalaliWeekday(year, month, 1);
  const cells: Array<number | null> = [];
  for (let i = 0; i < start; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
