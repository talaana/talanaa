import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, '.auth', 'storeAdmin.json');

const TENANT = 'pars-gold';
const VIDEO_DIR = path.resolve(__dirname, '../../../e2e-videos/tax');
const FRAME_DIR = path.join(VIDEO_DIR, 'frames');
const DOWNLOAD_DIR = path.join(VIDEO_DIR, 'downloads');

fs.mkdirSync(FRAME_DIR, { recursive: true });
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

test.use({ storageState: authFile });

// A nonce that makes every invoice body unique, so the idempotency guard never
// mistakes one scenario's invoice for another.
const NONCE = Date.now();

/** Gold scenario: 3 g at 4,500,000 with 12% wage, 7% profit, 150,000 commission. */
const GOLD = { weight: '3', tablo: '4500000', wage: '12', profit: '7', commission: '150000' };
const GOLD_VAT = '۲۵۴,۵۵۶';
const GOLD_TOTAL = '۱۶,۵۸۲,۹۵۶';

/** Non-gold scenario: a plain 5,000,000 service line. */
const PLAIN_VAT = '۴۵۰,۰۰۰';
const PLAIN_TOTAL = '۵,۴۵۰,۰۰۰';

async function frame(page: Page, name: string) {
  // The webfont comes from a CDN, and Playwright blocks on document.fonts.ready. A slow font CDN
  // must not sink the scenario, so the still frame is best-effort.
  await page
    .screenshot({ path: path.join(FRAME_DIR, `${name}.png`), fullPage: false, timeout: 60000 })
    .catch((e) => console.log(`frame ${name} skipped: ${String(e.message).split('\n')[0]}`));
}

const API = 'http://talana-backend.test/api';

async function registerTaxProfile(page: Page) {
  // The submission gate requires a registered profile. There is no profile UI yet, so the e2e
  // suite registers the demo tenant via the API before submitting invoices.
  const resolved = await page.request.get(`${API}/tenants/resolve?slug=${TENANT}`, {
    headers: { Accept: 'application/json' },
  });
  const tenantId = (await resolved.json()).tenant?.id;
  if (!tenantId) {
    throw new Error(`Could not resolve tenant ID for ${TENANT}`);
  }

  const storageState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
  const cookie = storageState.cookies?.find((c: { name: string }) => c.name === `talana_token_${TENANT}`);
  if (!cookie) {
    throw new Error('No auth token cookie found in storage state');
  }

  const res = await page.request.put(`${API}/admin/tax/profile`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${decodeURIComponent(cookie.value)}`,
      'X-Tenant': String(tenantId),
    },
    data: { tax_authority_id: 'DEMO-TAX-ID', api_key: 'demo-api-key', is_registered: true },
  });

  if (res.status() !== 200) {
    throw new Error(`Profile registration failed: ${res.status()} ${await res.text()}`);
  }
}

async function openAdmin(page: Page) {
  await page.goto(`/?tenant=${TENANT}#/admin`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('در حال بارگذاری پنل مدیریت...')).toBeHidden({ timeout: 30000 });
}

/** Opens a "مالی" sub-item, expanding the accordion only when it is collapsed. */
async function financialNav(page: Page, label: string) {
  const nav = page.locator('aside');
  const sub = nav.getByRole('button', { name: label, exact: true });

  if (!(await sub.isVisible())) {
    await nav.getByRole('button', { name: 'مالی', exact: true }).click();
    await expect(sub).toBeVisible({ timeout: 10000 });
  }

  await sub.click();
}

async function openInvoices(page: Page) {
  await openAdmin(page);
  await financialNav(page, 'فاکتورها');
  await expect(page.getByRole('heading', { name: 'فاکتورها', exact: true })).toBeVisible({ timeout: 15000 });
  await expect(
    page.locator('main table tbody tr').first().or(page.getByText('فاکتوری ثبت نشده')),
  ).toBeVisible({ timeout: 15000 });
}

async function openTaxDashboard(page: Page) {
  await openAdmin(page);
  await financialNav(page, 'مالیات و مؤدیان');
  await expect(page.getByRole('heading', { name: 'سامانه مؤدیان و مالیات' })).toBeVisible({ timeout: 15000 });
}

/** The invoice numbers currently listed, used to spot the row of a freshly created invoice. */
async function snapshotNumbers(page: Page): Promise<Set<string>> {
  const rows = page.locator('main table tbody tr');
  const count = await rows.count();
  const numbers = new Set<string>();

  for (let i = 0; i < count; i++) {
    const text = (await rows.nth(i).locator('td').first().textContent())?.trim();
    if (text) numbers.add(text);
  }

  return numbers;
}

async function waitForNewInvoiceNumber(page: Page, before: Set<string>): Promise<string> {
  const rows = page.locator('main table tbody tr');
  let found = '';

  await expect
    .poll(async () => {
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const text = (await rows.nth(i).locator('td').first().textContent())?.trim() ?? '';
        if (text && !before.has(text)) {
          found = text;
          return text;
        }
      }
      return '';
    }, { timeout: 25000, message: 'the new invoice never showed up in the list' })
    .not.toBe('');

  return found;
}

function rowOf(page: Page, invoiceNumber: string) {
  return page.locator('main table tbody tr').filter({ hasText: invoiceNumber });
}

async function pickContact(page: Page) {
  const select = page.getByLabel('مخاطب');
  await expect(select.locator('option').nth(1)).toBeAttached({ timeout: 15000 });
  await select.selectOption({ index: 1 });
}

async function openCreateModal(page: Page) {
  await page.getByRole('button', { name: 'فاکتور جدید' }).click();
  await expect(page.getByRole('heading', { name: 'فاکتور جدید' })).toBeVisible({ timeout: 10000 });
}

/** Fills the single item row of the create modal as a gold line. */
async function fillGoldItem(page: Page, description: string) {
  await page.getByRole('checkbox', { name: 'طلایی' }).check();
  await page.getByPlaceholder('توضیح').first().fill(description);
  await page.getByPlaceholder('وزن (گرم)').first().fill(GOLD.weight);
  await page.getByPlaceholder('قیمت تابلو').first().fill(GOLD.tablo);
  await page.getByPlaceholder('درصد اجرت %').first().fill(GOLD.wage);
  await page.getByPlaceholder('درصد سود %').first().fill(GOLD.profit);
  await page.getByPlaceholder('کمیسیون (تومان)').first().fill(GOLD.commission);
}

/** Fills the single item row of the create modal as a plain, fully taxable line. */
async function fillPlainItem(page: Page, description: string, amount: string) {
  await page.getByPlaceholder('توضیح').first().fill(description);
  await page.getByPlaceholder('مبلغ (تومان)').first().fill(amount);
}

/** Asserts a value inside the "جمع کل / مالیات / مبلغ نهایی" summary of a modal. */
async function expectSummaryValue(page: Page, label: string, value: string) {
  await expect(page.getByText(label, { exact: true }).locator('..')).toContainText(value, { timeout: 25000 });
}

async function submitInvoiceForm(page: Page) {
  const submit = page.getByRole('button', { name: 'ثبت فاکتور' });
  await submit.scrollIntoViewIfNeeded();
  await submit.click();
  await expect(page.getByRole('heading', { name: 'فاکتور جدید' })).toHaveCount(0, { timeout: 25000 });
}

test.describe('سامانه مؤدیان و مالیات — سناریوهای اثباتی', () => {
  test.beforeEach(async ({ page }) => {
    page.on('dialog', dialog => dialog.accept());
  });

  test('01 — ثبت فاکتور طلایی با مالیات بر ارزش افزوده', async ({ page }) => {
    await openInvoices(page);
    await openCreateModal(page);
    await pickContact(page);

    await fillGoldItem(page, `طلای ۱۸ عیار — اجرت ۱۲٪ — ${NONCE}`);
    await page.waitForTimeout(1200);

    await expectSummaryValue(page, 'مشمول مالیات:', '۲,۸۲۸,۴۰۰');
    await expectSummaryValue(page, 'مالیات بر ارزش افزوده:', GOLD_VAT);
    await expectSummaryValue(page, 'مبلغ نهایی:', GOLD_TOTAL);
    await frame(page, '01-gold-invoice-form');

    const before = await snapshotNumbers(page);
    await submitInvoiceForm(page);

    const invoiceNumber = await waitForNewInvoiceNumber(page, before);
    const row = rowOf(page, invoiceNumber);
    await expect(row.locator('td').nth(3)).toHaveText(GOLD_TOTAL);
    await expect(row.locator('td').nth(4)).toContainText(GOLD_VAT);
    await expect(row.locator('td').nth(4)).toContainText('ارزش افزوده');
    await frame(page, '01-gold-invoice-saved');

    console.log(`gold invoice ${invoiceNumber}: vat=${GOLD_VAT} total=${GOLD_TOTAL}`);
  });

  test('02 — ثبت فاکتور غیرطلایی با مالیات ۹ درصد', async ({ page }) => {
    await openInvoices(page);
    await openCreateModal(page);
    await pickContact(page);

    await fillPlainItem(page, `خدمات تعمیر و آبکاری — ${NONCE}`, '5000000');
    await page.waitForTimeout(1200);

    await expectSummaryValue(page, 'مشمول مالیات:', '۵,۰۰۰,۰۰۰');
    await expectSummaryValue(page, 'مالیات بر ارزش افزوده:', PLAIN_VAT);
    await expectSummaryValue(page, 'مبلغ نهایی:', PLAIN_TOTAL);
    await frame(page, '02-plain-invoice-form');

    const before = await snapshotNumbers(page);
    await submitInvoiceForm(page);

    const invoiceNumber = await waitForNewInvoiceNumber(page, before);
    const row = rowOf(page, invoiceNumber);
    await expect(row.locator('td').nth(3)).toHaveText(PLAIN_TOTAL);
    await expect(row.locator('td').nth(4)).toContainText(PLAIN_VAT);
    await frame(page, '02-plain-invoice-saved');

    console.log(`plain invoice ${invoiceNumber}: vat=${PLAIN_VAT} total=${PLAIN_TOTAL}`);
  });

  test('03 — ویرایش فاکتور و بازمحاسبه مالیات', async ({ page }) => {
    await openInvoices(page);
    await openCreateModal(page);
    await pickContact(page);
    await fillGoldItem(page, `طلای ۱۸ عیار — پیش‌نویس ویرایش — ${NONCE}`);
    await page.waitForTimeout(1200);

    const before = await snapshotNumbers(page);
    await submitInvoiceForm(page);

    const invoiceNumber = await waitForNewInvoiceNumber(page, before);
    const row = rowOf(page, invoiceNumber);
    await expect(row.locator('td').nth(4)).toContainText(GOLD_VAT);

    await row.getByRole('button', { name: /ویرایش/ }).click();
    await expect(page.getByRole('heading', { name: 'ویرایش فاکتور' })).toBeVisible({ timeout: 10000 });

    // 3 g -> 5 g: the taxable base and the VAT both move.
    await page.getByPlaceholder('وزن (گرم)').first().fill('5');
    await page.getByLabel('یادداشت').fill(`وزن از ۳ گرم به ۵ گرم تغییر کرد — ${NONCE}`);
    await page.waitForTimeout(1500);

    await expectSummaryValue(page, 'مالیات بر ارزش افزوده:', '۴۱۵,۲۶۰');
    await expectSummaryValue(page, 'مبلغ نهایی:', '۲۷,۵۲۹,۲۶۰');
    await frame(page, '03-invoice-edit-modal');

    const save = page.getByRole('button', { name: 'ذخیره تغییرات' });
    await save.scrollIntoViewIfNeeded();
    await save.click();
    await expect(page.getByRole('heading', { name: 'ویرایش فاکتور' })).toHaveCount(0, { timeout: 25000 });

    await expect(rowOf(page, invoiceNumber).locator('td').nth(3)).toHaveText('۲۷,۵۲۹,۲۶۰');
    await expect(rowOf(page, invoiceNumber).locator('td').nth(4)).toContainText('۴۱۵,۲۶۰');
    await frame(page, '03-invoice-edited');

    console.log(`edited invoice ${invoiceNumber}: vat=۴۱۵,۲۶۰ total=۲۷,۵۲۹,۲۶۰`);
  });

  test('04 — پرداخت فاکتور', async ({ page }) => {
    await openInvoices(page);
    await openCreateModal(page);
    await pickContact(page);
    await fillGoldItem(page, `طلای ۱۸ عیار — پرداخت نقدی — ${NONCE}`);
    await page.waitForTimeout(1200);

    const before = await snapshotNumbers(page);
    await submitInvoiceForm(page);

    const invoiceNumber = await waitForNewInvoiceNumber(page, before);
    const row = rowOf(page, invoiceNumber);
    await expect(row.locator('td').nth(6)).toHaveText('صادر شده');

    await row.getByRole('button', { name: 'پرداخت' }).click();
    await expect(page.getByRole('heading', { name: 'پرداخت فاکتور' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('باقی‌مانده:').locator('..')).toContainText(GOLD_TOTAL);
    await frame(page, '04-invoice-pay-modal');

    await page.getByRole('button', { name: 'کارت‌خوان' }).click();
    await page.getByRole('button', { name: 'پرداخت' }).last().click();
    await expect(page.getByRole('heading', { name: 'پرداخت فاکتور' })).toHaveCount(0, { timeout: 25000 });

    await expect(rowOf(page, invoiceNumber).locator('td').nth(5)).toHaveText(GOLD_TOTAL);
    await expect(rowOf(page, invoiceNumber).locator('td').nth(6)).toHaveText('پرداخت شده');
    await frame(page, '04-invoice-paid');

    console.log(`paid invoice ${invoiceNumber}`);
  });

  test('05 — مشاهده پیش‌نمایش فاکتور', async ({ page }) => {
    await openInvoices(page);
    await openCreateModal(page);
    await pickContact(page);
    await fillGoldItem(page, `طلای ۱۸ عیار — پیش‌نمایش — ${NONCE}`);
    await page.waitForTimeout(1200);

    const before = await snapshotNumbers(page);
    await submitInvoiceForm(page);

    const invoiceNumber = await waitForNewInvoiceNumber(page, before);
    await rowOf(page, invoiceNumber).getByRole('button', { name: /مشاهده/ }).click();

    const preview = page.locator('div.fixed.inset-0').first();
    await expect(preview).toBeVisible({ timeout: 15000 });
    await expect(preview.getByText('پیش‌نمایش فاکتور')).toBeVisible();
    await expect(preview.getByText('مبالغ')).toBeVisible();
    await expect(preview.getByText('مالیات:').locator('..')).toContainText(GOLD_VAT);
    await expect(preview.getByText('مبلغ نهایی:').locator('..')).toContainText(GOLD_TOTAL);
    await frame(page, '05-invoice-preview');

    console.log(`previewed invoice ${invoiceNumber}`);
  });

  test('06 — حذف فاکتور', async ({ page }) => {
    await openInvoices(page);
    await openCreateModal(page);
    await pickContact(page);
    await fillPlainItem(page, `فاکتور موقت برای حذف — ${NONCE}`, '750000');
    await page.waitForTimeout(1200);

    const before = await snapshotNumbers(page);
    await submitInvoiceForm(page);

    const invoiceNumber = await waitForNewInvoiceNumber(page, before);
    await rowOf(page, invoiceNumber).getByRole('button', { name: /حذف/ }).click();

    await expect(page.getByRole('heading', { name: 'حذف فاکتور' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('این عملیات قابل بازگشت نیست.')).toBeVisible();
    await frame(page, '06-invoice-delete-confirm');

    await page.getByRole('button', { name: 'حذف فاکتور' }).last().click();
    await expect(page.getByRole('heading', { name: 'حذف فاکتور' })).toHaveCount(0, { timeout: 25000 });

    await expect(rowOf(page, invoiceNumber)).toHaveCount(0, { timeout: 15000 });
    await frame(page, '06-invoice-deleted');

    console.log(`deleted invoice ${invoiceNumber}`);
  });

  test('07 — محاسبه‌گر مالیات بر ارزش افزوده', async ({ page }) => {
    await openTaxDashboard(page);
    await page.getByRole('button', { name: 'محاسبه VAT' }).first().click();

    await page.getByPlaceholder('انگشتر طلا').fill(`انگشتر طلا — ${NONCE}`);

    // The calculator card holds five number inputs in order: weight, tablo, wage, profit, commission.
    const nums = page.locator('div.bg-white.rounded-2xl').filter({ hasText: 'محاسبه‌گر VAT' }).locator('input[type="number"]');
    await nums.nth(0).fill(GOLD.weight);
    await nums.nth(1).fill(GOLD.tablo);
    await nums.nth(2).fill(GOLD.wage);
    await nums.nth(3).fill(GOLD.profit);
    await nums.nth(4).fill(GOLD.commission);
    await frame(page, '07-vat-calculator-input');

    await page.getByRole('button', { name: 'محاسبه VAT' }).last().click();

    await expect(page.getByText('نتیجه محاسبه')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('نرخ VAT: ۹٪')).toBeVisible();

    const item = page.locator('div.bg-slate-50.rounded-xl').filter({ hasText: 'ارزش طلا (معاف)' }).first();
    await expect(item.getByText('ارزش طلا (معاف)').locator('..')).toContainText('۱۳,۵۰۰,۰۰۰');
    await expect(item.getByText('اجرت (مشمول)').locator('..')).toContainText('۱,۶۲۰,۰۰۰');
    await expect(item.getByText('سود (مشمول)').locator('..')).toContainText('۱,۰۵۸,۴۰۰');
    await expect(item.getByText('حق‌العمل').locator('..')).toContainText('۱۵۰,۰۰۰');
    await expect(item.getByText('مجموع مشمول').locator('..')).toContainText('۲,۸۲۸,۴۰۰');
    await expect(item.getByText('مالیات').locator('..')).toContainText(GOLD_VAT);

    const summary = page.locator('div.bg-gradient-to-br.from-amber-50');
    await expect(summary.getByText('ارزش طلا (معاف)').locator('..')).toContainText('۱۳,۵۰۰,۰۰۰');
    await expect(summary.getByText('مشمول VAT').locator('..')).toContainText('۲,۸۲۸,۴۰۰');
    await expect(summary.getByText('مالیات بر ارزش افزوده').locator('..')).toContainText(GOLD_VAT);
    await expect(summary.getByText('مبلغ نهایی').locator('..')).toContainText(GOLD_TOTAL);
    await frame(page, '07-vat-calculator-result');

    console.log(`vat calculator: vat=${GOLD_VAT} total=${GOLD_TOTAL}`);
  });

  test('08 — ارسال فاکتور به سامانه مؤدیان و ثبت فاکتور الکترونیکی', async ({ page }) => {
    await registerTaxProfile(page);
    await openInvoices(page);
    await openCreateModal(page);
    await pickContact(page);
    await fillGoldItem(page, `طلای ۱۸ عیار — ارسال به مؤدیان — ${NONCE}`);
    await page.waitForTimeout(1200);

    const before = await snapshotNumbers(page);
    await submitInvoiceForm(page);

    const invoiceNumber = await waitForNewInvoiceNumber(page, before);
    await rowOf(page, invoiceNumber).getByRole('button', { name: 'ارسال به مؤدیان' }).click();

    await expect(page.getByText('به سامانه مؤدیان ارسال شد.')).toBeVisible({ timeout: 25000 });
    await expect(rowOf(page, invoiceNumber).locator('td').nth(7)).toContainText('ارسال شده');
    await frame(page, '08-invoice-sent-to-authority');

    await openTaxDashboard(page);
    await page.getByRole('button', { name: 'فاکتورهای الکترونیکی' }).click();

    const row = page.locator('main table tbody tr').filter({ hasText: invoiceNumber });
    await expect(row).toBeVisible({ timeout: 20000 });
    await expect(row).toContainText('ارسال شده');
    await expect(row).toContainText(GOLD_VAT);
    await frame(page, '08-electronic-invoices-list');

    console.log(`electronic invoice ${invoiceNumber}`);
  });

  test('09 — گزارش فصلی و ارسال آن به سامانه مؤدیان', async ({ page }) => {
    await openTaxDashboard(page);
    await page.getByRole('button', { name: 'گزارشات فصلی' }).click();

    await page.locator('main select').selectOption('4');
    await page.getByRole('button', { name: 'تولید گزارش' }).click();

    await expect(page.getByText('گزارش زمستان ۲۰۲۶')).toBeVisible({ timeout: 25000 });
    await expect(page.getByText('جمع فروش')).toBeVisible();
    await expect(page.getByText('مشمول VAT')).toBeVisible();
    await expect(page.getByText('معاف')).toBeVisible();
    await expect(page.getByText('مالیات بر ارزش افزوده قابل پرداخت')).toBeVisible();
    await frame(page, '09-quarterly-report');

    const submit = page.getByRole('button', { name: 'ارسال به سامانه مؤدیان' });
    if (await submit.isVisible()) {
      await submit.click();
    }

    await expect(page.getByText('ارسال شده', { exact: true })).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('button', { name: 'دانلود PDF' })).toBeVisible();
    await frame(page, '09-quarterly-report-submitted');

    console.log('quarterly report Q4-2026 submitted');
  });

  test('10 — خروجی PDF و Excel گزارش مالیاتی', async ({ page }) => {
    await openTaxDashboard(page);
    await page.getByRole('button', { name: 'گزارشات فصلی' }).click();

    await page.locator('main select').selectOption('4');
    await page.getByRole('button', { name: 'تولید گزارش' }).click();

    await expect(page.getByText('گزارش زمستان ۲۰۲۶')).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('button', { name: 'دانلود PDF' })).toBeVisible({ timeout: 10000 });
    await frame(page, '10-report-generated');

    const pdfPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.getByRole('button', { name: 'دانلود PDF' }).click();
    const pdf = await pdfPromise;
    const pdfPath = path.join(DOWNLOAD_DIR, 'tax-report-Q4-2026.pdf');
    await pdf.saveAs(pdfPath);
    expect(fs.statSync(pdfPath).size).toBeGreaterThan(1000);

    // A PDF without an embedded Persian font renders every label as "?????".
    expect(fs.readFileSync(pdfPath).includes('/Vazirmatn')).toBe(true);
    await frame(page, '10-pdf-downloaded');

    const excelPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.getByRole('button', { name: 'دانلود Excel' }).click();
    const excel = await excelPromise;
    const excelPath = path.join(DOWNLOAD_DIR, 'tax-report-Q4-2026.xlsx');
    await excel.saveAs(excelPath);
    expect(fs.statSync(excelPath).size).toBeGreaterThan(1000);
    await frame(page, '10-excel-downloaded');

    console.log(`downloaded ${pdf.suggestedFilename()} and ${excel.suggestedFilename()}`);
  });

  test('11 — مدیریت پروفایل مالیاتی و ثبت‌نام از پنل', async ({ page }) => {
    await openTaxDashboard(page);
    await expect(page.getByRole('button', { name: 'پروفایل مالیاتی', exact: true })).toBeVisible();
    const loaded = page.waitForResponse(response => response.url() === `${API}/admin/tax/profile` && response.request().method() === 'GET');
    await page.getByRole('button', { name: 'پروفایل مالیاتی', exact: true }).click();
    const profileResponse = await loaded;
    const original = (await profileResponse.json()).data;
    const headers = await profileResponse.request().allHeaders();
    const form = page.getByRole('form', { name: 'پروفایل مالیاتی' });
    const key = form.getByLabel('کلید API', { exact: true });

    try {
      await expect(key).toHaveAttribute('type', 'password');
      await expect(key).toHaveValue('');
      await expect(form.getByText('ثبت‌شده', { exact: true })).toBeVisible();
      await form.getByLabel('کد اقتصادی', { exact: true }).fill('411111111111');
      await form.getByLabel('شناسه یکتای حافظه مالیاتی', { exact: true }).fill('DEMO-TAX-ID');
      await form.getByLabel('شناسه ملی', { exact: true }).fill('0012345678');
      await form.getByLabel('شماره ثبت', { exact: true }).fill('1234');
      await form.getByLabel('نرخ اختصاصی VAT (درصد)', { exact: true }).fill('10.5');
      await form.getByText('تنظیمات پیشرفته', { exact: true }).click();
      await expect(form.getByLabel('آدرس پایه API', { exact: true })).toHaveValue(original.api_base_url);

      const saved = page.waitForResponse(response => response.url() === `${API}/admin/tax/profile` && response.request().method() === 'PUT');
      await form.getByRole('button', { name: 'ذخیره تغییرات', exact: true }).click();
      const savedResponse = await saved;
      expect(savedResponse.status()).toBe(200);
      expect(savedResponse.request().postDataJSON()).not.toHaveProperty('api_key');
      const savedData = (await savedResponse.json()).data;
      expect(savedData).not.toHaveProperty('api_key');
      expect(savedData).not.toHaveProperty('api_key_encrypted');
      await expect(form.getByRole('status')).toContainText('تغییرات ذخیره شد');
      await expect(key).toHaveValue('');
      await expect(form).not.toContainText('demo-api-key');
      await expect(form.getByText('نرخ فعلی: ۱۰.۵٪', { exact: true })).toBeVisible();
      await frame(page, '11-tax-profile-saved');

      await page.getByRole('button', { name: 'فاکتورهای الکترونیکی', exact: true }).click();
      await page.getByRole('button', { name: 'پروفایل مالیاتی', exact: true }).click();
      await expect(form.getByLabel('کد اقتصادی', { exact: true })).toHaveValue('411111111111');
      await expect(form.getByLabel('شناسه ملی', { exact: true })).toHaveValue('0012345678');
      await expect(form.getByLabel('شماره ثبت', { exact: true })).toHaveValue('1234');
      await expect(key).toHaveValue('');

      const unchangedKey = page.waitForResponse(response => response.url() === `${API}/admin/tax/profile` && response.request().method() === 'PUT');
      await form.getByRole('button', { name: 'ذخیره تغییرات', exact: true }).click();
      const unchangedResponse = await unchangedKey;
      expect(unchangedResponse.request().postDataJSON()).not.toHaveProperty('api_key');
      expect((await unchangedResponse.json()).data.has_api_key).toBe(true);

      await form.getByLabel('شناسه یکتای حافظه مالیاتی', { exact: true }).fill('');
      await form.getByRole('button', { name: 'ذخیره تغییرات', exact: true }).click();
      await expect(form.getByRole('alert')).toContainText('ابتدا ثبت را لغو کنید');
      await expect(form.getByText('ثبت‌شده', { exact: true })).toBeVisible();
      await form.getByLabel('شناسه یکتای حافظه مالیاتی', { exact: true }).fill('DEMO-TAX-ID');

      await form.getByRole('button', { name: 'لغو ثبت', exact: true }).click();
      await expect(form.getByText('ثبت‌نشده', { exact: true })).toBeVisible();
      await form.getByLabel('شناسه یکتای حافظه مالیاتی', { exact: true }).fill('');
      await form.getByRole('button', { name: 'ثبت در سامانه مؤدیان', exact: true }).click();
      await expect(form.getByRole('alert')).toContainText('شناسه مؤدی و کلید API الزامی است');
      await expect(form.getByText('ثبت‌نشده', { exact: true })).toBeVisible();
      await frame(page, '11-tax-profile-validation-error');

      await form.getByLabel('شناسه یکتای حافظه مالیاتی', { exact: true }).fill('DEMO-TAX-ID');
      await form.getByRole('button', { name: 'ثبت در سامانه مؤدیان', exact: true }).click();
      await expect(form.getByText('ثبت‌شده', { exact: true })).toBeVisible();
      await expect(form.getByRole('status')).toContainText('پروفایل مالیاتی ثبت شد');
      await expect(key).toHaveValue('');
      await frame(page, '11-tax-profile-registered');

      await form.getByLabel('نرخ اختصاصی VAT (درصد)', { exact: true }).fill('');
      await form.getByRole('button', { name: 'ذخیره تغییرات', exact: true }).click();
      await expect(form.getByRole('status')).toContainText('تغییرات ذخیره شد');
      await page.getByRole('button', { name: 'فاکتورهای الکترونیکی', exact: true }).click();
      await page.getByRole('button', { name: 'پروفایل مالیاتی', exact: true }).click();
      await expect(form.getByLabel('نرخ اختصاصی VAT (درصد)', { exact: true })).toHaveValue('');
    } finally {
      const { economic_code, tax_authority_id, national_id, register_number, vat_rate_override, api_base_url, is_registered } = original;
      const restored = await page.request.put(`${API}/admin/tax/profile`, {
        headers,
        data: { economic_code, tax_authority_id, national_id, register_number, vat_rate_override, api_base_url, is_registered },
      });
      expect(restored.status()).toBe(200);
    }
  });

  test('12 — بازیابی خطای بارگذاری پروفایل در موبایل', async ({ page }) => {
    await openTaxDashboard(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route(`${API}/admin/tax/profile`, route => route.fulfill({
      status: 503,
      json: { message: 'سرویس موقتاً در دسترس نیست؛ دوباره تلاش کنید.' },
    }), { times: 1 });
    await page.getByRole('button', { name: 'پروفایل مالیاتی', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('سرویس موقتاً در دسترس نیست');
    await page.getByRole('button', { name: 'تلاش دوباره', exact: true }).click();
    const form = page.getByRole('form', { name: 'پروفایل مالیاتی' });
    await expect(form.getByLabel('کد اقتصادی', { exact: true })).toBeVisible();
    await form.getByLabel('کلید API', { exact: true }).focus();
    await expect(form.getByLabel('کلید API', { exact: true })).toBeFocused();
    expect(await form.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await frame(page, '12-tax-profile-mobile');
  });

  test('13 — نمایش خطای اعتبارنامه بدون ثبت کاذب پروفایل', async ({ page }) => {
    await openTaxDashboard(page);
    await page.route(`${API}/admin/tax/profile`, async route => {
      if (route.request().method() === 'GET') {
        const response = await route.fetch();
        const body = await response.json();
        body.data.is_registered = false;
        await route.fulfill({ response, json: body });
      } else {
        await route.fulfill({ status: 422, json: { success: false, message: 'اعتبارنامه‌های وارد شده توسط سامانه مؤدیان تأیید نشد.' } });
      }
    });
    await page.getByRole('button', { name: 'پروفایل مالیاتی', exact: true }).click();
    const form = page.getByRole('form', { name: 'پروفایل مالیاتی' });
    await form.getByLabel('شناسه یکتای حافظه مالیاتی', { exact: true }).fill('REJECTED-ID');
    await form.getByRole('button', { name: 'ثبت در سامانه مؤدیان', exact: true }).click();
    await expect(form.getByRole('alert')).toContainText('تأیید نشد');
    await expect(form.getByText('ثبت‌نشده', { exact: true })).toBeVisible();
    await expect(form.getByLabel('شناسه یکتای حافظه مالیاتی', { exact: true })).toHaveValue('REJECTED-ID');
    await expect(form.getByRole('button', { name: 'ثبت در سامانه مؤدیان', exact: true })).toBeEnabled();
  });

  test('14 — حفظ کلید هنگام خطا و پاکسازی آن پس از ذخیره', async ({ page }) => {
    await openTaxDashboard(page);
    let profile: Record<string, unknown>;
    let attempts = 0;
    await page.route(`${API}/admin/tax/profile`, async route => {
      if (route.request().method() === 'GET') {
        const response = await route.fetch();
        const body = await response.json();
        profile = { ...body.data, has_api_key: false, is_registered: false };
        await route.fulfill({ response, json: { ...body, data: profile } });
      } else if (attempts++ === 0) {
        await route.fulfill({ status: 503, json: { message: 'ذخیره موقتاً ناموفق بود؛ دوباره تلاش کنید.' } });
      } else {
        const { api_key, ...fields } = route.request().postDataJSON();
        await route.fulfill({ status: 200, json: { success: true, data: { ...profile, ...fields, has_api_key: true } } });
      }
    });
    await page.getByRole('button', { name: 'پروفایل مالیاتی', exact: true }).click();
    const form = page.getByRole('form', { name: 'پروفایل مالیاتی' });
    const key = form.getByLabel('کلید API', { exact: true });
    await key.fill('new-test-secret');
    await form.getByRole('button', { name: 'ذخیره تغییرات', exact: true }).click();
    await expect(form.getByRole('alert')).toContainText('ذخیره موقتاً ناموفق بود');
    await expect(key).toHaveValue('new-test-secret');
    const saved = page.waitForResponse(response => response.url() === `${API}/admin/tax/profile` && response.request().method() === 'PUT');
    await form.getByRole('button', { name: 'ذخیره تغییرات', exact: true }).click();
    const response = await saved;
    expect(response.request().postDataJSON().api_key).toBe('new-test-secret');
    await expect(form.getByRole('status')).toContainText('تغییرات ذخیره شد');
    await expect(key).toHaveValue('');
    await expect(form).not.toContainText('new-test-secret');
    await expect(form.getByText('کلید ذخیره شده است؛ برای تغییر، کلید جدید وارد کنید.')).toBeVisible();
  });
});
