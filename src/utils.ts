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

const CATEGORY_LABELS: Record<string, string> = {
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

export function getProductPlaceholder(category: string, metal?: 'gold' | 'silver'): string {
  const isGold = metal !== 'silver';
  const [c1, c2] = isGold ? ['#f59e0b', '#b45309'] : ['#94a3b8', '#475569'];
  const name = CATEGORY_LABELS[category] || 'طلانا';
  const w = 400, h = 400;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <text x="${w/2}" y="${h/2}" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="Vazirmatn, system-ui, sans-serif" font-size="32" font-weight="900">${name}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function getSellerPlaceholder(name: string): string {
  const w = 800, h = 300;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e293b"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect x="${w/2-120}" y="${h/2-50}" width="240" height="100" rx="20" fill="none" stroke="#ca8a04" stroke-width="2"/>
  <text x="${w/2}" y="${h/2-8}" text-anchor="middle" dominant-baseline="central" fill="#ca8a04" font-family="Vazirmatn, system-ui, sans-serif" font-size="36" font-weight="900">${name}</text>
  <text x="${w/2}" y="${h/2+32}" text-anchor="middle" dominant-baseline="central" fill="#64748b" font-family="Vazirmatn, system-ui, sans-serif" font-size="18" font-weight="700">همکار رسمی طلانا</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

