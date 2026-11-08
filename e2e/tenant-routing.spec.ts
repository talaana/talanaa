import { test as base, expect, type Request } from '@playwright/test';

interface TenantFixture {
  id: number;
  slug: string;
  name: string;
  type: 'marketplace' | 'store';
  domain: string | null;
  logo: string | null;
  brand_color: string;
  silver_tab_color: string | null;
  settings: Record<string, never>;
}

const tenants = new Map<string, TenantFixture>([
  ['talana', {
    id: 1, slug: 'talana', name: 'طلانا', type: 'marketplace', domain: null,
    logo: null, brand_color: '#ca8a04', silver_tab_color: null, settings: {},
  }],
  ['pars-gold', {
    id: 2, slug: 'pars-gold', name: 'طلافروشی پارس', type: 'store', domain: null,
    logo: null, brand_color: '#b45309', silver_tab_color: null, settings: {},
  }],
]);

interface RoutingFixture {
  resolutions: string[];
  registrations: Request[];
}

const test = base.extend<{ routingFixture: RoutingFixture }>({
  routingFixture: [async ({ context, baseURL }, use) => {
    const appOrigin = new URL(baseURL!);
    const fixture: RoutingFixture = { resolutions: [], registrations: [] };
    const errors: string[] = [];
    const unexpectedRequests: string[] = [];
    const blocked = new Set<string>();

    context.on('page', page => {
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() !== 'error') return;
        // Filter out benign Vite HMR websocket errors and Firefox navigation noise
        if (message.text().includes('[vite] failed to connect to websocket')) return;
        if (message.text().includes('InvalidStateError: Navigated away from page')) return;
        if (blocked.has(message.location().url) && message.text().startsWith('Failed to load resource:')) return;
        errors.push(message.text());
      });
    });

    const isLocalApp = (url: URL) => url.protocol === appOrigin.protocol
      && url.port === appOrigin.port
      && (url.hostname === appOrigin.hostname || url.hostname.endsWith('.localhost'));

    await context.routeWebSocket('**/*', socket => {
      if (isLocalApp(new URL(socket.url()))) socket.connectToServer();
      else socket.close();
    });

    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (!isLocalApp(url)) {
        blocked.add(request.url());
        if (request.resourceType() === 'stylesheet') {
          return route.fulfill({ contentType: 'text/css', body: '' });
        }
        return route.abort('blockedbyclient');
      }
      if (!url.pathname.startsWith('/api/')) return route.continue();

      if (request.method() === 'GET' && url.pathname === '/api/tenants/resolve') {
        const slug = url.searchParams.get('slug') || '';
        fixture.resolutions.push(slug);
        const tenant = tenants.get(slug);
        return route.fulfill({
          status: tenant ? 200 : 404,
          json: tenant ? { found: true, tenant } : { found: false },
        });
      }
      if (request.method() === 'POST' && url.pathname === '/api/tenants/register') {
        fixture.registrations.push(request);
        const tenant: TenantFixture = {
          id: 3, slug: 'mina-gallery', name: 'گالری طلای مینا', type: 'store', domain: null,
          logo: null, brand_color: '#ca8a04', silver_tab_color: null, settings: {},
        };
        tenants.set(tenant.slug, tenant);
        return route.fulfill({
          status: 201,
          json: {
            tenant,
            user: { id: 3, name: 'مدیر آزمون', phone: '09120000000' },
            token: 'synthetic-routing-token-not-a-real-credential',
          },
        });
      }

      unexpectedRequests.push(`${request.method()} ${url.pathname}`);
      return route.fulfill({ status: 500, json: { message: 'No synthetic fixture for this request' } });
    });

    await use(fixture);
    expect(unexpectedRequests, 'Every API request must have an explicit fixture').toEqual([]);
    expect(errors, 'Unexpected browser runtime or console errors').toEqual([]);
  }, { auto: true }],
});

test('tenant URL contracts use subdomains and reject unsafe identifiers', async ({ page, baseURL }) => {
  await page.goto(baseURL!);
  const result = await page.evaluate(async () => {
    const modulePath = '/src/tenant.tsx';
    const tenant = await import(modulePath);
    let invalidSlug = 'accepted';
    try {
      tenant.getTenantUrl('evil.example/path', '', 'https://talaana.ir/');
    } catch {
      invalidSlug = 'rejected';
    }
    return {
      production: tenant.getTenantUrl('pars-gold', '#/login', 'https://talaana.ir/?tenant=old&campaign=gold'),
      marketplace: tenant.getTenantUrl('talana', '', 'https://app.talaana.ir/experience'),
      local: tenant.getTenantUrl('pars-gold', '/admin', 'http://127.0.0.1:3017/'),
      productionTenant: tenant.detectTenantFromURL('https://pars-gold.talaana.ir/?tenant=other'),
      marketplaceHost: tenant.detectTenantFromURL('https://app.talaana.ir/'),
      reservedHost: tenant.detectTenantFromURL('https://api.talaana.ir/'),
      nestedHost: tenant.detectTenantFromURL('https://nested.pars-gold.talaana.ir/'),
      productionQuery: tenant.detectTenantFromURL('https://talaana.ir/?tenant=pars-gold'),
      localQuery: tenant.detectTenantFromURL('http://127.0.0.1:3017/?tenant=pars-gold'),
      invalidSlug,
    };
  });

  expect(result).toEqual({
    production: 'https://pars-gold.talaana.ir/#/login',
    marketplace: 'https://talana.talaana.ir/',
    local: 'http://pars-gold.localhost:3017/#/admin',
    productionTenant: { slug: 'pars-gold' },
    marketplaceHost: { slug: 'talana' },
    reservedHost: null,
    nestedHost: null,
    productionQuery: null,
    localQuery: { slug: 'pars-gold' },
    invalidSlug: 'rejected',
  });
});

test('landing entry buttons open tenant subdomains and survive repeated navigation', async ({ page, baseURL, routingFixture }) => {
  await page.goto(baseURL!);
  await expect(page.getByRole('heading', { name: 'سرسرای اصلی بوتیک', level: 2 })).toBeVisible();

  await page.getByRole('button', { name: 'ورود به بازارچه' }).click();
  await expect(page).toHaveURL('http://talana.localhost:3017/#/login');
  await expect(page.getByRole('heading', { name: 'طلانا', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ورود به طلانا', exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.has('tenant')).toBe(false);

  await page.goBack();
  await page.getByRole('button', { name: 'فروشگاه نمونه', exact: true }).click();
  await expect(page).toHaveURL('http://pars-gold.localhost:3017/#/login');
  await expect(page.getByRole('heading', { name: 'طلافروشی پارس', level: 1 })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL('http://pars-gold.localhost:3017/#/login');
  await expect(page.getByRole('button', { name: 'ورود به طلافروشی پارس', exact: true })).toBeVisible();

  await page.goBack();
  await page.getByRole('button', { name: 'ورود به بازارچه' }).click();
  await expect(page).toHaveURL('http://talana.localhost:3017/#/login');
  expect(routingFixture.resolutions).toEqual(['talana', 'pars-gold', 'pars-gold', 'talana']);
});

test('the installer shows and opens the created tenant subdomain', async ({ page, baseURL, routingFixture }) => {
  await page.goto(baseURL!);
  await page.getByRole('button', { name: 'ساخت فروشگاه', exact: true }).click();
  await page.getByRole('button', { name: /فروشگاه مستقل \(Store\)/ }).click();
  await page.getByPlaceholder('مثال: گالری طلای مینا').fill('گالری طلای مینا');
  await page.getByPlaceholder('my-store', { exact: true }).fill('mina-gallery');
  await page.getByRole('button', { name: 'بعدی', exact: true }).click();
  await page.getByRole('button', { name: 'بعدی', exact: true }).click();
  await page.getByPlaceholder('نام و نام خانوادگی').fill('مدیر آزمون');
  await page.getByPlaceholder('۰۹۱۲۳۴۵۶۷۸۹').fill('09120000000');
  await page.getByPlaceholder('حداقل ۶ کاراکتر').fill('synthetic-password');
  await page.getByRole('button', { name: 'ساخت فروشگاه', exact: true }).click();

  const address = page.getByRole('link', { name: 'mina-gallery.localhost:3017' });
  await expect(address).toBeVisible();
  await expect(address).toHaveAttribute('href', 'http://mina-gallery.localhost:3017/');
  await page.getByRole('button', { name: 'ورود به فروشگاه', exact: true }).click();
  await expect(page).toHaveURL('http://mina-gallery.localhost:3017/');
  await expect(page.getByRole('heading', { name: 'گالری طلای مینا', level: 1 })).toBeVisible();
  expect(new URL(page.url()).searchParams.has('tenant')).toBe(false);
  expect(routingFixture.registrations).toHaveLength(1);
  expect(routingFixture.registrations[0].postDataJSON()).toMatchObject({
    tenant_slug: 'mina-gallery', tenant_type: 'store',
  });
});

test('tenant entry remains reachable without overflow on mobile', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseURL!);
  await page.getByRole('button', { name: 'ورود به بازارچه' }).click();
  await expect(page).toHaveURL('http://talana.localhost:3017/#/login');
  await expect(page.getByRole('button', { name: 'ورود به طلانا', exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});