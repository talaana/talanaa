import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Trash2, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp, Save, RotateCcw, Lock, Pencil, Settings, Sparkles, Send, Palette } from 'lucide-react';
import InvoiceRenderer from './InvoiceRenderer';
import { admin } from '../api';
import { predefinedTemplates } from '../lib/predefinedTemplates';

interface Block {
  id: string;
  type: string;
  visible: boolean;
  props: Record<string, any>;
}

interface PropMeta {
  type: string;
  edit: 'locked' | 'inline' | 'sidebar';
  default: any;
  label?: string;
  system_default?: boolean;
  min?: number;
  max?: number;
  options?: string[];
}

interface BlockDefinition {
  type: string;
  label: string;
  icon: string;
  mandatory: boolean;
  default_props: Record<string, any>;
  props: Record<string, PropMeta>;
  layout_props: Record<string, PropMeta>;
}

interface TemplateStyles {
  primary_color: string;
  text_color: string;
  font_family: string;
  font_size: string;
  page_size: string;
  margin: string;
  header_align: string;
}

interface InvoiceTemplateEditorProps {
  templateId?: number;
  initialBlocks?: Block[];
  initialStyles?: Partial<TemplateStyles>;
  templateName: string;
  onSave: (data: { name: string; blocks: Block[]; styles: Partial<TemplateStyles> }) => Promise<void>;
  onClose: () => void;
}

const defaultStyles: TemplateStyles = {
  primary_color: '#ca8a04',
  text_color: '#1e293b',
  font_family: 'Vazirmatn, sans-serif',
  font_size: '12px',
  page_size: 'A4',
  margin: '20mm',
  header_align: 'center',
};

export default function InvoiceTemplateEditor({
  templateId,
  initialBlocks = [],
  initialStyles = {},
  templateName,
  onSave,
  onClose,
}: InvoiceTemplateEditorProps) {
  const [name, setName] = useState(templateName);
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [styles, setStyles] = useState<Partial<TemplateStyles>>({ ...defaultStyles, ...initialStyles });
  const [blockDefinitions, setBlockDefinitions] = useState<BlockDefinition[]>([]);
  const [systemDefaults, setSystemDefaults] = useState<Record<string, Record<string, string>>>({});
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [undoStack, setUndoStack] = useState<Block[][]>([]);
  const [redoStack, setRedoStack] = useState<Block[][]>([]);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'ai'; content: string}>>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBlockSchema();
  }, []);

  const loadBlockSchema = async () => {
    try {
      const data = await admin.invoiceTemplates.blocks();
      setBlockDefinitions(data.blocks || []);
      setSystemDefaults(data.system_defaults || {});
    } catch (error) {
      console.error('Failed to load block schema:', error);
    }
  };

  const pushUndo = useCallback((prev: Block[]) => {
    setUndoStack(s => [...s.slice(-30), prev]);
    setRedoStack([]);
  }, []);

  const updateBlocks = useCallback((updater: (prev: Block[]) => Block[]) => {
    setBlocks(prev => {
      pushUndo(prev);
      const next = updater(prev);
      scheduleAutosave(next);
      return next;
    });
  }, [pushUndo]);

  const scheduleAutosave = useCallback((currentBlocks: Block[]) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (templateId) {
        admin.invoiceTemplates.update(templateId, { name, blocks: currentBlocks, styles }).catch(() => {});
      }
    }, 3000);
  }, [templateId, name, styles]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setRedoStack(s => [...s, blocks]);
    setBlocks(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(s => s.slice(0, -1));
    setUndoStack(s => [...s, blocks]);
    setBlocks(next);
  };

  const addBlock = (blockDef: BlockDefinition) => {
    updateBlocks(prev => [...prev, {
      id: `${blockDef.type}_${Date.now()}`,
      type: blockDef.type,
      visible: true,
      props: { ...blockDef.default_props },
    }]);
    setExpandedBlock(`${blockDef.type}_${Date.now()}`);
  };

  const removeBlock = (blockId: string) => {
    updateBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  const toggleBlockVisibility = (blockId: string) => {
    updateBlocks(prev => prev.map(b => b.id === blockId ? { ...b, visible: !b.visible } : b));
  };

  const updateBlockProps = (blockId: string, newProps: Record<string, any>) => {
    updateBlocks(prev => prev.map(b => b.id === blockId ? { ...b, props: { ...b.props, ...newProps } } : b));
  };

  const handleInlineEdit = useCallback((blockId: string, propKey: string, value: string) => {
    updateBlocks(prev => prev.map(b => b.id === blockId ? { ...b, props: { ...b.props, [propKey]: value } } : b));
  }, [updateBlocks]);

  const moveBlock = (fromIndex: number, toIndex: number) => {
    updateBlocks(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('نام قالب را وارد کنید');
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaving(true);
    try {
      await onSave({ name, blocks, styles });
      onClose();
    } catch (error: any) {
      alert(error.message || 'خطا در ذخیره قالب');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('آیا از بازنشانی تمام تغییرات مطمئنید؟')) {
      pushUndo(blocks);
      setBlocks(initialBlocks);
      setStyles({ ...defaultStyles, ...initialStyles });
      setName(templateName);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiInput.trim() || aiLoading) return;

    const userMessage = aiInput.trim();
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setAiLoading(true);

    try {
      const currentTemplate = { blocks, styles };
      const response = await admin.invoiceTemplates.generateAi(userMessage, currentTemplate);

      if (response.error) {
        setAiMessages(prev => [...prev, { role: 'ai', content: `❌ خطا: ${response.error}` }]);
      } else {
        // Apply the generated template
        if (response.blocks) {
          pushUndo(blocks);
          setBlocks(response.blocks);
        }
        if (response.styles) {
          setStyles(prev => ({ ...prev, ...response.styles }));
        }
        
        const explanation = response.explanation || 'قالب با موفقیت ایجاد شد!';
        setAiMessages(prev => [...prev, { role: 'ai', content: `✅ ${explanation}` }]);
      }
    } catch (error: any) {
      setAiMessages(prev => [...prev, { role: 'ai', content: `❌ خطا در ارتباط با سرور: ${error.message}` }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleApplyPredefinedTemplate = (templateId: string) => {
    const template = predefinedTemplates.find(t => t.id === templateId);
    if (!template) return;

    pushUndo(blocks);
    setBlocks(template.blocks);
    setStyles(prev => ({ ...prev, ...template.styles }));
    
    setAiMessages(prev => [
      ...prev,
      { role: 'ai', content: `✅ قالب «${template.name}» اعمال شد! می‌توانید آن را ویرایش کنید.` }
    ]);
  };

  const getBlockDef = (type: string): BlockDefinition | undefined => {
    return blockDefinitions.find(d => d.type === type);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2">
            <X className="w-5 h-5" />
          </button>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="نام قالب"
            className="text-lg font-black text-slate-800 border-none outline-none bg-transparent focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiChat(!showAiChat)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
              showAiChat 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
            title="دستیار هوش مصنوعی"
          >
            <Sparkles className="w-4 h-4" />
            AI
          </button>
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            title="بازگشت (Undo)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            title="انجام مجدد (Redo)"
          >
            <RotateCcw className="w-4 h-4 scale-x-[-1]" />
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg text-sm font-bold"
          >
            بازنشانی
          </button>
          <button
            onClick={() => setShowStylePanel(!showStylePanel)}
            className={`px-3 py-2 rounded-lg text-sm font-bold ${showStylePanel ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Settings className="w-4 h-4 inline ml-1" />
            استایل‌ها
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'در حال ذخیره...' : 'ذخیره قالب'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Block Editor */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col no-print">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-800 mb-3">بلوک‌های قالب</h3>
            <p className="text-xs text-slate-400">بلوک‌ها را اضافه، حذف یا مرتب کنید. مقادیر قابل ویرایش مستقیم روی پیش‌نمایش نیز قابل تغییر هستند.</p>
          </div>

          {/* Current Blocks */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {blocks.map((block, index) => (
              <React.Fragment key={block.id}>
                <BlockEditor
                  block={block}
                  blockDef={getBlockDef(block.type)}
                  index={index}
                  totalBlocks={blocks.length}
                  expanded={expandedBlock === block.id}
                  onToggleExpand={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
                  onToggleVisibility={() => toggleBlockVisibility(block.id)}
                  onRemove={() => removeBlock(block.id)}
                  onUpdateProps={(props) => updateBlockProps(block.id, props)}
                  onMoveUp={() => index > 0 && moveBlock(index, index - 1)}
                  onMoveDown={() => index < blocks.length - 1 && moveBlock(index, index + 1)}
                />
              </React.Fragment>
            ))}
          </div>

          {/* Add Block Section */}
          <div className="border-t border-slate-200 p-4">
            <h4 className="text-xs font-black text-slate-600 mb-2">افزودن بلوک</h4>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {blockDefinitions.map(blockDef => (
                <button
                  key={blockDef.type}
                  onClick={() => addBlock(blockDef)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  {blockDef.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Live Preview */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <InvoiceRenderer
                blocks={blocks}
                styles={styles}
                invoice={{} as any}
                preview
                onInlineEdit={handleInlineEdit}
                blockSchema={blockDefinitions}
                systemDefaults={systemDefaults}
              />
            </div>
          </div>
        </div>

        {/* Right Panel: Style Editor (conditional) */}
        {showStylePanel && (
          <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto no-print">
            <StyleEditor styles={styles} onUpdate={setStyles} />
          </div>
        )}

        {/* Right Panel: AI Chat (conditional) */}
        {showAiChat && (
          <div className="w-96 bg-white border-r border-slate-200 flex flex-col no-print">
            <div className="p-4 border-b border-slate-100 bg-gradient-to-l from-purple-50 to-white">
              <h3 className="text-sm font-black text-slate-800 mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                دستیار هوش مصنوعی
              </h3>
              <p className="text-xs text-slate-500">قالب فاکتور مورد نظرتان را توصیف کنید تا AI آن را برایتان بسازد</p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {aiMessages.length === 0 && (
                <div className="text-center py-6">
                  <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-600 font-bold mb-2">دستیار هوش مصنوعی</p>
                  <p className="text-xs text-slate-500 mb-4">قالب فاکتور مورد نظرتان را توصیف کنید یا از قالب‌های آماده زیر استفاده کنید</p>
                  
                  <div className="space-y-2 text-right mb-4">
                    <p className="text-xs font-bold text-slate-600 mb-2">نمونه درخواست‌ها:</p>
                    <button
                      onClick={() => setAiInput('یک قالب ساده و مینیمال برای فروشگاه طلا می‌خوام')}
                      className="block w-full text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 p-2 rounded-lg transition-colors text-right"
                    >
                      "یک قالب ساده و مینیمال برای فروشگاه طلا می‌خوام"
                    </button>
                    <button
                      onClick={() => setAiInput('قالب رسمی با رنگ‌های طلایی و آبی تیره')}
                      className="block w-full text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 p-2 rounded-lg transition-colors text-right"
                    >
                      "قالب رسمی با رنگ‌های طلایی و آبی تیره"
                    </button>
                  </div>

                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      قالب‌های آماده:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {predefinedTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleApplyPredefinedTemplate(template.id)}
                          className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg transition-all text-right"
                        >
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800">{template.name}</p>
                            <p className="text-xs text-slate-500">{template.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {aiMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-slate-100 text-slate-800'
                        : 'bg-purple-600 text-white'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div className="flex justify-end">
                  <div className="bg-purple-100 text-purple-700 rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                      <span>در حال پردازش...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={aiChatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="border-t border-slate-200 p-4">
              <div className="flex gap-2">
                <textarea
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAiGenerate();
                    }
                  }}
                  placeholder="توضیح دهید چه قالبی می‌خواهید..."
                  className="flex-1 resize-none border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                  disabled={aiLoading}
                />
                <button
                  onClick={handleAiGenerate}
                  disabled={!aiInput.trim() || aiLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Enter برای ارسال، Shift+Enter برای خط جدید
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EditTypeBadge({ edit }: { edit: string }) {
  if (edit === 'locked') {
    return <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-100 rounded px-1 py-0.5"><Lock className="w-2.5 h-2.5" />قفل</span>;
  }
  if (edit === 'inline') {
    return <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 rounded px-1 py-0.5"><Pencil className="w-2.5 h-2.5" />روی قالب</span>;
  }
  return <span className="inline-flex items-center gap-0.5 text-[10px] text-sky-600 bg-sky-50 rounded px-1 py-0.5"><Settings className="w-2.5 h-2.5" />پنل کناری</span>;
}

function BlockEditor({
  block,
  blockDef,
  index,
  totalBlocks,
  expanded,
  onToggleExpand,
  onToggleVisibility,
  onRemove,
  onUpdateProps,
  onMoveUp,
  onMoveDown,
}: {
  block: Block;
  blockDef?: BlockDefinition;
  index: number;
  totalBlocks: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
  onUpdateProps: (props: Record<string, any>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const propDefs = blockDef?.props || {};
  const layoutDefs = blockDef?.layout_props || {};

  const sidebarProps = Object.entries(propDefs).filter(([key, meta]) => meta.edit === 'sidebar');
  const inlineProps = Object.entries(propDefs).filter(([key, meta]) => meta.edit === 'inline');
  const lockedProps = Object.entries(propDefs).filter(([key, meta]) => meta.edit === 'locked');

  return (
    <div className={`border rounded-lg ${expanded ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="w-4 h-4 text-slate-300 cursor-move" />
        <div className="flex-1">
          <button onClick={onToggleExpand} className="flex items-center gap-2 w-full text-right">
            <span className="text-sm font-black text-slate-800">{blockDef?.label || block.type}</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        <button onClick={onToggleVisibility} className={`p-1.5 rounded ${block.visible ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>
          {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        {!blockDef?.mandatory && (
          <button onClick={onRemove} className="p-1.5 rounded text-rose-600 hover:bg-rose-50">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-slate-200 p-3 space-y-3">
          {/* Inline-editable props (info only in sidebar — actual editing is on canvas) */}
          {inlineProps.length > 0 && (
            <div>
              <p className="text-[10px] text-amber-600 font-bold mb-1.5 flex items-center gap-1">
                <Pencil className="w-3 h-3" />
                این فیلدها مستقیماً روی پیش‌نمایش قابل ویرایش هستند:
              </p>
              {inlineProps.map(([key, meta]) => (
                <div key={key} className="text-[11px] text-slate-500 py-0.5 px-2 bg-amber-50/50 rounded">
                  {meta.label || key}
                </div>
              ))}
            </div>
          )}

          {/* Sidebar-editable props */}
          {sidebarProps.map(([key, meta]) => (
            <div key={key}>
              <label className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-bold text-slate-700">{meta.label || key}</span>
                <EditTypeBadge edit={meta.edit} />
              </label>
              {meta.type === 'boolean' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={block.props[key] ?? meta.default ?? false}
                    onChange={e => onUpdateProps({ [key]: e.target.checked })}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs text-slate-600">فعال</span>
                </label>
              ) : meta.type === 'number' ? (
                <input
                  type="number"
                  value={block.props[key] ?? meta.default ?? 0}
                  min={meta.min}
                  max={meta.max}
                  onChange={e => onUpdateProps({ [key]: Number(e.target.value) })}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-amber-500"
                />
              ) : meta.type === 'enum' ? (
                <select
                  value={block.props[key] ?? meta.default ?? ''}
                  onChange={e => onUpdateProps({ [key]: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-amber-500"
                >
                  {(meta.options || []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : meta.type === 'string' ? (
                <input
                  type="text"
                  value={block.props[key] ?? meta.default ?? ''}
                  onChange={e => onUpdateProps({ [key]: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-amber-500"
                />
              ) : null}
            </div>
          ))}

          {/* Locked props (read-only info) */}
          {lockedProps.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                فیلدهای قفل‌شده (سیستمی):
              </p>
              {lockedProps.map(([key, meta]) => (
                <div key={key} className="flex items-center gap-1.5 text-[11px] text-slate-400 py-0.5 px-2 bg-slate-50 rounded">
                  <Lock className="w-2.5 h-2.5" />
                  {meta.label || key}: {String(block.props[key] ?? meta.default)}
                </div>
              ))}
            </div>
          )}

          {/* Layout props */}
          {Object.keys(layoutDefs).length > 0 && (
            <div className="border-t border-slate-100 pt-2">
              <p className="text-[10px] text-slate-500 font-bold mb-1.5">چیدمان بلوک</p>
              {Object.entries(layoutDefs).map(([key, meta]) => (
                <div key={key} className="mb-1.5">
                  <label className="text-[10px] text-slate-500 block mb-0.5">{meta.label || key}</label>
                  {meta.type === 'number' ? (
                    <input
                      type="number"
                      value={block.props[key] ?? meta.default ?? 0}
                      min={meta.min}
                      max={meta.max}
                      onChange={e => onUpdateProps({ [key]: Number(e.target.value) })}
                      className="w-full border border-slate-200 rounded py-1 px-2 text-[11px] focus:outline-none focus:border-amber-500"
                    />
                  ) : meta.type === 'enum' ? (
                    <select
                      value={block.props[key] ?? meta.default ?? ''}
                      onChange={e => onUpdateProps({ [key]: e.target.value })}
                      className="w-full border border-slate-200 rounded py-1 px-2 text-[11px] focus:outline-none focus:border-amber-500"
                    >
                      {(meta.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* Move buttons */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="flex-1 py-1.5 rounded text-xs font-bold bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              بالا
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === totalBlocks - 1}
              className="flex-1 py-1.5 rounded text-xs font-bold bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              پایین
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StyleEditor({
  styles,
  onUpdate,
}: {
  styles: Partial<TemplateStyles>;
  onUpdate: (styles: Partial<TemplateStyles>) => void;
}) {
  return (
    <div className="p-4">
      <h3 className="text-sm font-black text-slate-800 mb-4">استایل‌های قالب</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">رنگ اصلی</label>
          <input
            type="color"
            value={styles.primary_color || '#ca8a04'}
            onChange={e => onUpdate({ ...styles, primary_color: e.target.value })}
            className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">رنگ متن</label>
          <input
            type="color"
            value={styles.text_color || '#1e293b'}
            onChange={e => onUpdate({ ...styles, text_color: e.target.value })}
            className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">فونت</label>
          <select
            value={styles.font_family || 'Vazirmatn, sans-serif'}
            onChange={e => onUpdate({ ...styles, font_family: e.target.value })}
            className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="Vazirmatn, sans-serif">وزیرمتن</option>
            <option value="IRANSans, sans-serif">ایران‌سنس</option>
            <option value="Tahoma, sans-serif">تاهوما</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">اندازه فونت</label>
          <select
            value={styles.font_size || '12px'}
            onChange={e => onUpdate({ ...styles, font_size: e.target.value })}
            className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="10px">۱۰ پیکسل</option>
            <option value="11px">۱۱ پیکسل</option>
            <option value="12px">۱۲ پیکسل</option>
            <option value="13px">۱۳ پیکسل</option>
            <option value="14px">۱۴ پیکسل</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">اندازه صفحه</label>
          <select
            value={styles.page_size || 'A4'}
            onChange={e => onUpdate({ ...styles, page_size: e.target.value })}
            className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="A4">A4</option>
            <option value="A5">A5</option>
            <option value="Letter">Letter</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">حاشیه صفحه</label>
          <select
            value={styles.margin || '20mm'}
            onChange={e => onUpdate({ ...styles, margin: e.target.value })}
            className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="10mm">۱۰ میلی‌متر</option>
            <option value="15mm">۱۵ میلی‌متر</option>
            <option value="20mm">۲۰ میلی‌متر</option>
            <option value="25mm">۲۵ میلی‌متر</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">چینش سربرگ</label>
          <select
            value={styles.header_align || 'center'}
            onChange={e => onUpdate({ ...styles, header_align: e.target.value })}
            className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-amber-500"
          >
            <option value="left">چپ</option>
            <option value="center">وسط</option>
            <option value="right">راست</option>
          </select>
        </div>
      </div>
    </div>
  );
}
