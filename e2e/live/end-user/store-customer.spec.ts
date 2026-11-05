import { test, expect } from '@playwright/test';
import { authFile, appNav, appTab, shot, tenantUrl, noHorizontalOverflow, isMobile, USERS } from '../support/helpers';

const SECTION = 'end-user/store-customer';

test.use({ storageState: authFile('storeCustomer') });

test.describe('Store customer (علی رضایی @ طلافروشی پارس)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(tenantUrl('pars-gold', '#/'), { waitUntil: 'domcontentloaded' });
    await expect(appNav(page).getByRole('button', { name: 'خانه', exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test('home uses store branding and store navigation', async ({ page }, info) => {
    const nav = isMobile(page) ? page.locator('nav.lg\\:hidden.fixed.bottom-0') : page.locator('aside nav');
    await expect(nav.getByRole('button', { name: 'محصولات', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'ویترین', exact: true })).toHaveCount(0);
    await expect(page.getByText('طلافروشی پارس').filter({ visible: true }).first()).toBeVisible();
    await expect.poll(() => page.locator('#home-compact-vitrine .grid button').count()).toBeGreaterThan(0);
    await shot(page, info, SECTION, '01-home');
    expect(await noHorizontalOverflow(page)).toBe(0);
  });

  test('products tab shows only this store\'s products with store branding', async ({ page }, info) => {
    await appTab(page, 'محصولات');
    await expect(page.getByRole('heading', { name: 'ویترین زیورآلات طلایی طلافروشی پارس' })).toBeVisible();
    await expect(page.getByText('مارکت‌پلیس زیورآلات')).toHaveCount(0);
    const cards = page.locator('#products-grid h4');
    await expect(cards).toHaveCount(4);
    for (const title of await cards.allTextContents()) expect(title).toBe('دستبند طلای پارس ۱۸ عیار');
    await expect(page.locator('main').getByText('گالری زرین')).toHaveCount(0);
    await shot(page, info, SECTION, '02-products');
  });

  test('product detail opens for a store product', async ({ page }, info) => {
    await appTab(page, 'محصولات');
    await page.locator('#products-grid h4').first().click();
    await expect(page.getByText('جزئیات و ساخت فاکتور رسمی')).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: 'دستبند طلای پارس ۱۸ عیار' })).toBeVisible();
    await expect(page.getByText(/قیمت نهایی فاکتور رسمی:/)).toBeVisible();
    await expect(page.getByText(/^غرفه:/)).toHaveCount(0);
    await shot(page, info, SECTION, '03-product-detail');
  });
});
