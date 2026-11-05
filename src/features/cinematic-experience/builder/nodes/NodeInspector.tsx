import React, { useSyncExternalStore } from 'react';
import { Trash2, Plus, Flag } from 'lucide-react';
import type { GraphEdge, GraphNode, Hotspot, TransitionKind } from '../../types/sequenceGraph';
import { BuilderStore } from '../store/builderStore';

/** Property inspector for the selected node or transition edge. */
export default function NodeInspector() {
  const state = useSyncExternalStore(BuilderStore.subscribe, BuilderStore.getState);
  const node = state.graph.nodes.find((n) => n.id === state.selectedNodeId);
  const edge = state.graph.edges.find((e) => e.id === state.selectedEdgeId);

  if (edge) {
    return <EdgeInspector edge={edge} graph={state.graph} />;
  }

  if (!node) {
    return (
      <div className="p-5 text-center text-[11px] font-bold text-slate-400">
        یک سکانس یا یال ترنزیشن را برای ویرایش انتخاب کنید.
      </div>
    );
  }

  return <SequenceInspector node={node} isEntry={state.graph.entryNodeId === node.id} />;
}

function SequenceInspector({ node, isEntry }: { node: GraphNode; isEntry: boolean }) {
  const update = (patch: Partial<GraphNode>) => BuilderStore.updateNode(node.id, patch);

  const addHotspot = () => {
    const hs: Hotspot = {
      id: 'hs_' + Math.random().toString(36).slice(2, 7),
      x: 0.5,
      y: 0.5,
      label: 'هات‌اسپات جدید',
      productId: '',
    };
    update({ hotspots: [...(node.hotspots ?? []), hs] });
  };

  const updateHotspot = (index: number, patch: Partial<Hotspot>) => {
    const next = (node.hotspots ?? []).map((h, i) => (i === index ? { ...h, ...patch } : h));
    update({ hotspots: next });
  };

  const removeHotspot = (index: number) => {
    update({ hotspots: (node.hotspots ?? []).filter((_, i) => i !== index) });
  };

  return (
    <div dir="rtl" className="p-4 space-y-4 text-slate-700">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">سکانس</span>
        {isEntry && (
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
            <Flag className="w-3 h-3" /> نقطه شروع
          </span>
        )}
      </div>

      <Field label="عنوان" value={node.title} onChange={(v) => update({ title: v })} />
      <Field label="زیرعنوان" value={node.subtitle ?? ''} onChange={(v) => update({ subtitle: v })} />
      <Field label="آدرس ویدیو (لوپ)" value={node.videoUrl ?? ''} onChange={(v) => update({ videoUrl: v || undefined })} />
      <Field label="پوستر" value={node.posterUrl ?? ''} onChange={(v) => update({ posterUrl: v || undefined })} />

      {!isEntry && (
        <button
          onClick={() => BuilderStore.setEntry(node.id)}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg py-2 transition-colors"
        >
          <Flag className="w-3.5 h-3.5" /> تنظیم به‌عنوان نقطه شروع
        </button>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-500">هات‌اسپات‌ها ({node.hotspots?.length ?? 0})</span>
          <button onClick={addHotspot} className="flex items-center gap-1 text-[10px] font-black text-amber-600 hover:text-amber-700">
            <Plus className="w-3.5 h-3.5" /> افزودن
          </button>
        </div>
        {(node.hotspots ?? []).map((h, i) => (
          <div key={h.id} className="border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={h.label}
                aria-label="نام هات‌اسپات"
                onChange={(e) => updateHotspot(i, { label: e.target.value })}
                className="flex-1 bg-white border border-slate-200 rounded-md px-2 py-1.5 text-[11px] font-bold focus:outline-none focus:border-amber-500"
              />
              <button onClick={() => removeHotspot(i)} className="text-rose-400 hover:text-rose-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <Field label="شناسه محصول" value={h.productId} onChange={(v) => updateHotspot(i, { productId: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="X (۰–۱)" value={String(h.x)} onChange={(v) => updateHotspot(i, { x: clamp01(Number(v)) })} />
              <Field label="Y (۰–۱)" value={String(h.y)} onChange={(v) => updateHotspot(i, { y: clamp01(Number(v)) })} />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => BuilderStore.removeNode(node.id)}
        className="w-full flex items-center justify-center gap-1.5 text-[11px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg py-2 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> حذف سکانس
      </button>
    </div>
  );
}

function EdgeInspector({
  edge,
  graph,
}: {
  edge: GraphEdge;
  graph: { nodes: GraphNode[] };
}) {
  const source = graph.nodes.find((n) => n.id === edge.source);
  const target = graph.nodes.find((n) => n.id === edge.target);
  const update = (patch: Partial<GraphEdge>) => BuilderStore.updateEdge(edge.id, patch);

  return (
    <div dir="rtl" className="p-4 space-y-4 text-slate-700">
      <div>
        <span className="text-[10px] font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded">ترنزیشن‌سکانس (یال)</span>
        <p className="mt-2 text-[11px] font-bold text-slate-500">
          {source?.title ?? edge.source} → {target?.title ?? edge.target}
        </p>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 block mb-1">نوع</label>
        <select
          value={edge.kind}
          onChange={(e) => update({ kind: e.target.value as TransitionKind })}
          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
        >
          <option value="crossfade">کراس‌فید (بدون ویدیو)</option>
          <option value="video">ویدیوی ترنزیشن</option>
        </select>
      </div>

      <Field
        label="ویدیو جلو (source → target)"
        value={edge.videoUrl ?? ''}
        onChange={(v) => update({ videoUrl: v || undefined, kind: v ? 'video' : edge.kind })}
      />
      <Field
        label="ویدیو عقب (target → source)"
        value={edge.videoUrlReverse ?? ''}
        onChange={(v) => update({ videoUrlReverse: v || undefined, kind: v || edge.videoUrl ? 'video' : edge.kind })}
      />
      <Field
        label="مدت (میلی‌ثانیه)"
        value={String(edge.durationMs ?? 900)}
        onChange={(v) => update({ durationMs: Math.max(200, Number(v) || 900) })}
      />
      <Field
        label="برچسب یال"
        value={edge.label ?? ''}
        onChange={(v) => update({ label: v || undefined })}
      />

      <button
        onClick={() => BuilderStore.removeEdge(edge.id)}
        className="w-full flex items-center justify-center gap-1.5 text-[11px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg py-2 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> حذف ترنزیشن
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="text-[10px] font-black text-slate-400 block mb-1">{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
      />
    </div>
  );
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}
