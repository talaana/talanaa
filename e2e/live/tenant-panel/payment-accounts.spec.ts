import { test, expect, type Page } from '@playwright/test';
import { authFile, openAdmin, adminSidebar, shot } from '../support/helpers';

const SECTION = 'tenant-panel/payment-accounts';

test.use({ storageState: authFile('storeAdmin') });

/**
 * Opens a sub-page of the مالی accordion. The accordion toggles on click, so re-clicking مالی
 * after it is already open would collapse it and hide the sub-item; only expand when needed.
 */
async function financialNav(page: Page, sub: string) {
  const nav = await adminSidebar(page);
  const subBtn = nav.getByRole('button', { name: sub, exact: true });
  if (!(await subBtn.isVisible())) await nav.getByRole('button', { name: 'مالی', exact: true }).click();
  await subBtn.click();
}

async function gotoPaymentAccounts(page: Page) {
  await financialNav(page, 'حساب‌های پرداخت');
  await expect(page.getByRole('heading', { name: 'حساب‌های پرداخت', exact: true })).toBeVisible();
}

async function gotoInvoices(page: Page) {
  await financialNav(page, 'فاکتورها');
  await expect(page.getByRole('heading', { name: 'فاکتورها', exact: true })).toBeVisible();
}

/** Opens the create-account form. Labels have no htmlFor, so fields are found by placeholder. */
async function openAccountForm(page: Page) {
  await page.getByRole('button', { name: 'حساب جدید' }).click();
  await expect(page.getByRole('heading', { name: 'حساب جدید' })).toBeVisible();
}

const typeSelect = (page: Page) => page.locator('div.fixed.inset-0 select').first();

/** Creates a card-type payment account and returns the unique card number used. */
async function createCardAccount(page: Page, holder: string): Promise<string> {
  const cardNumber = `6104-3333-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  await openAccountForm(page);
  await typeSelect(page).selectOption('card');
  await page.getByPlaceholder('مثلاً: ملت، ملی، پاسارگاد').fill('ملت');
  await page.getByPlaceholder('نام و نام خانوادگی').fill(holder);
  await page.getByPlaceholder('XXXX-XXXX-XXXX-XXXX').fill(cardNumber);
  await page.getByRole('button', { name: 'ذخیره' }).click();
  await expect(page.getByRole('heading', { name: 'حساب جدید' })).toHaveCount(0);
  await expect(page.getByText(cardNumber, { exact: true })).toBeVisible({ timeout: 10000 });
  return cardNumber;
}

/** The account card that displays a given card number. */
const accountCard = (page: Page, cardNumber: string) =>
  page.locator('div.bg-white.rounded-2xl.p-5').filter({ hasText: cardNumber });

/** The star badge shown on the default account. */
const defaultBadge = (page: Page, cardNumber: string) =>
  accountCard(page, cardNumber).getByText('پیش‌فرض', { exact: true });

/** Deletes an account card, accepting the confirm() dialog. */
async function deleteAccount(page: Page, cardNumber: string) {
  page.once('dialog', d => d.accept());
  await accountCard(page, cardNumber).locator('button:has(svg.lucide-trash-2)').click();
  await expect(page.getByText(cardNumber, { exact: true })).toHaveCount(0, { timeout: 10000 });
}

test.describe('Payment accounts (حساب‌های پرداخت)', () => {
  test.beforeEach(async ({ page }) => {
    await openAdmin(page, 'pars-gold');
    await gotoPaymentAccounts(page);
  });

  test('page loads with heading, subtitle and create button', async ({ page }, info) => {
    await expect(page.getByText('مدیریت حساب‌ها و کارت‌های بانکی برای دریافت پرداخت')).toBeVisible();
    await expect(page.getByRole('button', { name: 'حساب جدید' })).toBeVisible();
    await shot(page, info, SECTION, '01-payment-accounts-page');
  });

  test('create form toggles fields by account type', async ({ page }, info) => {
    await openAccountForm(page);

    // Default type is bank_account → account number + IBAN visible, card number hidden.
    await expect(page.getByPlaceholder('IR...')).toBeVisible();
    await expect(page.getByPlaceholder('XXXX-XXXX-XXXX-XXXX')).toHaveCount(0);

    await typeSelect(page).selectOption('card');
    await expect(page.getByPlaceholder('XXXX-XXXX-XXXX-XXXX')).toBeVisible();
    await expect(page.getByPlaceholder('IR...')).toHaveCount(0);
    await shot(page, info, SECTION, '02-account-form-card-type');

    await typeSelect(page).selectOption('wallet');
    await expect(page.getByPlaceholder('XXXX-XXXX-XXXX-XXXX')).toHaveCount(0);
    await expect(page.getByPlaceholder('IR...')).toHaveCount(0);

    await page.getByRole('button', { name: 'انصراف' }).click();
    await expect(page.getByRole('heading', { name: 'حساب جدید' })).toHaveCount(0);
  });

  test('create card account then delete it', async ({ page }, info) => {
    const holder = 'تست اتوماسیون';
    const cardNumber = await createCardAccount(page, holder);
    await shot(page, info, SECTION, '03-account-created');

    const card = accountCard(page, cardNumber);
    await expect(card.getByText('کارت بانکی')).toBeVisible();
    await expect(card.getByText(holder)).toBeVisible();
    await expect(card.getByText('بانک:')).toBeVisible();

    await deleteAccount(page, cardNumber);
    await shot(page, info, SECTION, '04-account-deleted');
  });

  test('set account as default shows the badge', async ({ page }, info) => {
    const cardNumber = await createCardAccount(page, 'صاحب حساب');

    const setDefault = accountCard(page, cardNumber).getByRole('button', { name: 'تنظیم به عنوان پیش‌فرض' });
    if (await setDefault.isVisible()) {
      await setDefault.click();
      await expect(defaultBadge(page, cardNumber)).toBeVisible({ timeout: 10000 });
    } else {
      await expect(defaultBadge(page, cardNumber)).toBeVisible();
    }
    await shot(page, info, SECTION, '05-account-default');

    await deleteAccount(page, cardNumber);
  });
});

test.describe('Invoice payment modal (پرداخت فاکتور)', () => {
  test.beforeEach(async ({ page }) => {
    await openAdmin(page, 'pars-gold');
  });

  /** Creates a sale invoice for the first seeded contact. */
  async function createSaleInvoice(page: Page) {
    await page.getByRole('button', { name: 'فاکتور جدید' }).click();
    await expect(page.getByRole('heading', { name: 'فاکتور جدید' })).toBeVisible();

    const modal = page.locator('div.fixed.inset-0').filter({ hasText: 'فاکتور جدید' });
    const contactSelect = modal.locator('select').nth(1);
    // Contacts load asynchronously; wait for a real option (beyond the placeholder) before selecting.
    await expect(contactSelect.locator('option').nth(1)).toHaveAttribute('value', /.+/, { timeout: 10000 });
    await contactSelect.selectOption({ index: 1 });
    // Unique payload per call: POST /invoices is behind idempotent middleware, so an identical
    // body sent twice within the window is rejected as a duplicate.
    const nonce = Date.now() + Math.floor(Math.random() * 1000);
    await modal.getByPlaceholder('توضیح').first().fill(`طلای ۱۸ عیار — تست ${nonce}`);
    await modal.getByPlaceholder('مبلغ').first().fill(String(1000000 + (nonce % 100000)));
    await modal.getByRole('button', { name: 'ثبت فاکتور' }).click();
    await expect(page.getByRole('heading', { name: 'فاکتور جدید' })).toHaveCount(0);
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 10000 });
  }

  const payModal = (page: Page) =>
    page.locator('div.fixed.inset-0').filter({ hasText: 'پرداخت فاکتور' });

  test('pay modal opens with three payment methods', async ({ page }, info) => {
    await gotoInvoices(page);
    await createSaleInvoice(page);

    await page.locator('tbody tr').first().getByRole('button', { name: 'پرداخت' }).click();
    const modal = payModal(page);
    await expect(modal.getByRole('heading', { name: 'پرداخت فاکتور' })).toBeVisible();
    await expect(modal.getByText('باقی‌مانده:')).toBeVisible();
    await expect(modal.getByRole('button', { name: 'نقدی' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'کارت‌خوان' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'کارت به کارت' })).toBeVisible();
    await shot(page, info, SECTION, '06-pay-modal-methods');

    await modal.getByRole('button', { name: 'انصراف' }).click();
    await expect(modal).toHaveCount(0);
  });

  test('transfer method prompts for an account when none exist', async ({ page }, info) => {
    // Empty out any existing accounts so the warning is deterministic.
    await gotoPaymentAccounts(page);
    let remaining = await page.locator('div.bg-white.rounded-2xl.p-5').count();
    while (remaining > 0) {
      page.once('dialog', d => d.accept());
      await page.locator('div.bg-white.rounded-2xl.p-5').first().locator('button:has(svg.lucide-trash-2)').click();
      await expect(page.locator('div.bg-white.rounded-2xl.p-5')).toHaveCount(remaining - 1, { timeout: 10000 });
      remaining -= 1;
    }

    await gotoInvoices(page);
    await createSaleInvoice(page);

    await page.locator('tbody tr').first().getByRole('button', { name: 'پرداخت' }).click();
    const modal = payModal(page);
    await modal.getByRole('button', { name: 'کارت به کارت' }).click();

    await expect(modal.getByText('حسابی برای دریافت وجه تعریف نشده است', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(modal.getByRole('button', { name: 'پرداخت' })).toBeDisabled();
    await shot(page, info, SECTION, '07-pay-modal-transfer-empty');

    await modal.getByRole('button', { name: 'انصراف' }).click();
  });

  test('transfer method lists an account and completes payment', async ({ page }, info) => {
    await gotoPaymentAccounts(page);
    const cardNumber = await createCardAccount(page, 'حساب دریافت تست');

    await gotoInvoices(page);
    await createSaleInvoice(page);

    await page.locator('tbody tr').first().getByRole('button', { name: 'پرداخت' }).click();
    const modal = payModal(page);
    await modal.getByRole('button', { name: 'کارت به کارت' }).click();

    await expect(modal.getByText('حساب مقصد')).toBeVisible({ timeout: 10000 });
    const accountOption = modal.locator('button').filter({ hasText: 'حساب دریافت تست' }).first();
    await expect(accountOption).toBeVisible();
    await accountOption.click();
    await shot(page, info, SECTION, '08-pay-modal-transfer-account');

    await expect(modal.getByRole('button', { name: 'پرداخت' })).toBeEnabled();
    await modal.getByRole('button', { name: 'پرداخت' }).click();
    await expect(modal).toHaveCount(0, { timeout: 10000 });

    // Cleanup the account we created.
    await gotoPaymentAccounts(page);
    await deleteAccount(page, cardNumber);
  });
});
