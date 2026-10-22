import React, { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { Video } from 'lucide-react';
import type { GraphEdge, GraphNode, NodeKind } from '../types/sequenceGraph';
import { BuilderStore } from './store/builderStore';
import NodeCard from './nodes/NodeCard';

const PALETTE: Array<{ kind: NodeKind; label: string; icon: React.ReactNode }> = [
  { kind: 'sequence', label: 'سکانس', icon: <Video className="w-4 h-4" /> },
];

const NODE_W = 176;
const NODE_H = 78;

/**
 * Node-based visual workflow canvas: pan, zoom, draggable sequence nodes,
 * Bezier transition edges between ports.
 */
export default function StudioCanvas() {
  const state = useSyncExternalStore(BuilderStore.subscribe, BuilderStore.getState);
  const [transform, setTransform] = useState({ x: 40, y: 60, scale: 1 });
  const [dragging, setDragging] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [panning, setPanning] = useState<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const [connecting, setConnecting] = useState<{ from: string; toX: number; toY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const graph = state.graph;

  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - transform.x) / transform.scale,
      y: (clientY - rect.top - transform.y) / transform.scale,
    };
  }, [transform]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => ({ ...t, scale: Math.max(0.3, Math.min(2.5, t.scale * delta)) }));
  };

  const startPan = (e: React.PointerEvent) => {
    if (e.target !== containerRef.current && !(e.target as HTMLElement).dataset?.canvas) return;
    setPanning({ sx: e.clientX, sy: e.clientY, ox: transform.x, oy: transform.y });
  };

  const movePan = (e: React.PointerEvent) => {
    if (panning) {
      setTransform((t) => ({ ...t, x: panning.ox + (e.clientX - panning.sx), y: panning.oy + (e.clientY - panning.sy) }));
    }
  };

  const endPan = () => setPanning(null);

  const startDrag = (id: string, e: React.PointerEvent) => {
    const node = graph.nodes.find((n) => n.id === id);
    if (!node) return;
    const p = screenToWorld(e.clientX, e.clientY);
    setDragging({ id, dx: p.x - node.x, dy: p.y - node.y });
  };

  const moveDrag = (e: React.PointerEvent) => {
    if (dragging) {
      const p = screenToWorld(e.clientX, e.clientY);
      BuilderStore.moveNode(dragging.id, Math.round(p.x - dragging.dx), Math.round(p.y - dragging.dy));
    }
    if (connecting) {
      const p = screenToWorld(e.clientX, e.clientY);
      setConnecting({ ...connecting, toX: p.x, toY: p.y });
    }
  };

  const endDrag = () => {
    setDragging(null);
    if (connecting) {
      setConnecting(null);
    }
  };

  const addNodeAt = (kind: NodeKind) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const centerX = (rect.width / 2 - transform.x) / transform.scale;
    const centerY = (rect.height / 2 - transform.y) / transform.scale;
    BuilderStore.addNode(kind, centerX - NODE_W / 2 + (Math.random() * 60 - 30), centerY - NODE_H / 2 + (Math.random() * 60 - 30));
  };

  const startConnect = (nodeId: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const p = screenToWorld(e.clientX, e.clientY);
    setConnecting({ from: nodeId, toX: p.x, toY: p.y });
  };

  const dropConnect = (targetId: string) => {
    if (connecting && connecting.from !== targetId) {
      BuilderStore.addEdge(connecting.from, targetId);
    }
    setConnecting(null);
  };

  return (
    <div
      ref={containerRef}
      data-canvas
      dir="ltr"
      className="relative w-full h-full overflow-hidden bg-[#0d0a06] cursor-grab active:cursor-grabbing"
      style={{ backgroundImage: 'radial-gradient(circle, rgba(212,175,55,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      onWheel={onWheel}
      onPointerDown={startPan}
      onPointerMove={(e) => { movePan(e); moveDrag(e); }}
      onPointerUp={() => { endPan(); endDrag(); }}
      onPointerLeave={() => { endPan(); endDrag(); }}
    >
      <div className="absolute top-4 left-4 z-20 flex gap-1.5 bg-black/60 backdrop-blur-md rounded-xl p-1.5 border border-white/10" dir="rtl">
        {PALETTE.map((p) => (
          <button
            key={p.kind}
            onClick={() => addNodeAt(p.kind)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black text-amber-100 hover:bg-white/10 transition-colors"
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      <div
        className="absolute inset-0 origin-top-left"
        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
      >
        <svg className="absolute inset-0 overflow-visible pointer-events-none" width={4000} height={3000}>
          {graph.edges.map((edge) => (
            <React.Fragment key={edge.id}>
              <BezierEdge
                edge={edge}
                nodes={graph.nodes}
                selected={edge.id === state.selectedEdgeId}
                onSelect={BuilderStore.selectEdge}
              />
            </React.Fragment>
          ))}
          {connecting && (
            <BezierCable
              x1={portX(graph.nodes.find((n) => n.id === connecting.from))}
              y1={portY(graph.nodes.find((n) => n.id === connecting.from))}
              x2={connecting.toX}
              y2={connecting.toY}
              dashed
            />
          )}
        </svg>

        {graph.nodes.map((node) => (
          <React.Fragment key={node.id}>
            <NodeCard
              node={node}
              selected={node.id === state.selectedNodeId}
              onSelect={BuilderStore.select}
              onDragStart={startDrag}
            />
          </React.Fragment>
        ))}

        {graph.nodes.map((node) => (
          <div
            key={'drop-' + node.id}
            className="absolute rounded-xl border-2 border-transparent"
            style={{ left: node.x - 4, top: node.y - 4, width: NODE_W + 8, height: NODE_H + 8 }}
            onPointerUp={() => dropConnect(node.id)}
            onPointerDown={(e) => {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              const px = e.clientX - rect.left;
              if (px > rect.width - 12) startConnect(node.id, e);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function portX(node: GraphNode | undefined): number {
  if (!node) return 0;
  return node.x + NODE_W;
}
function portY(node: GraphNode | undefined): number {
  if (!node) return 0;
  return node.y + NODE_H / 2;
}

function BezierEdge({
  edge,
  nodes,
  selected,
  onSelect,
}: {
  edge: GraphEdge;
  nodes: GraphNode[];
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const from = nodes.find((n) => n.id === edge.source);
  const to = nodes.find((n) => n.id === edge.target);
  if (!from || !to) return null;
  const x1 = portX(from);
  const y1 = portY(from);
  const x2 = to.x;
  const y2 = portY(to);
  const dx = Math.max(Math.abs(x2 - x1) * 0.5, 40);
  const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  return (
    <g className="pointer-events-auto cursor-pointer" onClick={() => onSelect(edge.id)}>
      <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
      <path
        d={d}
        fill="none"
        stroke={selected ? 'rgba(56,189,248,0.95)' : 'rgba(251,191,36,0.7)'}
        strokeWidth={selected ? 3 : 2}
      />
      {edge.kind === 'video' && (
        <circle cx={midX} cy={midY} r={5} fill="rgba(56,189,248,0.9)" />
      )}
    </g>
  );
}

function BezierCable({ x1, y1, x2, y2, dashed }: { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }) {
  const dx = Math.max(Math.abs(x2 - x1) * 0.5, 40);
  const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  return (
    <path
      d={d}
      fill="none"
      stroke="rgba(251,191,36,0.7)"
      strokeWidth={2}
      strokeDasharray={dashed ? '6 4' : undefined}
    />
  );
}
