import { test, expect } from '@playwright/test';
import { authFile, openAdmin, adminNav, adminProductsNav, adminSidebar, closeDrawer, shot, noHorizontalOverflow, isMobile, statCard } from '../support/helpers';

const SECTION = 'tenant-panel/store-pars-gold';
const STORE_NAV = ['داشبورد فروشگاه', 'سفارشات', 'محصولات', 'سازنده تجربه'];
const CATEGORIES = ['انگشتر', 'گردنبند', 'دستبند', 'گوشواره', 'سرویس', 'شمش', 'سکه', 'طلای دست‌دوم', 'سفارشی‌سازی'];

test.use({ storageState: authFile('storeAdmin') });

test.describe('Store admin panel (طلافروشی پارس)', () => {
  test('dashboard is scoped to the store and hides platform-level navigation', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await expect(page.getByRole('heading', { name: 'داشبورد مدیریت' })).toBeVisible();
    await expect(statCard(page, 'محصولات').locator('span').first()).toHaveText('۴');
    await expect(statCard(page, 'فروشگاه‌ها')).toHaveCount(0);

    const nav = await adminSidebar(page);
    await expect(nav.getByRole('heading', { name: 'طلافروشی پارس' })).toBeVisible();
    await expect(nav.getByText('پنل مدیریت فروشگاه')).toBeVisible();
    for (const label of STORE_NAV) await expect(nav.getByRole('button', { name: label, exact: true })).toBeVisible();
    for (const label of ['فروشگاه‌ها', 'نقش‌ها و دسترسی‌ها', 'فروشندگان', 'کاربران']) {
      await expect(nav.getByRole('button', { name: label, exact: true })).toHaveCount(0);
    }
    await expect(nav.getByRole('button', { name: 'بازگشت به ویترین' })).toBeVisible();
    await expect(page.getByText('طلانا سوپر ادمین')).toHaveCount(0);
    if (isMobile(page)) {
      await shot(page, info, SECTION, '01-dashboard-drawer');
      await closeDrawer(page);
    }
    await shot(page, info, SECTION, '01-dashboard');
    expect(await noHorizontalOverflow(page)).toBe(0);
  });

  test('products page lists only this store\'s products', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminProductsNav(page, 'همه محصولات');
    await expect(page.getByRole('heading', { name: 'محصولات', exact: true })).toBeVisible();
    const rows = page.locator('main tbody tr');
    await expect(rows).toHaveCount(4);
    for (const row of await rows.all()) await expect(row).toContainText('دستبند طلای پارس ۱۸ عیار');

    await page.getByPlaceholder('جستجوی محصول...').fill('گردنبند');
    await expect(page.getByText('محصولی ثبت نشده')).toBeVisible();
    await page.getByPlaceholder('جستجوی محصول...').fill('');
    await expect(rows).toHaveCount(4);
    await shot(page, info, SECTION, '02-products');
  });

  test('new product form opens with its fields and can be cancelled', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminProductsNav(page, 'همه محصولات');
    await page.getByRole('button', { name: 'محصول جدید' }).click();
    await expect(page.getByRole('heading', { name: 'محصول جدید' })).toBeVisible();
    await shot(page, info, SECTION, '03-product-new-form');
    for (const label of ['نام محصول', 'دسته‌بندی', 'فلز', 'وزن (گرم)', 'اجرت (%)', 'مالیات (%)', 'توضیحات']) {
      await expect(page.locator('form').getByText(label, { exact: true })).toBeVisible();
    }
    await page.getByRole('button', { name: 'انصراف' }).click();
    await expect(page.getByRole('heading', { name: 'محصول جدید' })).toHaveCount(0);
  });

  test('categories page lists the nine store categories', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminProductsNav(page, 'دسته‌بندی‌ها');
    await expect(page.getByRole('heading', { name: 'دسته‌بندی‌ها', exact: true })).toBeVisible();
    const rows = page.locator('main tbody tr');
    await expect(rows).toHaveCount(CATEGORIES.length);
    for (const name of CATEGORIES) await expect(rows.locator('td:first-child', { hasText: new RegExp(`^${name}$`) })).toHaveCount(1);
    await expect(rows.filter({ has: page.locator('td:first-child', { hasText: /^دستبند$/ }) }).locator('td').nth(2)).toHaveText('۴');
    await expect(rows.filter({ has: page.locator('td:first-child', { hasText: /^انگشتر$/ }) }).locator('td').nth(2)).toHaveText('۰');
    await shot(page, info, SECTION, '04-categories');
  });

  test('orders page renders for the store', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'سفارشات');
    await expect(page.getByRole('heading', { name: 'سفارشات', exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('جستجو در سفارشات...')).toBeVisible();
    await expect(page.getByText('سفارشی ثبت نشده')).toBeVisible();
    await shot(page, info, SECTION, '05-orders');
  });

  test('experience builder is available inside the store panel', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'سازنده تجربه');
    await expect(page.getByText('ویژگی‌های نود')).toBeVisible();
    await expect(page.getByRole('button', { name: 'سکانس' })).toBeVisible();
    await expect(page.getByText('یک سکانس یا یال ترنزیشن را برای ویرایش انتخاب کنید.')).toBeVisible();
    await shot(page, info, SECTION, '06-experience-builder');
  });

  test('back button returns to the storefront', async ({ page }) => {
    await openAdmin(page, 'pars-gold');
    const nav = await adminSidebar(page);
    await nav.getByRole('button', { name: 'بازگشت به ویترین' }).click();
    await expect(page).toHaveURL(/tenant=pars-gold#\/$/);
    await expect(page.getByText('داشبورد مدیریت')).toHaveCount(0);
  });
});
