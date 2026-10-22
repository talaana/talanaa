/**
 * Core graph model for the cinematic experience builder.
 *
 * Sequences are nodes (loop videos). Transition sequences are directed edges
 * between sequences (forward/reverse video, driven by scroll/swipe).
 */

/** Identifies a sequence node. */
export type SceneId = string;

/** A pulsing radar pin attached to a jewelry piece on screen. */
export interface Hotspot {
  id: string;
  /** Position as fraction of the media viewport (0..1). */
  x: number;
  y: number;
  /** Persian label. */
  label: string;
  /** Reference into the gold product catalog. */
  productId: string;
}

export type NodeKind = 'sequence';

export interface BaseNode {
  id: string;
  kind: NodeKind;
  /** Persian title shown on the node card. */
  title: string;
  /** Canvas position (px). */
  x: number;
  y: number;
}

/** A loop-video hall / room the visitor rests on until they scroll/swipe. */
export interface SequenceNode extends BaseNode {
  kind: 'sequence';
  subtitle?: string;
  /** Local / remote video loop. Empty → gold-dust canvas fallback. */
  videoUrl?: string;
  /** Poster image shown while the video is not yet ready. */
  posterUrl?: string;
  /** Spatial radar pins attached to jewelry pieces in this sequence. */
  hotspots: Hotspot[];
  /** Product ids featured in this sequence. */
  productIds?: string[];
}

export type GraphNode = SequenceNode;

export type TransitionKind = 'video' | 'crossfade';

/**
 * Directed transition between two sequence nodes.
 * Scroll/swipe forward plays `videoUrl`; reverse plays `videoUrlReverse` (or
 * falls back to crossfade when media is missing).
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  /** Bezier connection label (optional). */
  label?: string;
  kind: TransitionKind;
  /** Forward transition video (source → target). */
  videoUrl?: string;
  /** Reverse transition video (target → source). */
  videoUrlReverse?: string;
  /** Fallback / trim duration when using crossfade or no video. */
  durationMs: number;
}

export interface ExperienceGraph {
  /** Node id to start playback from. */
  entryNodeId: string | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SeoMeta {
  title: string;
  description: string;
  ogImageUrl?: string;
}

export interface Campaign {
  id: string;
  /** Unique public slug (e.g. bridal-2025). */
  slug: string;
  /** Persian display name. */
  name: string;
  seo: SeoMeta;
  graph: ExperienceGraph;
  published: boolean;
  createdAt: number;
  updatedAt: number;
}
