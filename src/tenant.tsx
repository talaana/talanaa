import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TenantConfig } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
 * Priority:
 * 1. Query param: ?tenant=slug (dev mode)
 * 2. Subdomain: slug.talaana.ir, slug.localhost, slug.talana.app
 * 3. Path prefix: /s/store-slug (legacy)
 * Returns { slug?, domain? } or null if no tenant detected.
 */
export function detectTenantFromURL(): { slug?: string; domain?: string } | null {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);

  // 1. Query param (dev mode — localhost or arbitrary)
  const tenantParam = url.searchParams.get('tenant');
  if (tenantParam) {
    return { slug: tenantParam };
  }

  // 2. Subdomain detection
  const hostname = url.hostname;
  const prodDomain = 'talaana.ir';
  const devDomains = 'localhost|talana\\.app|talana-sage\\.vercel\\.app';
  const subdomainPattern = new RegExp(`^([^.]+)\\.(${devDomains}|${prodDomain.replace('.', '\\.')})$`);

  const subdomainMatch = hostname.match(subdomainPattern);
  if (subdomainMatch && subdomainMatch[1] !== 'www' && subdomainMatch[1] !== 'app') {
    return { domain: hostname };
  }

  // 3. Path prefix (e.g., /s/zarrin)
  const pathMatch = url.pathname.match(/^\/s\/([^/]+)/);
  if (pathMatch) {
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
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(false);
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
