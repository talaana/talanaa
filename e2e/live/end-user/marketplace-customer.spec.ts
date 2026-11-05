import { test, expect } from '@playwright/test';
import { authFile, appNav, appTab, shot, tenantUrl, noHorizontalOverflow, USERS } from '../support/helpers';

const SECTION = 'end-user/marketplace-customer';

test.use({ storageState: authFile('marketplaceCustomer') });

test.describe('Marketplace customer (سارا کریمی @ طلانا)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(tenantUrl('talana', '#/'), { waitUntil: 'domcontentloaded' });
    await expect(appNav(page).getByRole('button', { name: 'خانه', exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test('home shows wallet, quick services and no admin entry', async ({ page }, info) => {
    await expect(page.getByText('موجودی کیف پول').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'دسترسی سریع و خدمات طلانا' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'نمودار قیمت طلا' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'پنل مدیریت' })).toHaveCount(0);
    const tiles = page.locator('#home-compact-vitrine .grid button');
    await expect(tiles).toHaveCount(8);
    await shot(page, info, SECTION, '01-home');
    expect(await noHorizontalOverflow(page)).toBe(0);

    await tiles.filter({ hasText: 'شمش' }).click();
    await expect(page.getByRole('heading', { name: 'مارکت‌پلیس زیورآلات طلایی طلانا' })).toBeVisible();
    await expect(page.locator('#products-grid h4').first()).toContainText('شمش');
  });

  test('vitrine lists marketplace products from several sellers and filters by category', async ({ page }, info) => {
    await appTab(page, 'ویترین');
    await expect(page.getByRole('heading', { name: 'مارکت‌پلیس زیورآلات طلایی طلانا' })).toBeVisible();
    const cards = page.locator('#products-grid h4');
    await expect.poll(() => cards.count()).toBeGreaterThan(5);
    await expect(page.locator('main').getByText('گالری زرین').first()).toBeVisible();
    await expect(page.locator('main').getByText('دستبند طلای پارس')).toHaveCount(0);
    await shot(page, info, SECTION, '02-vitrine');

    await page.locator('main').getByRole('button', { name: 'شمش', exact: true }).click();
    await expect(cards.first()).toContainText('شمش');
    for (const title of await cards.allTextContents()) expect(title).toContain('شمش');
    await shot(page, info, SECTION, '03-vitrine-category-shemsh');
  });

  test('switching to silver changes the vitrine to silver products', async ({ page }, info) => {
    await appTab(page, 'ویترین');
    await page.getByRole('button', { name: 'نقره', exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByRole('heading', { name: 'مارکت‌پلیس زیورآلات نقره‌ای طلانا' })).toBeVisible();
    const cards = page.locator('#products-grid h4');
    await expect(cards.first()).toContainText('نقره');
    for (const title of await cards.allTextContents()) expect(title).toContain('نقره');
    await shot(page, info, SECTION, '04-vitrine-silver');
  });

  test('product detail shows the official invoice breakdown', async ({ page }, info) => {
    await appTab(page, 'ویترین');
    const first = page.locator('#products-grid h4').first();
    await expect(first).toBeVisible();
    const title = (await first.textContent())!.trim();
    await first.click();
    await expect(page.getByText('جزئیات و ساخت فاکتور رسمی')).toBeVisible();
    await expect(page.getByRole('heading', { level: 3, name: title })).toBeVisible();
    await expect(page.getByText(/^غرفه: \S+/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'فرمول رسمی صنف طلا و جواهر' })).toBeVisible();
    await expect(page.getByText(/قیمت نهایی فاکتور رسمی:/)).toBeVisible();
    await expect(page.getByRole('button', { name: /پرداخت آنلاین نقدی فاکتور/ })).toBeVisible();
    await shot(page, info, SECTION, '05-product-detail');
    await page.getByRole('button', { name: 'بازگشت به ویترین' }).click();
    await expect(page.getByRole('heading', { name: 'مارکت‌پلیس زیورآلات طلایی طلانا' })).toBeVisible();
  });

  test('trade tab converts grams to toman', async ({ page }, info) => {
    await appTab(page, 'خرید و فروش');
    await expect(page.getByRole('button', { name: 'خرید طلا', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'فروش طلا', exact: true })).toBeVisible();
    const toman = page.getByPlaceholder('مثلاً ۵,۰۰۰,۰۰۰');
    await expect(toman).toHaveValue('');
    await page.getByRole('button', { name: '۱ گرم' }).click();
    await expect(page.locator('#input-trade-grams')).toHaveValue('۱');
    await expect(toman).toHaveValue(/^[۱-۹][۰-۹]{0,2}(,[۰-۹]{3})+$/);
    await expect(page.getByRole('button', { name: 'تأیید خرید طلای ۱۸ عیار' })).toBeVisible();
    await shot(page, info, SECTION, '06-trade-buy-1g');
  });

  test('services, notifications and profile tabs show their content', async ({ page }, info) => {
    await appTab(page, 'خدمات');
    await expect(page.getByText('لیست خدمات طلا')).toBeVisible();
    await expect(page.getByRole('button', { name: 'وام آنی بدون ضامن' })).toBeVisible();
    await shot(page, info, SECTION, '07-services');

    await appTab(page, 'اعلان‌ها');
    await expect(page.getByText('اطلاع‌رسانی و اخبار طلانا')).toBeVisible();
    await expect(page.getByText('افزایش قیمت طلا')).toBeVisible();
    await shot(page, info, SECTION, '08-notifications');
    await page.getByRole('button', { name: 'بازگشت' }).click();

    await appTab(page, 'پروفایل');
    await expect(page.getByText('پروفایل کاربری طلانا')).toBeVisible();
    await expect(page.locator('main').getByText(USERS.marketplaceCustomer.name).first()).toBeVisible();
    await expect(page.locator('main').getByText('۰۹۳۵ ۰۰۰ ۰۰۰۱')).toBeVisible();
    await shot(page, info, SECTION, '09-profile');
  });

  test('a customer opening the admin panel is denied', async ({ page }, info) => {
    await page.goto(tenantUrl('talana', '#/admin'), { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('خطا در بارگذاری')).toBeVisible();
    await expect(page.getByText('دسترسی غیرمجاز')).toBeVisible();
    await shot(page, info, SECTION, '10-admin-denied');
    await page.getByRole('button', { name: 'بازگشت به سایت' }).click();
    await expect(page).toHaveURL(/tenant=talana#\/$/);
    await expect(appNav(page).getByRole('button', { name: 'خانه', exact: true })).toBeVisible();
    await expect(page.getByText('موجودی کیف پول').first()).toBeVisible();
  });
});
