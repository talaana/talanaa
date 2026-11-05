import { test, expect } from '@playwright/test';
import { shot, noHorizontalOverflow } from '../support/helpers';

const SECTION = 'main-landing';
const HALLS = ['سرسرای اصلی بوتیک', 'سوئیت الماس سولیتر', 'کلکسیون عروس', 'سالن خصوصی VIP', 'خزانه شمش و سکه'];

test.describe('Main cinematic landing (no tenant)', () => {
  test('renders the cinematic boutique with halls and controls', async ({ page }, info) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'سرسرای اصلی بوتیک', level: 2 })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('تالار ۱ از ۵')).toBeVisible();
    for (const hall of HALLS) await expect(page.getByRole('button', { name: hall, exact: true })).toBeVisible();
    await expect(page.getByText('اسکرول یا سوایپ برای حرکت بین تالارها')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ورود به بازارچه' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'نقشه بوتیک' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'رزرو VIP و مشاوره' })).toBeVisible();

    const audio = page.getByRole('button', { name: 'صدا' });
    await expect(audio).toHaveAttribute('aria-pressed', 'true');
    const cart = page.getByRole('button', { name: 'سبد خرید' });
    await expect(cart.locator('span')).toHaveCount(0);

    await shot(page, info, SECTION, '01-landing');
    expect(await noHorizontalOverflow(page)).toBe(0);
  });

  test('hotspot modal shows specs and adds to the shopping bag', async ({ page }, info) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'انگشتر سولیتر الماس', exact: true }).click({ timeout: 15000 });

    await expect(page.getByRole('heading', { level: 3, name: 'انگشتر سولیتر الماس ۱.۵ قیراط' })).toBeVisible();
    await expect(page.getByText(/گرم/).first()).toBeVisible();
    await expect(page.getByText('مشخصات سنگ قیمتی')).toBeVisible();
    await expect(page.getByText(/گواهی GIA/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'خرید مستقیم' })).toBeVisible();
    await shot(page, info, SECTION, '02-hotspot-modal');

    await page.getByRole('button', { name: 'افزودن به سبد' }).click();
    await expect(page.getByRole('button', { name: 'انگشتر سولیتر الماس ۱.۵ قیراط' })).toHaveCount(0);
    const cart = page.getByRole('button', { name: 'سبد خرید' });
    await expect(cart.locator('span')).toHaveText('۱');
    await shot(page, info, SECTION, '03-bag-badge');
  });

  test('boutique map teleports to the VIP hall', async ({ page }, info) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'نقشه بوتیک' }).click({ timeout: 15000 });

    const map = page.locator('div.max-w-lg', { hasText: 'نقشه بوتیک' });
    await expect(map.getByRole('heading', { level: 3, name: 'نقشه بوتیک' })).toBeVisible();
    await shot(page, info, SECTION, '04a-map-modal');

    await map.getByRole('button', { name: 'سالن خصوصی VIP' }).click();
    await expect(page.getByRole('heading', { name: 'سالن خصوصی VIP', level: 2 })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('تالار ۴ از ۵')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'سرسرای اصلی بوتیک', level: 2 })).toHaveCount(0);
    await shot(page, info, SECTION, '04b-map-teleport-vip-hall');
  });

  test('VIP wizard validates the phone then confirms the reservation', async ({ page }, info) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'رزرو VIP و مشاوره' }).click({ timeout: 15000 });

    await expect(page.getByRole('heading', { level: 3, name: 'رزرو VIP و مشاوره اختصاصی' })).toBeVisible();
    await expect(page.getByText('سالن اختصاصی الماس')).toBeVisible();
    await page.getByRole('button', { name: /^تأیید رزرو/ }).click();
    await expect(page.getByText('شماره موبایل باید ۱۱ رقم باشد.')).toBeVisible();
    await page.getByText('شماره موبایل باید ۱۱ رقم باشد.').scrollIntoViewIfNeeded();
    await shot(page, info, SECTION, '05-vip-validation');

    await page.getByPlaceholder('۰۹۱۲۳۴۵۶۷۸۹').fill('09123456789');
    await page.getByRole('button', { name: /^تأیید رزرو/ }).click();
    await expect(page.getByRole('heading', { name: 'درخواست شما ثبت شد' })).toBeVisible();
    await expect(page.getByText(/برای تأیید نهایی با شما تماس می‌گیرند/)).toBeVisible();
    await shot(page, info, SECTION, '06-vip-success');
  });

  test('audio toggle switches between muted and unmuted', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    const audio = page.getByRole('button', { name: 'صدا' });
    await expect(audio).toBeVisible({ timeout: 15000 });
    await expect(audio).toHaveAttribute('aria-pressed', 'true');
    await audio.click();
    await expect(audio).toHaveAttribute('aria-pressed', 'false');
    await audio.click();
    await expect(audio).toHaveAttribute('aria-pressed', 'true');
  });

  test('ورود به بازارچه leads to the marketplace login', async ({ page }, info) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'ورود به بازارچه' }).click();
    await expect(page).toHaveURL(/tenant=talana#\/login/, { timeout: 15000 });
    await expect(page.getByRole('button', { name: 'ورود به طلانا' })).toBeVisible();
    await shot(page, info, SECTION, '07-enter-marketplace');
  });
});
