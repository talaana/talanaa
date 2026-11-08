import React, { useState, useEffect } from 'react';
import { admin } from '../api';
import { FileText, Plus, Copy, Star, Eye, Trash2, X, Edit2 } from 'lucide-react';
import InvoiceRenderer from '../components/InvoiceRenderer';
import InvoiceTemplateEditor from '../components/InvoiceTemplateEditor';

interface Block {
  id: string;
  type: string;
  visible: boolean;
  props: Record<string, any>;
}

interface Template {
  id: number;
  tenant_id: number | null;
  name: string;
  slug: string;
  type: 'system' | 'custom';
  status: 'draft' | 'published' | 'archived';
  schema_version: number;
  blocks: Block[];
  styles: Record<string, any> | null;
  preview_metadata: Record<string, any> | null;
  is_default: boolean;
  created_by: number | null;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  draft: 'پیش‌نویس',
  published: 'منتشر شده',
  archived: 'آرشیو',
};

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-emerald-50 text-emerald-700',
  archived: 'bg-rose-50 text-rose-600',
};

export default function AdminInvoiceTemplates({ isSuperadmin = false, can }: { isSuperadmin?: boolean; can?: (slug: string) => boolean }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState<Template | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await admin.invoiceTemplates.list();
      setTemplates(data.data || data || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleClone = async (id: number) => {
    console.log('🔵 Clone clicked for template ID:', id);
    try {
      console.log('📡 Calling API: clone template', id);
      await admin.invoiceTemplates.clone(id);
      console.log('✅ Clone successful, reloading templates');
      load();
    } catch (e: any) { 
      console.error('❌ Clone failed:', e);
      alert(e.message); 
    }
  };

  const handleSetDefault = async (id: number) => {
    console.log('⭐ Set Default clicked for template ID:', id);
    try {
      console.log('📡 Calling API: set default template', id);
      await admin.invoiceTemplates.setDefault(id);
      console.log('✅ Set default successful, reloading templates');
      load();
    } catch (e: any) { 
      console.error('❌ Set default failed:', e);
      alert(e.message); 
    }
  };

  const handleArchive = async (id: number) => {
    console.log('🗑️ Archive clicked for template ID:', id);
    if (!confirm('آیا از آرشیو این قالب مطمئنید؟')) {
      console.log('❌ Archive cancelled by user');
      return;
    }
    try {
      console.log('📡 Calling API: archive template', id);
      await admin.invoiceTemplates.remove(id);
      console.log('✅ Archive successful, reloading templates');
      load();
    } catch (e: any) { 
      console.error('❌ Archive failed:', e);
      alert(e.message); 
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
  };

  const handleEditorSave = async (data: { name: string; blocks: Block[]; styles: any }) => {
    if (!editingTemplate) return;
    await admin.invoiceTemplates.update(editingTemplate.id, data);
    load();
  };

  const systemTemplates = templates.filter(t => t.type === 'system');
  const customTemplates = templates.filter(t => t.type === 'custom');

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-lg lg:text-xl font-black text-slate-800">
            {isSuperadmin ? 'قالب‌های سیستمی فاکتور' : 'قالب‌های فاکتور'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperadmin 
              ? 'مدیریت قالب‌های گلوبال برای همه فروشگاه‌ها' 
              : 'مدیریت و سفارشی‌سازی ظاهر فاکتورها'}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" />
          قالب جدید
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : (
        <>
          {systemTemplates.length > 0 && (
            <section className="no-print">
              <h3 className="text-sm font-black text-slate-600 mb-3">
                {isSuperadmin ? 'قالب‌های سیستمی' : 'قالب‌های سیستمی'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {systemTemplates.map(tpl => (
                  <React.Fragment key={tpl.id}>
                    <TemplateCard 
                      template={tpl}
                      isSystemTemplate={true}
                      onPreview={() => setShowPreview(tpl)}
                      onClone={() => handleClone(tpl.id)}
                      onEdit={isSuperadmin ? () => handleEdit(tpl) : undefined}
                      onArchive={isSuperadmin && !tpl.is_default ? () => handleArchive(tpl.id) : undefined}
                      onSetDefault={isSuperadmin && !tpl.is_default ? () => handleSetDefault(tpl.id) : undefined}
                    />
                  </React.Fragment>
                ))}
              </div>
            </section>
          )}

          {!isSuperadmin && customTemplates.length > 0 && (
            <section className="no-print">
              <h3 className="text-sm font-black text-slate-600 mb-3">قالب‌های شما</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {customTemplates.map(tpl => (
                  <React.Fragment key={tpl.id}>
                    <TemplateCard 
                      template={tpl}
                      isSystemTemplate={false}
                      onPreview={() => setShowPreview(tpl)}
                      onClone={() => handleClone(tpl.id)}
                      onSetDefault={can?.('invoice_templates.manage_default') && !tpl.is_default ? () => handleSetDefault(tpl.id) : undefined}
                      onArchive={!tpl.is_default ? () => handleArchive(tpl.id) : undefined}
                      onEdit={() => handleEdit(tpl)}
                    />
                  </React.Fragment>
                ))}
              </div>
            </section>
          )}

          {!isSuperadmin && customTemplates.length === 0 && systemTemplates.length > 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center no-print">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-sm font-black text-slate-600">هنوز قالب سفارشی نساخته‌اید</h3>
              <p className="text-xs text-slate-400 mt-2">از قالب‌های سیستمی کپی بگیرید یا از صفر شروع کنید.</p>
            </div>
          )}

          {isSuperadmin && systemTemplates.length === 0 && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center no-print">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-sm font-black text-slate-600">هنوز قالب سیستمی وجود ندارد</h3>
              <p className="text-xs text-slate-400 mt-2">اولین قالب سیستمی را بسازید.</p>
            </div>
          )}
        </>
      )}

      {showPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full my-8">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-sm font-black text-slate-800">پیش‌نمایش: {showPreview.name}</h3>
              <button onClick={() => setShowPreview(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-x-auto">
              <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}>
                <InvoiceRenderer blocks={showPreview.blocks} styles={showPreview.styles || undefined} invoice={{} as any} preview />
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} templates={templates} />
      )}

      {editingTemplate && (
        <InvoiceTemplateEditor
          templateId={editingTemplate.id}
          initialBlocks={editingTemplate.blocks}
          initialStyles={editingTemplate.styles || undefined}
          templateName={editingTemplate.name}
          onSave={handleEditorSave}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}

function TemplateCard({ template, onPreview, onClone, onSetDefault, onArchive, onEdit, isSystemTemplate }: {
  template: Template;
  onPreview: () => void;
  onClone: () => void;
  onSetDefault?: () => void;
  onArchive?: () => void;
  onEdit?: () => void;
  isSystemTemplate?: boolean;
}) {
  console.log('🎴 TemplateCard rendered:', { 
    name: template.name, 
    id: template.id,
    hasOnClone: !!onClone,
    hasOnSetDefault: !!onSetDefault,
    hasOnArchive: !!onArchive,
    is_default: template.is_default,
    isSystemTemplate
  });
  
  const handleCardClick = () => {
    // For system templates without edit permission, clone instead
    if (isSystemTemplate && !onEdit) {
      console.log('📋 System template clicked by tenant - cloning');
      onClone();
    } else if (onEdit) {
      onEdit();
    }
  };
  
  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-md cursor-pointer ${template.is_default ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-100'}`}
    >
      <div className="h-32 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center relative overflow-hidden">
        <div style={{ transform: 'scale(0.25)', transformOrigin: 'center' }}>
          <InvoiceRenderer blocks={template.blocks} styles={template.styles || undefined} invoice={{} as any} preview />
        </div>
        {template.is_default && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" /> پیش‌فرض
          </div>
        )}
        {template.type === 'system' && (
          <div className="absolute top-2 right-2 bg-slate-700 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
            سیستمی
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-black text-slate-800">{template.name}</h4>
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${statusColors[template.status]}`}>
            {statusLabels[template.status]}
          </span>
        </div>
        {template.preview_metadata?.description && (
          <p className="text-[10px] text-slate-400 mb-3 line-clamp-2">{template.preview_metadata.description}</p>
        )}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={onPreview} className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-xs font-bold transition-colors">
            <Eye className="w-3.5 h-3.5" /> پیش‌نمایش
          </button>
          {onEdit && (
            <button onClick={onEdit} className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors" title="ویرایش">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => { console.log('📋 Clone button clicked for:', template.id); onClone(); }} className="flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors" title="کپی">
            <Copy className="w-3.5 h-3.5" />
          </button>
          {onSetDefault && (
            <button onClick={() => { console.log('⭐ Set Default button clicked for:', template.id); onSetDefault(); }} className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors" title="پیش‌فرض">
              <Star className="w-3.5 h-3.5" />
            </button>
          )}
          {onArchive && (
            <button onClick={() => { console.log('🗑️ Archive button clicked for:', template.id); onArchive(); }} className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-2 rounded-lg text-xs font-bold transition-colors" title="آرشیو">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreated, templates }: { onClose: () => void; onCreated: () => void; templates: Template[] }) {
  const [mode, setMode] = useState<'blank' | 'clone'>('blank');
  const [cloneFrom, setCloneFrom] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const defaultBlocks: Block[] = [
    { id: 'header', type: 'header', visible: true, props: {} },
    { id: 'seller_info', type: 'seller_info', visible: true, props: {} },
    { id: 'buyer_info', type: 'buyer_info', visible: true, props: {} },
    { id: 'invoice_meta', type: 'invoice_meta', visible: true, props: {} },
    { id: 'items_table', type: 'items_table', visible: true, props: {} },
    { id: 'totals', type: 'totals', visible: true, props: {} },
    { id: 'notes', type: 'notes', visible: true, props: {} },
    { id: 'signature', type: 'signature', visible: true, props: {} },
    { id: 'footer', type: 'footer', visible: true, props: {} },
  ];

  const handleSubmit = async () => {
    if (!name.trim()) { alert('نام قالب را وارد کنید'); return; }
    setLoading(true);
    try {
      if (mode === 'clone' && cloneFrom) {
        await admin.invoiceTemplates.clone(parseInt(cloneFrom), { name });
      } else {
        await admin.invoiceTemplates.create({ name, blocks: defaultBlocks });
      }
      onCreated();
    } catch (e: any) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-800">قالب جدید</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="template-name-input" className="block text-sm font-bold text-slate-600 mb-2">نام قالب</label>
            <input id="template-name-input" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: قالب رسمی"
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">نوع</label>
            <div className="flex gap-3">
              <button onClick={() => setMode('blank')}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-colors ${mode === 'blank' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                از صفر
              </button>
              <button onClick={() => setMode('clone')}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-colors ${mode === 'clone' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                کپی از موجود
              </button>
            </div>
          </div>

          {mode === 'clone' && (
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">کپی از</label>
              <select value={cloneFrom} onChange={e => setCloneFrom(e.target.value)}
                className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-amber-500">
                <option value="">انتخاب کنید...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type === 'system' ? 'سیستمی' : 'سفارشی'})</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">انصراف</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm disabled:opacity-50">
              {loading ? 'در حال ساخت...' : 'ساخت قالب'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
