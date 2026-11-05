import { test, expect } from '@playwright/test';
import { authFile, openAdmin, adminNav, adminProductsNav, adminSidebar, closeDrawer, shot, noHorizontalOverflow, isMobile, statCard } from '../support/helpers';

const SECTION = 'tenant-panel/marketplace-talana';
const MARKET_NAV = ['داشبورد بازارچه', 'سفارشات', 'محصولات', 'سازنده تجربه', 'فروشندگان', 'کاربران'];

test.use({ storageState: authFile('marketplaceAdmin') });

test.describe('Marketplace admin panel (طلانا)', () => {
  test('dashboard is scoped to the marketplace with marketplace navigation', async ({ page }, info) => {
    await openAdmin(page, 'talana');
    await expect(page.getByRole('heading', { name: 'داشبورد مدیریت' })).toBeVisible();
    await expect(statCard(page, 'کل کاربران').locator('span').first()).toHaveText('۱۳');
    await expect(statCard(page, 'محصولات').locator('span').first()).toHaveText('۱۴');
    await expect(statCard(page, 'فروشگاه‌ها')).toHaveCount(0);

    const nav = await adminSidebar(page);
    await expect(nav.getByRole('heading', { name: 'طلانا' })).toBeVisible();
    await expect(nav.getByText('پنل مدیریت بازارچه')).toBeVisible();
    for (const label of MARKET_NAV) await expect(nav.getByRole('button', { name: label, exact: true })).toBeVisible();
    for (const label of ['فروشگاه‌ها', 'نقش‌ها و دسترسی‌ها', 'داشبورد فروشگاه']) {
      await expect(nav.getByRole('button', { name: label, exact: true })).toHaveCount(0);
    }
    if (isMobile(page)) {
      await shot(page, info, SECTION, '01-dashboard-drawer');
      await closeDrawer(page);
    }
    await shot(page, info, SECTION, '01-dashboard');
    expect(await noHorizontalOverflow(page)).toBe(0);
  });

  test('products page shows marketplace products and never another tenant\'s', async ({ page }, info) => {
    await openAdmin(page, 'talana');
    await adminProductsNav(page, 'همه محصولات');
    await expect(page.getByRole('heading', { name: 'محصولات', exact: true })).toBeVisible();
    const rows = page.locator('main tbody tr');
    await expect.poll(() => rows.count()).toBeGreaterThan(5);
    await expect(rows.filter({ hasText: 'پارس' })).toHaveCount(0);

    await page.getByPlaceholder('جستجوی محصول...').fill('شمش');
    await expect.poll(() => rows.count()).toBeGreaterThan(0);
    for (const row of await rows.all()) await expect(row).toContainText('شمش');
    await shot(page, info, SECTION, '02-products-search-shemsh');
  });

  test('categories page lists the marketplace categories with product counts', async ({ page }, info) => {
    await openAdmin(page, 'talana');
    await adminProductsNav(page, 'دسته‌بندی‌ها');
    const rows = page.locator('main tbody tr');
    await expect(rows).toHaveCount(9);
    const shemsh = rows.filter({ has: page.locator('td:first-child', { hasText: /^شمش$/ }) });
    await expect(shemsh.locator('td').nth(2)).not.toHaveText('۰');
    await shot(page, info, SECTION, '03-categories');
  });

  test('sellers page is reachable', async ({ page }, info) => {
    await openAdmin(page, 'talana');
    await adminNav(page, 'فروشندگان');
    await expect(page.getByRole('heading', { name: 'فروشندگان بازارچه' })).toBeVisible();
    await expect(page.getByText('مدیریت فروشندگان فعال در بازارچه')).toBeVisible();
    await shot(page, info, SECTION, '04-sellers');
  });

  test('users page lists only members of this marketplace', async ({ page }, info) => {
    await openAdmin(page, 'talana');
    await adminNav(page, 'کاربران');
    await expect(page.getByRole('heading', { name: 'مدیریت کاربران' })).toBeVisible();
    const rows = page.locator('main div.space-y-2 > div.bg-white');
    await expect(rows).toHaveCount(13);
    await expect(rows.filter({ hasText: '01300000001' })).toContainText('ادمین طلانا');
    await expect(rows.filter({ hasText: '09350000001' })).toContainText('سارا کریمی');
    for (const foreign of ['01300000022', '09350000002']) await expect(rows.filter({ hasText: foreign })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'همه فروشگاه‌ها' })).toHaveCount(0);
    await shot(page, info, SECTION, '05-users');
  });

  test('orders page renders for the marketplace', async ({ page }, info) => {
    await openAdmin(page, 'talana');
    await adminNav(page, 'سفارشات');
    await expect(page.getByPlaceholder('جستجو در سفارشات...')).toBeVisible();
    await expect(page.getByText('سفارشی ثبت نشده')).toBeVisible();
    await shot(page, info, SECTION, '06-orders');
  });
});
