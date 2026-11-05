import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const netlog = [];
page.on('response', async (r) => {
  const u = r.url();
  if (u.includes('invoice-templates')) {
    let body = '';
    try { body = (await r.text()).slice(0, 300); } catch {}
    netlog.push(`${r.status()} ${r.request().method()} ${u.split('/api')[1]}`);
  }
});

// Login as SUPERADMIN
await page.goto(`${BASE}/#/login`);
await page.waitForTimeout(1500);
await page.fill('input[placeholder="۰۹۱۲۳۴۵۶۷۸۹"]', '09123456789');
await page.fill('input[type="password"]', 'password');
await page.getByRole('button', { name: /^ورود به / }).click();
await page.waitForTimeout(3000);

console.log('✓ Logged in as superadmin');

// Navigate to admin
await page.goto(`${BASE}/#/admin`);
await page.waitForTimeout(3000);

// Take screenshot to see current state
await page.screenshot({ path: 'e2e/screenshots/superadmin-admin-page.png' });
console.log('✓ Screenshot saved');

// Click on مالی accordion to expand it
const financialBtn = page.getByRole('button', { name: 'مالی' });
await financialBtn.click();
await page.waitForTimeout(500);

// Click on قالب فاکتور from submenu
await page.getByRole('button', { name: 'قالب فاکتور' }).click();
await page.waitForTimeout(2000);

console.log('✓ Navigated to templates page');

// Click "قالب جدید"
await page.getByRole('button', { name: 'قالب جدید' }).click();
await page.waitForTimeout(1000);

// Fill name
const uniqueName = 'قالب سوپرادمین ' + Date.now();
await page.fill('input[placeholder="مثال: قالب رسمی"]', uniqueName);

// Click "از صفر"
await page.getByRole('button', { name: 'از صفر' }).click();
await page.waitForTimeout(500);

// Submit
const netlogBefore = netlog.length;
await page.getByRole('button', { name: 'ساخت قالب' }).click();
await page.waitForTimeout(3000);

console.log('\n=== Network requests ===');
netlog.slice(netlogBefore).forEach(l => console.log(l));

// Take screenshot to see current state
await page.screenshot({ path: 'e2e/screenshots/superadmin-after-create.png' });
console.log('✓ Screenshot saved');

// Check if modal closed (check for modal backdrop, not just text)
const modalBackdrop = await page.locator('.fixed.inset-0.bg-black\\/40').first().isVisible().catch(() => false);
console.log('\nمودال هنوز باز است؟', modalBackdrop ? '✗ بله (خطا)' : '✓ خیر (موفق)');

// Check if new template appears
const newTemplateCard = page.locator('h4').filter({ hasText: new RegExp(uniqueName.slice(0, 15)) }).first();
const templateExists = await newTemplateCard.isVisible().catch(() => false);
console.log('قالب جدید در لیست ظاهر شد؟', templateExists ? '✓ بله' : '✗ خیر');

if (templateExists) {
  // Check if "سیستمی" badge appears anywhere on the page (it's an absolute positioned badge)
  const systemBadgeVisible = await page.locator('text=سیستمی').first().isVisible().catch(() => false);
  console.log('قالب به عنوان "سیستمی" علامت‌گذاری شد؟', systemBadgeVisible ? '✓ بله' : '✗ خیر');
}

await browser.close();
console.log('\n✓ Superadmin template creation test complete');
