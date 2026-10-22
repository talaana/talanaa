import { test, expect } from '@playwright/test';

test.describe('Talana Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should redirect to login page when visiting admin without auth', async ({ page }) => {
    await page.goto('http://localhost:3001/#/admin');
    await page.waitForURL(/.*#\/login/);
    await expect(page).toHaveURL(/.*#\/login/);
    await expect(page.getByRole('button', { name: 'رمز عبور' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'کد یکبار مصرف' })).toBeVisible();
  });

  test('should show login page at /#/login directly', async ({ page }) => {
    await page.goto('http://localhost:3001/#/login');
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
    await page.goto('http://localhost:3001/#/login');
    
    await page.click('text=کد یکبار مصرف');
    
    await expect(page.getByRole('button', { name: 'دریافت کد تأیید' })).toBeVisible();
    await expect(page.locator('text=کد به شماره شما ارسال می‌شود')).toBeVisible();
  });

  test('should validate phone number length', async ({ page }) => {
    await page.goto('http://localhost:3001/#/login');
    await page.click('text=کد یکبار مصرف');
    
    await page.fill('input[placeholder="۰۹۱۲۳۴۵۶۷۸۹"]', '0912');
    await page.click('button:has-text("دریافت کد تأیید")');
    
    await expect(page.locator('text=شماره موبایل باید ۱۱ رقم باشد')).toBeVisible();
  });

  test('should NOT redirect login page to landing', async ({ page }) => {
    await page.goto('http://localhost:3001/#/login');
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
    await page.goto('http://localhost:3000');
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
    await page.goto('http://localhost:3001/#/admin');
    await page.waitForURL(/.*#\/login/);
    await expect(page).toHaveURL(/.*#\/login/);
  });
});