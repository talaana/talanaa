import { test, expect, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', 'e2e-output', 'landing-builder');
const CAMPAIGN_JSON = path.join(OUTPUT_DIR, 'pars-gold-showcase.json');
const SLUG = 'pars-gold-showcase';
const CAMPAIGN_NAME = 'نمایشگاه پارس گلد';
const HALLS = ['سرسرای اصلی', 'گالری عروس', 'سالن خصوصی VIP'] as const;

let campaign: {
  slug: string;
  name: string;
  published: boolean;
  graph: { nodes: unknown[] };
};

test.beforeAll(() => {
  if (!fs.existsSync(CAMPAIGN_JSON)) {
    throw new Error('pars-gold-showcase.json یافت نشد — ابتدا build.spec.ts باید اجرا شده باشد');
  }
  campaign = JSON.parse(fs.readFileSync(CAMPAIGN_JSON, 'utf8'));
});

async function artifactShot(page: Page, info: TestInfo, name: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const file = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, timeout: 30_000 });
  await info.attach(name, { path: file, contentType: 'image/png' });
}

test.describe('Campaign renderer (/experience/:slug)', () => {
  test('unknown slug shows the not-found state', async ({ page }, info) => {
    await page.goto('/experience/does-not-exist');
    await expect(page.getByRole('heading', { name: 'تجربه یافت نشد' })).toBeVisible();
    await expect(page.getByText('کمپین «does-not-exist» وجود ندارد یا منتشر نشده است.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'بازگشت به صفحه اصلی' })).toBeVisible();
    await artifactShot(page, info, `render-not-found-${info.project.name}`);
  });

  test('the published campaign renders its halls, hotspot and teleport timeline', async ({ page }, info) => {
    test.setTimeout(120_000);
    await page.addInitScript((c) => {
      localStorage.setItem('talana_cinematic_campaigns_v2', JSON.stringify([c]));
    }, campaign);
    await page.goto(`/experience/${SLUG}`);

    await expect(page.getByText(CAMPAIGN_NAME, { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: HALLS[0], exact: true })).toBeVisible();
    await expect(page.getByText('تالار ۱ از ۳')).toBeVisible();
    await expect(page.getByText('اسکرول یا سوایپ برای حرکت بین تالارها')).toBeVisible();
    for (const hall of HALLS) {
      await expect(page.getByRole('button', { name: hall, exact: true })).toBeVisible();
    }

    // The hotspot wired in the builder opens the demo-catalog product modal.
    await page.getByRole('button', { name: 'انگشتر سولیتر الماس', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'انگشتر سولیتر الماس ۱.۵ قیراط' })).toBeVisible();
    await expect(page.getByText('مشخصات سنگ قیمتی')).toBeVisible();
    await expect(page.getByText('گواهی GIA')).toBeVisible();
    await artifactShot(page, info, `render-hotspot-${info.project.name}`);

    // Close via the dark backdrop, then teleport to hall 3 through the timeline.
    await page.locator('div.fixed.inset-0.z-50').first().click({ position: { x: 20, y: 20 } });
    await expect(page.getByRole('heading', { name: 'انگشتر سولیتر الماس ۱.۵ قیراط' })).toBeHidden();
    await page.getByRole('button', { name: HALLS[2], exact: true }).click();
    await expect(page.getByRole('heading', { name: HALLS[2], exact: true })).toBeVisible();
    await expect(page.getByText('تالار ۳ از ۳')).toBeVisible();
    await artifactShot(page, info, `render-${info.project.name}`);
  });
});
