/**
 * Helper to calculate the final price of a gold product based on Iranian standards.
 * Formula from 1400: Tax (9%) is only calculated on the Wage and Goldsmith Profit.
 * Raw gold is exempt from tax. Profit is a standard 7%.
 */
export function calculateGoldProductPrice(
  weight: number,
  baseGoldPrice18k: number,
  wagePercentage: number,
  taxPercentage: number = 9
) {
  const rawGoldVal = weight * baseGoldPrice18k;
  const wageVal = rawGoldVal * (wagePercentage / 100);
  const profitVal = (rawGoldVal + wageVal) * 0.07; // Standard 7% profit
  const taxVal = (wageVal + profitVal) * (taxPercentage / 100);
  const finalPrice = rawGoldVal + wageVal + profitVal + taxVal;

  return {
    rawGoldVal: Math.round(rawGoldVal),
    wageVal: Math.round(wageVal),
    profitVal: Math.round(profitVal),
    taxVal: Math.round(taxVal),
    finalPrice: Math.round(finalPrice),
  };
}

/**
 * Converts English digits to Persian digits
 */
export function toPersianDigits(num: string | number | undefined | null): string {
  if (num === undefined || num === null) return '';
  const str = String(num);
  const latinToPersian: { [key: string]: string } = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  return str.replace(/[0-9]/g, (match) => latinToPersian[match] || match);
}

/**
 * Formats a price in Toman with thousand separators and Persian digits
 */
export function formatToman(price: number | undefined | null): string {
  if (price === undefined || price === null) return toPersianDigits(0);
  const formatted = Math.round(price).toLocaleString('en-US');
  return toPersianDigits(formatted);
}

/**
 * Formats a weight in grams with 3 decimal places and Persian digits
 */
export function formatGram(weight: number | undefined | null): string {
  if (weight === undefined || weight === null) return toPersianDigits(0);
  const formatted = Number(weight).toFixed(3);
  return toPersianDigits(formatted);
}

/**
 * Formats standard Persian percentages
 */
export function formatPercent(percentage: number | string | undefined | null): string {
  if (percentage === undefined || percentage === null) return toPersianDigits(0);
  return toPersianDigits(percentage);
}

const CATEGORY_LABEL: Record<string, string> = {
  ring: 'انگشتر',
  necklace: 'گردنبند',
  bracelet: 'دستبند',
  earring: 'گوشواره',
  service: 'سرویس',
  bar: 'شمش',
  coin: 'سکه',
  secondhand: 'طلای دست\u200Cدوم',
  custom: 'سفارشی\u200Cسازی',
};

function svgEncode(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function productPlaceholder(category: string, metal?: 'gold' | 'silver'): string {
  const isGold = metal !== 'silver';
  const w = 400, h = 400;
  const label = CATEGORY_LABEL[category] || 'طلانا';

  if (isGold) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="50%" stop-color="#292524"/>
      <stop offset="100%" stop-color="#1c1917"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <linearGradient id="goldLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="60" cy="70" r="120" fill="#f59e0b" opacity="0.04"/>
  <circle cx="${w-40}" cy="${h-50}" r="160" fill="#fbbf24" opacity="0.03"/>
  <rect x="${w/2-70}" y="${h/2-70}" width="140" height="140" rx="28" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="0.3"/>
  <rect x="${w/2-58}" y="${h/2-58}" width="116" height="116" rx="20" fill="none" stroke="url(#goldLight)" stroke-width="1" opacity="0.15"/>
  <circle cx="${w/2}" cy="${h/2-30}" r="4" fill="#f59e0b" opacity="0.6"/>
  <text x="${w/2}" y="${h/2+10}" text-anchor="middle" dominant-baseline="central" fill="url(#gold)" font-family="Vazirmatn, system-ui, sans-serif" font-size="36" font-weight="900">${label}</text>
  <text x="${w/2}" y="${h/2+46}" text-anchor="middle" dominant-baseline="central" fill="#78716c" font-family="Vazirmatn, system-ui, sans-serif" font-size="14" font-weight="700">طلای ۱۸ عیار</text>
  <line x1="${w/2-50}" y1="${h-60}" x2="${w/2+50}" y2="${h-60}" stroke="#f59e0b" stroke-width="1" opacity="0.2"/>
  <circle cx="${w/2}" cy="${h-60}" r="3" fill="#f59e0b" opacity="0.4"/>
</svg>`;
    return svgEncode(svg);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="silver" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="50%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="80" cy="80" r="130" fill="#94a3b8" opacity="0.04"/>
  <circle cx="${w-60}" cy="${h-60}" r="150" fill="#cbd5e1" opacity="0.03"/>
  <rect x="${w/2-70}" y="${h/2-70}" width="140" height="140" rx="28" fill="none" stroke="url(#silver)" stroke-width="1.5" opacity="0.3"/>
  <rect x="${w/2-58}" y="${h/2-58}" width="116" height="116" rx="20" fill="none" stroke="#cbd5e1" stroke-width="1" opacity="0.15"/>
  <circle cx="${w/2}" cy="${h/2-30}" r="4" fill="#94a3b8" opacity="0.6"/>
  <text x="${w/2}" y="${h/2+10}" text-anchor="middle" dominant-baseline="central" fill="url(#silver)" font-family="Vazirmatn, system-ui, sans-serif" font-size="36" font-weight="900">${label}</text>
  <text x="${w/2}" y="${h/2+46}" text-anchor="middle" dominant-baseline="central" fill="#64748b" font-family="Vazirmatn, system-ui, sans-serif" font-size="14" font-weight="700">نقره ۹۲۵</text>
  <line x1="${w/2-50}" y1="${h-60}" x2="${w/2+50}" y2="${h-60}" stroke="#94a3b8" stroke-width="1" opacity="0.2"/>
  <circle cx="${w/2}" cy="${h-60}" r="3" fill="#94a3b8" opacity="0.4"/>
</svg>`;
  return svgEncode(svg);
}

export function sellerPlaceholder(name: string): string {
  const w = 800, h = 300;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <circle cx="120" cy="100" r="180" fill="#f59e0b" opacity="0.025"/>
  <circle cx="${w-80}" cy="${h-60}" r="200" fill="#fbbf24" opacity="0.02"/>
  <line x1="60" y1="${h/2}" x2="${w-60}" y2="${h/2}" stroke="#f59e0b" stroke-width="0.5" opacity="0.08"/>
  <rect x="${w/2-140}" y="${h/2-48}" width="280" height="96" rx="16" fill="none" stroke="url(#gold)" stroke-width="1.5" opacity="0.35"/>
  <text x="${w/2}" y="${h/2-6}" text-anchor="middle" dominant-baseline="central" fill="url(#gold)" font-family="Vazirmatn, system-ui, sans-serif" font-size="38" font-weight="900">${name}</text>
  <text x="${w/2}" y="${h/2+34}" text-anchor="middle" dominant-baseline="central" fill="#64748b" font-family="Vazirmatn, system-ui, sans-serif" font-size="16" font-weight="700">همکار رسمی طلانا</text>
</svg>`;
  return svgEncode(svg);
}

