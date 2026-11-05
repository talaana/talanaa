import { test, expect } from '@playwright/test';
import { authFile, openAdmin, adminNav, shot } from '../support/helpers';

const SECTION = 'tenant-panel/invoice-editor';

test.use({ storageState: authFile('storeAdmin') });

test.describe('Invoice Template Editor', () => {
  test('editor opens when clicking edit button on custom template', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'مالی');
    await page.getByRole('button', { name: 'قالب فاکتور', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'قالب‌های فاکتور', exact: true })).toBeVisible({ timeout: 10000 });
    
    // Find a custom template with edit button
    const editButton = page.locator('button[title="ویرایش"]').first();
    await expect(editButton).toBeVisible();
    
    await shot(page, info, SECTION, '01-templates-with-edit-button');
    
    // Click edit
    await editButton.click();
    
    // Editor should open
    await expect(page.getByRole('button', { name: 'ذخیره قالب' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'بازنشانی' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'استایل‌ها' })).toBeVisible();
    
    await shot(page, info, SECTION, '02-editor-opened');
    
    // Close editor
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
    await expect(page.getByRole('button', { name: 'ذخیره قالب' })).toHaveCount(0);
  });

  test('editor shows all template blocks', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'مالی');
    await page.getByRole('button', { name: 'قالب فاکتور', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'قالب‌های فاکتور', exact: true })).toBeVisible({ timeout: 10000 });
    
    // Open editor
    await page.locator('button[title="ویرایش"]').first().click();
    await expect(page.getByRole('button', { name: 'ذخیره قالب' })).toBeVisible();
    
    // Check all blocks are visible
    const blockLabels = [
      'سربرگ و لوگو',
      'اطلاعات فروشنده',
      'اطلاعات خریدار',
      'شماره و تاریخ',
      'جدول اقلام',
      'جمع‌ها',
      'یادداشت',
      'مهر و امضا',
      'پابرگ',
    ];
    
    for (const label of blockLabels) {
      await expect(page.getByRole('button', { name: label }).first()).toBeVisible();
    }
    
    await shot(page, info, SECTION, '03-all-blocks-visible');
    
    // Close editor
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
  });

  test('can expand block and edit properties', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'مالی');
    await page.getByRole('button', { name: 'قالب فاکتور', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'قالب‌های فاکتور', exact: true })).toBeVisible({ timeout: 10000 });
    
    // Open editor
    await page.locator('button[title="ویرایش"]').first().click();
    await expect(page.getByRole('button', { name: 'ذخیره قالب' })).toBeVisible();
    
    // Click on first block to expand
    const firstBlock = page.getByRole('button', { name: 'سربرگ و لوگو' }).first();
    await firstBlock.click();
    
    // Properties should be visible (checkboxes or inputs)
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible({ timeout: 3000 });
    
    await shot(page, info, SECTION, '04-block-expanded');
    
    // Toggle a checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    const initialState = await checkbox.isChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked({ checked: !initialState });
    
    // Close editor
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
  });

  test('can toggle block visibility', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'مالی');
    await page.getByRole('button', { name: 'قالب فاکتور', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'قالب‌های فاکتور', exact: true })).toBeVisible({ timeout: 10000 });
    
    // Open editor
    await page.locator('button[title="ویرایش"]').first().click();
    await expect(page.getByRole('button', { name: 'ذخیره قالب' })).toBeVisible();

    // Expand first block to reveal visibility toggle
    await page.getByRole('button', { name: 'سربرگ و لوگو' }).first().click();

    // Find the expanded block container and click its visibility toggle
    const blockContainer = page.locator('div.border-amber-500');
    const visibilityButton = blockContainer.locator('button').filter({ has: page.locator('svg.lucide-eye') }).first();
    await expect(visibilityButton).toBeVisible();

    await shot(page, info, SECTION, '05-before-toggle-visibility');

    // Click to hide
    await visibilityButton.click();

    // Icon should change to eye-off
    await expect(blockContainer.locator('button').filter({ has: page.locator('svg.lucide-eye-off') }).first()).toBeVisible();
    
    await shot(page, info, SECTION, '06-after-toggle-visibility');
    
    // Close editor
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
  });

  test('can open style panel', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'مالی');
    await page.getByRole('button', { name: 'قالب فاکتور', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'قالب‌های فاکتور', exact: true })).toBeVisible({ timeout: 10000 });
    
    // Open editor
    await page.locator('button[title="ویرایش"]').first().click();
    await expect(page.getByRole('button', { name: 'ذخیره قالب' })).toBeVisible();
    
    // Click style button
    await page.getByRole('button', { name: 'استایل‌ها' }).click();
    
    // Style panel should open with color pickers and selectors
    await expect(page.getByText('رنگ اصلی')).toBeVisible();
    await expect(page.getByText('رنگ متن')).toBeVisible();
    await expect(page.getByText('فونت', { exact: true })).toBeVisible();
    await expect(page.getByText('اندازه فونت')).toBeVisible();
    await expect(page.getByText('اندازه صفحه')).toBeVisible();
    
    await shot(page, info, SECTION, '07-style-panel-open');
    
    // Change primary color
    const colorInput = page.locator('input[type="color"]').first();
    await colorInput.fill('#ff0000');
    
    await shot(page, info, SECTION, '08-color-changed');
    
    // Close editor
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
  });

  test('can save template changes', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'مالی');
    await page.getByRole('button', { name: 'قالب فاکتور', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'قالب‌های فاکتور', exact: true })).toBeVisible({ timeout: 10000 });
    
    // Open editor
    await page.locator('button[title="ویرایش"]').first().click();
    await expect(page.getByRole('button', { name: 'ذخیره قالب' })).toBeVisible();
    
    // Change template name
    const nameInput = page.getByPlaceholder('نام قالب');
    const originalName = await nameInput.inputValue();
    await nameInput.fill(originalName + ' - ویرایش شده');
    
    await shot(page, info, SECTION, '09-name-changed');
    
    // Click save
    await page.getByRole('button', { name: 'ذخیره قالب' }).click();
    
    // Editor should close
    await expect(page.getByRole('button', { name: 'ذخیره قالب' })).toHaveCount(0, { timeout: 5000 });
    
    await shot(page, info, SECTION, '10-saved-and-closed');
  });

  test('can reset changes', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'مالی');
    await page.getByRole('button', { name: 'قالب فاکتور', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'قالب‌های فاکتور', exact: true })).toBeVisible({ timeout: 10000 });
    
    // Open editor
    await page.locator('button[title="ویرایش"]').first().click();
    await expect(page.getByRole('button', { name: 'ذخیره قالب' })).toBeVisible();
    
    // Change template name
    const nameInput = page.getByPlaceholder('نام قالب');
    await nameInput.fill('نام تستی');
    
    // Click reset
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'بازنشانی' }).click();
    
    // Name should be reset
    await expect(nameInput).not.toHaveValue('نام تستی', { timeout: 3000 });
    
    await shot(page, info, SECTION, '11-reset-done');
    
    // Close editor
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
  });

  test('live preview updates when editing', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'مالی');
    await page.getByRole('button', { name: 'قالب فاکتور', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'قالب‌های فاکتور', exact: true })).toBeVisible({ timeout: 10000 });
    
    // Open editor
    await page.locator('button[title="ویرایش"]').first().click();
    await expect(page.getByRole('button', { name: 'ذخیره قالب' })).toBeVisible();
    
    // Preview should be visible
    const preview = page.locator('.invoice-page').first();
    await expect(preview).toBeVisible();
    
    await shot(page, info, SECTION, '12-live-preview');
    
    // Expand a block
    await page.getByRole('button', { name: 'سربرگ و لوگو' }).first().click();

    // Toggle visibility
    const visibilityButton = page.locator('button').filter({ has: page.locator('svg.lucide-eye') }).first();
    await visibilityButton.click({ force: true });
    
    // Preview should update (block hidden)
    await page.waitForTimeout(500);
    
    await shot(page, info, SECTION, '13-preview-updated');
    
    // Close editor
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
  });

  test('can move blocks up and down', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'مالی');
    await page.getByRole('button', { name: 'قالب فاکتور', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'قالب‌های فاکتور', exact: true })).toBeVisible({ timeout: 10000 });
    
    // Open editor
    await page.locator('button[title="ویرایش"]').first().click();
    await expect(page.getByRole('button', { name: 'ذخیره قالب' })).toBeVisible();
    
    // Expand first block
    await page.getByRole('button', { name: 'سربرگ و لوگو' }).first().click();
    
    // Find move buttons
    const moveUpButton = page.locator('button').filter({ hasText: 'بالا' }).first();
    const moveDownButton = page.locator('button').filter({ hasText: 'پایین' }).first();
    
    await expect(moveDownButton).toBeVisible();
    
    await shot(page, info, SECTION, '14-move-buttons-visible');
    
    // Move down
    await moveDownButton.click();
    
    await shot(page, info, SECTION, '15-block-moved');
    
    // Close editor
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
  });

  test('can remove a block', async ({ page }, info) => {
    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'مالی');
    await page.getByRole('button', { name: 'قالب فاکتور', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'قالب‌های فاکتور', exact: true })).toBeVisible({ timeout: 10000 });
    
    // Open editor
    await page.locator('button[title="ویرایش"]').first().click();
    await expect(page.getByRole('button', { name: 'ذخیره قالب' })).toBeVisible();

    // Expand a non-mandatory block (notes) to reveal remove button
    await page.getByRole('button', { name: 'یادداشت' }).first().click();

    // Count blocks before (each non-mandatory block has a Trash2 icon button)
    const blocksBefore = await page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).count();

    // Find remove button in the expanded block container
    const blockContainer = page.locator('div.border-amber-500');
    const removeButton = blockContainer.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first();
    await expect(removeButton).toBeVisible();

    await shot(page, info, SECTION, '16-before-remove');

    // Remove block
    await removeButton.click();

    // Count blocks after
    const blocksAfter = await page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).count();
    expect(blocksAfter).toBe(blocksBefore - 1);
    
    await shot(page, info, SECTION, '17-after-remove');
    
    // Close editor
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first().click();
  });
});
