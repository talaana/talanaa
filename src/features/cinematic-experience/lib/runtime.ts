/**
 * Runtime compilation: walk the sequence graph from entryNodeId along edges
 * into an ordered path the player can navigate with scroll/swipe.
 */
import type {
  ExperienceGraph,
  GraphEdge,
  SequenceNode,
} from '../types/sequenceGraph';

/** A playable sequence step (flattened for timeline / map). */
export type RuntimeSequence = SequenceNode;

export interface RuntimeNeighbor {
  edge: GraphEdge;
  /** The other sequence this edge connects to. */
  nodeId: string;
  /** true when traveling source → target on this edge. */
  forward: boolean;
}

export interface RuntimeView {
  /** Ordered path of sequence nodes from entry along forward edges. */
  sequences: RuntimeSequence[];
  /** Map of sequence id → outgoing forward + reverse neighbors. */
  neighbors: Record<string, { forward: RuntimeNeighbor | null; reverse: RuntimeNeighbor | null }>;
  entryNodeId: string | null;
}

/** Walk a linear path from entry following unique forward edges. */
export function compileGraph(graph: ExperienceGraph): RuntimeView {
  const nodes = (graph.nodes ?? []).filter((n): n is SequenceNode => n.kind === 'sequence');
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges = graph.edges ?? [];

  const neighbors: RuntimeView['neighbors'] = {};
  for (const n of nodes) {
    neighbors[n.id] = { forward: null, reverse: null };
  }

  for (const edge of edges) {
    if (!byId.has(edge.source) || !byId.has(edge.target)) continue;
    // Prefer first forward edge from a node for the linear path.
    if (!neighbors[edge.source].forward) {
      neighbors[edge.source].forward = { edge, nodeId: edge.target, forward: true };
    }
    if (!neighbors[edge.target].reverse) {
      neighbors[edge.target].reverse = { edge, nodeId: edge.source, forward: false };
    }
  }

  const sequences: RuntimeSequence[] = [];
  const entryId =
    (graph.entryNodeId && byId.has(graph.entryNodeId) ? graph.entryNodeId : null) ??
    nodes[0]?.id ??
    null;

  if (entryId) {
    const visited = new Set<string>();
    let cursor: string | null = entryId;
    while (cursor && !visited.has(cursor)) {
      visited.add(cursor);
      const node = byId.get(cursor);
      if (node) sequences.push(node);
      cursor = neighbors[cursor]?.forward?.nodeId ?? null;
    }
    // Orphan sequences not on the main path (still selectable via map).
    for (const n of nodes) {
      if (!visited.has(n.id)) sequences.push(n);
    }
  }

  return { sequences, neighbors, entryNodeId: entryId };
}

export function indexOfSequence(view: RuntimeView, nodeId: string): number {
  return view.sequences.findIndex((s) => s.id === nodeId);
}

/** Resolve the media URL for traveling along an edge in a given direction. */
export function resolveTransitionVideo(edge: GraphEdge, forward: boolean): string | undefined {
  if (forward) return edge.videoUrl || undefined;
  return edge.videoUrlReverse || edge.videoUrl || undefined;
}

interface LegacyScene {
  id: string;
  title: string;
  subtitle?: string;
  videoUrl?: string;
  posterUrl?: string;
  hotspots?: SequenceNode['hotspots'];
}

interface LegacyNode {
  id: string;
  kind?: string;
  scenes?: LegacyScene[];
  productIds?: string[];
  title?: string;
  subtitle?: string;
  videoUrl?: string;
  posterUrl?: string;
  hotspots?: SequenceNode['hotspots'];
  x?: number;
  y?: number;
}

/**
 * Best-effort migrate of legacy environment-nested graphs into sequence nodes.
 * Returns the input unchanged when already in the new shape.
 */
export function migrateGraph(raw: unknown): ExperienceGraph {
  const g = raw as {
    entryNodeId?: string | null;
    nodes?: LegacyNode[];
    edges?: GraphEdge[];
  };
  if (!g || !Array.isArray(g.nodes)) {
    return { entryNodeId: null, nodes: [], edges: [] };
  }

  const hasSequence = g.nodes.some((n) => n.kind === 'sequence');
  if (hasSequence) {
    const nodes: SequenceNode[] = g.nodes
      .filter((n) => n.kind === 'sequence')
      .map((n) => ({
        id: n.id,
        kind: 'sequence' as const,
        title: n.title ?? 'سکانس',
        subtitle: n.subtitle,
        videoUrl: n.videoUrl,
        posterUrl: n.posterUrl,
        x: n.x ?? 0,
        y: n.y ?? 0,
        hotspots: n.hotspots ?? [],
        productIds: n.productIds,
      }));
    return {
      entryNodeId: g.entryNodeId ?? nodes[0]?.id ?? null,
      nodes,
      edges: (g.edges ?? []).map(normalizeEdge),
    };
  }

  const env = g.nodes.find((n) => n.kind === 'environment');
  const scenes = env?.scenes ?? [];

  if (scenes.length === 0) {
    return { entryNodeId: null, nodes: [], edges: [] };
  }

  const nodes: SequenceNode[] = scenes.map((s, i) => ({
    id: s.id.startsWith('seq-') ? s.id : `seq-${s.id}`,
    kind: 'sequence' as const,
    title: s.title,
    subtitle: s.subtitle,
    videoUrl: s.videoUrl,
    posterUrl: s.posterUrl,
    x: i * 240,
    y: 80,
    hotspots: s.hotspots ?? [],
    productIds: env?.productIds,
  }));

  const edges: GraphEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      id: `t-${nodes[i].id}-${nodes[i + 1].id}`,
      source: nodes[i].id,
      target: nodes[i + 1].id,
      kind: 'crossfade',
      durationMs: 900,
    });
  }

  return {
    entryNodeId: nodes[0]?.id ?? null,
    nodes,
    edges,
  };
}

function normalizeEdge(e: GraphEdge): GraphEdge {
  return {
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    kind: e.kind === 'video' ? 'video' : 'crossfade',
    videoUrl: e.videoUrl,
    videoUrlReverse: e.videoUrlReverse,
    durationMs: typeof e.durationMs === 'number' ? e.durationMs : 900,
  };
}
