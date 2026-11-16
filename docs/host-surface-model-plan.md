# Host / Surface Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the hostname — not the account's role — decide which surface (landing / tenant app / platform app / superadmin panel) a visitor gets, and light up `app.zaraasan.ir` and `sa.zaraasan.ir` as the two platform surfaces.

**Architecture:** One SPA bundle keeps serving every Talana host. A new pure module `src/host.ts` owns the vocabulary (surface, brand) and interprets `hostname`; `src/tenant.tsx` keeps building URLs, `src/App.tsx` and `src/admin/AdminPanel.tsx` become thin adapters that ask `host.ts` before rendering or navigating. nginx gets four exact `server_name` blocks pointing at the same `dist`, so the `*.zaraasan.ir` 301 keeps swallowing every other name.

**Tech Stack:** React 19 + Vite (TypeScript, no unit runner in this repo — pure logic is tested through Playwright by importing the module with `page.evaluate`), Playwright (`@playwright/test`, dev server on `127.0.0.1:3017`), nginx on the Parspack VPS, `tsc --noEmit` as lint.

**Spec:** `docs/host-surface-model.md` (same directory — read it first; every rule below cites its sections).

**Worktree / branch:** `D:/talana/talana-frontend-hostmodel`, branch `feat/host-surface-model`, cut from `a249bea` (the bundle production serves today). `node_modules` is a junction to `D:/talana/talana-frontend/node_modules`. The deploy repo work happens in `D:/talana/deploy` (branch `feat/agentic-tenancy-phase2`).

## Global Constraints

- UI copy is Persian; code comments are English. Every Persian string this plan adds is written out below — do not invent new ones.
- Never run `vite build` on the server (`root@171.22.25.200`): it OOMs the 3.8 GiB box. Build on the laptop, upload `dist/`.
- Never write to the production database in this plan. Read-only queries only. Never touch local MySQL 3306 or `C:\laragon\data\mysql-8`.
- nginx: back up every touched file, `nginx -t` must be green before reload, after reload wait for old workers to drain and decide the answer from the **access log containing `$host`**, never from a response alone.
- Exact `server_name` beats the wildcard; do not reorder or delete the existing `*.zaraasan.ir` 301 blocks, and do not touch `000-catchall` or any `talana*` vhost.
- Local development hosts (`localhost`, `*.localhost`, `127.0.0.1`) always allow the superadmin surface. The host gate is a production rule only — otherwise the owner's dev workflow breaks and the e2e suite (which runs on `127.0.0.1:3017`) cannot run at all.
- `users.tenant_id` / `permissions.tenant` behaviour, the `/api/auth/*` payloads, and `RESERVED_SUBDOMAINS` contents are production contracts. No migration, no new tenant row, no new endpoint, no change to `tenants.type`.
- Run Playwright with `--workers=1`: `playwright.config.ts` sets `fullyParallel: true` and `retries: 0`, and that combination has a pre-existing flake in `e2e/tenant-routing.spec.ts` (reproduced on unmodified HEAD on 2026-11-16). Never attribute that flake to this work.
- Line numbers below are as of `1bd6827`. Cite constructs when reviewing; they drift.
- Merging to `main` and promoting the release are the owner's decisions. Pushing branches is pre-authorized.

**File structure (what each file is responsible for after this plan):**

| File | Responsibility |
|---|---|
| `src/host.ts` (new) | Shared hostname vocabulary (`normalizeDomain`, `isTenantSlug`, `isLocalDevelopmentHost`, `isReservedHost`, base/platform domains) + interpretation: `resolveHost`, the superadmin gate decisions. No DOM, no fetch. |
| `src/tenant.tsx` | Building tenant URLs (`getTenantUrl`), tenant detection and `TenantProvider`. Imports the vocabulary from `host.ts`; no longer defines it. |
| `src/App.tsx` | Landing vs admin classification, login destination, the host-level redirect off foreign superadmin hashes. |
| `src/admin/AdminPanel.tsx` | Panel chrome (nav, hash prefix, sidebar voice) — superadmin chrome only where the host allows it — plus the two honest states: the access denial and the tenant-less notice. |
| `e2e/host-surface.spec.ts` (new) | The host contract table and the gate decision table, run against the pure module. |
| `e2e/tenant-routing.spec.ts` | The existing URL/entry/landing tests, with the platform-host rows added. |
| `D:/talana/deploy/nginx/zaraasan-platform.conf` (new) | The four exact-name vhosts for the platform surfaces. |
| `D:/talana/deploy/nginx/zaraasan.conf` | Reconciled with the live file; wildcard 301 unchanged. |
| `D:/talana/deploy/README.md` | Stop documenting a server-side `npm run build` and add the new vhosts to the file list. |

---

### Task 1: `src/host.ts` — the vocabulary and the gate, pure

**Files:**
- Create: `src/host.ts`
- Create: `e2e/host-surface.spec.ts`
- Modify: `src/tenant.tsx` (delete the helpers it now imports — nothing else changes, so behaviour is identical in this task)

**Interfaces:**
- Produces: `type Surface`, `type Brand`, `type HostInfo`, `resolveHost(hostname: string, port?: string): HostInfo`, `currentHost(): HostInfo`, `superadminAllowed(host: HostInfo): boolean`, `superadminChromeAllowed(host: HostInfo, isSuperadmin: boolean): boolean`, `superadminRedirectTarget(host: HostInfo, hash: string): string | null`, `adminHomeHash(host: HostInfo, isSuperadmin: boolean): string`, `showsPlatformAccessDenied(host: HostInfo, isSuperadmin: boolean): boolean`, `platformEntryHash(host: HostInfo, hash: string): string | null`, `SUPERADMIN_ORIGIN: string`, `PLATFORM_APP_ORIGIN: string`, `PLATFORM_DOMAIN`, `MARKETPLACE_DOMAIN`, `MARKETPLACE_SLUG`, `normalizeDomain`, `isTenantSlug`, `isLocalDevelopmentHost`, `isReservedHost`, `LEGACY_BASE_DOMAINS`, `RESERVED_SUBDOMAINS`.
- Consumes: nothing from later tasks.

- [ ] **Step 1: Write the failing tests**

Create `e2e/host-surface.spec.ts`. It rides on the same request-blocking fixture as `tenant-routing.spec.ts`, so copy that fixture's shape (it aborts every non-local request and 500s un-fixture'd API calls) by importing it from a shared file is **not** done here — instead the two tests below never touch the API because they only import a module and evaluate pure functions:

```ts
import { test, expect } from '@playwright/test';

// surface/brand/platformHost joined with '/' so one row reads as one string.
const row = (info: any) => `${info.surface}/${info.brand}/${info.platformHost}`;

test('the host contract table resolves one surface per hostname', async ({ page, baseURL }) => {
  await page.goto(baseURL!);
  const hosts = await page.evaluate(async () => {
    const host = await import('/src/host.ts');
    const r = (hostname: string, port = '') => row(host.resolveHost(hostname, port));
    return {
      superadminHost: r('sa.zaraasan.ir'),
      platformAppHost: r('app.zaraasan.ir'),
      platformApex: r('zaraasan.ir'),
      platformWww: r('www.zaraasan.ir'),
      marketplaceApp: r('app.talaana.ir'),
      marketplaceLanding: r('talaana.ir'),
      marketplaceWww: r('www.talaana.ir'),
      storeHost: r('pars-gold.talaana.ir'),
      reservedHost: r('api.talaana.ir'),
      nestedHost: r('nested.pars-gold.talaana.ir'),
      legacyDomainHost: r('pars-gold.talana.app'),
      customApex: r('mina.gold'),
      customApp: r('app.mina.gold'),
      localStore: r('pars-gold.localhost', '3017'),
      localBare: r('127.0.0.1', '3017'),
    };
  });

  expect(hosts).toEqual({
    superadminHost: 'superadmin/zaraasan/true',
    platformAppHost: 'platform-app/zaraasan/true',
    platformApex: 'landing/zaraasan/true',
    platformWww: 'landing/zaraasan/true',
    marketplaceApp: 'tenant-app/talana/false',
    marketplaceLanding: 'landing/talana/false',
    marketplaceWww: 'landing/talana/false',
    storeHost: 'tenant-app/tenant/false',
    reservedHost: 'landing/tenant/false',
    nestedHost: 'landing/tenant/false',
    legacyDomainHost: 'tenant-app/tenant/false',
    customApex: 'tenant-app/tenant/false',
    customApp: 'tenant-app/tenant/false',
    localStore: 'tenant-app/tenant/false',
    localBare: 'landing/talana/false',
  });
});

test('the superadmin gate is a host rule, with a development escape hatch', async ({ page, baseURL }) => {
  await page.goto(baseURL!);
  const gate = await page.evaluate(async () => {
    const host = await import('/src/host.ts');
    const redirect = (hostname: string, hash = '#/superadmin/tenants', port = '') =>
      host.superadminRedirectTarget(host.resolveHost(hostname, port), hash);
    const denied = (hostname: string, isSuperadmin: boolean) =>
      host.showsPlatformAccessDenied(host.resolveHost(hostname), isSuperadmin);
    const entry = (hostname: string, hash: string) =>
      host.platformEntryHash(host.resolveHost(hostname), hash);
    return {
      origin: host.SUPERADMIN_ORIGIN,
      platformAppOrigin: host.PLATFORM_APP_ORIGIN,
      redirectMarketplaceLanding: redirect('talaana.ir'),
      redirectMarketplaceApp: redirect('app.talaana.ir'),
      redirectStoreHost: redirect('pars-gold.talaana.ir'),
      redirectCustomDomain: redirect('mina.gold'),
      redirectPlatformApp: redirect('app.zaraasan.ir'),
      redirectSuperadminHost: redirect('sa.zaraasan.ir'),
      redirectKeepsSubRoute: redirect('talaana.ir', '#/superadmin/users'),
      redirectIgnoresTenantHash: redirect('talaana.ir', '#/tenant/dashboard'),
      redirectLocalDev: redirect('pars-gold.localhost', '#/superadmin/tenants', '3017'),
      homeOnPlatformApp: host.adminHomeHash(host.resolveHost('app.zaraasan.ir'), true),
      homeOnSuperadminHost: host.adminHomeHash(host.resolveHost('sa.zaraasan.ir'), true),
      homeOnStoreHost: host.adminHomeHash(host.resolveHost('pars-gold.talaana.ir'), true),
      homeForPlainTenantUser: host.adminHomeHash(host.resolveHost('sa.zaraasan.ir'), false),
      chromeForSuperadminOnPlatformApp: host.superadminChromeAllowed(host.resolveHost('app.zaraasan.ir'), true),
      chromeForSuperadminOnSuperadminHost: host.superadminChromeAllowed(host.resolveHost('sa.zaraasan.ir'), true),
      chromeForSuperadminOnLocalhost: host.superadminChromeAllowed(host.resolveHost('talana.localhost', '3017'), true),
      chromeForTenantUserOnSuperadminHost: host.superadminChromeAllowed(host.resolveHost('sa.zaraasan.ir'), false),
      deniedTenantUserOnPlatform: denied('sa.zaraasan.ir', false),
      deniedSuperadminOnPlatform: denied('sa.zaraasan.ir', true),
      deniedOnPlatformApp: denied('app.zaraasan.ir', false),
      deniedTenantUserOnMarketplaceLanding: denied('talaana.ir', false),
      deniedOnLocalhost: host.showsPlatformAccessDenied(host.resolveHost('talana.localhost', '3017'), false),
      entryPlatformApp: entry('app.zaraasan.ir', ''),
      entrySuperadminHost: entry('sa.zaraasan.ir', ''),
      entryPlatformAppWithHash: entry('app.zaraasan.ir', '#/tenant/dashboard'),
      entryMarketplaceLanding: entry('talaana.ir', ''),
      entryStoreHost: entry('pars-gold.talaana.ir', ''),
      entryPlatformLanding: entry('zaraasan.ir', ''),
    };
  });

  expect(gate).toEqual({
    origin: 'https://sa.zaraasan.ir',
    platformAppOrigin: 'https://app.zaraasan.ir',
    redirectMarketplaceLanding: 'https://sa.zaraasan.ir/#/superadmin/tenants',
    redirectMarketplaceApp: 'https://sa.zaraasan.ir/#/superadmin/tenants',
    redirectStoreHost: 'https://sa.zaraasan.ir/#/superadmin/tenants',
    redirectCustomDomain: 'https://sa.zaraasan.ir/#/superadmin/tenants',
    redirectPlatformApp: 'https://sa.zaraasan.ir/#/superadmin/tenants',
    redirectSuperadminHost: null,
    redirectKeepsSubRoute: 'https://sa.zaraasan.ir/#/superadmin/users',
    redirectIgnoresTenantHash: null,
    redirectLocalDev: null,
    homeOnPlatformApp: '#/tenant/dashboard',
    homeOnSuperadminHost: '#/superadmin/dashboard',
    homeOnStoreHost: '#/tenant/dashboard',
    homeForPlainTenantUser: '#/tenant/dashboard',
    chromeForSuperadminOnPlatformApp: false,
    chromeForSuperadminOnSuperadminHost: true,
    chromeForSuperadminOnLocalhost: true,
    chromeForTenantUserOnSuperadminHost: false,
    deniedTenantUserOnPlatform: true,
    deniedSuperadminOnPlatform: false,
    deniedOnPlatformApp: false,
    deniedTenantUserOnMarketplaceLanding: false,
    deniedOnLocalhost: false,
    entryPlatformApp: '#/login',
    entrySuperadminHost: '#/login',
    entryPlatformAppWithHash: null,
    entryMarketplaceLanding: null,
    entryStoreHost: null,
    entryPlatformLanding: null,
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx playwright test e2e/host-surface.spec.ts --workers=1`
Expected: 2 failed, both with the dynamic import rejecting — the message Vite/Playwright actually produce is `Failed to fetch dynamically imported module: http://127.0.0.1:3017/src/host.ts`. If instead you get a timeout or a webServer error, the dev server did not start; fix that before reading anything into the result.

- [ ] **Step 3: Write `src/host.ts`**

```ts
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
  return `${SUPERADMIN_ORIGIN}${hash}`;
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
```

- [ ] **Step 4: Move the vocabulary out of `src/tenant.tsx`**

In `src/tenant.tsx`, delete the now-duplicated private helpers and the domain constants — `normalizeDomain`, `isTenantSlug`, `isLocalDevelopmentHost`, `isReservedHost`, `TENANT_BASE_DOMAIN`, `LEGACY_BASE_DOMAINS`, `RESERVED_SUBDOMAINS`, `MARKETPLACE_SLUG` — and import them instead:

```ts
import {
  normalizeDomain, isTenantSlug, isLocalDevelopmentHost, isReservedHost,
  MARKETPLACE_DOMAIN as TENANT_BASE_DOMAIN, MARKETPLACE_SLUG, LEGACY_BASE_DOMAINS,
  resolveHost,
} from './host';
```

`TenantIdentifier`, `getTenantUrl`, `detectTenantFromURL` and the provider keep their current bodies in this task. Nothing that renders changes.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test e2e/host-surface.spec.ts e2e/tenant-routing.spec.ts --workers=1`
Expected: 6 passed (2 new + the 4 tests already in `tenant-routing.spec.ts`). Also run `npm run lint` (it is `tsc --noEmit`) — expected: no output, exit 0.

- [ ] **Step 6: Mutation-test the new rules**

Break each rule once, run `npx playwright test e2e/host-surface.spec.ts --workers=1`, confirm the **named** assertion goes red, then restore with `git checkout -- src/host.ts`. Record which row failed in the commit message body:

| Mutation | Expected red row |
|---|---|
| swap the `sa.` and `app.` platform checks | `superadminHost` / `platformAppHost` |
| delete the `www.${PLATFORM_DOMAIN}` comparison | `platformWww` |
| make `superadminAllowed` return `true` unconditionally | `redirectMarketplaceLanding`, `chromeForSuperadminOnPlatformApp` |
| delete the `hash.startsWith('#/superadmin')` guard in `superadminRedirectTarget` | `redirectIgnoresTenantHash` |
| return `#/superadmin/dashboard` from `adminHomeHash` regardless of host | `homeOnPlatformApp`, `homeOnStoreHost` |
| drop `|| host.isLocal` from `superadminAllowed` | `redirectLocalDev`, `chromeForSuperadminOnLocalhost` |
| drop `isSuperadmin &&` from `superadminChromeAllowed` | `chromeForTenantUserOnSuperadminHost` |
| remove the `PLATFORM_APP_ORIGIN` name and hard-code the denial link | `platformAppOrigin` |
| drop the `host.surface === 'superadmin'` test from `showsPlatformAccessDenied` | `deniedTenantUserOnMarketplaceLanding`, `deniedOnPlatformApp`, `deniedOnLocalhost` |
| drop the `hash === ''` test from `platformEntryHash` | `entryPlatformAppWithHash` |
| drop the `host.surface !== 'landing'` test from `platformEntryHash` | `entryPlatformLanding` |
| drop the `host.platformHost` test from `platformEntryHash` | `entryStoreHost` |

- [ ] **Step 7: Commit**

```bash
git add src/host.ts src/tenant.tsx e2e/host-surface.spec.ts
git commit -m "feat(host): resolve surface from the hostname in one pure module

hostname and role were both being used as if either alone decided what to
render; host.ts now owns interpretation so the wiring tasks can only ask it.
Local development hosts keep the superadmin surface on purpose."
```

---

### Task 2: Stop the platform hosts leaking a tenant resolution

**Files:**
- Modify: `src/tenant.tsx` (`detectTenantFromURL`)
- Test: `e2e/tenant-routing.spec.ts` (the URL-contract test's evaluate block + its `toEqual`)

**Interfaces:**
- Consumes: `resolveHost(host: HostInfo)` → `host.platformHost` from Task 1.
- Produces: `detectTenantFromURL` returns `null` for `sa.zaraasan.ir`, `app.zaraasan.ir`, `zaraasan.ir`, `www.zaraasan.ir` — which `TenantProvider`'s `useState(() => !!detectTenantFromURL())` and every resolve call depend on to avoid `GET /api/tenants/resolve?domain=sa.zaraasan.ir` (a guaranteed 404 → «فروشگاه مورد نظر یافت نشد»).

- [ ] **Step 1: Write the failing test**

In `e2e/tenant-routing.spec.ts`, inside the first test's `page.evaluate` return object, add three rows after `nestedHost`:

```ts
      platformSuperadminHost: tenant.detectTenantFromURL('https://sa.zaraasan.ir/'),
      platformAppHost: tenant.detectTenantFromURL('https://app.zaraasan.ir/'),
      platformApexHost: tenant.detectTenantFromURL('https://zaraasan.ir/?tenant=pars-gold'),
```

and to the `expect(result).toEqual({...})` object:

```ts
    platformSuperadminHost: null,
    platformAppHost: null,
    platformApexHost: null,
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test e2e/tenant-routing.spec.ts --workers=1 -g "URL contracts"`
Expected: FAIL, and the diff must show `platformSuperadminHost: Received: {"domain": "sa.zaraasan.ir"}` (same for `platformAppHost`). `platformApexHost` already passes — that is the point: the apex rule exists, the two sub-hosts fall through to the custom-domain branch.

- [ ] **Step 3: Implement the early return**

At the top of `detectTenantFromURL`, right after `const hostname = normalizeDomain(url.hostname);`:

```ts
  // A platform host owns no tenant by name. Without this, `sa.` and `app.zaraasan.ir`
  // reach the custom-domain branch below and ask the backend to resolve a hostname
  // that is not any tenant's domain.
  if (resolveHost(hostname, url.port).platformHost) return null;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx playwright test e2e/tenant-routing.spec.ts e2e/host-surface.spec.ts --workers=1`
Expected: 6 passed. Every pre-existing assertion (`landingHost: null`, `marketplaceHost: {slug:'talana'}`, `customDomainHost: {domain:'mina.gold'}`, `localQuery: {slug:'pars-gold'}`, `invalidSlug: 'rejected'`) must still hold — a changed legacy value is a regression, not a fix.

- [ ] **Step 5: Mutation-test the guard**

Delete the `if (resolveHost(...).platformHost) return null;` line, run the same command, expect `platformSuperadminHost` and `platformAppHost` red with `{"domain": ...}`; restore.

- [ ] **Step 6: Commit**

```bash
git add src/tenant.tsx e2e/tenant-routing.spec.ts
git commit -m "fix(host): the platform hosts name no tenant, so they resolve nothing

sa.zaraasan.ir and app.zaraasan.ir were falling through to the custom-domain
branch and asking /api/tenants/resolve for a hostname no tenant owns."
```

---

### Task 3: Wire the gate into `App.tsx`

**Files:**
- Modify: `src/App.tsx` — the `showAdmin` initializer, the `loginRedirect` initializer, the `onHashChange` listener, `goToAdmin()`, the two post-login destination writes in the login render, and one new effect carrying the two host routing rules. No new screen here (Step 5 says why).
- Test: `tsc --noEmit` + the live anonymous probe in Task 7 (accepted limitation, stated below — do not invent a localhost test that cannot exercise a production host rule).

**Interfaces:**
- Consumes: `currentHost`, `superadminRedirectTarget`, `platformEntryHash`, `adminHomeHash`, `type HostInfo` from Task 1.
- Produces: no new export; the visible contract is spec §11 criteria 1–3. Task 4 relies on `showAdmin` already being host-aware, so by the time `AdminPanel` renders on `sa.` the decision is only about the role.

- [ ] **Step 1: Add the host to App's state**

Extend `App.tsx`'s existing import from `./tenant` with the host module, adding one import line beside it:

```tsx
import {
  currentHost, superadminRedirectTarget, platformEntryHash, adminHomeHash, type HostInfo,
} from './host';
```

Then at the top of `App()` (next to the other `useState` calls, before `showAdmin`), add:

```tsx
  const host = currentHost();
```

- [ ] **Step 2: Make the classifier refuse to mount the panel for a foreign superadmin hash**

`showAdmin` is initialised from the hash in three places that must stay in agreement — the `showAdmin` initializer, the `loginRedirect` initializer, and `onHashChange`. Replace each hash-prefix test with one shared helper, defined immediately above `export default function App()`:

```tsx
/**
 * `#/superadmin/*` renders the panel only where this host is allowed to show it.
 * Elsewhere the hash is not an admin route: it is a redirect, and mounting the
 * panel for one tick would fetch platform data before the browser leaves.
 */
function isAdminHash(host: HostInfo, hash = window.location.hash): boolean {
  if (superadminRedirectTarget(host, hash)) return false;
  return hash.startsWith('#/admin') || hash.startsWith('#/superadmin') || hash.startsWith('#/tenant');
}
```

Then:
- `showAdmin` initializer → `useState(() => isAdminHash(host))`
- `loginRedirect` initializer → `useState<'admin' | 'landing'>(() => isAdminHash(host) ? 'admin' : 'landing')`
- inside `onHashChange` → `const isAdminRoute = isAdminHash(host);` and keep the four `setShowAdmin` / `setShowLoginPage` / `setVerifyHash` / `setLoginRedirect` lines that follow it exactly as they are.

- [ ] **Step 3: Add the host routing effect**

Add one effect next to the existing `hashchange` effect. It carries the two host rules that have to fire on mount and on every later hash change: leaving a foreign superadmin hash, and giving the platform's panel hosts a destination when the URL has no hash at all.

```tsx
  useEffect(() => {
    const applyHostRouting = () => {
      const hash = window.location.hash;
      const target = superadminRedirectTarget(host, hash);
      if (target) { window.location.href = target; return; }
      const entry = platformEntryHash(host, hash);
      if (entry) window.location.hash = entry;
    };
    applyHostRouting();
    window.addEventListener('hashchange', applyHostRouting);
    return () => window.removeEventListener('hashchange', applyHostRouting);
  }, [host.hostname]);
```

Without the second rule, `app.zaraasan.ir/` and `sa.zaraasan.ir/` with no hash would render the marketplace storefront — `tenant` is null there, and `isMarketplace` in App is `!tenant || …`. The bare root of a panel host must not look like a shop.

- [ ] **Step 4: Login destinations follow the host**

Four places choose the post-login hash. `goToAdmin()` is the visible one, and the two OTP/password handlers in the nested login render write the same value straight after fetching permissions:

```tsx
    const goToAdmin = () => {
      window.location.hash = adminHomeHash(host, isSuperadmin);
    };
```

In the login render, the two lines that currently read `window.location.hash = perms.is_superadmin ? '#/superadmin/dashboard' : '#/tenant/dashboard';` become:

```tsx
                  window.location.hash = adminHomeHash(host, perms.is_superadmin);
```

`src/admin/AdminPanel.tsx`'s `exitImpersonation` line that writes `#/superadmin/dashboard` stays as it is — impersonation is only reachable where the host already allows the platform panel, so there the host check would be decorative.

Why these two matter and cannot be left to the routing effect: on `app.zaraasan.ir` a platform account logging in would otherwise be written to `#/superadmin/dashboard` and immediately shipped to `sa.zaraasan.ir` by the effect — a full extra page load after a login that already succeeded. `adminHomeHash` picks the right hash on the spot.

- [ ] **Step 5: The platform-denied screen is deliberately NOT here**

Do not add an access-denied branch to `App.tsx`. It has the wrong signal for it. App's `isSuperadmin` state is written from three places — the tenant effect's `if (tenant)` arm (which calls `getAuthContext()`), `loadUserData()`'s permissions result, and the two login handlers — and the tenant effect only takes that arm when a tenant resolved. On `app.zaraasan.ir` and `sa.zaraasan.ir` Task 2 makes the tenant null, so App's `isSuperadmin` is whatever a previous tenant context left behind, and a denial driven by it can lock out a real platform account. `AdminPanel` fetches `adminApi.permissions()` itself and has a `loading` state that has already settled by the time its content renders — Task 4 puts the screen there, where the role is fresh.

Two consequences to keep in mind while wiring, because they are the app's existing behaviour and this release does not change them:

- An anonymous visitor to `sa.zaraasan.ir/#/superadmin/tenants` has `showAdmin === true` (the host allows the hash) and no token, so the admin guard — the `if (showAdmin && !tenantSyncPending && !getToken())` block that clears `showAdmin`, sets `showLoginPage`, and `replaceState`s the hash to `#/login` — sends them to the login form on the following render. That is what makes acceptance criterion 3 provable without credentials.
- A visitor to `sa.zaraasan.ir` who *is* signed in passes that guard and reaches `<AdminPanel … />` at the next line with the token from whatever tenant context was last synced. `AdminPanel` then decides, on its own freshly fetched `is_superadmin`, whether to show the panel or the denial.

- [ ] **Step 6: Verify compile + no local regression**

Run: `npm run lint && npx playwright test e2e/host-surface.spec.ts e2e/tenant-routing.spec.ts --workers=1`
Expected: lint silent; 6 passed. Local dev keeps working because `host.isLocal` short-circuits the gate — if `e2e/tenant-routing.spec.ts`'s landing-entry tests go red here, the escape hatch was lost; fix that before anything else.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): the host decides whether a superadmin hash renders here

#/superadmin on a foreign host no longer mounts AdminPanel at all: the hash is
not classified as an admin route, and one effect leaves for sa.zaraasan.ir
keeping the sub-route. The same effect gives app. and sa. a destination when the
URL has no hash, so a panel host cannot render the marketplace storefront. Login
destinations ask the host instead of only the role, so a platform account on
app.zaraasan.ir is not shipped sideways one render later."
```

---

### Task 4: Tenant-surface chrome and the two honest states in `AdminPanel.tsx`

**Files:**
- Modify: `src/admin/AdminPanel.tsx`
- Test: `npm run lint` + the live probe in Task 7 (same accepted limitation as Task 3).

**Interfaces:**
- Consumes: `currentHost`, `superadminChromeAllowed`, `showsPlatformAccessDenied`, `SUPERADMIN_ORIGIN`, `PLATFORM_APP_ORIGIN` from Task 1; `showAdmin` already host-aware from Task 3.
- Produces: one derived value, `superadminView`, that every chrome decision in the panel reads. `can()` keeps reading the role. Three new visible states: the access denial for a non-platform account on `sa.` (spec §7 row 6), the platform-panel link on a non-platform host (spec §6.2), and the tenant-less notice on the platform-app surface (spec §7 row 5).

- [ ] **Step 1: Derive the view flag**

Add the import, then place the host and the flag **after the impersonation `useState` block** (the file declares `page`, `perms`, `isSuperadmin`, `tenant`, `loading`, `error`, three menu states, then the impersonation states — the flag has to read `impersonatedTenant`, and every hook must stay below the file's existing `if (!token)` guard):

```tsx
import {
  currentHost, superadminChromeAllowed, showsPlatformAccessDenied,
  SUPERADMIN_ORIGIN, PLATFORM_APP_ORIGIN,
} from '../host';
```

```tsx
  const host = currentHost();
  /**
   * Chrome, not permission. On a host that does not show the platform panel a
   * platform role behaves as a tenant admin; `can()` below still reads the role
   * because the API is the real boundary for data access.
   */
  const superadminView = superadminChromeAllowed(host, isSuperadmin) && !impersonatedTenant;
```

- [ ] **Step 2: Replace the chrome consumers**

Change exactly these, and nothing else:
- `navigateTo`: `const prefix = superadminView ? 'superadmin' : 'tenant';`
- `isMarketplaceAdmin`: `const isMarketplaceAdmin = !superadminView && tenant?.type === 'marketplace';`
- `const nav = superadminView ? superNav : tenantNav;`
- the five sidebar voice lines (`sidebarBg`, `sidebarBorder`, `navActive`, `navInactive`, `backBtnHover`) and the two ternaries that render «بازگشت به سایت» / «سوپر ادمین» / «منو مدیریت» and the shell background class → all read `superadminView`.
- the `{isSuperadmin ? (` block that chooses the superadmin header/aside, and `{!isSuperadmin && (` → `superadminView`.
- the four child props `<AdminRoles isSuperadmin=…>`, `<AdminUsers isSuperadmin=…>`, `<AdminInvoiceTemplates isSuperadmin=…>`, `<AdminAiSettings isSuperadmin=…>` → pass `superadminView`. `can={can}` stays as-is.

Leave untouched: `const can = (slug: string) => isSuperadmin || perms.includes(slug);`, `setIsSuperadmin(d.is_superadmin)`, `exitImpersonation`'s `#/superadmin/dashboard` write (impersonation is only reachable where the host allows it), and `handleImpersonate`.

- [ ] **Step 3: The platform-panel link (spec §6.2)**

A platform role sitting on a tenant surface must not be locked out of the platform — give one way out. In the sidebar's back-button block (the `div` with `{/* Back button */}` above it, whose label ternary was just switched to `superadminView`), add after the existing `button`:

```tsx
        {isSuperadmin && !superadminView && (
          <a href={`${SUPERADMIN_ORIGIN}/#/superadmin/dashboard`}
             className="block w-full px-4 py-2.5 rounded-xl text-sm font-bold text-amber-300 hover:bg-slate-800">
            پنل پلتفرم زرآسان
          </a>
        )}
```

`isSuperadmin && !superadminView` is deliberately the role-and-host conjunction: on `localhost` the flag is true so nothing new appears; on `app.zaraasan.ir` and on a store host a platform role sees exactly one extra link.

- [ ] **Step 4: The tenant-less notice (spec §7 row 5)**

On the platform-app surface the tenant comes from `permissions.tenant`, which is the legacy `users.tenant_id`. If it is absent (an account that exists only in `tenant_user`), the panel would otherwise render an empty shell. Add a third early return, immediately after the existing `if (error) return (...)` block — that block is the last of the two loading/error returns, so by this point `loadPermissions()` has settled and `tenant` is whatever it will be:

```tsx
  if (host.surface === 'platform-app' && !tenant) return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex items-center justify-center font-sans p-4">
      <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-slate-100 max-w-sm w-full">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 text-2xl">؟</div>
        <p className="text-sm font-black text-slate-800 mb-2">فروشگاهی برای این حساب پیدا نشد</p>
        <p className="text-xs text-slate-500 mb-5 leading-6">
          این حساب به فروشگاه متصل نیست. برای ادامه به مدیر پلتفرم اطلاع دهید تا حساب شما را به یک فروشگاه وصل کند.
        </p>
        <button onClick={onBack} className="bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-black">بازگشت به سایت</button>
      </div>
    </div>
  );
```

`host.surface === 'platform-app'` means the superadmin host is untouched (there, `tenant` being null is normal) and a store host keeps its current behaviour. Do not add a `!loading` guard here: the `if (loading) return` above already covers it, and a condition that can never be false is a trap for whoever reads this next.

- [ ] **Step 5: The access denial for a non-platform account on `sa.` (spec §7 row 6)**

Task 3 explains why this screen belongs here: `isSuperadmin` in this component comes from `adminApi.permissions()`, fetched on mount and already settled by the two returns above, so the flag is never stale. In `App.tsx` the same decision would read `isSuperadmin` from state that only refreshes inside the tenant effect's `if (tenant)` arm — on `sa.` and `app.zaraasan.ir` Task 2 leaves `tenant` null, so that value is whatever the last tenant context left behind, and a check there can deny a real platform account. Add a fourth early return, directly after the tenant-less notice, using the same button classes the loading/error screens already use:

```tsx
  if (showsPlatformAccessDenied(host, isSuperadmin)) return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex items-center justify-center font-sans p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl">!</div>
        <p className="text-sm font-black text-slate-800 mb-2">این نشانی فقط برای مدیران پلتفرم زرآسان است</p>
        <p className="text-xs text-slate-500 mb-6 leading-6">
          حساب شما به این پنل دسترسی ندارد. برای مدیریت فروشگاه خود وارد نشانی اپلیکیشن پلتفرم شوید.
        </p>
        <a href={`${PLATFORM_APP_ORIGIN}/#/login`} className="bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-black">
          ورود به فروشگاه من
        </a>
      </div>
    </div>
  );
```

The two surfaces cannot both answer: `surface === 'superadmin'` and `surface === 'platform-app'` are different values, which is why the order of these two returns does not matter and why neither needs the other's negation.

- [ ] **Step 6: Verify compile, dev behaviour, and that no chrome decision still reads the raw role**

Run: `npm run lint && npx playwright test e2e/host-surface.spec.ts --workers=1`
Expected: lint silent, 2 passed. Then:

```bash
grep -n "isSuperadmin" src/admin/AdminPanel.tsx
```
Expected remaining hits, and only these: the `useState` declaration, the two `setIsSuperadmin` writes, `can()`, the `superadminChromeAllowed(host, isSuperadmin)` call in the flag, the `showsPlatformAccessDenied(host, isSuperadmin)` call in the denial, and the new link's `isSuperadmin && !superadminView`. Any other hit is a missed consumer — fix it, don't note it.

- [ ] **Step 7: Commit**

```bash
git add src/admin/AdminPanel.tsx
git commit -m "feat(admin): platform chrome only where the platform host is

a superadmin opening the tenant entry panel now gets the tenant admin's nav and
voice, plus one link back to the platform panel; the role still decides data
access. Two accounts that used to sit in an empty shell now get told what is
missing: a non-platform role on sa. and a platform-app member with no tenant."
```

---

### Task 5: nginx — name the two platform surfaces exactly

**Files:**
- Create: `D:/talana/deploy/nginx/zaraasan-platform.conf`
- Modify: `D:/talana/deploy/nginx/zaraasan.conf` (only if it differs from the live file)
- Modify: `D:/talana/deploy/README.md`

**Interfaces:**
- Consumes: `/home/talana/www/talana-frontend/dist` (already the SPA root), cert `zaraasan-wildcard`.
- Produces: `app.zaraasan.ir` and `sa.zaraasan.ir` served from the SPA dist, with an access log that records `$host` and `$ssl_server_name` — without that, Task 7 cannot prove which vhost the edge hit.

- [ ] **Step 1: Reconcile the tracked copy with the live file**

```bash
ssh root@171.22.25.200 "cat /etc/nginx/sites-available/zaraasan" > /tmp/zaraasan-live.conf
diff <(tr -d '\r' < /d/talana/deploy/nginx/zaraasan.conf) <(tr -d '\r' < /tmp/zaraasan-live.conf)
```
Expected: no output. If it differs, copy the live file over the tracked one and say so in the commit — the live file is what production runs, and `/home/talana/www/talana-deploy` (at `d27ba4c`) has no copy of it at all.

- [ ] **Step 2: Write `zaraasan-platform.conf`**

Full content. `log_format` sits at file top level because nginx includes `sites-enabled/*` at http level — the same reason `map $uri $zaraasan_cache` works in `zaraasan.conf`:

```nginx
# =============================================================================
# Nginx Configuration for the ZarAsan platform surfaces (SPA)
# Domains: app.zaraasan.ir (tenant entry app), sa.zaraasan.ir (platform panel)
# SSL: /etc/letsencrypt/live/zaraasan-wildcard — SAN: zaraasan.ir + *.zaraasan.ir
#      (measured 2026-11-15, expires 2027-02-12; no new cert needed)
# Serves: the same dist as talana-frontend.conf — one bundle, behaviour branched
#         by hostname in src/host.ts. Building a second dist per surface was
#         rejected: this box cannot run vite build, and the bundle is not the
#         security boundary (the API is).
#
# These names are exact. nginx prefers an exact server_name over a wildcard, so
# *.zaraasan.ir in zaraasan.conf keeps 301-ing every other subname — including
# the junk ones — without that block having to change.
#
# Port 443 is mandatory: the WCDN edge rewrites its origin fetches to https
# (measured 2026-11-14, server_port=443 in the access log for edge requests).
# =============================================================================

# A response alone cannot prove which vhost answered: the default combined
# format logs neither $host nor SNI, and a graceful reload leaves old workers
# draining with the old config. $host is logged here so Task 7's evidence is
# the log line, not the page.
log_format zaraasan_platform '$remote_addr host=$host sni=$ssl_server_name '
                             '[$time_local] "$request" $status $body_bytes_sent '
                             '"$http_referer" "$http_user_agent"';

server {
    listen 80;
    listen [::]:80;
    server_name app.zaraasan.ir sa.zaraasan.ir;

    location ^~ /.well-known/acme-challenge/ {
        root /var/lib/letsencrypt;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name app.zaraasan.ir sa.zaraasan.ir;

    root /home/talana/www/talana-frontend/dist;
    index index.html;
    charset utf-8;

    ssl_certificate /etc/letsencrypt/live/zaraasan-wildcard/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zaraasan-wildcard/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;

    # Vite hashed assets — immutable long cache
    location ^~ /assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable" always;
        access_log off;
    }

    # Never cache index.html (SPA entry point) or the service worker
    location = /index.html {
        add_header Cache-Control "no-store" always;
    }

    location = /sw.js {
        add_header Cache-Control "no-store" always;
    }

    # SPA fallback — hash routing means every path is the same page
    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    access_log /var/log/nginx/zaraasan-platform-access.log zaraasan_platform;
    error_log /var/log/nginx/zaraasan-platform-error.log;
}
```

Deliberate omissions, so nobody adds them by reflex: no `default_server` (that is `000-catchall`'s job), no CSP header (the SPA vhost has none and the app needs its own `connect-src`; inventing one here breaks the app, not the platform), no `www.` name (zaraasan.ir/www belong to the static landing vhost).

- [ ] **Step 3: Static verification without touching nginx**

```bash
grep -c "default_server" /d/talana/deploy/nginx/zaraasan-platform.conf; grep -n "server_name" /d/talana/deploy/nginx/zaraasan-platform.conf; grep -n "root \|access_log \|log_format " /d/talana/deploy/nginx/zaraasan-platform.conf
```
Expected: `0` for default_server; two `server_name app.zaraasan.ir sa.zaraasan.ir;` lines; one `log_format zaraasan_platform`, one `root /home/talana/www/talana-frontend/dist`, one `access_log … zaraasan_platform`.
Also confirm the two cert paths and the dist root exist on the box (read-only):
```bash
ssh root@171.22.25.200 "ls -l /etc/letsencrypt/live/zaraasan-wildcard/fullchain.pem /home/talana/www/talana-frontend/dist/index.html"
```
Expected: both listed. `nginx -t` itself runs in Task 7, because it is only meaningful once the file is installed.

- [ ] **Step 4: Fix the deploy documentation that contradicts reality**

In `D:/talana/deploy/README.md`, the frontend section currently reads `npm ci` / `npm run build` on the server and the nginx list has no `zaraasan` entry. Replace the build command block with:

```markdown
> **Do not run `npm run build` on this server.** The Vite bundle needs ~2.6 GB
> and the box has 3.8 GiB with no swap; the build is killed with an
> ineffective-mark-compacts OOM. Build on a laptop from the release worktree,
> upload `dist/`, and swap `index.html` last (see `talana-frontend/docs/DEPLOYMENT.md`).
> The server's untracked `talana-frontend/.env.production` is also not the build
> input anyone expects: it must keep `VITE_BASE_DOMAIN=talaana.ir`.
```

and add to the `/etc/nginx/sites-available/` tree:

```
├── zaraasan                 # ZarAsan landing (static, zaraasan.ir + *. redirect)
├── zaraasan-platform        # ZarAsan app + panel (app.zaraasan.ir, sa.zaraasan.ir)
```

- [ ] **Step 5: Commit**

```bash
cd /d/talana/deploy && git add nginx/zaraasan-platform.conf nginx/zaraasan.conf README.md
git commit -m "ops(nginx): serve the two ZarAsan platform surfaces from the SPA dist

exact server_name blocks so app. and sa. reach the app while every other
*.zaraasan.ir keeps 301-ing to the landing, and the file logs $host because the
combined format cannot prove which vhost answered."
```

---

### Task 6: Make the build inputs match the contract

**Files:**
- Modify: `.env.production.example` (tracked, in the hostmodel worktree)
- Modify: `docs/DEPLOYMENT.md`
- Create: `.env.production` (untracked — gitignored — local build input from Step 4)
- Modify on the server: `/home/talana/www/talana-frontend/.env.production` (untracked)

`src/host.ts` is not touched here: Task 1 already gives it the `zaraasan.ir` / `talaana.ir` defaults, and this task only makes sure a rebuild cannot override them by accident.

**Interfaces:**
- Consumes: `VITE_PLATFORM_DOMAIN` (default `zaraasan.ir`) and `VITE_BASE_DOMAIN` (default `talaana.ir`) from Task 1.
- Produces: a rebuild — by anyone, anywhere — cannot silently revert spec §5.

- [ ] **Step 1: Measure the current state of both files**

```bash
cat .env.production.example
ssh root@171.22.25.200 "cat /home/talana/www/talana-frontend/.env.production"
```
Expected before the fix: the example has `VITE_BASE_DOMAIN=talaana.ir` and no platform var; the server file has `VITE_BASE_DOMAIN=zaraasan.ir` plus `VITE_MARKETPLACE_DOMAIN=talaana.ir` — the pair that reverts the apex split if anyone rebuilds from the box. Record both outputs in the commit message.

- [ ] **Step 2: Write the tracked example**

`.env.production.example`:

```
VITE_API_URL=https://api.talaana.ir/api
VITE_APP_NAME=Talana
# Stores are served from {slug}.{BASE}; the marketplace tenant keeps app.{BASE}.
VITE_BASE_DOMAIN=talaana.ir
# The platform's own landing, tenant-entry app and panel host.
VITE_PLATFORM_DOMAIN=zaraasan.ir
```

- [ ] **Step 3: Fix the server's untracked file (backup first)**

```bash
ssh root@171.22.25.200 'cd /home/talana/www/talana-frontend && cp -p .env.production .env.production.bak-$(date +%Y%m%d%H%M%S) && printf "VITE_API_URL=https://api.talaana.ir/api\nVITE_APP_NAME=Talana\nVITE_BASE_DOMAIN=talaana.ir\nVITE_PLATFORM_DOMAIN=zaraasan.ir\n" > .env.production && cat .env.production'
```
Expected: the printed file shows `VITE_BASE_DOMAIN=talaana.ir` and `VITE_PLATFORM_DOMAIN=zaraasan.ir`. Do **not** run any build there afterwards.

- [ ] **Step 4: Local release build input**

Create `D:/talana/talana-frontend-hostmodel/.env.production` with the same four lines (`.env*` is gitignored; the file must exist or the build falls back to the defaults — which are correct, but the build must be reproducible from a documented input, not from a default).

- [ ] **Step 5: Document it**

In `docs/DEPLOYMENT.md` add a short section:

```markdown
## Build inputs

`dist/` is built on a laptop, never on the VPS (the build OOMs 3.8 GiB with no
swap). The four values in `.env.production.example` are the whole contract:
`VITE_BASE_DOMAIN` decides where tenant hosts live (`{slug}.talaana.ir`, and
`app.talaana.ir` for the marketplace tenant) and `VITE_PLATFORM_DOMAIN` decides
the platform hosts (`app.zaraasan.ir`, `sa.zaraasan.ir`). The server's untracked
`.env.production` is not a template and must not be used to rebuild the split —
it currently equals the example for a reason.
Host interpretation lives in `src/host.ts`; see `docs/host-surface-model.md`.
```

- [ ] **Step 6: Commit**

```bash
git add .env.production.example docs/DEPLOYMENT.md
git commit -m "chore(env): name the platform domain in the build contract

the server's untracked .env.production had the two domains swapped, which made
the documented rebuild path revert the apex/app split."
```

---

### Task 7: Release and prove it on production

**Files:**
- Modify: `D:/talana/.qa-hosts-probe.cjs` (scratch probe, outside any repo)
- No source changes. This task is the only place a production file changes.

**Interfaces:**
- Consumes: Tasks 1–6 committed and green locally.
- Produces: spec §11 criteria 1–5, 7 with screenshots and log lines.

- [ ] **Step 1: Build locally**

```bash
cd /d/talana/talana-frontend-hostmodel && npm run build && ls -l dist/index.html
```
Expected: build exits 0. Do not judge the bundle by grepping it for hostnames — `SUPERADMIN_ORIGIN` is a template literal and minification may not leave the string intact; the browser probe is the evidence.

- [ ] **Step 2: Upload, back up, cutover**

```bash
cd /d/talana/talana-frontend-hostmodel && tar czf /tmp/dist-platform.tgz -C dist .
scp -q /tmp/dist-platform.tgz root@171.22.25.200:/tmp/
ssh root@171.22.25.200 'set -e; TS=$(date +%Y%m%d%H%M%S); cd /home/talana/www/talana-frontend;
mkdir -p dist-$TS && tar xzf /tmp/dist-platform.tgz -C dist-$TS && chown -R talana:talana dist-$TS;
cp -a dist dist.bak-$TS;
cp -a dist-$TS/assets/. dist/assets/;
mv -f dist-$TS/index.html dist/index.html.tmp && mv -f dist/index.html.tmp dist/index.html;
echo "TS=$TS"; ls -ld dist dist-$TS dist.bak-$TS'
```
Expected: three directories, one timestamp printed. Keep that timestamp — it is the rollback address. Old assets stay in place on purpose so any edge-cached HTML pointing at a previous bundle still resolves.

- [ ] **Step 3: Install the nginx blocks**

First capture the baseline of every enabled vhost on the box — this releases adds one file and edits none, and Task 8 Step 2 diffs against exactly this output. Keep the file:

```bash
ssh root@171.22.25.200 'cd /etc/nginx/sites-enabled && md5sum * | sort -k2' > /tmp/qa-nginx-baseline.txt
cat /tmp/qa-nginx-baseline.txt
```

Expected: the nine names currently on the box (`000-catchall`, `menaura`, `satora`, `talana`, `talana-bot`, `talana-frontend`, `talana-horizon`, `talana-pma`, `zaraasan`) — measured with `ls -l /etc/nginx/sites-enabled/` on 2026-11-16. `menaura` and `satora` belong to other projects; they are in the baseline precisely so the release can be shown not to have disturbed them.

Then install:

```bash
scp -q /d/talana/deploy/nginx/zaraasan-platform.conf root@171.22.25.200:/etc/nginx/sites-available/zaraasan-platform
ssh root@171.22.25.200 'cd /etc/nginx/sites-enabled && ln -s ../sites-available/zaraasan-platform zaraasan-platform; nginx -t'
```
Expected: `nginx: configuration file /etc/nginx/nginx.conf test is successful`. **Stop if it is not** — the symlink stays but nothing reloads; report the exact error line.

```bash
ssh root@171.22.25.200 'systemctl reload nginx; sleep 6; journalctl -u nginx --since "-30s" --no-pager | tail -5'
```
Expected: reload without error. The sleep is the worker drain, not decoration.

- [ ] **Step 4: Decide the vhost from the log, not the response**

```bash
ssh root@171.22.25.200 'tail -20 /var/log/nginx/zaraasan-platform-access.log'
```
Then from the laptop: `curl -sS -o /dev/null -w "%{http_code}\n" https://app.zaraasan.ir/` and the same for `https://sa.zaraasan.ir/`.
Expected: a log line per request containing `host=app.zaraasan.ir sni=app.zaraasan.ir` and `host=sa.zaraasan.ir sni=sa.zaraasan.ir` with status 200. A 200 **without** a matching `host=` line means an old worker or a different vhost answered — wait and re-check before continuing. A 301 to `https://zaraasan.ir/` means the exact block is not being preferred: stop and inspect `nginx -T | grep -A3 "server_name app.zaraasan"`.

- [ ] **Step 5: Run the live browser matrix**

Replace the `TARGETS` block in `D:/talana/.qa-hosts-probe.cjs` with the surfaces this release must show, and add the gate probe:

```js
const TARGETS = [
  ["zaraasan landing", "https://zaraasan.ir/"],
  ["zaraasan app surface", "https://app.zaraasan.ir/"],
  ["zaraasan app login", "https://app.zaraasan.ir/#/login"],
  ["sa surface", "https://sa.zaraasan.ir/#/superadmin/tenants"],
  ["talaana landing", "https://talaana.ir/"],
  ["talaana app", "https://app.talaana.ir/"],
  ["store app", "https://pars-gold.talaana.ir/"],
  ["gate from landing", "https://talaana.ir/#/superadmin/tenants"],
  ["gate from store", "https://pars-gold.talaana.ir/#/superadmin/tenants"],
  ["gate from marketplace app", "https://app.talaana.ir/#/superadmin/tenants"],
  ["junk subdomain", "https://junk.zaraasan.ir/"],
];
```

Keep the probe's existing assertions (final URL, title, visible h1/h2, `loginFormVisible`, 4xx/5xx notes, screenshot per row) and run:

```bash
NODE_PATH="D:/talana/talana-frontend/node_modules" node /d/talana/.qa-hosts-probe.cjs
```

Expected from `D:/talana/.qa-hosts.json`, row by row. All four superadmin-hash rows end at `#/login`, because the app's own admin guard `replaceState`s an unauthenticated admin hash onto the sign-in screen once it lands — on `sa.` that is the correct destination for this probe, which has no credentials:

- `gate from landing`, `gate from store`, `gate from marketplace app` → `finalUrl` is exactly `https://sa.zaraasan.ir/#/login`, `loginFormVisible: true`, no `pageerror`, and the body does **not** contain a platform-panel heading («فروشگاه‌ها»). The evidence for criterion 3 is that the browser left the requested host, not the status code.
- `sa surface` → same final URL as the three gate rows. If it differs from them, the gate is not what produced the destination — stop and look at the routing effect before recording anything.
- `zaraasan app surface` / `zaraasan app login` → 200 on `app.zaraasan.ir`, login form, and **no** «فروشگاه مورد نظر یافت نشد» text in `bodyChars`-sized body (the Task 2 leak would show it).
- `talaana landing` → h1/CTA set identical to yesterday's `.qa-hosts.json` rows (`ورود به بازارچه`, `فروشگاه نمونه`, `ساخت فروشگاه` present, `loginFormVisible: false`).
- `talaana app` → h1 «طلانا»; `store app` → h1 «طلافروشی پارس»; `zaraasan landing` → the static ZarAsan page; `junk subdomain` → `finalUrl` `https://zaraasan.ir/`.
- `notes` empty for every row except `junk subdomain` (its 301 is a redirect, not an error).

If a single row fails, re-run that row alone before believing it — one failed probe is not a refutation, and the edge rewrites 5xx bodies so a `notes` entry can be an upstream mask rather than a bug.

- [ ] **Step 6: Report and hand the login over**

Send the owner the screenshot paths (`D:/talana/.qa-hosts/*.png`) and the `.qa-hosts.json` row table, and ask for two logins he performs himself, since his production credentials are not in my possession: (a) `sa.zaraasan.ir/#/login` → the platform panel with «فروشگاه‌ها» in the sidebar; (b) `app.zaraasan.ir/#/login` → the *marketplace* panel, no platform nav. Record both outcomes in Task 8.

- [ ] **Step 7: Push what is committed**

```bash
cd /d/talana/talana-frontend-hostmodel && git push -u origin feat/host-surface-model
cd /d/talana/deploy && git push -u origin HEAD:feat/host-surface-model
```
Expected: both branches on `origin`. No merge to `main`, no PR — the owner's call.

---

### Task 8: Acceptance record

**Files:**
- Modify: `docs/host-surface-model.md` (append §۱۲ as measured evidence)

- [ ] **Step 1: Fill the acceptance table with evidence**

Append to `docs/host-surface-model.md`:

```markdown
## ۱۲. اجرای این طرح (ثبت‌شده YYYY-MM-DD)

| معیار | نتیجه | اثبات |
|---|---|---|
| ۱ app.zaraasan.ir لاگین می‌دهد | … | .qa-hosts.json row + .png |
| ۲ sa.zaraasan.ir سوپرادمین | … | login by owner + .png |
| ۳ بستن سوپرادمین روی بقیه | … | 3 gate rows + log lines |
| ۴ junk.zaraasan.ir ۳۰۱ | … | curl + log |
| ۵ چهار میزبان دیروز | … | this run's rows vs the pre-release `.qa-hosts.json` for the same four URLs |
| ۶ قرارداد + mutation | … | playwright output + mutation table |
| ۷ nginx بدون تغییر ناخواسته | … | diff of /tmp/qa-nginx-baseline.txt against /tmp/qa-nginx-after.txt |
```

`YYYY-MM-DD` is the release date from Task 7 Step 2's `TS`, not the date the plan was written. Every `…` is filled by the run, or says «باز» with the reason. An empty cell is a plan failure, not a formatting one.

- [ ] **Step 2: Prove nothing else moved on the box**

```bash
ssh root@171.22.25.200 'cd /etc/nginx/sites-enabled && md5sum * | sort -k2' > /tmp/qa-nginx-after.txt
diff /tmp/qa-nginx-baseline.txt /tmp/qa-nginx-after.txt
```
Expected: one added line for `zaraasan-platform` and nothing else — no changed hash, no removed line. If any other file's hash moved, this release touched a vhost it should not have; stop and name it. If `/tmp/qa-nginx-baseline.txt` is gone, criterion 7 is reported as «باز: baseline capture was lost» — re-running the command now would hash the post-change state and prove nothing.

- [ ] **Step 3: Commit the record**

```bash
git add docs/host-surface-model.md
git commit -m "docs(host): record the measured acceptance of the surface model"
```

---

## Open risks this plan does not resolve (say them, do not hide them)

- **Pivot-only members on `app.zaraasan.ir`.** `permissions.tenant` reads `users.tenant_id`; an account whose membership exists only in `tenant_user` arrives tenant-less and will be routed to `#/tenant/dashboard` with no tenant. No such account exists today (`select count(*) … where tenant_id is null` → 0), and the fix is a "my tenants" endpoint — deliberately out of scope (spec §10).
- **Platform affordances move off the tenant surface.** On `app.zaraasan.ir` the owner's chrome becomes the marketplace admin's: «فروشگاه‌ها» and the platform «تنظیمات AI» are on `sa.zaraasan.ir` only. If he wants either inside the tenant panel, that is a new decision, not a bug in Task 4.
- **`*.talaana.ir` still serves the SPA for every subname** (`talana-frontend.conf` keeps `*.talaana.ir`). A tenant landing page per brand (spec §10) is what replaces that, not anything here.
- **The server's `talana-frontend` checkout keeps five uncommitted draft files at `main`/`7ac72dc`,** and its `talana-deploy` checkout is 1 commit behind with no `zaraasan.conf`. Neither is pulled by this plan: touching a shared checkout is the owner's call. The rescued draft is at `D:/talana/server-frontend-uncommitted-20261116.patch`.
- **Signing in on a tenant-less host is not yet verified in a browser.** The live probe is anonymous by design, and `auth.login(phone, password, tenant?.slug)` receives an undefined slug on `app.zaraasan.ir` and `sa.zaraasan.ir` because Task 2 deliberately leaves the tenant null there. The owner's login in Step 6 is the first real evidence that the platform-role session works on the platform hosts; if it 400s, the fix is backend-side (which tenant context a platform sign-in needs) and it is a new task, not a Task 4 patch.
- **The `fullyParallel: true` flake** in `e2e/tenant-routing.spec.ts` stays. Any task that runs Playwright with default workers may show 1–2 red tests that also fail on unmodified `a249bea`.
