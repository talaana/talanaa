const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

let authToken: string | null = localStorage.getItem('talana_token');
let tenantId: number | null = null;

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('talana_token', token);
  } else {
    localStorage.removeItem('talana_token');
  }
}

export function getToken(): string | null {
  return authToken;
}

export function setTenantId(id: number | null) {
  tenantId = id;
}

export function getTenantId(): number | null {
  return tenantId;
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
  login: async (phone: string, password: string) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    setToken(data.token);
    return data;
  },
  register: async (name: string, phone: string, password: string, referralCode?: string) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password, referral_code: referralCode }),
    });
    setToken(data.token);
    return data;
  },
  requestOtp: (phone: string) => apiFetch('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  }),
  verifyOtp: async (phone: string, code: string) => {
    const data = await apiFetch('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
    setToken(data.token);
    return data;
  },
  logout: async () => {
    await apiFetch('/auth/logout', { method: 'POST' });
    setToken(null);
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
