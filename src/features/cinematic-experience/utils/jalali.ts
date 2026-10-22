/**
 * Minimal Jalali (Shamsi) calendar for the VIP appointment wizard.
 * Gregorian ↔ Jalali conversion using the standard 33-year leap algorithm.
 */

export interface JalaliDate {
  year: number;
  month: number; // 1..12
  day: number;   // 1..31
}

export const JALALI_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
] as const;

export const JALALI_WEEKDAYS = [
  'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه',
] as const;

// Leap-year break points of the Jalali 33-year cycle.
const BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
  1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178,
];

function isJalaliLeap(jy: number): boolean {
  let leap = -14;
  let jp = BREAKS[0];
  for (let i = 1; i < BREAKS.length; i += 1) {
    const jm = BREAKS[i];
    const jump = jm - jp;
    if (jy < jm) break;
    leap += Math.floor(jump / 33) * 8 + Math.floor((jump % 33) / 4);
    jp = jm;
  }
  const n = jy - jp;
  leap += Math.floor(n / 33) * 8 + Math.floor(((n % 33) + 3) / 4);
  return (leap + 1) % 33 < 9;
}

export { isJalaliLeap };

function gregorianLeap(gy: number): boolean {
  return (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
}

function gDaysInMonth(gy: number, gm: number): number {
  return [31, gregorianLeap(gy) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][gm - 1];
}

function jDaysInMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeap(jy) ? 30 : 29;
}

/** Convert Gregorian (gy, gm, gd) to Jalali. */
export function toJalali(gy: number, gm: number, gd: number): JalaliDate {
  let gdm = gd;
  for (let m = 1; m < gm; m += 1) gdm += gDaysInMonth(gy, m);

  let jy = gy - 621;
  while (true) {
    const days = isJalaliLeap(jy) ? 366 : 365;
    if (gdm <= days) break;
    gdm -= days;
    jy += 1;
  }

  let jm = 1;
  while (gdm > jDaysInMonth(jy, jm)) {
    gdm -= jDaysInMonth(jy, jm);
    jm += 1;
  }
  return { year: jy, month: jm, day: gdm };
}

/** Convert Jalali (jy, jm, jd) to a JS Date. */
export function toGregorian(jy: number, jm: number, jd: number): Date {
  const gy = jy + 621;
  let gdm = jd;
  for (let m = 1; m < jm; m += 1) gdm += jDaysInMonth(jy, m);
  // Start of the Jalali year corresponds to ~March 21 of (jy + 621).
  const start = new Date(gy, 2, 21);
  return new Date(start.getTime() + (gdm - 1) * 86400000);
}

/** Days in a Jalali month. */
export function jalaliMonthDays(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeap(year) ? 30 : 29;
}

/** Weekday (0 = Saturday) of a Jalali date. */
export function jalaliWeekday(year: number, month: number, day: number): number {
  const d = toGregorian(year, month, day);
  // JS getDay(): 0=Sun..6=Sat → map to 0=Sat..6=Fri
  return (d.getDay() + 1) % 7;
}

/** Persian digits for a number. */
export function toPersianDigits(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => String.fromCharCode(1776 + d.charCodeAt(0) - 48));
}

export function formatJalali(d: JalaliDate): string {
  return `${toPersianDigits(d.day)} ${JALALI_MONTH_NAMES[d.month - 1]} ${toPersianDigits(d.year)}`;
}

export function todayJalali(): JalaliDate {
  const now = new Date();
  return toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
