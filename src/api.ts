const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// ========== COOKIE HELPERS ==========

function setCookie(name: string, value: string, days: number = 30) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

// ========== TOKEN STORAGE (cookie-based, keyed by tenant slug + type) ==========

let authToken: string | null = null;
let tenantId: number | null = null;
let tenantSlug: string = '';
let tenantType: string = '';

function tokenCookieName(): string {
  if (!tenantSlug) return 'talana_token';
  return tenantType === 'supplier' ? `talana_supplier_token_${tenantSlug}` : `talana_token_${tenantSlug}`;
}

// Init from cookie on module load (try fallback key first, tenant context set later)
authToken = getCookie('talana_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    setCookie(tokenCookieName(), token, 30);
  } else {
    removeCookie(tokenCookieName());
    removeCookie('talana_token');
    removeCookie('talana_supplier_token');
  }
}

export function getToken(): string | null {
  return authToken;
}

export function setTenantContext(id: number | null, slug: string = '', type: string = '') {
  // Clear old tenant cookies before switching
  if (slug && tenantSlug && slug !== tenantSlug) {
    const oldToken = tenantType === 'supplier' ? `talana_supplier_token_${tenantSlug}` : `talana_token_${tenantSlug}`;
    const oldAuth = tenantType === 'supplier' ? `talana_supplier_auth_${tenantSlug}` : `talana_auth_${tenantSlug}`;
    removeCookie(oldToken);
    removeCookie(oldAuth);
  }
  tenantId = id;
  tenantSlug = slug;
  tenantType = type;
  // Reload token and auth context from cookies for this tenant
  if (slug) {
    const tk = getCookie(tokenCookieName());
    authToken = tk || null;
    authContext = null; // force re-read from cookie
    getAuthContext();    // reload
  } else {
    authToken = null;
    authContext = null;
  }
}

export function getTenantId(): number | null {
  return tenantId;
}

export function getTenantSlug(): string {
  return tenantSlug;
}

// ========== AUTH CONTEXT (role, permissions — cached in cookie per tenant) ==========

export interface AuthContext {
  type: string;
  role: string | null;
  permissions: string[];
  is_superadmin: boolean;
  roles: string[];
}

let authContext: AuthContext | null = null;

function authCookieName(): string {
  if (!tenantSlug) return 'talana_auth';
  return tenantType === 'supplier' ? `talana_supplier_auth_${tenantSlug}` : `talana_auth_${tenantSlug}`;
}

export function setAuthContext(ctx: AuthContext | null) {
  authContext = ctx;
  if (ctx) {
    setCookie(authCookieName(), JSON.stringify(ctx), 30);
  } else {
    removeCookie(authCookieName());
    removeCookie('talana_auth');
    removeCookie('talana_supplier_auth');
  }
}

export function getAuthContext(): AuthContext | null {
  if (authContext) return authContext;
  // Try loading from cookie (keyed by current tenant slug+type, then fallback)
  let raw = tenantSlug ? getCookie(authCookieName()) : null;
  if (!raw) raw = getCookie('talana_auth') || getCookie('talana_supplier_auth');
  if (raw) {
    try { authContext = JSON.parse(raw); } catch { authContext = null; }
  }
  return authContext;
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (tenantId) {
    headers['X-Tenant'] = String(tenantId);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'خطا در ارتباط با سرور');
  }

  return res.json();
}

// Auth
export const auth = {
  login: async (phone: string, password: string, tenantSlug?: string) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password, tenant_slug: tenantSlug || undefined }),
    });
    setToken(data.token);
    setAuthContext({
      type: data.type || 'user',
      role: data.role || null,
      permissions: data.permissions || [],
      is_superadmin: data.is_superadmin || false,
      roles: data.roles || [],
    });
    return data;
  },
  register: async (name: string, phone: string, password: string, referralCode?: string, tenantSlug?: string) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password, referral_code: referralCode, tenant_slug: tenantSlug || undefined }),
    });
    setToken(data.token);
    setAuthContext({
      type: data.type || 'user',
      role: data.role || null,
      permissions: data.permissions || [],
      is_superadmin: data.is_superadmin || false,
      roles: data.roles || [],
    });
    return data;
  },
  requestOtp: (phone: string) => apiFetch('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  }),
  verifyOtp: async (phone: string, code: string, tenantSlug?: string) => {
    const data = await apiFetch('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, tenant_slug: tenantSlug || undefined }),
    });
    setToken(data.token);
    setAuthContext({
      type: data.type || 'user',
      role: data.role || null,
      permissions: data.permissions || [],
      is_superadmin: data.is_superadmin || false,
      roles: data.roles || [],
    });
    return data;
  },
  logout: async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setToken(null);
    setAuthContext(null);
  },
  profile: () => apiFetch('/auth/profile'),
  updateProfile: (name: string) => apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  }),
  updatePassword: (currentPassword: string, newPassword: string) => apiFetch('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  }),
  permissions: () => apiFetch('/auth/permissions'),
};

// Contact auth (customers/suppliers/investors)
export const contactAuth = {
  login: async (phone: string, password: string, tenantSlug: string) => {
    const data = await apiFetch('/auth/contact/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password, tenant_slug: tenantSlug }),
    });
    setToken(data.token);
    setAuthContext({
      type: data.kind || 'contact',
      role: data.role || null,
      permissions: [],
      is_superadmin: false,
      roles: [data.role || 'customer'],
    });
    return data;
  },
  register: async (name: string, phone: string, password: string, type: string, tenantSlug: string) => {
    const data = await apiFetch('/auth/contact/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password, type, tenant_slug: tenantSlug }),
    });
    setToken(data.token);
    setAuthContext({
      type: data.kind || 'contact',
      role: data.role || null,
      permissions: [],
      is_superadmin: false,
      roles: [data.role || 'customer'],
    });
    return data;
  },
  requestOtp: (phone: string, tenantSlug: string) => apiFetch('/auth/contact/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone, tenant_slug: tenantSlug }),
  }),
  verifyOtp: async (phone: string, code: string, tenantSlug: string) => {
    const data = await apiFetch('/auth/contact/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, tenant_slug: tenantSlug }),
    });
    setToken(data.token);
    setAuthContext({
      type: data.kind || 'contact',
      role: data.role || null,
      permissions: [],
      is_superadmin: false,
      roles: [data.role || 'customer'],
    });
    return data;
  },
  logout: async () => {
    try { await apiFetch('/auth/contact/logout', { method: 'POST' }); } catch {}
    setToken(null);
    setAuthContext(null);
  },
  profile: () => apiFetch('/auth/contact/profile'),
  updatePassword: (currentPassword: string, newPassword: string) => apiFetch('/auth/contact/password', {
    method: 'PUT',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  }),
};

// Wallet
export const wallet = {
  get: () => apiFetch('/wallet'),
};

// Prices
export const prices = {
  current: () => apiFetch('/prices/current'),
  history: (metal: 'gold_18k' | 'silver_999', interval: string) =>
    apiFetch(`/prices/history?metal=${metal}&interval=${interval}`),
};

// Categories
export const categories = {
  list: () => apiFetch('/categories'),
};

// Products
export const products = {
  list: (params?: Record<string, string | boolean>) => {
    const qs = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
      });
    }
    return apiFetch(`/products?${qs.toString()}`);
  },
  show: (id: number) => apiFetch(`/products/${id}`),
};

// Sellers
export const sellers = {
  list: () => apiFetch('/sellers'),
  show: (id: number) => apiFetch(`/sellers/${id}`),
};

// Transactions
export const transactions = {
  list: (type?: string) => {
    const qs = type ? `?type=${type}` : '';
    return apiFetch(`/transactions${qs}`);
  },
  create: (data: {
    type: string;
    title: string;
    amount_toman: number;
    weight_grams?: number;
    metal: 'gold' | 'silver';
    details?: string;
    image?: string;
    product_id?: number;
  }) => apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Notifications
export const notifications = {
  list: () => apiFetch('/notifications'),
  markRead: (id: number) => apiFetch(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => apiFetch('/notifications/read-all', { method: 'PUT' }),
};

// Banners
export const banners = {
  list: () => apiFetch('/banners'),
};

// Bank Accounts
export const bankAccounts = {
  list: () => apiFetch('/bank-accounts'),
  create: (data: { card_number: string; bank_name: string; owner_name: string; sheba_number?: string; is_default?: boolean }) =>
    apiFetch('/bank-accounts', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: number) => apiFetch(`/bank-accounts/${id}`, { method: 'DELETE' }),
};

// Branches
export const branches = {
  list: () => apiFetch('/branches'),
};

// Services
export const loans = {
  calculate: (data: { collateral_grams: number; metal: string; duration_months?: number }) =>
    apiFetch('/loans/calculate', { method: 'POST', body: JSON.stringify(data) }),
  create: (data: { collateral_grams: number; metal: string; duration_months: number }) =>
    apiFetch('/loans', { method: 'POST', body: JSON.stringify(data) }),
  list: () => apiFetch('/loans'),
};

export const installments = {
  calculate: (data: { product_id: number; total_months: number; down_payment_percent?: number }) =>
    apiFetch('/installments/calculate', { method: 'POST', body: JSON.stringify(data) }),
  create: (data: { product_id: number; total_months: number; down_payment_percent?: number }) =>
    apiFetch('/installments', { method: 'POST', body: JSON.stringify(data) }),
  list: () => apiFetch('/installments'),
};

export const autoOrders = {
  create: (data: { metal: string; grams: number; max_spend_toman?: number; interval: string }) =>
    apiFetch('/auto-orders', { method: 'POST', body: JSON.stringify(data) }),
  list: () => apiFetch('/auto-orders'),
  toggle: (id: number) => apiFetch(`/auto-orders/${id}/toggle`, { method: 'PUT' }),
  remove: (id: number) => apiFetch(`/auto-orders/${id}`, { method: 'DELETE' }),
};

export const deliveryRequests = {
  create: (data: { metal: string; grams: number; recipient_name: string; address: string; phone: string; postal_code: string; insurance?: boolean }) =>
    apiFetch('/deliveries', { method: 'POST', body: JSON.stringify(data) }),
  list: () => apiFetch('/deliveries'),
};

export const giftCards = {
  create: (data: { recipient_name: string; recipient_phone: string; amount_toman: number; message?: string }) =>
    apiFetch('/gift-cards', { method: 'POST', body: JSON.stringify(data) }),
  list: () => apiFetch('/gift-cards'),
};
