import React from 'react';
import { Video } from 'lucide-react';
import type { GraphNode } from '../../types/sequenceGraph';

interface Props {
  node: GraphNode;
  selected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, e: React.PointerEvent) => void;
}

/** A single draggable sequence node card rendered on the StudioCanvas. */
export default function NodeCard({ node, selected, onSelect, onDragStart }: Props) {
  return (
    <div
      dir="rtl"
      onPointerDown={(e) => { e.stopPropagation(); onSelect(node.id); onDragStart(node.id, e); }}
      className={`absolute rounded-xl border-2 bg-[#16120b] shadow-lg cursor-grab active:cursor-grabbing w-44 border-amber-400/40 bg-amber-400/10 text-amber-200 ${
        selected ? 'ring-2 ring-amber-300/60' : ''
      }`}
      style={{ left: node.x, top: node.y }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <span className="opacity-80"><Video className="w-4 h-4" /></span>
        <span className="flex-1 text-[11px] font-black truncate">{node.title}</span>
      </div>
      <div className="px-3 py-1.5 text-[9px] font-bold text-white/30">
        سکانس {node.videoUrl ? '· ویدیو' : '· بدون ویدیو'}
      </div>
      <span className="absolute top-1/2 -left-2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-[#16120b]" />
      <span className="absolute top-1/2 -right-2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-[#16120b]" />
    </div>
  );
}
