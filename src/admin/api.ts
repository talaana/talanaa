import { getTenantId } from '../api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface TaxProfile {
  economic_code: string | null;
  tax_authority_id: string | null;
  national_id: string | null;
  register_number: string | null;
  vat_rate_override: number | string | null;
  api_base_url: string | null;
  is_registered: boolean;
  has_api_key: boolean;
  effective_vat_rate: number;
}

export type TaxProfileUpdate = Partial<Omit<TaxProfile, 'has_api_key' | 'effective_vat_rate'>> & {
  api_key?: string;
};

let _token = '';
let _tenantOverride: number | null = null;

export function setAdminToken(t: string) { _token = t; }
export function getAdminToken() { return _token; }
export function setAdminTenant(id: number | null) { _tenantOverride = id; }

/**
 * A fresh idempotency key per attempt. Without it the server fingerprints the payload and refuses a
 * legitimate repeat (e.g. regenerating the same quarter twice) with a 409.
 */
function idempotencyKey(): string {
  return `tax-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const tk = _token || localStorage.getItem('talana_token') || '';
  const isFormData = opts.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'Authorization': `Bearer ${tk}`,
    ...(opts.headers as any || {}),
  };
  const tid = _tenantOverride ?? getTenantId();
  if (tid) headers['X-Tenant'] = String(tid);
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) {
    const e = await res.json().catch(()=>({message:'خطا'}));
    const err = new Error(e.message);
    (err as any).code = e.code;
    throw err;
  }
  return res.json();
}

/**
 * Downloads a protected file. A plain link cannot carry the Bearer token the API
 * requires, so the file is fetched with the auth headers and handed to the browser
 * as a blob.
 */
async function apiDownload(path: string, fallbackName: string) {
  const tk = _token || localStorage.getItem('talana_token') || '';
  const headers: Record<string, string> = { 'Authorization': `Bearer ${tk}` };
  const tid = _tenantOverride ?? getTenantId();
  if (tid) headers['X-Tenant'] = String(tid);
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) { const e = await res.json().catch(()=>({message:'خطا'})); throw new Error(e.message); }
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const filename = match ? decodeURIComponent(match[1]) : fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const admin = {
  permissions: (qs?: string) => apiFetch(`/admin/dashboard/permissions${qs||''}`),
  stats: () => apiFetch('/admin/dashboard/stats'),
  permissionGroups: () => apiFetch('/admin/permissions'),
  roles: {
    list: () => apiFetch('/admin/roles'),
    create: (d: any) => apiFetch('/admin/roles', {method:'POST',body:JSON.stringify(d)}),
    update: (id:number,d:any) => apiFetch(`/admin/roles/${id}`,{method:'PUT',body:JSON.stringify(d)}),
    remove: (id:number) => apiFetch(`/admin/roles/${id}`,{method:'DELETE'}),
    clone: (id:number,d:any) => apiFetch(`/admin/roles/${id}/clone`,{method:'POST',body:JSON.stringify(d)}),
    permissions: () => apiFetch('/admin/permissions'),
    assignToUser: (userId:number,d:any) => apiFetch(`/admin/users/${userId}/assign-role`,{method:'POST',body:JSON.stringify(d)}),
    revokeFromUser: (userId:number,d:any) => apiFetch(`/admin/users/${userId}/revoke-role`,{method:'POST',body:JSON.stringify(d)}),
  },
  users: { list: (tid?:number) => apiFetch(`/admin/users${tid?`?tenant_id=${tid}`:''}`), update: (id:number,d:any) => apiFetch(`/admin/users/${id}`,{method:'PUT',body:JSON.stringify(d)}) },
  tenants: { list: () => apiFetch('/admin/tenants'), create: (d:any) => apiFetch('/admin/tenants',{method:'POST',body:JSON.stringify(d)}), get: (id:number) => apiFetch(`/admin/tenants/${id}`), update: (id:number,d:any) => apiFetch(`/admin/tenants/${id}`,{method:'PUT',body:JSON.stringify(d)}), toggle: (id:number) => apiFetch(`/admin/tenants/${id}/toggle`,{method:'PUT'}), impersonate: (id:number) => apiFetch(`/admin/tenants/${id}/impersonate`,{method:'POST'}) },
  categories: {
    list: (params?: Record<string,any>) => apiFetch(`/admin/categories?${new URLSearchParams(params||{}).toString()}`),
    create: (d:any) => apiFetch('/admin/categories', {method:'POST',body:JSON.stringify(d)}),
    update: (id:number,d:any) => apiFetch(`/admin/categories/${id}`, {method:'PUT',body:JSON.stringify(d)}),
    remove: (id:number) => apiFetch(`/admin/categories/${id}`, {method:'DELETE'}),
  },
  products: {
    list: (params?: Record<string,any>) => apiFetch(`/admin/products?${new URLSearchParams(params||{}).toString()}`),
    create: (d:any) => apiFetch('/admin/products', {method:'POST',body:JSON.stringify(d)}),
    update: (id:number,d:any) => apiFetch(`/admin/products/${id}`, {method:'PUT',body:JSON.stringify(d)}),
    remove: (id:number) => apiFetch(`/admin/products/${id}`, {method:'DELETE'}),
  },
  orders: {
    list: (params?: Record<string,any>) => apiFetch(`/admin/orders?${new URLSearchParams(params||{}).toString()}`),
  },
  branches: {
    list: (params?: Record<string,any>) => apiFetch(`/admin/branches?${new URLSearchParams(params||{}).toString()}`),
    create: (d:any) => apiFetch('/admin/branches', {method:'POST',body:JSON.stringify(d)}),
    update: (id:number,d:any) => apiFetch(`/admin/branches/${id}`, {method:'PUT',body:JSON.stringify(d)}),
    remove: (id:number) => apiFetch(`/admin/branches/${id}`, {method:'DELETE'}),
  },
  wallet: {
    show: (userId:number) => apiFetch(`/admin/wallet/${userId}`),
    deposit: (userId:number,d:any) => apiFetch(`/admin/wallet/${userId}/deposit`, {method:'POST',body:JSON.stringify(d)}),
    withdraw: (userId:number,d:any) => apiFetch(`/admin/wallet/${userId}/withdraw`, {method:'POST',body:JSON.stringify(d)}),
  },
  invoices: {
    list: (params?: Record<string,any>) => apiFetch(`/admin/invoices?${new URLSearchParams(params||{}).toString()}`),
    create: (d:any) => apiFetch('/admin/invoices', {method:'POST',body:JSON.stringify(d)}),
    update: (id:number,d:any) => apiFetch(`/admin/invoices/${id}`, {method:'PUT',body:JSON.stringify(d)}),
    delete: (id:number) => apiFetch(`/admin/invoices/${id}`, {method:'DELETE'}),
    pay: (id:number,d:any) => apiFetch(`/admin/invoices/${id}/pay`, {method:'POST',body:JSON.stringify(d)}),
  },
  bills: {
    list: (params?: Record<string,any>) => apiFetch(`/admin/bills?${new URLSearchParams(params||{}).toString()}`),
    pay: (id:number,d:any) => apiFetch(`/admin/bills/${id}/pay`, {method:'POST',body:JSON.stringify(d)}),
  },
  paymentAccounts: {
    list: () => apiFetch('/admin/payment-accounts'),
    create: (d:any) => apiFetch('/admin/payment-accounts', {method:'POST',body:JSON.stringify(d)}),
    update: (id:number,d:any) => apiFetch(`/admin/payment-accounts/${id}`, {method:'PUT',body:JSON.stringify(d)}),
    remove: (id:number) => apiFetch(`/admin/payment-accounts/${id}`, {method:'DELETE'}),
  },
  reports: {
    balanceSheet: () => apiFetch('/admin/reports/balance-sheet'),
    profitLoss: (params?: Record<string,any>) => apiFetch(`/admin/reports/profit-loss?${new URLSearchParams(params||{}).toString()}`),
    inventory: () => apiFetch('/admin/reports/inventory'),
    transactions: (params?: Record<string,any>) => apiFetch(`/admin/reports/transactions?${new URLSearchParams(params||{}).toString()}`),
    summary: () => apiFetch('/admin/reports/summary'),
  },
  contacts: {
    list: (params?: Record<string,any>) => apiFetch(`/admin/contacts?${new URLSearchParams(params||{}).toString()}`),
  },
  invoiceTemplates: {
    list: (params?: Record<string,any>) => apiFetch(`/admin/invoice-templates?${new URLSearchParams(params||{}).toString()}`),
    get: (id:number) => apiFetch(`/admin/invoice-templates/${id}`),
    blocks: () => apiFetch('/admin/invoice-templates/blocks'),
    create: (d:any) => apiFetch('/admin/invoice-templates', {method:'POST',body:JSON.stringify(d)}),
    update: (id:number,d:any) => apiFetch(`/admin/invoice-templates/${id}`, {method:'PUT',body:JSON.stringify(d)}),
    remove: (id:number) => apiFetch(`/admin/invoice-templates/${id}`, {method:'DELETE'}),
    clone: (id:number,d?:any) => apiFetch(`/admin/invoice-templates/${id}/clone`, {method:'POST',body:JSON.stringify(d||{})}),
    setDefault: (id:number) => apiFetch(`/admin/invoice-templates/${id}/set-default`, {method:'POST'}),
    generateAi: (prompt:string, currentTemplate?:any) => apiFetch('/admin/invoice-templates/generate-ai', {method:'POST',body:JSON.stringify({prompt, current_template: currentTemplate})}),
  },
  aiSettings: {
    list: () => apiFetch('/admin/ai-settings'),
    get: (tenantId:number) => apiFetch(`/admin/ai-settings/${tenantId}`),
    update: (tenantId:number, d:any) => apiFetch(`/admin/ai-settings/${tenantId}`, {method:'PUT',body:JSON.stringify(d)}),
    chatGptStatus: () => apiFetch('/admin/ai-settings/chatgpt/status'),
    connectChatGpt: (tenantId:number) => apiFetch(`/admin/ai-settings/${tenantId}/chatgpt/connect`, {method:'POST'}),
    disconnectChatGpt: (tenantId:number) => apiFetch(`/admin/ai-settings/${tenantId}/chatgpt/disconnect`, {method:'POST'}),
    // Tenant self-service
    getOwn: () => apiFetch('/admin/ai-settings/own'),
    updateOwn: (d:any) => apiFetch('/admin/ai-settings/own', {method:'PUT',body:JSON.stringify(d)}),
    connectChatGptOwn: () => apiFetch('/admin/ai-settings/own/chatgpt/connect', {method:'POST'}),
    disconnectChatGptOwn: () => apiFetch('/admin/ai-settings/own/chatgpt/disconnect', {method:'POST'}),
  },
  tax: {
    profile: (): Promise<{ data: TaxProfile }> => apiFetch('/admin/tax/profile'),
    updateProfile: (data: TaxProfileUpdate): Promise<{ data: TaxProfile }> => apiFetch('/admin/tax/profile', { method: 'PUT', body: JSON.stringify(data) }),
    calculateVat: (d: any) => apiFetch('/admin/tax/calculate-vat', {method:'POST',body:JSON.stringify(d)}),
    submitInvoice: (d: any) => apiFetch('/admin/tax/submit-invoice', {method:'POST',body:JSON.stringify(d)}),
    invoiceStatus: (invoiceId: number) => apiFetch(`/admin/tax/invoice-status/${invoiceId}`),
    electronicInvoices: (params?: Record<string,any>) => apiFetch(`/admin/tax/electronic-invoices?${new URLSearchParams(params||{}).toString()}`),
    quarterlyReport: (d: any) => apiFetch('/admin/tax/reports/quarterly', {method:'POST',body:JSON.stringify(d),headers:{'Idempotency-Key': idempotencyKey()}}),
    submitReport: (d: any) => apiFetch('/admin/tax/submit-report', {method:'POST',body:JSON.stringify(d),headers:{'Idempotency-Key': idempotencyKey()}}),
    reportPdfUrl: (id: number) => `${API}/admin/tax/reports/${id}/pdf`,
    reportExcelUrl: (id: number) => `${API}/admin/tax/reports/${id}/excel`,
    downloadReportPdf: (id: number) => apiDownload(`/admin/tax/reports/${id}/pdf`, `tax-report-${id}.pdf`),
    downloadReportExcel: (id: number) => apiDownload(`/admin/tax/reports/${id}/excel`, `tax-report-${id}.xlsx`),
  },
};

export const amlApi = {
  listContacts: (params?: { search?: string }) =>
    apiFetch(`/admin/compliance/contacts${params?.search ? `?search=${encodeURIComponent(params.search)}` : ''}`),
  getContact: (id: number) => apiFetch(`/admin/compliance/contacts/${id}`),
  initiateKyc: (contactId: number, payload: { national_code: string; full_name: string; father_name?: string; birth_date?: string }) =>
    apiFetch(`/admin/compliance/contacts/${contactId}/kyc`, { method: 'POST', body: JSON.stringify(payload) }),
  uploadDocument: (kycId: number, type: string, file: File) => {
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    return apiFetch(`/admin/compliance/kyc/${kycId}/documents`, { method: 'POST', body: form });
  },
  downloadDocument: (kycId: number, docId: number) =>
    apiDownload(`/admin/compliance/kyc/${kycId}/documents/${docId}`, `kyc-doc-${docId}`),
  approveKyc: (kycId: number, notes?: string) =>
    apiFetch(`/admin/compliance/kyc/${kycId}/approve`, { method: 'POST', body: JSON.stringify({ notes }) }),
  rejectKyc: (kycId: number, reason: string) =>
    apiFetch(`/admin/compliance/kyc/${kycId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  listAlerts: (params?: { status?: string; severity?: string }) =>
    apiFetch(`/admin/compliance/alerts?${new URLSearchParams(params as any || {}).toString()}`),
  reviewAlert: (alertId: number, decision: string, notes?: string) =>
    apiFetch(`/admin/compliance/alerts/${alertId}/review`, { method: 'POST', body: JSON.stringify({ decision, notes }) }),
  listReports: (params?: { status?: string; type?: string }) =>
    apiFetch(`/admin/compliance/reports?${new URLSearchParams(params as any || {}).toString()}`),
  createReport: (payload: any) =>
    apiFetch('/admin/compliance/reports', { method: 'POST', body: JSON.stringify(payload) }),
  approveReport: (id: number) =>
    apiFetch(`/admin/compliance/reports/${id}/approve`, { method: 'POST' }),
  fileReport: (id: number, authorityReference: string) =>
    apiFetch(`/admin/compliance/reports/${id}/file`, { method: 'POST', body: JSON.stringify({ authority_reference: authorityReference }) }),
  dismissReport: (id: number, reason: string) =>
    apiFetch(`/admin/compliance/reports/${id}/dismiss`, { method: 'POST', body: JSON.stringify({ reason }) }),
  downloadReportPdf: (id: number) =>
    apiDownload(`/admin/compliance/reports/${id}/pdf`, `compliance-report-${id}.pdf`),
  listWatchlist: () => apiFetch('/admin/compliance/watchlist'),
  addWatchlist: (payload: { national_code?: string; full_name: string; reason?: string }) =>
    apiFetch('/admin/compliance/watchlist', { method: 'POST', body: JSON.stringify(payload) }),
  deleteWatchlist: (id: number) =>
    apiFetch(`/admin/compliance/watchlist/${id}`, { method: 'DELETE' }),
  getSettings: () => apiFetch('/admin/compliance/settings'),
  updateSettings: (payload: any) =>
    apiFetch('/admin/compliance/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  dashboard: () => apiFetch('/admin/compliance/dashboard'),
  check: (contactId: number, amount: number) =>
    apiFetch(`/admin/compliance/check?contact_id=${contactId}&amount=${amount}`),
};
