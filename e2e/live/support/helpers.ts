import { expect, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PASSWORD = 'password';

export const USERS = {
  superadmin: { phone: '09123456789', tenant: null, name: 'احسان مرادی' },
  marketplaceAdmin: { phone: '01300000001', tenant: 'talana', name: 'ادمین طلانا' },
  storeAdmin: { phone: '01300000022', tenant: 'pars-gold', name: 'ادمین طلافروشی پارس' },
  marketplaceCustomer: { phone: '09350000001', tenant: 'talana', name: 'سارا کریمی' },
  storeCustomer: { phone: '09350000002', tenant: 'pars-gold', name: 'علی رضایی' },
} as const;

export type Role = keyof typeof USERS;

export const authFile = (role: Role) => path.join(__dirname, '..', '.auth', `${role}.json`);

export const tenantUrl = (tenant: string | null, hash = '') => `${tenant ? `/?tenant=${tenant}` : '/'}${hash}`;

const SCREENSHOT_ROOT = path.join(__dirname, '..', '..', '..', 'e2e-screenshots');

/** Saves to e2e-screenshots/<section>/[mobile/]<name>.png and attaches it to the report. */
export async function shot(page: Page, testInfo: TestInfo, section: string, name: string, fullPage = true) {
  const sub = testInfo.project.name === 'mobile' ? 'mobile' : '';
  const file = path.join(SCREENSHOT_ROOT, section, sub, `${name}.png`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, fullPage, timeout: 30_000 });
  await testInfo.attach(name, { path: file, contentType: 'image/png' });
}

export async function fillLogin(page: Page, phone: string, password: string) {
  await page.fill('input[placeholder="۰۹۱۲۳۴۵۶۷۸۹"]', phone);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: /^ورود به / }).click();
}

export async function openAdmin(page: Page, tenant: string | null) {
  await page.goto(tenantUrl(tenant, '#/admin'), { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('در حال بارگذاری پنل مدیریت...')).toBeHidden({ timeout: 15000 });
}

/** Clicks a sidebar item in the visible (desktop or mobile-drawer) admin nav. */
export async function adminNav(page: Page, label: string) {
  const nav = await adminSidebar(page);
  await nav.getByRole('button', { name: label, exact: true }).click();
}

export function noHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 1024;

/** A dashboard stat card; its first span holds the value. */
export const statCard = (page: Page, label: string) =>
  page.locator('main div.bg-white.rounded-2xl').filter({ has: page.locator(`span.text-sm:text-is("${label}")`) });

export async function openDrawer(page: Page) {
  await page.locator('div.lg\\:hidden.fixed.top-0 button').first().click();
  const drawer = page.locator('div.lg\\:hidden.fixed.inset-0');
  await expect(drawer).toBeVisible();
  return drawer;
}

/** The visible admin navigation: desktop sidebar, or the mobile drawer (opened). */
export async function adminSidebar(page: Page) {
  return isMobile(page) ? openDrawer(page) : page.locator('aside');
}

export async function closeDrawer(page: Page) {
  await page.locator('div.lg\\:hidden.fixed.inset-0 > div.absolute.inset-0').click({ position: { x: 20, y: 400 } });
  await expect(page.locator('div.lg\\:hidden.fixed.inset-0')).toHaveCount(0);
}

/** Opens a sub-item of the "محصولات" accordion in the admin nav. */
export async function adminProductsNav(page: Page, sub: 'همه محصولات' | 'دسته‌بندی‌ها') {
  const nav = await adminSidebar(page);
  const subBtn = nav.getByRole('button', { name: sub, exact: true });
  if (!(await subBtn.isVisible())) await nav.getByRole('button', { name: 'محصولات', exact: true }).click();
  await subBtn.click();
}

/** Opens an end-user app tab: sidebar on desktop; bottom nav or header icons on mobile. */
export async function appTab(page: Page, label: string) {
  if (!isMobile(page)) {
    await page.locator('aside nav').getByRole('button', { name: label, exact: true }).click();
    return;
  }
  const headerLabels: Record<string, string> = { 'اعلان‌ها': 'اعلان‌ها', 'پروفایل': 'پروفایل کاربری' };
  if (headerLabels[label]) await page.getByRole('button', { name: headerLabels[label], exact: true }).click();
  else await page.locator('nav.lg\\:hidden.fixed.bottom-0').getByRole('button', { name: label, exact: true }).click();
}

/** The authenticated app-shell navigation: bottom nav on mobile, sidebar on desktop. */
export function appNav(page: Page) {
  return isMobile(page) ? page.locator('nav.lg\\:hidden.fixed.bottom-0') : page.locator('aside nav');
}
