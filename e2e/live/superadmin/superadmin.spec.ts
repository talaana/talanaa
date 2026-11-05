import { test, expect } from '@playwright/test';
import { authFile, openAdmin, adminNav, adminProductsNav, shot, noHorizontalOverflow, isMobile, statCard, openDrawer, closeDrawer } from '../support/helpers';

const SECTION = 'superadmin';
const TENANTS = ['طلانا', 'بازار نقره', 'گالری الماس', 'طلافروشی پارس', 'جواهری تهران'];
const SUPER_NAV = ['داشبورد', 'فروشگاه‌ها', 'سازنده تجربه', 'کاربران', 'نقش‌ها و دسترسی‌ها'];

test.use({ storageState: authFile('superadmin') });

test.describe('Superadmin panel', () => {
  test('dashboard shows platform-wide stats and only superadmin navigation', async ({ page }, info) => {
    await openAdmin(page, null);
    await expect(page.getByRole('heading', { name: 'داشبورد مدیریت' })).toBeVisible();
    await expect(statCard(page, 'کل کاربران')).toBeVisible();
    await expect(statCard(page, 'فروشگاه‌ها').locator('span').first()).toHaveText('۵');
    await expect(statCard(page, 'محصولات')).toHaveCount(0);

    const nav = isMobile(page) ? await openDrawer(page) : page.locator('aside');
    await expect(nav.getByRole('heading', { name: 'طلانا سوپر ادمین' })).toBeVisible();
    await expect(nav.getByText('مدیریت کل پلتفرم')).toBeVisible();
    for (const label of SUPER_NAV) await expect(nav.getByRole('button', { name: label, exact: true })).toBeVisible();
    for (const label of ['سفارشات', 'محصولات', 'فروشندگان', 'داشبورد فروشگاه']) {
      await expect(nav.getByRole('button', { name: label, exact: true })).toHaveCount(0);
    }
    await expect(nav.getByRole('button', { name: 'بازگشت به سایت' })).toBeVisible();
    await shot(page, info, SECTION, isMobile(page) ? '01-dashboard-drawer' : '01-dashboard');
    if (isMobile(page)) {
      await closeDrawer(page);
      await shot(page, info, SECTION, '01-dashboard');
    }
    expect(await noHorizontalOverflow(page)).toBe(0);
  });

  test('tenants page lists all five tenants with impersonation buttons', async ({ page }, info) => {
    await openAdmin(page, null);
    await adminNav(page, 'فروشگاه‌ها');
    await expect(page.getByRole('heading', { name: 'مدیریت فروشگاه‌ها' })).toBeVisible();
    const cards = page.locator('main div.grid > div.bg-white');
    await expect(cards).toHaveCount(5);
    for (const name of TENANTS) await expect(cards.filter({ hasText: name }).first()).toBeVisible();
    await expect(cards.filter({ hasText: 'pars-gold' })).toContainText('فروشگاه');
    await expect(cards.filter({ hasText: 'silver-bazaar' })).toContainText('بازارچه');
    await expect(page.getByRole('button', { name: 'ورود به فروشگاه' })).toHaveCount(5);
    await shot(page, info, SECTION, '02-tenants-list');

    await page.getByRole('button', { name: 'فروشگاه جدید' }).click();
    await expect(page.getByPlaceholder('نام فروشگاه')).toBeVisible();
    await expect(page.getByPlaceholder('slug')).toBeVisible();
    await expect(page.getByPlaceholder('domain.com')).toBeVisible();
    await page.getByPlaceholder('نام فروشگاه').fill('فروشگاه آزمایشی');
    await shot(page, info, SECTION, '03-tenants-new-form');
    await page.getByRole('button', { name: 'لغو' }).click();
    await expect(page.getByPlaceholder('نام فروشگاه')).toHaveCount(0);
    await expect(cards).toHaveCount(5);
  });

  test('impersonating a store scopes the panel to that store and exits cleanly', async ({ page }, info) => {
    await openAdmin(page, null);
    await adminNav(page, 'فروشگاه‌ها');
    await page.locator('main div.grid > div.bg-white').filter({ hasText: 'pars-gold' })
      .getByRole('button', { name: 'ورود به فروشگاه' }).click();
    await expect(page.getByText('در حال بارگذاری پنل مدیریت...')).toBeHidden({ timeout: 15000 });

    await expect(page.getByRole('heading', { name: 'داشبورد مدیریت' })).toBeVisible();
    await expect(statCard(page, 'محصولات').locator('span').first()).toHaveText('۴');
    await expect(statCard(page, 'فروشگاه‌ها')).toHaveCount(0);

    if (isMobile(page)) {
      const drawer = await openDrawer(page);
      await expect(drawer.getByText('حالت سوپر ادمین')).toBeVisible();
      await expect(drawer.getByText('در حال مشاهده: طلافروشی پارس')).toBeVisible();
      await expect(drawer.getByRole('heading', { name: 'طلافروشی پارس' })).toBeVisible();
      await expect(drawer.getByText('پنل مدیریت فروشگاه')).toBeVisible();
      await shot(page, info, SECTION, '04-impersonation-dashboard');
      await drawer.getByRole('button', { name: 'محصولات', exact: true }).click();
      await drawer.getByRole('button', { name: 'همه محصولات' }).click();
    } else {
      await expect(page.getByText('حالت مدیریت سوپر ادمین')).toBeVisible();
      await expect(page.getByText('شما در حال مشاهده و مدیریت فروشگاه «طلافروشی پارس» با دسترسی کامل هستید.')).toBeVisible();
      const aside = page.locator('aside');
      await expect(aside.getByRole('heading', { name: 'طلافروشی پارس' })).toBeVisible();
      await expect(aside.getByText('پنل مدیریت فروشگاه')).toBeVisible();
      await expect(aside.getByRole('button', { name: 'نقش‌ها و دسترسی‌ها' })).toHaveCount(0);
      await shot(page, info, SECTION, '04-impersonation-dashboard');
      await aside.getByRole('button', { name: 'محصولات', exact: true }).click();
      await aside.getByRole('button', { name: 'همه محصولات' }).click();
    }

    await expect(page.getByRole('heading', { name: 'محصولات', exact: true })).toBeVisible();
    const rows = page.locator('main tbody tr');
    await expect(rows).toHaveCount(4);
    for (const row of await rows.all()) await expect(row).toContainText('پارس');
    await shot(page, info, SECTION, '05-impersonation-products');

    if (isMobile(page)) {
      const drawer = await openDrawer(page);
      await drawer.getByRole('button', { name: 'خروج و بازگشت' }).click();
      await expect(page.locator('div.lg\\:hidden.fixed.top-0')).toContainText('سوپر ادمین');
    } else {
      await page.getByRole('button', { name: 'خروج و بازگشت به سوپر ادمین' }).click();
      await expect(page.locator('aside').getByRole('heading', { name: 'طلانا سوپر ادمین' })).toBeVisible();
    }
    await expect(statCard(page, 'فروشگاه‌ها').locator('span').first()).toHaveText('۵');
    await expect(page.getByText('حالت مدیریت سوپر ادمین')).toHaveCount(0);
    await shot(page, info, SECTION, '06-impersonation-exited');
  });

  test('roles page lists roles and opens the permission editor', async ({ page }, info) => {
    await openAdmin(page, null);
    await adminNav(page, 'نقش‌ها و دسترسی‌ها');
    await expect(page.getByRole('heading', { name: 'مدیریت نقش‌ها' })).toBeVisible();
    const roles = page.locator('main div.space-y-2 > div.bg-white');
    await expect.poll(() => roles.count()).toBeGreaterThan(2);
    await expect(roles.first()).toContainText('کاربر');
    await expect(roles.first()).toContainText('دسترسی');
    await shot(page, info, SECTION, '07-roles-list');

    const firstName = (await roles.first().locator('button').first().textContent())!.trim();
    await roles.first().locator('button').first().click();
    await expect(page.getByPlaceholder('نام نقش')).toHaveValue(firstName);
    await expect(page.getByPlaceholder('slug')).not.toHaveValue('');
    await expect(page.getByRole('button', { name: 'ذخیره' })).toBeVisible();
    await shot(page, info, SECTION, '08-roles-edit-form');
    await page.getByRole('button', { name: 'لغو' }).click();
    await expect(page.getByPlaceholder('نام نقش')).toHaveCount(0);
  });

  test('users page lists every user and filters by tenant', async ({ page }, info) => {
    await openAdmin(page, null);
    await adminNav(page, 'کاربران');
    await expect(page.getByRole('heading', { name: 'مدیریت کاربران' })).toBeVisible();
    const rows = page.locator('main div.space-y-2 > div.bg-white');
    await expect.poll(() => rows.count()).toBeGreaterThan(10);
    await expect(rows.filter({ hasText: '09123456789' })).toContainText('احسان مرادی');
    await shot(page, info, SECTION, '09-users-list');

    await page.getByRole('button', { name: 'همه فروشگاه‌ها' }).click();
    await page.getByRole('button', { name: 'طلافروشی پارس', exact: true }).click();
    await expect(page.getByRole('button', { name: 'طلافروشی پارس' }).first()).toBeVisible();
    await expect(rows).toHaveCount(4);
    await expect(rows.filter({ hasText: '01300000022' })).toHaveCount(1);
    await expect(rows.filter({ hasText: '09350000002' })).toHaveCount(1);
    await expect(rows.filter({ hasText: '09123456789' })).toHaveCount(0);
    await shot(page, info, SECTION, '10-users-filtered-pars-gold');
  });

  test('experience builder is reachable from the superadmin nav', async ({ page }, info) => {
    await openAdmin(page, null);
    await adminNav(page, 'سازنده تجربه');
    await expect(page.getByRole('button', { name: 'ذخیره' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'پیش‌نمایش' })).toBeVisible();
    await expect(page.getByText('ویژگی‌های نود')).toBeVisible();
    await expect(page.getByText('/experience/default')).toBeVisible();
    await shot(page, info, SECTION, '11-experience-builder');
  });
});
