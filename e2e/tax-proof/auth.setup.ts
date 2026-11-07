import { test as setup, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const authFile = path.join(__dirname, '.auth', 'storeAdmin.json');

setup('authenticate store admin of pars-gold', async ({ page }) => {
  page.on('dialog', d => d.accept());

  await page.goto('/?tenant=pars-gold#/login', { waitUntil: 'domcontentloaded' });

  await page.fill('input[placeholder="۰۹۱۲۳۴۵۶۷۸۹"]', '01300000022');
  await page.fill('input[type="password"]', 'password');
  await page.getByRole('button', { name: /^ورود به / }).click();

  await expect(page).not.toHaveURL(/#\/login/, { timeout: 20000 });
  await page.waitForTimeout(1500);

  const cookies = await page.context().cookies();
  expect(cookies.some(c => c.name.startsWith('talana_token')), 'auth cookie must be set').toBe(true);

  await page.context().storageState({ path: authFile });
});
