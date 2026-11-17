/**
 * Hostname → surface. The host decides what a visitor is allowed to see; the
 * account's role only decides whether they may use it. Pure by design: the only
 * DOM read is in currentHost(), so every rule is testable with a literal host.
 *
 * Surface vocabulary (spec §3):
 *   landing       — marketing page, no tenant context
 *   tenant-app    — one tenant's app (marketplace or store)
 *   platform-app  — ZarAsan's own tenant entry: the account's tenant is discovered after login
 *   superadmin    — ZarAsan's platform panel
 */

const normalizeDomain = (domain: string): string => domain.trim().toLowerCase().replace(/\.+$/, '');

const PLATFORM_DOMAIN = normalizeDomain(import.meta.env.VITE_PLATFORM_DOMAIN || 'zaraasan.ir');
/** The platform's own app subdomain. Talana's marketplace app keeps `app.<MARKETPLACE_DOMAIN>`. */
const SUPERADMIN_SUBDOMAIN = 'sa';
/** The Talana platform is the marketplace's tenant of old; the domain it is served from is the tenant base. */
const MARKETPLACE_DOMAIN = normalizeDomain(import.meta.env.VITE_BASE_DOMAIN || 'talaana.ir');
const MARKETPLACE_SLUG = 'talana';
const LEGACY_BASE_DOMAINS = ['localhost', 'talana.app', 'talana-sage.vercel.app'];
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin', 'mail']);

export type Surface = 'landing' | 'tenant-app' | 'platform-app' | 'superadmin';
export type Brand = 'zaraasan' | 'talana' | 'tenant';

export type HostInfo = {
  hostname: string;
  surface: Surface;
  brand: Brand;
  /** A platform-owned host: no tenant may be resolved from the hostname here. */
  platformHost: boolean;
  isLocal: boolean;
};

export const SUPERADMIN_ORIGIN = `https://${SUPERADMIN_SUBDOMAIN}.${PLATFORM_DOMAIN}`;
/** The tenant-entry surface, named so the platform-denied screen can link to it without string surgery. */
export const PLATFORM_APP_ORIGIN = `https://app.${PLATFORM_DOMAIN}`;
export { PLATFORM_DOMAIN, MARKETPLACE_DOMAIN, MARKETPLACE_SLUG, LEGACY_BASE_DOMAINS, RESERVED_SUBDOMAINS };
export { normalizeDomain };

export function isTenantSlug(slug: string): boolean {
  // Keep legacy underscore slugs readable, but never let a slug inject a host, path, or query.
  return /^[a-z0-9_-]{1,63}$/.test(slug) && !RESERVED_SUBDOMAINS.has(slug);
}

export function isLocalDevelopmentHost(hostname: string): boolean {
  return hostname === 'localhost'
    || hostname.endsWith('.localhost')
    || hostname === '127.0.0.1'
    || hostname === '[::1]'
    || hostname === '::1';
}

export function isReservedHost(hostname: string): boolean {
  const labels = hostname.split('.');
  return labels.length > 1 && RESERVED_SUBDOMAINS.has(labels[0]);
}

export function resolveHost(hostname: string, port = ''): HostInfo {
  const host = normalizeDomain(hostname);
  const isLocal = isLocalDevelopmentHost(host);
  const info = (surface: Surface, brand: Brand, platformHost = false): HostInfo =>
    ({ hostname: host, surface, brand, platformHost, isLocal });

  // The three platform hosts are named exactly, in this order (spec §5 rows 1-3).
  if (host === `${SUPERADMIN_SUBDOMAIN}.${PLATFORM_DOMAIN}`) return info('superadmin', 'zaraasan', true);
  if (host === `app.${PLATFORM_DOMAIN}`) return info('platform-app', 'zaraasan', true);
  if (host === PLATFORM_DOMAIN || host === `www.${PLATFORM_DOMAIN}`) return info('landing', 'zaraasan', true);

  // Development hosts always mirror the production shape on *.localhost (spec §5 row 7).
  if (isLocal) {
    const slug = host.endsWith('.localhost') ? host.slice(0, -'.localhost'.length) : '';
    if (slug === MARKETPLACE_SLUG) return info('tenant-app', 'talana');
    if (slug && isTenantSlug(slug)) return info('tenant-app', 'tenant');
    return info('landing', 'talana');
  }

  if (host === `app.${MARKETPLACE_DOMAIN}`) return info('tenant-app', 'talana');
  if (host === MARKETPLACE_DOMAIN || host === `www.${MARKETPLACE_DOMAIN}`) return info('landing', 'talana');

  for (const baseDomain of [MARKETPLACE_DOMAIN, ...LEGACY_BASE_DOMAINS]) {
    const suffix = `.${baseDomain}`;
    if (!host.endsWith(suffix)) continue;
    const slug = host.slice(0, -suffix.length);
    if (!isTenantSlug(slug)) return info('landing', 'tenant');
    return slug === MARKETPLACE_SLUG ? info('tenant-app', 'talana') : info('tenant-app', 'tenant');
  }

  // Any other hostname is a tenant's own domain. `app.` is stripped so a custom-domain
  // tenant keeps today's shape until the per-tenant landing slice gives it a surface of its own.
  const customHost = host.replace(/^app\./, '');
  if (isReservedHost(customHost)) return info('landing', 'tenant');
  if (customHost.includes('.')) return info('tenant-app', 'tenant');
  return info('landing', 'tenant');
}

export function currentHost(): HostInfo {
  if (typeof window === 'undefined') return resolveHost(MARKETPLACE_DOMAIN);
  return resolveHost(window.location.hostname, window.location.port);
}

/**
 * Superadmin chrome/data view is allowed on the superadmin host and, on purpose,
 * on every development host. Production tenants never get it off `sa.`.
 */
export function superadminAllowed(host: HostInfo): boolean {
  return host.surface === 'superadmin' || host.isLocal;
}

/** The conjunction the panel chrome needs: platform role *and* a host that shows it. */
export function superadminChromeAllowed(host: HostInfo, isSuperadmin: boolean): boolean {
  return isSuperadmin && superadminAllowed(host);
}

/** Where a `#/superadmin/*` hash belongs from this host, or null when it belongs here. */
export function superadminRedirectTarget(host: HostInfo, hash: string): string | null {
  if (!hash.startsWith('#/superadmin')) return null;
  if (superadminAllowed(host)) return null;
  // The '/' is load-bearing: assignment to window.location.href normalizes
  // 'https://host#x' to 'https://host/#x', and the spec asserts href-shaped strings.
  return `${SUPERADMIN_ORIGIN}/${hash}`;
}

/** Where a signed-in user lands after login, given who they are and where they are. */
export function adminHomeHash(host: HostInfo, isSuperadmin: boolean): string {
  return isSuperadmin && superadminAllowed(host) ? '#/superadmin/dashboard' : '#/tenant/dashboard';
}

/**
 * A signed-in account with no platform role must not sit in the platform panel.
 * No token argument: the only caller is `AdminPanel`, which is behind both
 * `App.tsx`'s logged-out branch and its own `if (!token)` guard, so by the time
 * it renders there is always a token. An anonymous visitor to
 * `sa.zaraasan.ir/#/superadmin/...` therefore gets the login form, not this screen.
 */
export function showsPlatformAccessDenied(host: HostInfo, isSuperadmin: boolean): boolean {
  return host.surface === 'superadmin' && !isSuperadmin;
}

/**
 * The platform's own panel hosts are entry points, not storefronts: with no
 * hash there is nothing to render, so they go to the sign-in screen. The
 * marketplace landing and the platform landing keep today's empty-hash page.
 */
export function platformEntryHash(host: HostInfo, hash: string): string | null {
  return host.platformHost && host.surface !== 'landing' && hash === '' ? '#/login' : null;
}
