import { test as base, expect, type Page, type Request } from '@playwright/test';

const tenant = {
  id: 917, slug: 'fixture-store', name: 'فروشگاه آزمایشی', type: 'store',
  domain: null, logo: null, brand_color: '#ca8a04', silver_tab_color: null, settings: {},
};
const token = 'synthetic-browser-token-not-a-real-credential';
const phone = '09000000000';
const currentPassword = 'Synthetic-current-001!';
const newPassword = 'Synthetic-new-002!';
const permissions = ['admin.access', 'products.manage'];
const authContext = {
  type: 'user', role: 'admin', roles: ['admin'], permissions, is_superadmin: false,
};
const user = { id: 917, name: 'کاربر آزمایشی', phone };
const originalDescription = 'توضیحات محصول که باید هنگام تغییر نام حفظ شود.';

interface ProductFixture {
  id: number;
  title: string;
  category_id: number;
  seller_id: null;
  metal: 'gold';
  weight: number;
  wage_percentage: number;
  tax_percentage: number;
  is_active: boolean;
  description?: string | null;
  calculated_price?: { final_price?: number | null; raw_gold?: number } | null;
}

function product(overrides: Partial<ProductFixture> = {}): ProductFixture {
  return {
    id: 71, title: 'محصول آزمایشی', category_id: 7, seller_id: null,
    metal: 'gold', weight: 2.5, wage_percentage: 8, tax_percentage: 9,
    is_active: true, description: originalDescription,
    calculated_price: { final_price: 12345678, raw_gold: 10000000 },
    ...overrides,
  };
}

interface ApiFixture {
  products: ProductFixture[];
  loginRequests: Request[];
  passwordRequests: Request[];
  productUpdates: Request[];
  expectedHttpErrors: number;
}

const test = base.extend<{ apiFixture: ApiFixture }>({
  apiFixture: [async ({ context, baseURL }, use) => {
    const fixture: ApiFixture = {
      products: [product()], loginRequests: [], passwordRequests: [], productUpdates: [], expectedHttpErrors: 0,
    };
    const errors: string[] = [];
    const unexpectedRequests: string[] = [];
    const blocked = new Set<string>();
    const expectedErrorUrls = new Set<string>();
    context.on('page', page => {
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() !== 'error') return;
        const url = message.location().url;
        if (blocked.has(url) && message.text().startsWith('Failed to load resource:')) return;
        if (expectedErrorUrls.has(url) && message.text().startsWith('Failed to load resource: the server responded with a status of 422')) {
          fixture.expectedHttpErrors++;
          return;
        }
        errors.push(message.text());
      });
    });
    await context.routeWebSocket('**/*', socket => {
      if (new URL(socket.url()).origin === baseURL?.replace(/^http/, 'ws')) socket.connectToServer();
      else socket.close();
    });
    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      // Only this dedicated Vite origin may reach the network, never backend :8000 or remote fonts.
      if (url.origin !== baseURL) {
        blocked.add(request.url());
        if (request.resourceType() === 'stylesheet') {
          return route.fulfill({ contentType: 'text/css', body: '' });
        }
        return route.abort('blockedbyclient');
      }
      if (!url.pathname.startsWith('/api/')) return route.continue();

      const endpoint = `${request.method()} ${url.pathname}`;
      const json = (body: unknown, status = 200) => route.fulfill({ status, json: body });
      if (endpoint === 'GET /api/tenants/resolve') {
        return json({ found: url.searchParams.get('slug') === tenant.slug, tenant });
      }
      if (endpoint === 'POST /api/auth/login') {
        fixture.loginRequests.push(request);
        return json({ token, user, ...authContext });
      }
      if (request.headers()['authorization'] !== `Bearer ${token}` || request.headers()['x-tenant'] !== String(tenant.id)) {
        unexpectedRequests.push(`Missing synthetic auth/tenant headers: ${endpoint}`);
        return json({ message: 'Synthetic authentication required' }, 401);
      }
      switch (endpoint) {
        case 'GET /api/auth/profile': return json({ user, ...authContext });
        case 'GET /api/auth/permissions': return json(authContext);
        case 'GET /api/prices/current': return json({ gold_18k: 8650000, silver_999: 125000 });
        case 'GET /api/transactions': return json({ data: [] });
        case 'GET /api/categories':
        case 'GET /api/banners': return json([]);
        case 'GET /api/admin/dashboard/permissions': return json({ ...authContext, tenant });
        case 'GET /api/admin/dashboard/stats':
          return json({ total_users: 1, total_tenants: 1, total_transactions: 0, total_revenue: 0 });
        case 'GET /api/admin/categories': return json({ data: [{ id: 7, name: 'دسته آزمایشی', metal: 'gold' }] });
        case 'GET /api/admin/products': return json({ data: fixture.products });
        case 'PUT /api/auth/password': {
          fixture.passwordRequests.push(request);
          const body = request.postDataJSON();
          // Mirror the confirmed validation before checking the current password.
          if (body.new_password_confirmation !== body.new_password) {
            expectedErrorUrls.add(request.url());
            return json({ message: 'The new password field confirmation does not match.' }, 422);
          }
          if (body.current_password !== currentPassword) {
            expectedErrorUrls.add(request.url());
            return json({ message: 'رمز عبور فعلی اشتباه است.' }, 422);
          }
          return json({ message: 'رمز عبور با موفقیت تغییر کرد.' });
        }
        default: {
          const match = url.pathname.match(/^\/api\/admin\/products\/(\d+)$/);
          if (request.method() === 'PUT' && match) {
            fixture.productUpdates.push(request);
            const id = Number(match[1]);
            fixture.products = fixture.products.map(p => p.id === id ? { ...p, ...request.postDataJSON() } : p);
            return json(fixture.products.find(p => p.id === id));
          }
          unexpectedRequests.push(endpoint);
          return json({ message: 'No synthetic fixture for this API request' }, 500);
        }
      }
    });
    await use(fixture);
    expect(unexpectedRequests, 'All API requests must use explicit synthetic fixtures').toEqual([]);
    expect(errors, 'Unexpected browser console errors').toEqual([]);
  }, { auto: true }],
});

async function login(page: Page, fixture: ApiFixture) {
  await page.goto('/?tenant=fixture-store#/login');
  await expect(page.getByRole('heading', { name: tenant.name })).toBeVisible();
  await page.getByPlaceholder('۰۹۱۲۳۴۵۶۷۸۹').fill(phone);
  await page.locator('input[type="password"]').fill(currentPassword);
  await page.getByRole('button', { name: `ورود به ${tenant.name}`, exact: true }).click();
  await expect(page.getByRole('button', { name: 'پروفایل', exact: true })).toBeVisible();
  expect(fixture.loginRequests).toHaveLength(1);
  expect(fixture.loginRequests[0].postDataJSON()).toEqual({ phone, password: currentPassword, tenant_slug: tenant.slug });
  const cookies = await page.context().cookies();
  expect(cookies.find(cookie => cookie.name === `talana_token_${tenant.slug}`)?.value).toBe(token);
  const storedContext = cookies.find(cookie => cookie.name === `talana_auth_${tenant.slug}`)?.value;
  expect(JSON.parse(decodeURIComponent(storedContext!))).toEqual(authContext);
}

async function openPasswordForm(page: Page, fixture: ApiFixture) {
  await login(page, fixture);
  await page.getByRole('button', { name: 'پروفایل', exact: true }).click();
  await page.getByText('رمز عبور و امنیت ورود دو مرحله‌ای', { exact: true }).click();
  await expect(page.locator('input[type="password"]')).toHaveCount(3);
}

async function fillPasswordForm(page: Page, current = currentPassword, confirmation = newPassword) {
  const fields = page.locator('input[type="password"]');
  await fields.nth(0).fill(current);
  await fields.nth(1).fill(newPassword);
  await fields.nth(2).fill(confirmation);
}

async function openProducts(page: Page, fixture: ApiFixture) {
  await login(page, fixture);
  await page.getByRole('button', { name: 'پنل مدیریت', exact: true }).click();
  await expect(page).toHaveURL(/#\/admin$/);
  await expect(page.getByRole('heading', { name: 'داشبورد مدیریت' })).toBeVisible();
  await page.getByRole('button', { name: 'محصولات', exact: true }).click();
  await page.getByRole('button', { name: 'همه محصولات', exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
}

async function editProduct(page: Page, title = 'محصول آزمایشی') {
  // Existing edit icon has no accessible name; scope it to the selected product row.
  await page.getByRole('row').filter({ hasText: title }).getByRole('button').first().click();
  await expect(page.getByRole('heading', { name: 'ویرایش محصول' })).toBeVisible();
}

function expectedUpdate(title: string, description: string | null) {
  return { title, category_id: 7, metal: 'gold', weight: 2.5, wage_percentage: 8, tax_percentage: 9, description, is_active: true };
}

test.describe('F006 password contract through the profile UI', () => {
  test('sends exact confirmed body and returns to the profile on success', async ({ page, apiFixture }) => {
    await openPasswordForm(page, apiFixture);
    await fillPasswordForm(page);
    await page.getByRole('button', { name: 'ذخیره رمز عبور جدید' }).click();
    await expect.poll(() => apiFixture.passwordRequests.length).toBe(1);
    expect(apiFixture.passwordRequests[0].postDataJSON()).toEqual({
      current_password: currentPassword, new_password: newPassword, new_password_confirmation: newPassword,
    });
    await expect(page.getByText('رمز عبور با موفقیت تغییر کرد.', { exact: true })).toBeVisible();
    await expect(page.getByText('پروفایل کاربری طلانا', { exact: true })).toBeVisible();
    await page.getByText('رمز عبور و امنیت ورود دو مرحله‌ای', { exact: true }).click();
    for (const field of await page.locator('input[type="password"]').all()) await expect(field).toHaveValue('');
    expect(apiFixture.expectedHttpErrors).toBe(0);
  });

  test('keeps the form and displays the wrong-current-password error', async ({ page, apiFixture }) => {
    await openPasswordForm(page, apiFixture);
    await fillPasswordForm(page, 'Synthetic-wrong-current!');
    await page.getByRole('button', { name: 'ذخیره رمز عبور جدید' }).click();
    await expect.poll(() => apiFixture.passwordRequests.length).toBe(1);
    expect(apiFixture.passwordRequests[0].postDataJSON()).toEqual({
      current_password: 'Synthetic-wrong-current!', new_password: newPassword, new_password_confirmation: newPassword,
    });
    await expect(page.getByText('رمز عبور فعلی اشتباه است.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ذخیره رمز عبور جدید' })).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toHaveValue('Synthetic-wrong-current!');
    await expect(page.getByText('رمز عبور با موفقیت تغییر کرد.', { exact: true })).toHaveCount(0);
    await expect.poll(() => apiFixture.expectedHttpErrors).toBe(1);
  });

  test('retains local confirmation validation without making a request', async ({ page, apiFixture }) => {
    await openPasswordForm(page, apiFixture);
    await fillPasswordForm(page, currentPassword, 'Synthetic-mismatch!');
    await page.getByRole('button', { name: 'ذخیره رمز عبور جدید' }).click();
    await expect(page.getByText('رمز جدید با تکرار آن مطابقت ندارد.', { exact: true })).toBeVisible();
    expect(apiFixture.passwordRequests).toHaveLength(0);
  });
});

test.describe('F007 product contracts through the admin UI', () => {
  test('displays the server final_price rather than NaN or a recalculation', async ({ page, apiFixture }) => {
    await openProducts(page, apiFixture);
    const row = page.getByRole('row').filter({ hasText: 'محصول آزمایشی' });
    await expect(row.getByRole('cell').nth(4)).toHaveText('۱۲,۳۴۵,۶۷۸');
    await expect(page.getByRole('table')).not.toContainText('NaN');
  });

  test('renders zero and handles absent, null, and incomplete price objects', async ({ page, apiFixture }) => {
    apiFixture.products = [
      product({ id: 1, title: 'قیمت صفر', calculated_price: { final_price: 0 } }),
      product({ id: 2, title: 'قیمت ناموجود', calculated_price: undefined }),
      product({ id: 3, title: 'قیمت تهی', calculated_price: null }),
      product({ id: 4, title: 'قیمت ناقص', calculated_price: {} }),
      product({ id: 5, title: 'قیمت نهایی تهی', calculated_price: { final_price: null } }),
    ];
    await openProducts(page, apiFixture);
    const cells = page.locator('tbody tr td:nth-child(5)');
    await expect(cells).toHaveText(['۰', '-', '-', '-', '-']);
    await expect(page.getByRole('table')).not.toContainText('NaN');
  });

  test('preserves an existing description when only the title is changed', async ({ page, apiFixture }) => {
    await openProducts(page, apiFixture);
    await editProduct(page);
    await expect(page.locator('form textarea')).toHaveValue(originalDescription);
    await page.locator('form input').first().fill('نام جدید محصول');
    await page.getByRole('button', { name: 'بروزرسانی', exact: true }).click();
    await expect.poll(() => apiFixture.productUpdates.length).toBe(1);
    expect(apiFixture.productUpdates[0].postDataJSON()).toEqual(expectedUpdate('نام جدید محصول', originalDescription));
    await expect(page.getByRole('heading', { name: 'ویرایش محصول' })).toHaveCount(0);
    await editProduct(page, 'نام جدید محصول');
    await expect(page.locator('form textarea')).toHaveValue(originalDescription);
  });

  test('sends null when an existing description is explicitly cleared', async ({ page, apiFixture }) => {
    await openProducts(page, apiFixture);
    await editProduct(page);
    await expect(page.locator('form textarea')).toHaveValue(originalDescription);
    await page.locator('form textarea').fill('');
    await page.getByRole('button', { name: 'بروزرسانی', exact: true }).click();
    await expect.poll(() => apiFixture.productUpdates.length).toBe(1);
    expect(apiFixture.productUpdates[0].postDataJSON()).toEqual(expectedUpdate('محصول آزمایشی', null));
    await expect(page.getByRole('heading', { name: 'ویرایش محصول' })).toHaveCount(0);
    await editProduct(page);
    await expect(page.locator('form textarea')).toHaveValue('');
  });

  test('opens a nullable description as an empty editable field', async ({ page, apiFixture }) => {
    apiFixture.products = [product({ description: null })];
    await openProducts(page, apiFixture);
    await editProduct(page);
    await expect(page.locator('form textarea')).toHaveValue('');
    await page.locator('form input').first().fill('محصول بدون توضیح');
    await page.getByRole('button', { name: 'بروزرسانی', exact: true }).click();
    await expect.poll(() => apiFixture.productUpdates.length).toBe(1);
    expect(apiFixture.productUpdates[0].postDataJSON()).toEqual(expectedUpdate('محصول بدون توضیح', null));
  });
});
