import { test, expect } from '@playwright/test';
import { authFile, openAdmin, adminNav, shot } from '../support/helpers';

const SECTION = 'tenant-panel/wallet';

test.use({ storageState: authFile('storeAdmin') });

async function selectFirstUserAndWaitForWallet(page: import('@playwright/test').Page) {
  const userButton = page.locator('div.space-y-2 button').first();
  await expect(userButton).toBeVisible({ timeout: 10000 });
  await userButton.click();
  // Wait for wallet details to load — the gold wallet card appears after API response
  await expect(page.locator('div.bg-amber-50').first()).toBeVisible({ timeout: 10000 });
}

test.describe('Wallet management (کیف پول)', () => {
  test.beforeEach(async ({ page }) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'مالی');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'کیف پول', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'مدیریت کیف پول', exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('wallet page loads with heading and user list', async ({ page }, info) => {
    await expect(page.getByText('واریز و برداشت از کیف پول کاربران')).toBeVisible();
    await expect(page.getByPlaceholder('جستجوی کاربر...')).toBeVisible();
    await shot(page, info, SECTION, '01-wallet-page');
  });

  test('select user shows wallet details', async ({ page }, info) => {
    await selectFirstUserAndWaitForWallet(page);

    await expect(page.locator('div.bg-amber-50').getByText('طلا', { exact: true })).toBeVisible();
    await expect(page.locator('div.bg-slate-50').getByText('نقره', { exact: true })).toBeVisible();
    await expect(page.locator('div.bg-emerald-50').getByText('نقدی', { exact: true })).toBeVisible();

    await shot(page, info, SECTION, '02-wallet-details');
  });

  test('deposit form opens with all fields', async ({ page }, info) => {
    await selectFirstUserAndWaitForWallet(page);

    await page.getByRole('button', { name: 'واریز' }).click();
    await expect(page.getByRole('heading', { name: 'واریز به کیف پول' })).toBeVisible();

    await expect(page.locator('form').getByText('نقدی', { exact: true })).toBeVisible();
    await expect(page.locator('form').getByText('طلا', { exact: true })).toBeVisible();
    await expect(page.locator('form').getByText('نقره', { exact: true })).toBeVisible();
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await expect(page.getByPlaceholder('توضیحات عملیات...')).toBeVisible();
    await shot(page, info, SECTION, '03-deposit-form');

    await page.getByRole('button', { name: 'انصراف' }).click();
    await expect(page.getByRole('heading', { name: 'واریز به کیف پول' })).toHaveCount(0);
  });

  test('deposit cash to user wallet', async ({ page }, info) => {
    await selectFirstUserAndWaitForWallet(page);

    await page.getByRole('button', { name: 'واریز' }).click();
    await expect(page.getByRole('heading', { name: 'واریز به کیف پول' })).toBeVisible();

    await page.locator('form').getByText('نقدی', { exact: true }).click();

    await page.locator('input[type="number"]').fill('1000000');
    await page.getByPlaceholder('توضیحات عملیات...').fill('تست واریز اتوماسیون');

    // Submit — scope to form to avoid matching the wallet deposit button
    await page.locator('form').getByRole('button', { name: 'واریز' }).click();

    await expect(page.getByText('واریز با موفقیت انجام شد')).toBeVisible({ timeout: 10000 });
    await shot(page, info, SECTION, '04-deposit-success');
  });

  test('withdraw form opens correctly', async ({ page }, info) => {
    await selectFirstUserAndWaitForWallet(page);

    await page.getByRole('button', { name: 'برداشت از کیف پول' }).click();
    await expect(page.getByRole('heading', { name: 'برداشت از کیف پول' })).toBeVisible();

    await shot(page, info, SECTION, '05-withdraw-form');

    await page.getByRole('button', { name: 'انصراف' }).click();
  });

  test('switch between metal types in form', async ({ page }, info) => {
    await selectFirstUserAndWaitForWallet(page);

    await page.getByRole('button', { name: 'واریز' }).click();

    await page.locator('form').getByText('طلا', { exact: true }).click();
    await expect(page.locator('input[type="number"]')).toBeVisible();

    await page.locator('form').getByText('نقره', { exact: true }).click();
    await expect(page.locator('input[type="number"]')).toBeVisible();

    await page.locator('form').getByText('نقدی', { exact: true }).click();
    await expect(page.locator('input[type="number"]')).toBeVisible();

    await shot(page, info, SECTION, '06-metal-types');

    await page.getByRole('button', { name: 'انصراف' }).click();
  });

  test('search users filters list', async ({ page }, info) => {
    await page.getByPlaceholder('جستجوی کاربر...').fill('تست');
    await page.waitForTimeout(500);
    await shot(page, info, SECTION, '07-users-search');
    await page.getByPlaceholder('جستجوی کاربر...').clear();
  });
});
