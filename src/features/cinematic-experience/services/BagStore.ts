/**
 * Local shopping bag for the cinematic experience. Purchase itself flows
 * through the existing transaction API in the host app; this store only holds
 * the in-session selection so "Add to Bag" behaves like a real cart.
 */
import type { GoldProduct } from '../types/goldProduct';

const KEY = 'talana_cinematic_bag_v1';

let listeners: Array<() => void> = [];
let items: GoldProduct[] = load();

function load(): GoldProduct[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GoldProduct[]) : [];
  } catch {
    return [];
  }
}

function persist(): void {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export const BagStore = {
  items(): GoldProduct[] {
    return [...items];
  },
  count(): number {
    return items.length;
  },
  add(product: GoldProduct): void {
    items.push(product);
    persist();
  },
  remove(index: number): void {
    items.splice(index, 1);
    persist();
  },
  clear(): void {
    items = [];
    persist();
  },
  subscribe(listener: () => void): () => void {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};
