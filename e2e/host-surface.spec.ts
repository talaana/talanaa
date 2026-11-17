import { test, expect } from '@playwright/test';

test('the host contract table resolves one surface per hostname', async ({ page, baseURL }) => {
  await page.goto(baseURL!);
  const hosts = await page.evaluate(async () => {
    // The specifier is a browser path Vite serves, not an tsc-resolvable module — same
    // indirection as tenant-routing.spec.ts, which imports '/src/tenant.tsx' this way.
    const modulePath = '/src/host.ts';
    // surface/brand/platformHost joined with '/' so one row reads as one string.
    const row = (info: any) => `${info.surface}/${info.brand}/${info.platformHost}`;
    const host = await import(modulePath);
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
    const modulePath = '/src/host.ts';
    const host = await import(modulePath);
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
