import type { GoldProduct } from '../types/goldProduct';

/**
 * Demo catalog of jewelry pieces referenced by the default experience graph.
 * In production these resolve against the tenant's product API; this bundled
 * catalog lets the cinematic feature run standalone with real trade data.
 */
export const DEMO_CATALOG: GoldProduct[] = [
  {
    id: 'prod-solitaire-ring',
    title: 'انگشتر سولیتر الماس ۱.۵ قیراط',
    karat: '18K',
    weightGrams: 5.42,
    makingWagePerGramToman: 1850000,
    galleryProfitPercent: 7,
    taxPercent: 9,
    gemstone: {
      carat: 1.5,
      color: 'D',
      clarity: 'VVS1',
      cut: 'Excellent',
      certificate: 'GIA 7435129876',
    },
  },
  {
    id: 'prod-bridal-set',
    title: 'ست عروس طلای ۱۸ عیار',
    karat: '18K',
    weightGrams: 62.8,
    makingWagePerGramToman: 960000,
    galleryProfitPercent: 7,
    taxPercent: 9,
  },
  {
    id: 'prod-sapphire-ring',
    title: 'انگشتر یاقوت کبود سلطنتی',
    karat: '750',
    weightGrams: 8.15,
    makingWagePerGramToman: 1400000,
    galleryProfitPercent: 7,
    taxPercent: 9,
    gemstone: {
      carat: 3.2,
      color: 'Royal Blue',
      clarity: 'VVS2',
      cut: 'Oval',
      certificate: 'IGI 2087612345',
    },
  },
  {
    id: 'prod-bullion-bar',
    title: 'شمش طلای ۲۴ عیار سوئیسی',
    karat: '24K',
    weightGrams: 100,
    makingWagePerGramToman: 0,
    galleryProfitPercent: 2,
    taxPercent: 9,
  },
  {
    id: 'prod-gold-coin',
    title: 'سکه تمام بهار آزادی',
    karat: '24K',
    weightGrams: 8.133,
    makingWagePerGramToman: 220000,
    galleryProfitPercent: 3,
    taxPercent: 9,
  },
  {
    id: 'prod-necklace',
    title: 'گردنبند الماس و طلای سفید',
    karat: '750',
    weightGrams: 21.6,
    makingWagePerGramToman: 1250000,
    galleryProfitPercent: 7,
    taxPercent: 9,
    gemstone: {
      carat: 4.0,
      color: 'F',
      clarity: 'VS1',
      cut: 'Round',
      certificate: 'GIA 6210487530',
    },
  },
];

export function findDemoProduct(id: string): GoldProduct | undefined {
  return DEMO_CATALOG.find((p) => p.id === id);
}
