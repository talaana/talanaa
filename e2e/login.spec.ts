import { test as base, expect } from '@playwright/test';

const test = base.extend<{ isolatedNetwork: void }>({
  isolatedNetwork: [async ({ context, baseURL }, use) => {
    const errors: string[] = [];
    const unexpectedApi: string[] = [];
    const blocked = new Set<string>();
    context.on('page', page => {
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => {
        if (message.type() !== 'error') return;
        if (blocked.has(message.location().url) && message.text().startsWith('Failed to load resource:')) return;
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
      if (url.origin !== baseURL) {
        blocked.add(request.url());
        // Empty CSS prevents remote font downloads without changing application styles.
        if (request.resourceType() === 'stylesheet') {
          return route.fulfill({ contentType: 'text/css', body: '' });
        }
        return route.abort('blockedbyclient');
      }
      if (url.pathname.startsWith('/api/')) {
        unexpectedApi.push(`${request.method()} ${url.pathname}`);
        return route.fulfill({ status: 500, json: { message: 'No synthetic fixture for this API request' } });
      }
      return route.continue();
    });
    await use();
    expect(unexpectedApi, 'Unauthenticated pages must not call an API').toEqual([]);
    expect(errors, 'Unexpected browser console errors').toEqual([]);
  }, { auto: true }],
});

test.describe('Talana Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login page when visiting admin without auth', async ({ page }) => {
    await page.goto('/#/admin');
    await page.waitForURL(/.*#\/login/);
    await expect(page).toHaveURL(/.*#\/login/);
    await expect(page.getByRole('button', { name: 'رمز عبور' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'کد یکبار مصرف' })).toBeVisible();
  });

  test('should show login page at /#/login directly', async ({ page }) => {
    await page.goto('/#/login');
    await expect(page).toHaveURL(/.*#\/login/);
    // Login page should render, NOT redirect to landing
    await expect(page.getByRole('button', { name: 'رمز عبور' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'کد یکبار مصرف' })).toBeVisible();
    await expect(page.locator('input[placeholder="۰۹۱۲۳۴۵۶۷۸۹"]')).toBeVisible();
    // Should show platform branding (expected on login page)
    // Should NOT redirect to cinematic landing (no canvas/video)
    await expect(page.locator('canvas, video').first()).not.toBeVisible({ timeout: 2000 });
  });

  test('should switch to OTP mode', async ({ page }) => {
    await page.goto('/#/login');
    
    await page.click('text=کد یکبار مصرف');
    
    await expect(page.getByRole('button', { name: 'دریافت کد تأیید' })).toBeVisible();
    await expect(page.locator('text=کد به شماره شما ارسال می‌شود')).toBeVisible();
  });

  test('should validate phone number length', async ({ page }) => {
    await page.goto('/#/login');
    await page.click('text=کد یکبار مصرف');
    
    await page.fill('input[placeholder="۰۹۱۲۳۴۵۶۷۸۹"]', '0912');
    await page.click('button:has-text("دریافت کد تأیید")');
    
    await expect(page.locator('text=شماره موبایل باید ۱۱ رقم باشد')).toBeVisible();
  });

  test('should NOT redirect login page to landing', async ({ page }) => {
    await page.goto('/#/login');
    // Wait for login page to fully load
    await expect(page.getByRole('button', { name: 'رمز عبور' })).toBeVisible();
    // URL should stay as login
    await expect(page).toHaveURL(/.*#\/login/);
    // Should not show cinematic landing page elements
    await expect(page.locator('canvas, video').first()).not.toBeVisible({ timeout: 2000 });
  });
});

test.describe('Cinematic Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load cinematic landing page', async ({ page }) => {
    // Should show cinematic experience (not old static landing)
    await expect(page.locator('text=طلانا')).toBeVisible();
    // Video experience or canvas fallback should be present - use first
    await expect(page.locator('canvas, video').first()).toBeVisible({ timeout: 10000 });
  });

  test('should have navigation to login', async ({ page }) => {
    await expect(page.locator('text=ورود به بازارچه')).toBeVisible();
  });
});

test.describe('Admin Panel Access', () => {
  test('should redirect to login when accessing admin without token', async ({ page }) => {
    await page.goto('/#/admin');
    await page.waitForURL(/.*#\/login/);
    await expect(page).toHaveURL(/.*#\/login/);
  });
});