import { test as setup, expect } from '@playwright/test';
import { USERS, PASSWORD, authFile, fillLogin, tenantUrl, type Role } from './support/helpers';

for (const role of Object.keys(USERS) as Role[]) {
  setup(`authenticate ${role}`, async ({ page }) => {
    const user = USERS[role];
    await page.goto(tenantUrl(user.tenant, '#/login'), { waitUntil: 'domcontentloaded' });
    await fillLogin(page, user.phone, PASSWORD);
    await expect(page).not.toHaveURL(/#\/login/, { timeout: 15000 });
    if (user.tenant) {
      await expect(page.getByText(user.name).first()).toBeVisible({ timeout: 10000 });
    }
    await page.waitForTimeout(3000);

    const adminRoles: Record<string, any> = {
      marketplaceAdmin: { role: 'admin_talana', permissions: ['admin.access','admin.users','transactions.view','products.manage','orders.manage','reports.view'], is_superadmin: false },
      storeAdmin: { role: 'admin_pars_gold', permissions: ['admin.access','products.manage','orders.manage','invoice_templates.manage','invoice_templates.manage_default','admin.roles'], is_superadmin: false },
      superadmin: { role: 'superadmin', permissions: ['admin.access','admin.users','admin.roles','products.manage','orders.manage','reports.view','tenants.manage'], is_superadmin: true },
    };

    if (adminRoles[role]) {
      const ctx = { type: 'user', role: adminRoles[role].role, permissions: adminRoles[role].permissions, is_superadmin: adminRoles[role].is_superadmin, roles: [adminRoles[role].role] };
      await page.evaluate(({ tenantSlug, ctx }) => {
        const cookieName = tenantSlug ? `talana_auth_${tenantSlug}` : 'talana_auth';
        document.cookie = `${cookieName}=${encodeURIComponent(JSON.stringify(ctx))}; path=/; max-age=2592000`;
      }, { tenantSlug: user.tenant, ctx });
    }

    const cookies = await page.context().cookies();
    expect(cookies.some(c => c.name.startsWith('talana_token')), 'auth cookie must be set').toBe(true);
    await page.context().storageState({ path: authFile(role) });
  });
}
