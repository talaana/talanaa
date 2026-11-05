import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import type { GoldProduct } from '../types/goldProduct';
import { CampaignStorage } from '../services/CampaignStorage';
import ExperiencePlayer from '../components/ExperiencePlayer';

interface Props {
  slug: string;
  rawGoldPerGramToman: number;
  onDirectPurchase: (product: GoldProduct) => void;
}

/**
 * Feature C — dynamic campaign renderer at /experience/:slug. Reads the
 * campaign graph by slug and renders the exact same player configured in the
 * builder.
 */
export default function DynamicCampaignExperiencePage({ slug, rawGoldPerGramToman, onDirectPurchase }: Props) {
  const campaign = useMemo(() => CampaignStorage.getBySlug(slug), [slug]);

  if (!campaign || !campaign.published) {
    return (
      <div dir="rtl" className="min-h-screen bg-[#0a0d13] text-white flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-4">
          <div className="text-5xl">🪙</div>
          <h1 className="text-xl font-black">تجربه یافت نشد</h1>
          <p className="text-sm text-amber-100/60 font-bold">کمپین «{slug}» وجود ندارد یا منتشر نشده است.</p>
          <a href="/" className="inline-flex items-center gap-1.5 text-amber-300 font-black text-sm hover:text-amber-200">
            <ArrowRight className="w-4 h-4" /> بازگشت به صفحه اصلی
          </a>
        </div>
      </div>
    );
  }

  const header = (
    <header className="absolute top-0 right-0 left-0 z-30">
      <div dir="rtl" className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 text-white font-black text-sm drop-shadow-lg">
          <img src="/talana_logo.png" alt="طلانا" className="w-9 h-9 rounded-xl object-cover" />
          <span>{campaign.name}</span>
        </a>
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
