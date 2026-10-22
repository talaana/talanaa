/**
 * Campaign persistence: localStorage-backed store with JSON import/export.
 * Keys are namespaced to avoid colliding with other tenant/feature state.
 */
import type { Campaign, ExperienceGraph } from '../types/sequenceGraph';
import defaultGraphData from '../data/defaultGoldExperienceGraph.json';
import { migrateGraph } from '../lib/runtime';

const STORAGE_KEY = 'talana_cinematic_campaigns_v2';
const LEGACY_KEY = 'talana_cinematic_campaigns_v1';

function normalizeCampaign(c: Campaign): Campaign {
  return { ...c, graph: migrateGraph(c.graph) };
}

function readAll(): Campaign[] {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy) as Campaign[];
        const migrated = (Array.isArray(parsed) ? parsed : []).map(normalizeCampaign);
        writeAll(migrated);
        return migrated;
      }
      return [];
    }
    const parsed = JSON.parse(raw) as Campaign[];
    return (Array.isArray(parsed) ? parsed : []).map(normalizeCampaign);
  } catch {
    return [];
  }
}

function writeAll(campaigns: Campaign[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

function makeId(): string {
  return 'cmp_' + Math.random().toString(36).slice(2, 10);
}

/** Resolve the demo graph bundled with the feature (default campaign seed). */
export function getDefaultGraph(): ExperienceGraph {
  return migrateGraph(defaultGraphData);
}

export function getDefaultCampaign(): Campaign {
  return {
    id: 'campaign_default',
    slug: 'default',
    name: 'گالری اصلی طلا و جواهر',
    seo: {
      title: 'تجربه سینمایی طلا و جواهر',
      description: 'گشت مجازی در تالارهای بوتیک طلا و جواهر.',
    },
    graph: getDefaultGraph(),
    published: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const CampaignStorage = {
  list(): Campaign[] {
    const existing = readAll();
    if (existing.length === 0) {
      const seed = getDefaultCampaign();
      writeAll([seed]);
      return [seed];
    }
    return existing;
  },

  getBySlug(slug: string): Campaign | null {
    return this.list().find((c) => c.slug === slug) ?? null;
  },

  getById(id: string): Campaign | null {
    return this.list().find((c) => c.id === id) ?? null;
  },

  save(campaign: Campaign): Campaign {
    const all = readAll();
    const idx = all.findIndex((c) => c.id === campaign.id);
    const next = { ...campaign, updatedAt: Date.now() };
    if (idx >= 0) all[idx] = next;
    else all.push(next);
    writeAll(all);
    return next;
  },

  create(name: string, slug: string, graph: ExperienceGraph): Campaign {
    const campaign: Campaign = {
      id: makeId(),
      slug,
      name,
      seo: { title: name, description: '' },
      graph,
      published: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.save(campaign);
    return campaign;
  },

  duplicate(id: string): Campaign | null {
    const src = this.getById(id);
    if (!src) return null;
    const copy: Campaign = {
      ...JSON.parse(JSON.stringify(src)) as Campaign,
      id: makeId(),
      slug: src.slug + '-copy',
      name: src.name + ' (کپی)',
      published: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.save(copy);
    return copy;
  },

  remove(id: string): void {
    writeAll(readAll().filter((c) => c.id !== id));
  },

  setPublished(id: string, published: boolean): Campaign | null {
    const all = readAll();
    const idx = all.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    all[idx] = { ...all[idx], published, updatedAt: Date.now() };
    writeAll(all);
    return all[idx];
  },

  isSlugTaken(slug: string, exceptId?: string): boolean {
    return readAll().some((c) => c.slug === slug && c.id !== exceptId);
  },

  export(campaign: Campaign): string {
    return JSON.stringify(campaign, null, 2);
  },

  import(json: string): Campaign | null {
    try {
      const parsed = JSON.parse(json) as Campaign;
      if (!parsed || !parsed.graph || !Array.isArray(parsed.graph.nodes)) return null;
      parsed.id = makeId();
      parsed.createdAt = Date.now();
      parsed.updatedAt = Date.now();
      if (this.isSlugTaken(parsed.slug)) parsed.slug = parsed.slug + '-' + Date.now().toString(36);
      this.save(parsed);
      return parsed;
    } catch {
      return null;
    }
  },
};
