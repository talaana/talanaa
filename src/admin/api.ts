import { getTenantId } from '../api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

let _token = '';

export function setAdminToken(t: string) { _token = t; }
export function getAdminToken() { return _token; }

async function apiFetch(path: string, opts: RequestInit = {}) {
  const tk = _token || localStorage.getItem('talana_token') || '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tk}`,
    ...(opts.headers as any || {}),
  };
  const tid = getTenantId();
  if (tid) headers['X-Tenant'] = String(tid);
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  if (!res.ok) { const e = await res.json().catch(()=>({message:'خطا'})); throw new Error(e.message); }
  return res.json();
}

export const admin = {
  permissions: (qs?: string) => apiFetch(`/admin/dashboard/permissions${qs||''}`),
  stats: () => apiFetch('/admin/dashboard/stats'),
  permissionGroups: () => apiFetch('/admin/permissions'),
  roles: { list: () => apiFetch('/admin/roles'), create: (d: any) => apiFetch('/admin/roles', {method:'POST',body:JSON.stringify(d)}), update: (id:number,d:any) => apiFetch(`/admin/roles/${id}`,{method:'PUT',body:JSON.stringify(d)}), remove: (id:number) => apiFetch(`/admin/roles/${id}`,{method:'DELETE'}) },
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
};
