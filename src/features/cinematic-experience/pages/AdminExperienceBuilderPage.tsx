import React, { useEffect, useState } from 'react';
import { Play, Plus, Copy, Trash2, Save, Upload, Download, Eye, Check, ArrowRight } from 'lucide-react';
import type { Campaign } from '../types/sequenceGraph';
import { CampaignStorage } from '../services/CampaignStorage';
import { BuilderStore } from '../builder/store/builderStore';
import StudioCanvas from '../builder/StudioCanvas';
import NodeInspector from '../builder/nodes/NodeInspector';
import ExperiencePlayer from '../components/ExperiencePlayer';

/**
 * Feature B — the multi-campaign experience builder. Node-based visual editor
 * with campaign CRUD, slug, SEO metadata, preview journey and publish.
 */
export default function AdminExperienceBuilderPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => CampaignStorage.list());
  const [activeId, setActiveId] = useState<string>(campaigns[0]?.id ?? '');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toast, setToast] = useState('');

  const active = campaigns.find((c) => c.id === activeId) ?? null;

  const refresh = () => setCampaigns(CampaignStorage.list());

  useEffect(() => {
    if (active) BuilderStore.load(active.graph);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveActive = () => {
    if (!active) return;
    const graph = BuilderStore.getState().graph;
    CampaignStorage.save({ ...active, graph });
    refresh();
    flash('ذخیره شد.');
  };

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2200);
  };

  const createCampaign = () => {
    const name = 'کمپین جدید';
    const slug = 'campaign-' + Date.now().toString(36);
    const campaign = CampaignStorage.create(name, slug, {
      entryNodeId: null,
      nodes: [],
      edges: [],
    });
    refresh();
    setActiveId(campaign.id);
  };

  const duplicateActive = () => {
    if (!active) return;
    const copy = CampaignStorage.duplicate(active.id);
    if (copy) { refresh(); setActiveId(copy.id); flash('کپی شد.'); }
  };

  const removeActive = () => {
    if (!active) return;
    CampaignStorage.remove(active.id);
    const rest = CampaignStorage.list();
    refresh();
    setActiveId(rest[0]?.id ?? '');
  };

  const togglePublish = () => {
    if (!active) return;
    CampaignStorage.setPublished(active.id, !active.published);
    refresh();
    flash(active.published ? 'لغو انتشار شد.' : 'منتشر شد.');
  };

  const updateField = (patch: Partial<Campaign>) => {
    if (!active) return;
    CampaignStorage.save({ ...active, ...patch });
    refresh();
  };

  const exportJson = () => {
    if (!active) return;
    const blob = new Blob([CampaignStorage.export(active)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imported = CampaignStorage.import(String(reader.result));
      if (imported) { refresh(); setActiveId(imported.id); flash('ایمپورت شد.'); }
      else flash('فایل نامعتبر است.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!active) {
    return (
      <div dir="rtl" className="p-6 text-center">
        <p className="text-sm font-black text-slate-600 mb-4">هنوز کمپینی وجود ندارد.</p>
        <button onClick={createCampaign} className="inline-flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-xl font-black text-sm">
          <Plus className="w-4 h-4" /> ساخت اولین کمپین
        </button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="flex flex-col font-sans text-slate-800" style={{ height: 'calc(100vh - 140px)', minHeight: '480px' }}>
      {/* Campaign bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-slate-200 bg-white">
        <select
          value={activeId}
          onChange={(e) => { saveActive(); setActiveId(e.target.value); }}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 max-w-[200px]"
        >
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button onClick={createCampaign} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="کمپین جدید"><Plus className="w-4 h-4" /></button>
        <button onClick={duplicateActive} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="کپی"><Copy className="w-4 h-4" /></button>
        <button onClick={removeActive} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500" title="حذف"><Trash2 className="w-4 h-4" /></button>
        <div className="w-px h-6 bg-slate-200" />
        <button onClick={saveActive} className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-black"><Save className="w-3.5 h-3.5" /> ذخیره</button>
        <button onClick={() => { saveActive(); setPreviewOpen(true); }} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-black"><Play className="w-3.5 h-3.5" /> پیش‌نمایش</button>
        <button onClick={togglePublish} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black ${active.published ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
          <Check className="w-3.5 h-3.5" /> {active.published ? 'منتشر شده' : 'انتشار'}
        </button>
        <button onClick={exportJson} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="خروجی JSON"><Download className="w-4 h-4" /></button>
        <label className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer" title="ورودی JSON">
          <Upload className="w-4 h-4" />
          <input type="file" accept="application/json" className="hidden" onChange={importJson} />
        </label>
      </div>

      {/* Slug / SEO */}
      <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-slate-50 border-b border-slate-200">
        <label className="text-[10px] font-black text-slate-400 flex items-center gap-1.5">
          نام
          <input value={active.name} onChange={(e) => updateField({ name: e.target.value })} className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold w-40" />
        </label>
        <label className="text-[10px] font-black text-slate-400 flex items-center gap-1.5">
          اسلاگ
          <input value={active.slug} onChange={(e) => updateField({ slug: e.target.value })} className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold w-40" dir="ltr" />
        </label>
        <label className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 flex-1 min-w-[160px]">
          عنوان SEO
          <input value={active.seo.title} onChange={(e) => updateField({ seo: { ...active.seo, title: e.target.value } })} className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold" />
        </label>
        <span className="text-[10px] font-bold text-slate-400" dir="ltr">/experience/{active.slug}</span>
      </div>

      {/* Editor body */}
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 relative min-w-0">
          <StudioCanvas />
        </div>
        <aside className="w-72 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
          <div className="px-4 py-3 border-b border-slate-100 text-[11px] font-black text-slate-500">ویژگی‌های نود</div>
          <NodeInspector />
        </aside>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex flex-col">
          <div dir="rtl" className="flex items-center justify-between p-3 bg-black/60">
            <span className="text-white text-sm font-black flex items-center gap-2"><Eye className="w-4 h-4" /> پیش‌نمایش کمپین</span>
            <div className="flex items-center gap-2">
              <a href={`/experience/${active.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-amber-300 text-xs font-black hover:text-amber-200">
                باز کردن در صفحه جدید <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <button onClick={() => setPreviewOpen(false)} className="text-white/70 hover:text-white text-sm font-black">بستن ✕</button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <ExperiencePreview graph={active.graph} />
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white text-xs font-black px-5 py-2.5 rounded-full shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function ExperiencePreview({ graph }: { graph: Campaign['graph'] }) {
  return (
    <div className="h-full">
      <ExperiencePlayer
        graph={graph}
        rawGoldPerGramToman={8650000}
        onDirectPurchase={() => undefined}
      />
    </div>
  );
}
