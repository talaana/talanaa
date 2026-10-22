/**
 * Builder state store — a tiny observable store (no external deps) holding the
 * working graph plus selection. Components subscribe via useSyncExternalStore.
 */
import type { ExperienceGraph, GraphEdge, GraphNode, NodeKind } from '../../types/sequenceGraph';

interface BuilderState {
  graph: ExperienceGraph;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
}

let state: BuilderState = {
  graph: { entryNodeId: null, nodes: [], edges: [] },
  selectedNodeId: null,
  selectedEdgeId: null,
};

let listeners: Array<() => void> = [];

function emit(): void {
  listeners.forEach((l) => l());
}

function cloneGraph(g: ExperienceGraph): ExperienceGraph {
  return JSON.parse(JSON.stringify(g)) as ExperienceGraph;
}

function setGraph(mutate: (g: ExperienceGraph) => void): void {
  const next = cloneGraph(state.graph);
  mutate(next);
  state = { ...state, graph: next };
  emit();
}

function makeId(prefix: string): string {
  return prefix + '_' + Math.random().toString(36).slice(2, 8);
}

export const BuilderStore = {
  getState(): BuilderState {
    return state;
  },

  subscribe(listener: () => void): () => void {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  load(graph: ExperienceGraph): void {
    state = { graph: cloneGraph(graph), selectedNodeId: null, selectedEdgeId: null };
    emit();
  },

  select(nodeId: string | null): void {
    state = { ...state, selectedNodeId: nodeId, selectedEdgeId: null };
    emit();
  },

  selectEdge(edgeId: string | null): void {
    state = { ...state, selectedEdgeId: edgeId, selectedNodeId: null };
    emit();
  },

  addNode(kind: NodeKind, x: number, y: number): string {
    const id = makeId('seq');
    const node: GraphNode = {
      id,
      kind: 'sequence',
      title: 'سکانس جدید',
      x,
      y,
      hotspots: [],
      productIds: [],
    };
    setGraph((g) => {
      g.nodes.push(node);
      if (g.entryNodeId === null) g.entryNodeId = id;
    });
    state = { ...state, selectedNodeId: id, selectedEdgeId: null };
    emit();
    return id;
  },

  updateNode(id: string, patch: Partial<GraphNode>): void {
    setGraph((g) => {
      const idx = g.nodes.findIndex((n) => n.id === id);
      if (idx >= 0) g.nodes[idx] = { ...g.nodes[idx], ...patch } as GraphNode;
    });
  },

  moveNode(id: string, x: number, y: number): void {
    setGraph((g) => {
      const n = g.nodes.find((n) => n.id === id);
      if (n) { n.x = x; n.y = y; }
    });
  },

  removeNode(id: string): void {
    setGraph((g) => {
      g.nodes = g.nodes.filter((n) => n.id !== id);
      g.edges = g.edges.filter((e) => e.source !== id && e.target !== id);
      if (g.entryNodeId === id) g.entryNodeId = g.nodes[0]?.id ?? null;
    });
    if (state.selectedNodeId === id) state = { ...state, selectedNodeId: null };
    emit();
  },

  setEntry(nodeId: string | null): void {
    setGraph((g) => {
      g.entryNodeId = nodeId;
    });
  },

  addEdge(source: string, target: string): void {
    setGraph((g) => {
      const exists = g.edges.some((e) => e.source === source && e.target === target);
      if (!exists) {
        g.edges.push({
          id: makeId('t'),
          source,
          target,
          kind: 'crossfade',
          durationMs: 900,
        });
      }
    });
  },

  updateEdge(id: string, patch: Partial<GraphEdge>): void {
    setGraph((g) => {
      const idx = g.edges.findIndex((e) => e.id === id);
      if (idx >= 0) g.edges[idx] = { ...g.edges[idx], ...patch };
    });
  },

  removeEdge(id: string): void {
    setGraph((g) => {
      g.edges = g.edges.filter((e) => e.id !== id);
    });
    if (state.selectedEdgeId === id) state = { ...state, selectedEdgeId: null };
    emit();
  },
};
