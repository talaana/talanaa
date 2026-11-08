import { test, expect } from '@playwright/test';
import { PASSWORD, USERS, appNav, fillLogin, shot, tenantUrl, noHorizontalOverflow, isMobile } from '../support/helpers';

const SECTION = 'end-user/auth';
const PHONE = '۰۹۱۲۳۴۵۶۷۸۹';

test.describe('End-user authentication', () => {
  test('login page renders with tenant branding and both login modes', async ({ page }, info) => {
    await page.goto(tenantUrl('pars-gold', '#/login'), { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1, name: 'طلافروشی پارس' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'رمز عبور' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'کد یکبار مصرف' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'ورود به طلافروشی پارس' })).toBeVisible();
    await shot(page, info, SECTION, '01-login-page-pars-gold');
    expect(await noHorizontalOverflow(page)).toBe(0);
  });

  test('wrong password shows a Persian error and stays on login', async ({ page }, info) => {
    await page.goto(tenantUrl('talana', '#/login'), { waitUntil: 'domcontentloaded' });
    await fillLogin(page, '09350000099', 'wrong-password');
    await expect(page.getByText('شماره موبایل یا رمز عبور اشتباه است.')).toBeVisible();
    await expect(page).toHaveURL(/#\/login$/);
    await shot(page, info, SECTION, '02-login-wrong-password');
  });

  test('a customer of another tenant cannot log in here', async ({ page }, info) => {
    await page.goto(tenantUrl('talana', '#/login'), { waitUntil: 'domcontentloaded' });
    await fillLogin(page, USERS.storeCustomer.phone, PASSWORD);
    await expect(page.getByText('شما عضو این فروشگاه نیستید.')).toBeVisible();
    await expect(page).toHaveURL(/#\/login$/);
    await shot(page, info, SECTION, '03-login-foreign-tenant');
  });

  test('OTP mode validates the phone length', async ({ page }, info) => {
    await page.goto(tenantUrl('talana', '#/login'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'کد یکبار مصرف' }).click();
    await page.getByPlaceholder(PHONE).fill('0935');
    await page.getByRole('button', { name: 'دریافت کد تأیید' }).click();
    await expect(page.getByText('شماره موبایل باید ۱۱ رقم باشد')).toBeVisible();
    await shot(page, info, SECTION, '04-otp-invalid-phone');
  });

  test('OTP login with the development code signs the customer in', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'OTP rate limit is per phone; desktop run covers it');
    await page.goto(tenantUrl('talana', '#/login'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'کد یکبار مصرف' }).click();
    await page.getByPlaceholder(PHONE).fill(USERS.marketplaceCustomer.phone);
    await page.getByRole('button', { name: 'دریافت کد تأیید' }).click();
    await expect(page.getByText('کد تأیید ۶ رقمی')).toBeVisible();
    await page.getByPlaceholder('111111').fill('111111');
    await shot(page, info, SECTION, '05-otp-code-entered');
    await page.getByRole('button', { name: 'تأیید و ورود' }).click();
    await expect(page).toHaveURL(/talana\.localhost:3017\/#\/$/);
    await expect(page.getByText(USERS.marketplaceCustomer.name).first()).toBeVisible();
  });

  test('password login, session survives reload, then logout', async ({ page }, info) => {
    await page.goto(tenantUrl('talana', '#/login'), { waitUntil: 'domcontentloaded' });
    await fillLogin(page, USERS.marketplaceCustomer.phone, PASSWORD);
    await expect(page).toHaveURL(/talana\.localhost:3017\/#\/$/);
    await expect(appNav(page).getByRole('button', { name: 'خانه', exact: true })).toBeVisible();
    await expect(page.getByText('موجودی کیف پول').first()).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/talana\.localhost:3017\/#\/$/);
    await expect(appNav(page).getByRole('button', { name: 'خانه', exact: true })).toBeVisible();
    await expect(page.getByText('موجودی کیف پول').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'ورود به طلانا' })).toHaveCount(0);
    await shot(page, info, SECTION, '06-logged-in-after-reload');

    if (isMobile(page)) {
      await page.getByRole('button', { name: 'پروفایل کاربری' }).click();
      await page.getByRole('button', { name: 'خروج از حساب کاربری' }).click();
    } else {
      await appNav(page).getByRole('button', { name: 'خروج', exact: true }).click();
    }
    await expect(page.getByRole('button', { name: 'ورود به طلانا' })).toBeVisible();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'ورود به طلانا' })).toBeVisible();
  });

  test('visiting the admin panel without a session redirects to that tenant\'s login', async ({ page }, info) => {
    await page.goto(tenantUrl('pars-gold', '#/admin'), { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/pars-gold\.localhost:3017\/#\/login$/);
    await expect(page.getByRole('button', { name: 'ورود به طلافروشی پارس' })).toBeVisible();
    await shot(page, info, SECTION, '07-admin-redirects-to-login');
    await fillLogin(page, USERS.storeAdmin.phone, PASSWORD);
    await expect(page).toHaveURL(/pars-gold\.localhost:3017\/#\/admin$/);
    await expect(page.getByRole('heading', { name: 'داشبورد مدیریت' })).toBeVisible();
  });
});
