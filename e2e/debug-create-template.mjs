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
    try { body = (await r.text()).slice(0, 400); } catch {}
    netlog.push(`${r.status()} ${r.request().method()} ${u.split('/api')[1]} :: ${body}`);
  }
});

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGE ERROR: ' + e.message));

// Login
await page.goto(`${BASE}/?tenant=pars-gold#/login`);
await page.waitForTimeout(1500);
await page.fill('input[placeholder="۰۹۱۲۳۴۵۶۷۸۹"]', '01300000022');
await page.fill('input[type="password"]', 'password');
await page.getByRole('button', { name: /^ورود به / }).click();
await page.waitForTimeout(3000);

// Navigate to admin
await page.goto(`${BASE}/?tenant=pars-gold#/admin`);
await page.waitForTimeout(2000);

// Click on مالی accordion
const financialBtn = page.getByRole('button', { name: 'مالی', exact: true });
if (await financialBtn.isVisible()) {
  await financialBtn.click();
  await page.waitForTimeout(500);
}

// Click on قالب فاکتور
await page.getByRole('button', { name: 'قالب فاکتور', exact: true }).click();
await page.waitForTimeout(2000);

console.log('=== قبل از ساخت قالب ===');
console.log('Network log:', netlog.length, 'requests');

// Click "قالب جدید"
const createBtn = page.getByRole('button', { name: 'قالب جدید' });
await createBtn.click();
await page.waitForTimeout(1000);

console.log('\n=== مودال ساخت باز شد ===');

// Fill name
const uniqueName = 'قالب تست ' + Date.now();
await page.fill('input[placeholder="مثال: قالب رسمی"]', uniqueName);
console.log('نام قالب پر شد:', uniqueName);

// Click "از صفر"
await page.getByRole('button', { name: 'از صفر' }).click();
await page.waitForTimeout(500);
console.log('حالت "از صفر" انتخاب شد');

// Submit
const netlogBefore = netlog.length;
await page.getByRole('button', { name: 'ساخت قالب' }).click();
console.log('\n=== دکمه ساخت کلیک شد ===');

// Wait for network response
await page.waitForTimeout(3000);

console.log('Network requests after submit:', netlog.length - netlogBefore);
if (netlog.length > netlogBefore) {
  console.log('Last request:', netlog[netlog.length - 1]);
}

// Check if modal closed
const modalStillOpen = await page.locator('text=قالب جدید').isVisible().catch(() => false);
console.log('مودال هنوز باز است؟', modalStillOpen);

// Check if new template appears in list
const newTemplateCard = page.locator('h4').filter({ hasText: new RegExp(uniqueName.slice(0, 15)) }).first();
const templateExists = await newTemplateCard.isVisible().catch(() => false);
console.log('قالب جدید در لیست ظاهر شد؟', templateExists);

if (!templateExists) {
  console.log('\n=== خطا: قالب ساخته نشد ===');
  console.log('Screenshot می‌گیرم...');
  await page.screenshot({ path: 'create-failed.png', fullPage: true });
}

// Try to find edit button on any custom template
console.log('\n=== تست ویرایش قالب ===');
const editButtons = page.locator('button[title="ویرایش"]');
const editCount = await editButtons.count();
console.log('تعداد دکمه‌های ویرایش:', editCount);

if (editCount > 0) {
  await editButtons.first().click();
  await page.waitForTimeout(2000);
  
  console.log('ویرایشگر باز شد');
  
  // Check if block palette loaded
  const addBlockSection = page.locator('text=افزودن بلوک').first();
  const paletteVisible = await addBlockSection.isVisible().catch(() => false);
  console.log('پالت بلوک‌ها دیده می‌شود؟', paletteVisible);
  
  if (paletteVisible) {
    const blockButtons = addBlockSection.locator('..').locator('button');
    const blockCount = await blockButtons.count();
    console.log('تعداد بلوک‌های موجود در پالت:', blockCount);
    
    if (blockCount === 0) {
      console.log('\n=== خطا: پالت بلوک‌ها خالی است ===');
      await page.screenshot({ path: 'editor-empty-palette.png', fullPage: true });
    }
  } else {
    console.log('\n=== خطا: پالت بلوک‌ها دیده نمی‌شود ===');
    await page.screenshot({ path: 'editor-no-palette.png', fullPage: true });
  }
}

console.log('\n===== Console Errors =====');
if (errors.length === 0) {
  console.log('بدون خطا');
} else {
  errors.forEach(e => console.log(e));
}

console.log('\n===== Network Log (last 10) =====');
netlog.slice(-10).forEach(l => console.log(l));

await browser.close();
