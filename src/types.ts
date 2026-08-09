export interface GoldPricePoint {
  date: string;
  price: number;
}

export interface Product {
  id: string;
  title: string;
  category: string;
  weight: number; // in grams
  wagePercentage: number; // e.g., 18% or 20%
  taxPercentage: number; // e.g., 9%
  sellerName: string;
  sellerRating: number;
  city: string;
  image: string;
  description: string;
  isSecondHand?: boolean;
  isFeatured?: boolean;
  isCustom?: boolean;
  metal?: 'gold' | 'silver';
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Seller {
  id: string;
  name: string;
  rating: number;
  city: string;
  logo: string;
  banner: string;
  productsCount: number;
}

export interface Transaction {
  id: string;
  type: 'buy_gold' | 'sell_gold' | 'buy_product';
  title: string;
  date: string;
  amountToman: number;
  weightGrams?: number;
  status: 'completed' | 'pending';
  details?: string;
  image?: string;
}

export interface UserWallet {
  goldGrams: number;
  silverGrams: number;
  cashToman: number;
}

export interface TenantConfig {
  id: number;
  name: string;
  slug: string;
  type: 'marketplace' | 'store' | 'supplier';
  domain: string | null;
  logo: string | null;
  brand_color: string | null;
  silver_tab_color: string | null;
  settings: Record<string, any> | null;
}
