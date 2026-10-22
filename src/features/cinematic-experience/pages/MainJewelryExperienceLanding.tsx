import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { GoldProduct } from '../types/goldProduct';
import { CampaignStorage, getDefaultCampaign } from '../services/CampaignStorage';
import ExperiencePlayer from '../components/ExperiencePlayer';

interface Props {
  /** Live gold gram price (18K) in Toman. */
  rawGoldPerGramToman: number;
  /** Entry points preserved from the legacy landing page. */
  onEnterMarketplace: () => void;
  onEnterStore: (slug: string) => void;
  onStartBuilding: (type?: 'marketplace' | 'store' | 'supplier') => void;
  /** Direct purchase handler — wired to the host transaction API. */
  onDirectPurchase: (product: GoldProduct) => void;
}

/**
 * Feature A — the ultra-luxury cinematic main landing. Replaces the static
 * landing page with the shared scene engine; legacy entry points still work.
 */
export default function MainJewelryExperienceLanding({
  rawGoldPerGramToman,
  onEnterMarketplace,
  onEnterStore,
  onStartBuilding,
  onDirectPurchase,
}: Props) {
  const [campaign] = useState(() => CampaignStorage.getBySlug('default') ?? getDefaultCampaign());

  const header = (
    <header className="absolute top-0 right-0 left-0 z-30 pointer-events-none">
      <div dir="rtl" className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={onEnterMarketplace}
          className="pointer-events-auto flex items-center gap-2 text-white font-black text-sm drop-shadow-lg"
        >
          <img src="/talana_logo.png" alt="طلانا" className="w-9 h-9 rounded-xl object-cover" />
          <span>طلانا</span>
        </button>
        <nav className="pointer-events-auto hidden md:flex items-center gap-5 text-[11px] font-bold text-amber-100/80">
          <button onClick={() => onStartBuilding()} className="hover:text-white transition-colors">ساخت فروشگاه</button>
          <button onClick={() => onEnterStore('pars-gold')} className="hover:text-white transition-colors">فروشگاه نمونه</button>
          <button onClick={onEnterMarketplace} className="hover:text-white transition-colors">بازارچه</button>
        </nav>
        <button
          onClick={onEnterMarketplace}
          className="pointer-events-auto flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-[11px] font-black transition-colors"
        >
          ورود به بازارچه <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );

  return (
    <ExperiencePlayer
      graph={campaign.graph}
      rawGoldPerGramToman={rawGoldPerGramToman}
      onDirectPurchase={onDirectPurchase}
      header={header}
    />
  );
}
