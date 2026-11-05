// Predefined professional invoice templates for when AI is not available

export interface PredefinedTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  blocks: any[];
  styles: any;
}

export const predefinedTemplates: PredefinedTemplate[] = [
  {
    id: 'minimal-gold',
    name: 'طلایی مینیمال',
    description: 'قالب ساده و شیک مناسب فروشگاه‌های طلا و جواهر',
    icon: '✨',
    blocks: [
      { id: 'header_1', type: 'header', visible: true, props: { show_logo: true, logo_width: 60, show_store_name: true, show_tagline: true, tagline: 'فروش انواع طلا و جواهر' } },
      { id: 'seller_info_1', type: 'seller_info', visible: true, props: { label: 'فروشنده:', show_address: true, show_phone: true, show_tax_id: false } },
      { id: 'buyer_info_1', type: 'buyer_info', visible: true, props: { label: 'خریدار:', show_national_id: false, show_phone: true, show_address: false } },
      { id: 'invoice_meta_1', type: 'invoice_meta', visible: true, props: { show_invoice_number: true, show_date: true, show_time: false, show_payment_method: true } },
      { id: 'items_table_1', type: 'items_table', visible: true, props: { show_row_number: true, show_description: true, show_weight: true, show_karat: true, show_stone: true, show_unit_price: true, show_wage: true, show_profit: true, show_tax: true, show_amount: true } },
      { id: 'totals_1', type: 'totals', visible: true, props: { show_subtotal: true, show_discount: true, show_tax: true, show_total: true } },
      { id: 'notes_1', type: 'notes', visible: false, props: { content: '' } },
      { id: 'terms_1', type: 'terms', visible: true, props: { content: 'این فاکتور مطابق با قوانین اتحادیه طلا و جواهر صادر شده و معتبر می‌باشد.' } },
      { id: 'signature_1', type: 'signature', visible: true, props: { show_seller_signature: true, show_buyer_signature: true, show_stamp: true } },
      { id: 'footer_1', type: 'footer', visible: true, props: { content: 'با تشکر از خرید شما', show_page_number: true } },
    ],
    styles: {
      primary_color: '#d4af37',
      text_color: '#1e293b',
      font_family: 'Vazirmatn, sans-serif',
      font_size: '12px',
      page_size: 'A4',
      margin: '20mm',
      header_align: 'center',
    },
  },
  {
    id: 'professional-navy',
    name: 'آبی حرفه‌ای',
    description: 'قالب رسمی با رنگ‌بندی آبی تیره و نقره‌ای',
    icon: '💼',
    blocks: [
      { id: 'header_1', type: 'header', visible: true, props: { show_logo: true, logo_width: 80, show_store_name: true, show_tagline: true, tagline: 'گالری طلا و جواهر' } },
      { id: 'seller_info_1', type: 'seller_info', visible: true, props: { label: 'مشخصات فروشنده:', show_address: true, show_phone: true, show_tax_id: true } },
      { id: 'buyer_info_1', type: 'buyer_info', visible: true, props: { label: 'مشخصات خریدار:', show_national_id: true, show_phone: true, show_address: true } },
      { id: 'invoice_meta_1', type: 'invoice_meta', visible: true, props: { show_invoice_number: true, show_date: true, show_time: true, show_payment_method: true } },
      { id: 'items_table_1', type: 'items_table', visible: true, props: { show_row_number: true, show_description: true, show_weight: true, show_karat: true, show_stone: true, show_unit_price: true, show_wage: true, show_profit: true, show_tax: true, show_amount: true } },
      { id: 'totals_1', type: 'totals', visible: true, props: { show_subtotal: true, show_discount: true, show_tax: true, show_total: true } },
      { id: 'notes_1', type: 'notes', visible: true, props: { content: 'توضیحات اضافی را اینجا وارد کنید.' } },
      { id: 'terms_1', type: 'terms', visible: true, props: { content: 'این فاکتور دارای اعتبار قانونی بوده و مطابق با مقررات اتحادیه طلا و جواهرات صادر گردیده است. هرگونه اختلاف از طریق مراجع قانونی پیگیری خواهد شد.' } },
      { id: 'signature_1', type: 'signature', visible: true, props: { show_seller_signature: true, show_buyer_signature: true, show_stamp: true } },
      { id: 'footer_1', type: 'footer', visible: true, props: { content: 'از اعتماد شما سپاسگزاریم | www.example.com', show_page_number: true } },
    ],
    styles: {
      primary_color: '#1e3a8a',
      text_color: '#334155',
      font_family: 'Vazirmatn, sans-serif',
      font_size: '11px',
      page_size: 'A4',
      margin: '15mm',
      header_align: 'center',
    },
  },
  {
    id: 'modern-rose',
    name: 'رز مدرن',
    description: 'قالب مدرن با رنگ‌های گرم و طراحی معاصر',
    icon: '🌹',
    blocks: [
      { id: 'header_1', type: 'header', visible: true, props: { show_logo: true, logo_width: 70, show_store_name: true, show_tagline: true, tagline: 'طلا و جواهرات مدرن' } },
      { id: 'seller_info_1', type: 'seller_info', visible: true, props: { label: 'فروشنده:', show_address: true, show_phone: true, show_tax_id: false } },
      { id: 'buyer_info_1', type: 'buyer_info', visible: true, props: { label: 'خریدار:', show_national_id: false, show_phone: true, show_address: false } },
      { id: 'invoice_meta_1', type: 'invoice_meta', visible: true, props: { show_invoice_number: true, show_date: true, show_time: false, show_payment_method: true } },
      { id: 'items_table_1', type: 'items_table', visible: true, props: { show_row_number: true, show_description: true, show_weight: true, show_karat: true, show_stone: true, show_unit_price: true, show_wage: true, show_profit: true, show_tax: true, show_amount: true } },
      { id: 'totals_1', type: 'totals', visible: true, props: { show_subtotal: true, show_discount: true, show_tax: true, show_total: true } },
      { id: 'notes_1', type: 'notes', visible: false, props: { content: '' } },
      { id: 'terms_1', type: 'terms', visible: true, props: { content: 'با تشکر از خرید شما. این فاکتور معتبر می‌باشد.' } },
      { id: 'signature_1', type: 'signature', visible: true, props: { show_seller_signature: true, show_buyer_signature: false, show_stamp: true } },
      { id: 'footer_1', type: 'footer', visible: true, props: { content: 'طلای رز | تماس: ۰۲۱-۱۲۳۴۵۶۷۸', show_page_number: true } },
    ],
    styles: {
      primary_color: '#be185d',
      text_color: '#1e293b',
      font_family: 'Vazirmatn, sans-serif',
      font_size: '12px',
      page_size: 'A4',
      margin: '20mm',
      header_align: 'right',
    },
  },
];
