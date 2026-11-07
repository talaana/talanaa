import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('file:///D:/talana/e2e-videos/tax/downloads/tax-report-Q4-2026.pdf#page=1&zoom=150');
await page.waitForTimeout(3000);
await page.screenshot({ path: 'D:/talana/pdf-check.png', fullPage: true });
await browser.close();
console.log('Screenshot saved');
