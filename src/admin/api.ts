import { getTenantId } from '../api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

let _token = '';
let _tenantOverride: number | null = null;

export function setAdminToken(t: string) { _token = t; }
export function getAdminToken() { return _token; }
export function setAdminTenant(id: number | null) { _tenantOverride = id; }

async function apiFetch(path: string, opts: RequestInit = {}) {
  const tk = _token || localStorage.getItem('talana_token') || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tk}`,
    ...(opts.headers as any || {}),
  };
  const tid = _tenantOverride ?? getTenantId();
  if (tid) headers['X-Tenant'] = String(tid);
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) { const e = await res.json().catch(()=>({message:'خطا'})); throw new Error(e.message); }
  return res.json();
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
};
