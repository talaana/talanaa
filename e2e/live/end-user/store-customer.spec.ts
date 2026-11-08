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

  // The statutory rate is versioned per tax year on the server; the storefront must render that
  // rate, not a number hard-coded into the UI. The test forces the first product's tax override
  // to null and rewrites the API response so the UI has to fall back on the server-resolved
  // `effective_tax_percentage`. Before the fix the label read "مالیات ... (۹٪ ...)" verbatim and
  // the tax amount was computed with a client-side 9%, both of which are wrong in 1405+.
  test('product detail shows the statutory rate, not a hard-coded 9%', async ({ page }) => {
    // The statutory rate for tax year 1405 is 10%. The backend schedule is tested in PHPUnit;
    // here we just verify the UI doesn't hard-code 9%.
    const statutory = 10;

    // Rewrite the product listing so the first item has no override and its effective rate
    // is the statutory rate. The UI must use that value, not a baked-in 9.
    await page.route(`**/api/products*`, async route => {
      if (route.request().method() !== 'GET') return route.continue();
      const response = await route.fetch();
      const body = await response.json();
      const data = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      if (data[0]) {
        data[0] = { ...data[0], tax_percentage: null, effective_tax_percentage: statutory };
      }
      await route.fulfill({ response, json: Array.isArray(body?.data) ? { ...body, data } : data });
    });

    await appTab(page, 'محصولات');
    await page.locator('#products-grid h4').first().click();
    await expect(page.getByText('جزئیات و ساخت فاکتور رسمی')).toBeVisible();

    // The label must not hard-code ۹٪.
    const vatLabel = page.locator('#product-detail-page').getByText(/مالیات بر ارزش افزوده/);
    await expect(vatLabel).toBeVisible({ timeout: 15000 });
    await expect(vatLabel).not.toContainText('۹٪');
    // The UI renders the rate in Persian digits via toPersianDigits().
    const persianRate = String(statutory).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
    await expect(vatLabel).toContainText(`${persianRate}٪`);
  });
});
