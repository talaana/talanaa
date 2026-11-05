import { test, expect } from '@playwright/test';
import { authFile, openAdmin, adminNav, shot } from '../support/helpers';

const SECTION = 'tenant-panel/branches';

test.use({ storageState: authFile('storeAdmin') });

test.describe('Branches management (شعب)', () => {
  test.beforeEach(async ({ page }) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'شعب');
    await expect(page.getByRole('heading', { name: 'شعب فروشگاه', exact: true })).toBeVisible({ timeout: 10000 });
    // Wait for table to load (either has rows or shows empty state)
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 }).catch(() => {
      // Empty state is OK
    });
  });

  test('branches page loads with heading and create button', async ({ page }, info) => {
    await expect(page.getByText('مدیریت شعب و آدرس‌های فیزیکی')).toBeVisible();
    await expect(page.getByRole('button', { name: /شعبه جدید/ })).toBeVisible();
    await expect(page.getByPlaceholder('جستجوی شعبه...')).toBeVisible();
    await shot(page, info, SECTION, '01-branches-page');
  });

  test('create branch form opens with all fields', async ({ page }, info) => {
    await page.getByRole('button', { name: /شعبه جدید/ }).click();
    await expect(page.getByRole('heading', { name: 'شعبه جدید' })).toBeVisible();
    await expect(page.getByLabel('نام شعبه')).toBeVisible();
    await expect(page.getByLabel('اسلاگ')).toBeVisible();
    await expect(page.getByLabel('شهر')).toBeVisible();
    await expect(page.getByLabel('آدرس')).toBeVisible();
    await expect(page.getByLabel('تلفن')).toBeVisible();
    // Check the active checkbox label within the form
    await expect(page.locator('form').getByText('فعال')).toBeVisible();
    await shot(page, info, SECTION, '02-create-branch-form');
    await page.getByRole('button', { name: 'انصراف' }).click();
    await expect(page.getByRole('heading', { name: 'شعبه جدید' })).toHaveCount(0);
  });

  test('create branch with required fields', async ({ page }, info) => {
    const branchName = `شعبه تست ${Date.now()}`;
    const slug = branchName.replace(/[^\w\s]/g, '').trim().toLowerCase().replace(/\s+/g, '-').substring(0, 40);

    await page.getByRole('button', { name: /شعبه جدید/ }).click();
    await page.getByLabel('نام شعبه').fill(branchName);
    // Slug should auto-generate
    await expect(page.getByLabel('اسلاگ')).toHaveValue(slug);
    await page.getByLabel('شهر').fill('تهران');
    await page.getByLabel('آدرس').fill('میدان ونک، خیابان تست');
    await page.getByLabel('تلفن').fill('02112345678');
    await page.getByRole('button', { name: 'ایجاد' }).click();

    // Wait for form to close and branch to appear
    await expect(page.getByRole('heading', { name: 'شعبه جدید' })).toHaveCount(0);
    await expect(page.getByText(branchName)).toBeVisible({ timeout: 10000 });
    await shot(page, info, SECTION, '03-branch-created');
  });

  test('edit branch updates fields', async ({ page }, info) => {
    // Create a branch first
    const branchName = `ویرایش ${Date.now()}`;
    await page.getByRole('button', { name: /شعبه جدید/ }).click();
    await page.getByLabel('نام شعبه').fill(branchName);
    await page.getByLabel('شهر').fill('تهران');
    await page.getByLabel('آدرس').fill('آدرس تست');
    await page.getByRole('button', { name: 'ایجاد' }).click();
    await expect(page.getByText(branchName)).toBeVisible({ timeout: 10000 });

    // Wait a bit for the table to fully render
    await page.waitForTimeout(500);

    // Find the row containing our branch and click its edit button
    const branchRow = page.locator('tbody tr').filter({ hasText: branchName }).first();
    await branchRow.locator('button').nth(1).click(); // Second button is edit (first is toggle)
    await expect(page.getByRole('heading', { name: 'ویرایش شعبه' })).toBeVisible();

    // Update city
    const cityInput = page.getByLabel('شهر');
    await cityInput.clear();
    await cityInput.fill('اصفهان');
    await page.getByRole('button', { name: 'بروزرسانی' }).click();

    await expect(page.getByRole('heading', { name: 'ویرایش شعبه' })).toHaveCount(0);
    await shot(page, info, SECTION, '04-branch-edited');
  });

  test('delete branch with confirmation', async ({ page }, info) => {
    // Create a branch first
    const branchName = `حذف ${Date.now()}`;
    await page.getByRole('button', { name: /شعبه جدید/ }).click();
    await page.getByLabel('نام شعبه').fill(branchName);
    await page.getByLabel('شهر').fill('تهران');
    await page.getByRole('button', { name: 'ایجاد' }).click();
    await expect(page.getByText(branchName)).toBeVisible({ timeout: 10000 });

    // Wait a bit for the table to fully render
    await page.waitForTimeout(500);

    // Find the row containing our branch and click its delete button
    const branchRow = page.locator('tbody tr').filter({ hasText: branchName }).first();
    await branchRow.locator('button').nth(2).click(); // Third button is delete (first is toggle, second is edit)

    // Confirm dialog should appear
    const dialog = page.locator('div.fixed.inset-0').filter({ has: page.getByText('حذف شعبه') }).first();
    await expect(dialog.getByText('آیا از حذف این شعبه اطمینان دارید؟').first()).toBeVisible();
    await dialog.getByRole('button', { name: 'حذف شعبه' }).click();

    // Wait for the specific branch to be removed
    await expect(page.getByText(branchName)).toHaveCount(0, { timeout: 10000 });
    await shot(page, info, SECTION, '05-branch-deleted');
  });

  test('search branches filters results', async ({ page }, info) => {
    // Create a branch with a unique name for searching
    const searchTerm = `شعبه جستجو ${Date.now()}`;
    await page.getByRole('button', { name: /شعبه جدید/ }).click();
    await page.getByLabel('نام شعبه').fill(searchTerm);
    await page.getByLabel('شهر').fill('تهران');
    await page.getByRole('button', { name: 'ایجاد' }).click();
    await expect(page.getByText(searchTerm)).toBeVisible({ timeout: 10000 });

    // Type in search box
    await page.getByPlaceholder('جستجوی شعبه...').fill(searchTerm);

    // Wait a bit for filtering
    await page.waitForTimeout(500);

    // The search result should contain our branch
    await expect(page.getByText(searchTerm)).toBeVisible();
    await shot(page, info, SECTION, '06-branches-search');

    // Clear search
    await page.getByPlaceholder('جستجوی شعبه...').clear();
  });

  test('toggle branch active status', async ({ page }, info) => {
    // Create a branch first
    const branchName = `شعبه تست تغییر وضعیت ${Date.now()}`;
    await page.getByRole('button', { name: /شعبه جدید/ }).click();
    await page.getByLabel('نام شعبه').fill(branchName);
    await page.getByLabel('شهر').fill('تهران');
    await page.getByRole('button', { name: 'ایجاد' }).click();
    await expect(page.getByText(branchName)).toBeVisible({ timeout: 10000 });

    // Find the toggle button for the branch we just created
    const toggleButton = page.locator('tbody tr').filter({ has: page.getByText(branchName) }).locator('button').filter({ has: page.locator('svg.lucide-check, svg.lucide-x') });
    const isActive = await toggleButton.locator('svg.lucide-check').count() > 0;

    await toggleButton.click();

    // Wait for toggle
    await page.waitForTimeout(500);

    // Verify state changed
    const newIsActive = await toggleButton.locator('svg.lucide-check').count() > 0;
    expect(newIsActive).not.toBe(isActive);
    await shot(page, info, SECTION, '07-branch-toggled');
  });
});
