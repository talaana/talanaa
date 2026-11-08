import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TenantConfig } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const TENANT_BASE_DOMAIN = normalizeDomain(import.meta.env.VITE_BASE_DOMAIN || 'talaana.ir');
const LEGACY_BASE_DOMAINS = ['localhost', 'talana.app', 'talana-sage.vercel.app'];
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin', 'mail']);

type TenantIdentifier = { slug?: string; domain?: string };

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/\.+$/, '');
}

function isTenantSlug(slug: string): boolean {
  // Keep legacy underscore slugs readable, but never let a slug inject a host, path, or query.
  return /^[a-z0-9_-]{1,63}$/.test(slug) && !RESERVED_SUBDOMAINS.has(slug);
}

function isLocalDevelopmentHost(hostname: string): boolean {
  return hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname === '127.0.0.1'
    || hostname === '[::1]'
    || hostname === '::1';
}

/** Build a tenant-owned origin; production links never carry a tenant query parameter. */
export function getTenantUrl(slug: string, hash = '', currentUrl?: string): string {
  if (!isTenantSlug(slug)) {
    throw new Error('شناسه فروشگاه برای آدرس ساب‌دامنه معتبر نیست');
  }

  const current = new URL(currentUrl ?? (typeof window !== 'undefined'
    ? window.location.href
    : `https://${TENANT_BASE_DOMAIN}`));
  const isLocal = isLocalDevelopmentHost(current.hostname);
  const baseDomain = isLocal ? `localhost${current.port ? `:${current.port}` : ''}` : TENANT_BASE_DOMAIN;
  const url = new URL(`${isLocal ? current.protocol : 'https:'}//${slug}.${baseDomain}`);
  url.hash = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
  return url.href;
}

interface TenantContextValue {
  tenant: TenantConfig | null;
  loading: boolean;
  error: string | null;
  /** Resolve tenant by slug or domain. Call this when tenant context changes. */
  resolveTenant: (identifier: { slug?: string; domain?: string }) => Promise<void>;
  /** Clear tenant context (e.g., go to main platform) */
  clearTenant: () => void;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  loading: false,
  error: null,
  resolveTenant: async () => {},
  clearTenant: () => {},
});

export function useTenant() {
  return useContext(TenantContext);
}

/**
 * Detect tenant from the current URL.
 * Subdomains own the tenant context in production. Query/path identifiers remain
 * readable only for local development and legacy links.
 */
export function detectTenantFromURL(currentUrl?: string): TenantIdentifier | null {
  if (typeof window === 'undefined' && !currentUrl) return null;

  const url = new URL(currentUrl ?? window.location.href);
  const hostname = normalizeDomain(url.hostname);

  // app.talaana.ir is the marketplace tenant, not a reserved platform subdomain.
  if (hostname === `app.${TENANT_BASE_DOMAIN}`) {
    return { slug: 'talana' };
  }

  for (const baseDomain of [TENANT_BASE_DOMAIN, ...LEGACY_BASE_DOMAINS]) {
    const suffix = `.${baseDomain}`;
    if (!hostname.endsWith(suffix)) continue;

    const slug = hostname.slice(0, -suffix.length);
    if (isTenantSlug(slug)) return { slug };
  }

  const tenantParam = url.searchParams.get('tenant');
  if (isLocalDevelopmentHost(hostname) && tenantParam && isTenantSlug(tenantParam)) {
    return { slug: tenantParam };
  }

  const pathMatch = url.pathname.match(/^\/s\/([^/]+)/);
  if (pathMatch && isTenantSlug(pathMatch[1])) {
    return { slug: pathMatch[1] };
  }

  return null;
}

/**
 * Get the current tenant ID — to be used as X-Tenant header in API calls.
 * Stores in a module-level variable for synchronous access.
 */
let _currentTenantId: number | null = null;
let _currentTenantType: string | null = null;

export function getCurrentTenantId(): number | null {
  return _currentTenantId;
}

export function getCurrentTenantType(): string | null {
  return _currentTenantType;
}

export function setCurrentTenantId(id: number | null, type?: string | null) {
  _currentTenantId = id;
  _currentTenantType = type || null;
}

// Async fetch tenant by slug or domain
async function fetchTenant(slug?: string, domain?: string): Promise<TenantConfig | null> {
  const params = new URLSearchParams();
  if (domain) params.set('domain', domain);
  if (slug) params.set('slug', slug);

  const res = await fetch(`${API_BASE}/tenants/resolve?${params.toString()}`);
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.found) return null;

  return data.tenant as TenantConfig;
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  // Start loading when a tenant identifier is present, so consumers (e.g. the
  // admin guard) never evaluate against "no tenant" before resolution begins.
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(() => !!detectTenantFromURL());
  const [error, setError] = useState<string | null>(null);

  const resolveTenant = useCallback(async (identifier: { slug?: string; domain?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const t = await fetchTenant(identifier.slug, identifier.domain);
      if (t) {
        setTenant(t);
        setCurrentTenantId(t.id, t.type);
      } else {
        setError('فروشگاه مورد نظر یافت نشد');
      }
    } catch (e: any) {
      setError(e.message || 'خطا در تشخیص فروشگاه');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearTenant = useCallback(() => {
    setTenant(null);
    setCurrentTenantId(null);
    setError(null);
  }, []);

  // Auto-detect tenant on mount
  useEffect(() => {
    const detected = detectTenantFromURL();
    if (detected) {
      resolveTenant(detected);
    } else {
      setLoading(false);
    }
  }, [resolveTenant]);

  return (
    <TenantContext.Provider value={{ tenant, loading, error, resolveTenant, clearTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export default TenantContext;
