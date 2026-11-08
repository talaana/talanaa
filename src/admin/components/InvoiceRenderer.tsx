import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatToman, toPersianDigits, formatGram } from '../../utils';
import { Lock } from 'lucide-react';
import './InvoicePrint.css';

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
  primary_color?: string;
  text_color?: string;
  font_family?: string;
  font_size?: string;
  page_size?: string;
  margin?: string;
  header_align?: string;
}

interface InvoiceItem {
  description: string;
  amount: number;
  weight?: number;
  unit_price?: number;
  wage?: number;
  profit?: number;
  tax?: number;
  karat?: string;
  stone?: string;
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
  items: InvoiceItem[];
  contact?: { name: string; phone: string; address?: string; national_id?: string };
  tenant?: { name: string; logo?: string; address?: string; phone?: string; email?: string; brand_color?: string; tax_id?: string };
}

interface Props {
  blocks: Block[];
  styles?: TemplateStyles;
  invoice: InvoiceData;
  preview?: boolean;
  onInlineEdit?: (blockId: string, propKey: string, value: string) => void;
  blockSchema?: BlockDefinition[];
  systemDefaults?: Record<string, Record<string, string>>;
}

const sampleInvoice: InvoiceData = {
  invoice_number: 'INV-20261101-000001',
  type: 'sale',
  status: 'issued',
  issued_at: '2026-11-01T10:30:00',
  due_date: '2026-12-01',
  subtotal: 45_000_000,
  tax_amount: 4_500_000,
  discount_amount: 500_000,
  total_amount: 49_000_000,
  paid_amount: 20_000_000,
  notes: 'تحویل در شعبه مرکزی',
  items: [
    { description: 'نیم‌ست طلا ۱۸ عیار', amount: 25_000_000, weight: 3.250, unit_price: 7_692_307, wage: 3_000_000, profit: 1_950_000, tax: 495_000, karat: '۱۸', stone: '—' },
    { description: 'دستبند طلا طرح ونکلیف', amount: 20_000_000, weight: 2.600, unit_price: 7_692_307, wage: 2_400_000, profit: 1_560_000, tax: 396_000, karat: '۱۸', stone: '—' },
  ],
  contact: { name: 'علی محمدی', phone: '۰۹۱۲۳۴۵۶۷۸۹', address: 'تهران، خیابان ولیعصر' },
  tenant: { name: 'طلانا جواهر', logo: undefined, address: 'تهران، میدان ونک', phone: '۰۲۱-۸۸۷۷۶۶۵۵', email: 'info@talana.ir', tax_id: '۱۲۳۴۵۶۷۸۹۰۱' },
};

const pageSizeDimensions: Record<string, { width: string; minHeight: string }> = {
  A4: { width: '210mm', minHeight: '297mm' },
  A5: { width: '148mm', minHeight: '210mm' },
  Letter: { width: '216mm', minHeight: '279mm' },
};

export default function InvoiceRenderer({ blocks, styles, invoice, preview = false, onInlineEdit, blockSchema, systemDefaults }: Props) {
  const data = preview ? sampleInvoice : invoice;
  const s = styles || {};

  const dims = pageSizeDimensions[s.page_size || 'A4'] || pageSizeDimensions.A4;

  const containerStyle: React.CSSProperties = {
    direction: 'rtl',
    fontFamily: s.font_family || 'Vazirmatn, sans-serif',
    fontSize: s.font_size || '12px',
    color: s.text_color || '#1e293b',
    width: dims.width,
    minHeight: dims.minHeight,
    margin: '0 auto',
    padding: s.margin || '20mm',
    background: 'white',
    boxSizing: 'border-box',
  };

  const primaryColor = s.primary_color || data.tenant?.brand_color || '#ca8a04';

  const schemaMap = React.useMemo(() => {
    if (!blockSchema) return null;
    const map: Record<string, BlockDefinition> = {};
    for (const def of blockSchema) map[def.type] = def;
    return map;
  }, [blockSchema]);

  const getPropMeta = (blockType: string, propKey: string): PropMeta | null => {
    return schemaMap?.[blockType]?.props?.[propKey] ?? null;
  };

  const resolveProp = (block: Block, key: string, fallback?: string): string => {
    const val = block.props[key];
    if (val !== undefined && val !== null) return String(val);
    const meta = getPropMeta(block.type, key);
    if (meta?.default !== undefined && meta?.default !== null) return String(meta.default);
    if (meta?.system_default && systemDefaults?.[block.type]?.[key]) {
      return systemDefaults[block.type][key];
    }
    return fallback ?? '';
  };

  const blockWrapperStyle = (block: Block): React.CSSProperties => {
    const p = block.props;
    const widthPct = typeof p.width_percent === 'number' ? p.width_percent : 100;
    const align = p.align && p.align !== 'inherit' ? p.align : undefined;
    return {
      width: `${widthPct}%`,
      marginTop: typeof p.margin_top === 'number' ? `${p.margin_top}mm` : undefined,
      marginBottom: typeof p.margin_bottom === 'number' ? `${p.margin_bottom}mm` : undefined,
      textAlign: align as any,
      marginLeft: align === 'center' ? 'auto' : align === 'right' ? 'auto' : undefined,
      marginRight: align === 'center' ? 'auto' : align === 'left' ? 'auto' : undefined,
    };
  };

  return (
    <div className="invoice-page" style={containerStyle}>
      {blocks.filter(b => b.visible).map(block => {
        const wrap = <div key={block.id} style={blockWrapperStyle(block)}>{renderBlock(block)}</div>;
        return wrap;
      })}
    </div>
  );

  function renderBlock(block: Block) {
    switch (block.type) {
      case 'header':
        return <HeaderBlock block={block} data={data} primaryColor={primaryColor} align={s.header_align} resolveProp={resolveProp} onInlineEdit={onInlineEdit} getPropMeta={getPropMeta} />;
      case 'seller_info':
        return <SellerInfoBlock block={block} data={data} resolveProp={resolveProp} onInlineEdit={onInlineEdit} getPropMeta={getPropMeta} />;
      case 'buyer_info':
        return <BuyerInfoBlock block={block} data={data} resolveProp={resolveProp} onInlineEdit={onInlineEdit} getPropMeta={getPropMeta} />;
      case 'invoice_meta':
        return <InvoiceMetaBlock block={block} data={data} resolveProp={resolveProp} onInlineEdit={onInlineEdit} getPropMeta={getPropMeta} />;
      case 'items_table':
        return <ItemsTableBlock block={block} data={data} primaryColor={primaryColor} resolveProp={resolveProp} onInlineEdit={onInlineEdit} getPropMeta={getPropMeta} />;
      case 'totals':
        return <TotalsBlock block={block} data={data} primaryColor={primaryColor} resolveProp={resolveProp} onInlineEdit={onInlineEdit} getPropMeta={getPropMeta} />;
      case 'notes':
        return <NotesBlock block={block} data={data} resolveProp={resolveProp} onInlineEdit={onInlineEdit} getPropMeta={getPropMeta} />;
      case 'terms':
        return <TermsBlock block={block} resolveProp={resolveProp} onInlineEdit={onInlineEdit} getPropMeta={getPropMeta} />;
      case 'signature':
        return <SignatureBlock block={block} resolveProp={resolveProp} onInlineEdit={onInlineEdit} getPropMeta={getPropMeta} />;
      case 'footer':
        return <FooterBlock block={block} primaryColor={primaryColor} resolveProp={resolveProp} onInlineEdit={onInlineEdit} getPropMeta={getPropMeta} />;
      default:
        return null;
    }
  }
}

function InlineText({ value, blockId, propKey, onInlineEdit, className, style, isPreview }: {
  value: string; blockId: string; propKey: string;
  onInlineEdit?: (blockId: string, propKey: string, value: string) => void;
  className?: string; style?: React.CSSProperties; isPreview?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft !== value && onInlineEdit) onInlineEdit(blockId, propKey, draft);
  }, [draft, value, blockId, propKey, onInlineEdit]);

  if (!onInlineEdit || isPreview) {
    return <span className={className} style={style}>{value}</span>;
  }

  if (editing) {
    return (
      <span
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className={className}
        style={{ ...style, outline: '2px solid #ca8a04', borderRadius: 3, padding: '1px 4px', cursor: 'text' }}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
      >
        {draft}
      </span>
    );
  }

  return (
    <span
      className={className}
      style={{ ...style, cursor: 'pointer', borderBottom: '1px dashed #cbd5e1' }}
      onClick={() => setEditing(true)}
      title="کلیک برای ویرایش"
    >
      {value}
    </span>
  );
}

function LockHint({ propKey, blockType, getPropMeta }: { propKey: string; blockType: string; getPropMeta: (bt: string, pk: string) => PropMeta | null }) {
  const meta = getPropMeta(blockType, propKey);
  if (!meta || meta.edit !== 'locked') return null;
  return <Lock className="inline w-3 h-3 text-slate-300 mr-1" title="این فیلد قفل است و قابل تغییر نیست" />;
}

function HeaderBlock({ block, data, primaryColor, align, resolveProp, onInlineEdit, getPropMeta }: any) {
  const p = block.props;
  const tagline = resolveProp(block, 'tagline', 'فروش انواع طلا و جواهر');
  return (
    <div style={{ textAlign: (align as any) || 'center', marginBottom: '24px', borderBottom: `2px solid ${primaryColor}`, paddingBottom: '16px' }}>
      {p.show_logo && data.tenant?.logo && (
        <img src={data.tenant.logo} alt="" style={{ maxHeight: `${p.logo_width || 60}px`, marginBottom: '8px' }} />
      )}
      {p.show_store_name !== false && (
        <h1 style={{ fontSize: '22px', fontWeight: 900, color: primaryColor, margin: 0 }}>
          <LockHint propKey="show_store_name" blockType="header" getPropMeta={getPropMeta} />
          {data.tenant?.name || 'فروشگاه'}
        </h1>
      )}
      {p.show_tagline && (
        <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0' }}>
          <InlineText value={tagline} blockId={block.id} propKey="tagline" onInlineEdit={onInlineEdit} />
        </p>
      )}
    </div>
  );
}

function SellerInfoBlock({ block, data, resolveProp, onInlineEdit, getPropMeta }: any) {
  const t = data.tenant;
  if (!t) return null;
  const p = block.props;
  const label = resolveProp(block, 'label', 'فروشنده:');
  return (
    <div style={{ marginBottom: '16px', fontSize: '11px', lineHeight: 1.8 }}>
      <strong style={{ color: '#475569' }}>
        <LockHint propKey="show_name" blockType="seller_info" getPropMeta={getPropMeta} />
        <InlineText value={label} blockId={block.id} propKey="label" onInlineEdit={onInlineEdit} />{' '}
      </strong>
      <span>{t.name}</span>
      {p.show_address !== false && t.address && <span> — {t.address}</span>}
      {p.show_phone !== false && t.phone && <span> — تلفن: {toPersianDigits(t.phone)}</span>}
      {p.show_email && t.email && <span> — {t.email}</span>}
      {p.show_tax_id !== false && t.tenant?.tax_id && <span> — شناسه مالیاتی: {toPersianDigits(t.tax_id)}</span>}
    </div>
  );
}

function BuyerInfoBlock({ block, data, resolveProp, onInlineEdit, getPropMeta }: any) {
  const c = data.contact;
  if (!c) return null;
  const p = block.props;
  const label = resolveProp(block, 'label', 'خریدار:');
  return (
    <div style={{ marginBottom: '16px', fontSize: '11px', lineHeight: 1.8 }}>
      <strong style={{ color: '#475569' }}>
        <LockHint propKey="show_name" blockType="buyer_info" getPropMeta={getPropMeta} />
        <InlineText value={label} blockId={block.id} propKey="label" onInlineEdit={onInlineEdit} />{' '}
      </strong>
      <span>{c.name}</span>
      {p.show_phone !== false && c.phone && <span> — {toPersianDigits(c.phone)}</span>}
      {p.show_address && c.address && <span> — {c.address}</span>}
      {p.show_national_id && c.national_id && <span> — کد ملی: {toPersianDigits(c.national_id)}</span>}
    </div>
  );
}

function InvoiceMetaBlock({ block, data, resolveProp, onInlineEdit, getPropMeta }: any) {
  const p = block.props;
  const labelNumber = resolveProp(block, 'label_number', 'شماره فاکتور:');
  const labelDate = resolveProp(block, 'label_date', 'تاریخ صدور:');
  const labelDueDate = resolveProp(block, 'label_due_date', 'سررسید:');
  return (
    <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', fontSize: '11px', flexWrap: 'wrap' }}>
      {p.show_number !== false && (
        <div>
          <strong>
            <LockHint propKey="show_number" blockType="invoice_meta" getPropMeta={getPropMeta} />
            <InlineText value={labelNumber} blockId={block.id} propKey="label_number" onInlineEdit={onInlineEdit} />{' '}
          </strong>
          <span style={{ fontFamily: 'monospace' }}>{toPersianDigits(data.invoice_number)}</span>
        </div>
      )}
      {p.show_date !== false && (
        <div>
          <strong>
            <LockHint propKey="show_date" blockType="invoice_meta" getPropMeta={getPropMeta} />
            <InlineText value={labelDate} blockId={block.id} propKey="label_date" onInlineEdit={onInlineEdit} />{' '}
          </strong>
          <span>{data.issued_at?.slice(0, 10)}</span>
        </div>
      )}
      {p.show_due_date !== false && data.due_date && (
        <div>
          <strong><InlineText value={labelDueDate} blockId={block.id} propKey="label_due_date" onInlineEdit={onInlineEdit} />{' '}</strong>
          <span>{data.due_date.slice(0, 10)}</span>
        </div>
      )}
    </div>
  );
}

function ItemsTableBlock({ block, data, primaryColor, resolveProp, onInlineEdit, getPropMeta }: any) {
  const p = block.props;

  const columns: { key: string; showProp: string; labelProp: string; defaultLabel: string; locked: boolean }[] = [
    { key: 'description', showProp: 'show_description', labelProp: 'label_description', defaultLabel: 'شرح کالا / خدمات', locked: true },
    { key: 'weight', showProp: 'show_weight', labelProp: 'label_weight', defaultLabel: 'وزن (گرم)', locked: true },
    { key: 'karat', showProp: 'show_karat', labelProp: 'label_karat', defaultLabel: 'عیار', locked: true },
    { key: 'stone', showProp: 'show_stone', labelProp: 'label_stone', defaultLabel: 'نگین', locked: true },
    { key: 'unit_price', showProp: 'show_unit_price', labelProp: 'label_unit_price', defaultLabel: 'قیمت هر گرم', locked: true },
    { key: 'wage', showProp: 'show_wage', labelProp: 'label_wage', defaultLabel: 'اجرت ساخت', locked: true },
    { key: 'profit', showProp: 'show_profit', labelProp: 'label_profit', defaultLabel: 'سود فروشنده', locked: true },
    { key: 'tax', showProp: 'show_tax', labelProp: 'label_tax', defaultLabel: 'مالیات', locked: true },
    { key: 'amount', showProp: 'show_amount', labelProp: 'label_amount', defaultLabel: 'مبلغ', locked: true },
  ];

  const visibleColumns = columns.filter(col => p[col.showProp] !== false);

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '11px' }}>
      <thead>
        <tr style={{ background: primaryColor, color: 'white' }}>
          <th style={thStyle}>#</th>
          {visibleColumns.map(col => (
            <th key={col.key} style={thStyle}>
              <LockHint propKey={col.showProp} blockType="items_table" getPropMeta={getPropMeta} />
              <InlineText value={resolveProp(block, col.labelProp, col.defaultLabel)} blockId={block.id} propKey={col.labelProp} onInlineEdit={onInlineEdit} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.items.map((item: InvoiceItem, i: number) => (
          <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={tdStyle}>{toPersianDigits(i + 1)}</td>
            {visibleColumns.map(col => (
              <td key={col.key} style={tdStyle}>{renderCell(col.key, item)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderCell(key: string, item: InvoiceItem): React.ReactNode {
  switch (key) {
    case 'description': return item.description;
    case 'weight': return item.weight ? formatGram(item.weight) : '—';
    case 'karat': return item.karat || '—';
    case 'stone': return item.stone || '—';
    case 'unit_price': return item.unit_price ? formatToman(item.unit_price) : '—';
    case 'wage': return item.wage ? formatToman(item.wage) : '—';
    case 'profit': return item.profit ? formatToman(item.profit) : '—';
    case 'tax': return item.tax ? formatToman(item.tax) : '—';
    case 'amount': return formatToman(item.amount);
    default: return null;
  }
}

function TotalsBlock({ block, data, primaryColor, resolveProp, onInlineEdit, getPropMeta }: any) {
  const p = block.props;
  const vatLabel = resolveProp(block, 'vat_label', 'مالیات بر ارزش افزوده (اجرت و سود):');
  return (
    <div className="invoice-totals" style={{ marginLeft: 'auto', width: '320px', fontSize: '12px', marginBottom: '20px' }}>
      {p.show_subtotal !== false && (
        <Row label="جمع کل:" value={formatToman(data.subtotal)} />
      )}
      {p.show_tax !== false && data.tax_amount > 0 && (
        <Row
          label={<><LockHint propKey="show_tax" blockType="totals" getPropMeta={getPropMeta} /><InlineText value={vatLabel} blockId={block.id} propKey="vat_label" onInlineEdit={onInlineEdit} /></>}
          value={formatToman(data.tax_amount)}
        />
      )}
      {p.show_discount !== false && data.discount_amount > 0 && (
        <Row label="تخفیف:" value={`-${formatToman(data.discount_amount)}`} color="#dc2626" />
      )}
      <div style={{ borderTop: `2px solid ${primaryColor}`, marginTop: '8px', paddingTop: '8px' }}>
        {p.show_total !== false && (
        <Row label="مبلغ قابل پرداخت:" value={formatToman(data.total_amount)} bold color={primaryColor} />
      )}
      </div>
      {p.show_paid !== false && data.paid_amount > 0 && (
        <>
          <Row label="پرداخت شده:" value={formatToman(data.paid_amount)} color="#059669" />
          <Row label="باقی‌مانده:" value={formatToman(data.total_amount - data.paid_amount)} bold />
        </>
      )}
    </div>
  );
}

function Row({ label, value, bold, color }: { label: React.ReactNode; value: string; bold?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: bold ? 900 : 400, color: color || 'inherit' }}>
      <span>{label}</span>
      <span>{value} تومان</span>
    </div>
  );
}

function NotesBlock({ block, data, resolveProp, onInlineEdit, getPropMeta }: any) {
  if (!data.notes) return null;
  const label = resolveProp(block, 'label', 'یادداشت:');
  return (
    <div style={{ marginBottom: '16px', fontSize: '11px', background: '#f8fafc', padding: '12px', borderRadius: '8px', borderRight: `3px solid #cbd5e1` }}>
      <strong>
        <InlineText value={label} blockId={block.id} propKey="label" onInlineEdit={onInlineEdit} />{' '}
      </strong>
      {data.notes}
    </div>
  );
}

function TermsBlock({ block, resolveProp, onInlineEdit }: any) {
  const text = resolveProp(block, 'text');
  const label = resolveProp(block, 'label', 'شرایط و قوانین:');
  if (!text) return null;
  return (
    <div style={{ marginBottom: '16px', fontSize: '10px', color: '#64748b', lineHeight: 1.8 }}>
      <strong><InlineText value={label} blockId={block.id} propKey="label" onInlineEdit={onInlineEdit} /></strong>
      <p style={{ margin: '4px 0 0' }}>
        <InlineText value={text} blockId={block.id} propKey="text" onInlineEdit={onInlineEdit} />
      </p>
    </div>
  );
}

function SignatureBlock({ block, resolveProp, onInlineEdit, getPropMeta }: any) {
  const p = block.props;
  const sellerLabel = resolveProp(block, 'seller_signature_label', 'مهر و امضای فروشنده');
  const buyerLabel = resolveProp(block, 'buyer_signature_label', 'امضای خریدار');
  return (
    <div className="invoice-signature" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '11px' }}>
      {p.show_seller_signature !== false && (
        <div style={{ textAlign: 'center', width: '200px' }}>
          <div style={{ borderBottom: '1px solid #94a3b8', marginBottom: '8px', height: '60px' }} />
          <LockHint propKey="show_seller_signature" blockType="signature" getPropMeta={getPropMeta} />
          <InlineText value={sellerLabel} blockId={block.id} propKey="seller_signature_label" onInlineEdit={onInlineEdit} />
        </div>
      )}
      {p.show_buyer_signature !== false && (
        <div style={{ textAlign: 'center', width: '200px' }}>
          <div style={{ borderBottom: '1px solid #94a3b8', marginBottom: '8px', height: '60px' }} />
          <InlineText value={buyerLabel} blockId={block.id} propKey="buyer_signature_label" onInlineEdit={onInlineEdit} />
        </div>
      )}
    </div>
  );
}

function FooterBlock({ block, primaryColor, resolveProp, onInlineEdit }: any) {
  const text = resolveProp(block, 'text');
  if (!text) return null;
  return (
    <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: `1px solid #e2e8f0`, textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
      <InlineText value={text} blockId={block.id} propKey="text" onInlineEdit={onInlineEdit} />
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '8px 12px', textAlign: 'right', fontWeight: 700, fontSize: '11px' };
const tdStyle: React.CSSProperties = { padding: '8px 12px', textAlign: 'right' };
