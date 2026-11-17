import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TenantConfig } from './types';
import {
  normalizeDomain, isTenantSlug, isLocalDevelopmentHost, isReservedHost,
  MARKETPLACE_DOMAIN as TENANT_BASE_DOMAIN, MARKETPLACE_SLUG, LEGACY_BASE_DOMAINS,
} from './host';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

type TenantIdentifier = { slug?: string; domain?: string };

/**
 * Build a tenant's public origin.
 * Production priority: the tenant's own domain, then app.<base> for the marketplace,
 * then <slug>.<base>. Local development always stays on *.localhost.
 */
export function getTenantUrl(
  slug: string,
  hash = '',
  currentUrl?: string,
  domain?: string | null,
): string {
  if (!isTenantSlug(slug)) {
    throw new Error('شناسه فروشگاه برای آدرس ساب‌دامنه معتبر نیست');
  }

  const current = new URL(currentUrl ?? (typeof window !== 'undefined'
    ? window.location.href
    : `https://${TENANT_BASE_DOMAIN}`));
  const isLocal = isLocalDevelopmentHost(current.hostname);

  const custom = domain ? normalizeDomain(domain) : '';
  const ownsOwnDomain = !!custom
    && custom !== TENANT_BASE_DOMAIN
    && custom !== `www.${TENANT_BASE_DOMAIN}`
    && !isReservedHost(custom);

  let host: string;
  if (isLocal) {
    host = `${slug}.localhost${current.port ? `:${current.port}` : ''}`;
  } else if (ownsOwnDomain) {
    host = custom;
  } else if (slug === MARKETPLACE_SLUG) {
    host = `app.${TENANT_BASE_DOMAIN}`;
  } else {
    host = `${slug}.${TENANT_BASE_DOMAIN}`;
  }

  const url = new URL(`${isLocal ? current.protocol : 'https:'}//${host}`);
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
 * Detect the tenant that owns the current URL.
 * The platform apex is the marketing landing and deliberately owns no tenant, so it
 * never resolves; app.<base> is the marketplace app and <slug>.<base> is a store app.
 * Any other host is a tenant's own domain, resolved by the backend.
 */
export function detectTenantFromURL(currentUrl?: string): TenantIdentifier | null {
  if (typeof window === 'undefined' && !currentUrl) return null;

  const url = new URL(currentUrl ?? window.location.href);
  const hostname = normalizeDomain(url.hostname);

  if (hostname === `app.${TENANT_BASE_DOMAIN}`) {
    return { slug: MARKETPLACE_SLUG };
  }
  if (hostname === TENANT_BASE_DOMAIN || hostname === `www.${TENANT_BASE_DOMAIN}`) {
    return null;
  }

  for (const baseDomain of [TENANT_BASE_DOMAIN, ...LEGACY_BASE_DOMAINS]) {
    const suffix = `.${baseDomain}`;
    if (!hostname.endsWith(suffix)) continue;

    const slug = hostname.slice(0, -suffix.length);
    return isTenantSlug(slug) ? { slug } : null;
  }

  const tenantParam = url.searchParams.get('tenant');
  if (isLocalDevelopmentHost(hostname) && tenantParam && isTenantSlug(tenantParam)) {
    return { slug: tenantParam };
  }

  const pathMatch = url.pathname.match(/^\/s\/([^/]+)/);
  if (pathMatch && isTenantSlug(pathMatch[1])) {
    return { slug: pathMatch[1] };
  }

  const customHost = hostname.replace(/^app\./, '');
  if (isLocalDevelopmentHost(customHost) || isReservedHost(customHost)) return null;
  if (customHost === TENANT_BASE_DOMAIN || customHost === `www.${TENANT_BASE_DOMAIN}`) return null;
  if (customHost.includes('.')) return { domain: customHost };

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
