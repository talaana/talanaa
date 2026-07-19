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

