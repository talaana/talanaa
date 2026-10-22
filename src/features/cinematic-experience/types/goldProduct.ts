/**
 * Gold/jewelry product model for the hotspot detail modal and price calculator.
 * Weights use Iranian trade units: gram, mesghal (مثقال) and soot (سوت).
 */

export type KaratStamp = '18K' | '24K' | '750' | '999';

export interface GemstoneSpec {
  carat: number;
  color: string;
  clarity: string;
  cut: string;
  /** GIA / IGI certificate code. */
  certificate: string;
}

export interface GoldProduct {
  id: string;
  title: string;
  karat: KaratStamp;
  /** Exact weight in grams. */
  weightGrams: number;
  /** Making wage per gram in Toman. */
  makingWagePerGramToman: number;
  /** Gallery profit percent (default 7). */
  galleryProfitPercent: number;
  /** Tax percent applied to wage + profit (default 9). */
  taxPercent: number;
  gemstone?: GemstoneSpec;
  imageUrl?: string;
  /** Fallback local asset used by the demo graph. */
  imageAsset?: string;
}

/** Iranian trade-unit conversion constants. */
export const GRAMS_PER_MESGHAL = 4.608;
/** One soot (سوت) is a quarter mesghal. */
export const SOOT_PER_MESGHAL = 4;

export function gramsToMesghal(grams: number): number {
  return grams / GRAMS_PER_MESGHAL;
}

export function gramsToSoot(grams: number): number {
  return gramsToMesghal(grams) * SOOT_PER_MESGHAL;
}

export interface PriceBreakdown {
  rawGoldPerGramToman: number;
  rawGoldTotalToman: number;
  makingWageTotalToman: number;
  /** (raw + wage) — the subtotal before profit/tax. */
  baseTotalToman: number;
  galleryProfitToman: number;
  taxToman: number;
  finalPriceToman: number;
}

/**
 * Pricing formula per the gold union:
 *   subtotal = (raw gram price + making wage) × weight
 *   profit   = subtotal × galleryProfitPercent
 *   tax      = (making wage + profit) × taxPercent
 *   final    = subtotal + profit + tax
 */
export function computePriceBreakdown(
  product: Pick<GoldProduct, 'weightGrams' | 'makingWagePerGramToman' | 'galleryProfitPercent' | 'taxPercent'>,
  rawGoldPerGramToman: number,
): PriceBreakdown {
  const rawGoldTotal = product.weightGrams * rawGoldPerGramToman;
  const makingWageTotal = product.weightGrams * product.makingWagePerGramToman;
  const baseTotal = rawGoldTotal + makingWageTotal;
  const profit = baseTotal * (product.galleryProfitPercent / 100);
  const tax = (makingWageTotal + profit) * (product.taxPercent / 100);
  return {
    rawGoldPerGramToman,
    rawGoldTotalToman: round(rawGoldTotal),
    makingWageTotalToman: round(makingWageTotal),
    baseTotalToman: round(baseTotal),
    galleryProfitToman: round(profit),
    taxToman: round(tax),
    finalPriceToman: round(baseTotal + profit + tax),
  };
}

function round(n: number): number {
  return Math.round(n);
}
