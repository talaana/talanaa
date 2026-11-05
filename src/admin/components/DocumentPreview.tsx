import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Printer, Download, FileText, Receipt } from 'lucide-react';
import { admin } from '../api';
import { formatToman, toPersianDigits, apiAssetUrl } from '../../utils';
import InvoiceRenderer from './InvoiceRenderer';
import html2pdf from 'html2pdf.js';

interface Block {
  id: string;
  type: string;
  visible: boolean;
  props: Record<string, any>;
}

interface Template {
  id: number;
  name: string;
  type: 'system' | 'custom';
  is_default: boolean;
  blocks: Block[];
  styles: Record<string, any> | null;
}

interface InvoiceData {
  invoice_number: string;
  type: string;
  status: string;
  issued_at: string;
  due_date?: string;
  paid_at?: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  notes?: string | null;
  items: Array<{ description: string; amount: number; weight?: number; unit_price?: number }>;
  contact?: { name: string; phone: string; address?: string };
  tenant?: { name: string; logo?: string; address?: string; phone?: string; email?: string; brand_color?: string };
}

interface InvoiceRow {
  id: number;
  invoice_number: string;
  type: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  issued_at: string;
  paid_at: string | null;
  notes: string | null;
  items: InvoiceData['items'];
  contact?: InvoiceData['contact'];
  tenant?: InvoiceData['tenant'];
  template_snapshot?: {
    blocks: Block[];
    styles: Record<string, any> | null;
    template_id: number;
    template_slug: string;
    snapshot_at: string;
  } | null;
}

interface BillRow {
  id: number;
  type: 'payable' | 'receivable';
  status: string;
  description: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  paid_at: string | null;
  reference: string;
  created_at?: string;
  contact?: InvoiceData['contact'];
  tenant?: InvoiceData['tenant'];
}

interface Props {
  kind: 'invoice' | 'bill';
  document: InvoiceRow | BillRow;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  issued: 'صادر شده',
  paid: 'پرداخت شده',
  overdue: 'سررسید گذشته',
  cancelled: 'لغو شده',
  pending: 'در انتظار',
  partial: 'پرداخت جزئی',
  payable: 'پرداختنی',
  receivable: 'دریافتنی',
};

const statusColors: Record<string, string> = {
  issued: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  overdue: 'bg-rose-50 text-rose-700',
  cancelled: 'bg-slate-100 text-slate-500',
  pending: 'bg-amber-50 text-amber-700',
  partial: 'bg-sky-50 text-sky-700',
  payable: 'bg-rose-50 text-rose-600',
  receivable: 'bg-emerald-50 text-emerald-600',
};

function normalizeToInvoiceData(kind: 'invoice' | 'bill', doc: InvoiceRow | BillRow): InvoiceData {
  if (kind === 'invoice') {
    const inv = doc as InvoiceRow;
    return {
      invoice_number: inv.invoice_number,
      type: inv.type,
      status: inv.status,
      issued_at: inv.issued_at,
      due_date: inv.due_date,
      paid_at: inv.paid_at,
      subtotal: inv.subtotal,
      tax_amount: inv.tax_amount,
      discount_amount: inv.discount_amount,
      total_amount: inv.total_amount,
      paid_amount: inv.paid_amount,
      notes: inv.notes,
      items: inv.items || [],
      contact: inv.contact,
      tenant: inv.tenant ? { ...inv.tenant, logo: inv.tenant.logo ? apiAssetUrl(inv.tenant.logo) : undefined } : undefined,
    };
  }
  const bill = doc as BillRow;
  return {
    invoice_number: bill.reference || `BILL-${toPersianDigits(bill.id)}`,
    type: bill.type,
    status: bill.status,
    issued_at: bill.created_at || bill.due_date,
    due_date: bill.due_date,
    paid_at: bill.paid_at,
    subtotal: bill.amount,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: bill.amount,
    paid_amount: bill.paid_amount,
    notes: bill.description,
    items: [{ description: bill.description, amount: bill.amount }],
    contact: bill.contact,
    tenant: bill.tenant ? { ...bill.tenant, logo: bill.tenant.logo ? apiAssetUrl(bill.tenant.logo) : undefined } : undefined,
  };
}

export default function DocumentPreview({ kind, document: doc, onClose }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const data = normalizeToInvoiceData(kind, doc);

  // Issued invoices carry a frozen template snapshot — use it directly so
  // later template edits never change what the customer received.
  const snapshot = kind === 'invoice' ? (doc as InvoiceRow).template_snapshot : null;

  useEffect(() => {
    if (snapshot) {
      setLoading(false);
      return;
    }
    admin.invoiceTemplates.list()
      .then((res: any) => {
        const list: Template[] = res.data || res || [];
        setTemplates(list);
        const def = list.find(t => t.is_default) || list.find(t => t.type === 'system') || list[0];
        if (def) setSelectedTemplateId(def.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [snapshot]);

  const selectedTemplate = snapshot
    ? { id: snapshot.template_id, name: snapshot.template_slug, type: 'system' as const, is_default: false, blocks: snapshot.blocks, styles: snapshot.styles }
    : templates.find(t => t.id === selectedTemplateId);

  const handlePrint = () => {
    document.body.classList.add('printing-document');
    window.print();
    document.body.classList.remove('printing-document');
  };

  const handleDownloadPdf = async () => {
    if (!previewRef.current || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const filename = kind === 'invoice'
        ? `invoice-${(doc as InvoiceRow).invoice_number}.pdf`
        : `bill-${(doc as BillRow).reference || doc.id}.pdf`;
      await html2pdf().set({
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(previewRef.current).save();
    } catch (e) {
      console.error('PDF generation failed', e);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const title = kind === 'invoice' ? 'پیش‌نمایش فاکتور' : 'پیش‌نمایش سند مالی';

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col no-print" dir="rtl">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {kind === 'invoice' ? <FileText className="w-5 h-5 text-amber-600" /> : <Receipt className="w-5 h-5 text-amber-600" />}
            <h2 className="text-sm lg:text-base font-black text-slate-800">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {snapshot ? (
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              قالب ثبت‌شده در زمان صدور — {selectedTemplate?.name}
            </span>
          ) : (
          <select
            value={selectedTemplateId ?? ''}
            onChange={e => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
            className="border border-slate-200 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-amber-500 bg-white"
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}{t.is_default ? ' (پیش‌فرض)' : ''}{t.type === 'system' ? ' — سیستمی' : ''}
              </option>
            ))}
          </select>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">چاپ</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{generatingPdf ? 'در حال ساخت...' : 'دانلود PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Info panel */}
        <aside className="w-full lg:w-96 bg-slate-50 border-l border-slate-200 overflow-y-auto p-5 space-y-4 flex-shrink-0">
          <InfoSection title="اطلاعات سند">
            <InfoRow label="شماره:" value={toPersianDigits(data.invoice_number)} mono />
            <InfoRow label="نوع:" value={
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${statusColors[data.type] || 'bg-slate-100 text-slate-600'}`}>
                {kind === 'invoice' ? (data.type === 'sale' ? 'فروش' : data.type === 'purchase' ? 'خرید' : 'خدمات') : (data.type === 'payable' ? 'پرداختنی' : 'دریافتنی')}
              </span>
            } />
            <InfoRow label="وضعیت:" value={
              <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${statusColors[data.status] || 'bg-slate-100 text-slate-600'}`}>
                {statusLabels[data.status] || data.status}
              </span>
            } />
            <InfoRow label="تاریخ صدور:" value={data.issued_at?.slice(0, 10)} />
            {data.due_date && <InfoRow label="سررسید:" value={data.due_date.slice(0, 10)} />}
          </InfoSection>

          {data.contact && (
            <InfoSection title="مخاطب">
              <InfoRow label="نام:" value={data.contact.name} />
              {data.contact.phone && <InfoRow label="تلفن:" value={toPersianDigits(data.contact.phone)} mono />}
              {data.contact.address && <InfoRow label="آدرس:" value={data.contact.address} />}
            </InfoSection>
          )}

          <InfoSection title="مبالغ">
            <InfoRow label="جمع کل:" value={formatToman(data.subtotal)} />
            {data.tax_amount > 0 && <InfoRow label="مالیات:" value={formatToman(data.tax_amount)} />}
            {data.discount_amount > 0 && <InfoRow label="تخفیف:" value={`-${formatToman(data.discount_amount)}`} color="text-rose-600" />}
            <div className="border-t border-slate-200 pt-2 mt-2">
              <InfoRow label="مبلغ نهایی:" value={formatToman(data.total_amount)} bold />
            </div>
            {data.paid_amount > 0 && (
              <>
                <InfoRow label="پرداخت شده:" value={formatToman(data.paid_amount)} color="text-emerald-600" />
                <InfoRow label="باقی‌مانده:" value={formatToman(data.total_amount - data.paid_amount)} bold color="text-amber-600" />
              </>
            )}
          </InfoSection>

          {data.notes && (
            <InfoSection title="یادداشت">
              <p className="text-xs text-slate-600 leading-relaxed">{data.notes}</p>
            </InfoSection>
          )}

          {kind === 'invoice' && (doc as InvoiceRow).items?.length > 0 && (
            <InfoSection title="اقلام">
              <div className="space-y-2">
                {(doc as InvoiceRow).items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-600">{item.description}</span>
                    <span className="font-bold text-slate-800">{formatToman(item.amount)}</span>
                  </div>
                ))}
              </div>
            </InfoSection>
          )}
        </aside>

        {/* Preview area */}
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : selectedTemplate ? (
            <div ref={previewRef} className="max-w-4xl mx-auto shadow-lg rounded-lg overflow-hidden bg-white print-shadow">
              <InvoiceRenderer
                blocks={selectedTemplate.blocks}
                styles={selectedTemplate.styles || undefined}
                invoice={data}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              قالبی برای پیش‌نمایش یافت نشد
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <h3 className="text-xs font-black text-slate-500 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value, mono, bold, color }: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-baseline text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={`${mono ? 'font-mono' : ''} ${bold ? 'font-black' : 'font-bold'} ${color || 'text-slate-800'}`}>
        {value || '—'}
      </span>
    </div>
  );
}
