# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Admin Panel Access >> should redirect to login when accessing admin without token
- Location: e2e\login.spec.ts:76:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/#/admin
Call log:
  - navigating to "http://localhost:3001/#/admin", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Talana Login Flow', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('http://localhost:3000');
  6  |   });
  7  | 
  8  |   test('should redirect to login page when visiting admin without auth', async ({ page }) => {
  9  |     await page.goto('http://localhost:3001/#/admin');
  10 |     await page.waitForURL(/.*#\/login/);
  11 |     await expect(page).toHaveURL(/.*#\/login/);
  12 |     await expect(page.getByRole('button', { name: 'رمز عبور' })).toBeVisible();
  13 |     await expect(page.getByRole('button', { name: 'کد یکبار مصرف' })).toBeVisible();
  14 |   });
  15 | 
  16 |   test('should show login page at /#/login directly', async ({ page }) => {
  17 |     await page.goto('http://localhost:3001/#/login');
  18 |     await expect(page).toHaveURL(/.*#\/login/);
  19 |     // Login page should render, NOT redirect to landing
  20 |     await expect(page.getByRole('button', { name: 'رمز عبور' })).toBeVisible();
  21 |     await expect(page.getByRole('button', { name: 'کد یکبار مصرف' })).toBeVisible();
  22 |     await expect(page.locator('input[placeholder="۰۹۱۲۳۴۵۶۷۸۹"]')).toBeVisible();
  23 |     // Should show platform branding (expected on login page)
  24 |     // Should NOT redirect to cinematic landing (no canvas/video)
  25 |     await expect(page.locator('canvas, video').first()).not.toBeVisible({ timeout: 2000 });
  26 |   });
  27 | 
  28 |   test('should switch to OTP mode', async ({ page }) => {
  29 |     await page.goto('http://localhost:3001/#/login');
  30 |     
  31 |     await page.click('text=کد یکبار مصرف');
  32 |     
  33 |     await expect(page.getByRole('button', { name: 'دریافت کد تأیید' })).toBeVisible();
  34 |     await expect(page.locator('text=کد به شماره شما ارسال می‌شود')).toBeVisible();
  35 |   });
  36 | 
  37 |   test('should validate phone number length', async ({ page }) => {
  38 |     await page.goto('http://localhost:3001/#/login');
  39 |     await page.click('text=کد یکبار مصرف');
  40 |     
  41 |     await page.fill('input[placeholder="۰۹۱۲۳۴۵۶۷۸۹"]', '0912');
  42 |     await page.click('button:has-text("دریافت کد تأیید")');
  43 |     
  44 |     await expect(page.locator('text=شماره موبایل باید ۱۱ رقم باشد')).toBeVisible();
  45 |   });
  46 | 
  47 |   test('should NOT redirect login page to landing', async ({ page }) => {
  48 |     await page.goto('http://localhost:3001/#/login');
  49 |     // Wait for login page to fully load
  50 |     await expect(page.getByRole('button', { name: 'رمز عبور' })).toBeVisible();
  51 |     // URL should stay as login
  52 |     await expect(page).toHaveURL(/.*#\/login/);
  53 |     // Should not show cinematic landing page elements
  54 |     await expect(page.locator('canvas, video').first()).not.toBeVisible({ timeout: 2000 });
  55 |   });
  56 | });
  57 | 
  58 | test.describe('Cinematic Landing Page', () => {
  59 |   test.beforeEach(async ({ page }) => {
  60 |     await page.goto('http://localhost:3000');
  61 |   });
  62 | 
  63 |   test('should load cinematic landing page', async ({ page }) => {
  64 |     // Should show cinematic experience (not old static landing)
  65 |     await expect(page.locator('text=طلانا')).toBeVisible();
  66 |     // Video experience or canvas fallback should be present - use first
  67 |     await expect(page.locator('canvas, video').first()).toBeVisible({ timeout: 10000 });
  68 |   });
  69 | 
  70 |   test('should have navigation to login', async ({ page }) => {
  71 |     await expect(page.locator('text=ورود به بازارچه')).toBeVisible();
  72 |   });
  73 | });
  74 | 
  75 | test.describe('Admin Panel Access', () => {
  76 |   test('should redirect to login when accessing admin without token', async ({ page }) => {
> 77 |     await page.goto('http://localhost:3001/#/admin');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/#/admin
  78 |     await page.waitForURL(/.*#\/login/);
  79 |     await expect(page).toHaveURL(/.*#\/login/);
  80 |   });
  81 | });
```