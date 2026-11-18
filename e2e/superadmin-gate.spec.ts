import { expect, test, type Page } from '@playwright/test';

// Browser-level guard for the App-level superadmin gate (src/App.tsx applyHostRouting).
// The helper-call assertions in host-surface.spec.ts can never see the redirect: every
// localhost host is the dev escape hatch, so the resolver returns null there. This spec
// maps a marketplace hostname to 127.0.0.1 via its own browser launch args and proves
// the SPA actually leaves the page for SUPERADMIN_ORIGIN — and stays put on localhost.
// Nothing here touches the real network: sa.zaraasan.ir is intercepted locally, and the
// launch rules send every other unmapped hostname to ~NOTFOUND.

const ALIAS = 'talaana.ir'; // marketplace landing base per src/host.ts §۵ — alias host only

async function gotoWithNavigationRace(page: Page, url: string): Promise<void> {
  // The gate navigates as soon as the effect runs, which can abort the original
  // document load. A failed navigation whose request already left the origin is
  // evidence of the gate, not a test failure — anything else must still throw.
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  } catch (error) {
    if (!page.url().startsWith(`http://${ALIAS}:3017`)) throw error;
  }
}

test('the App gate redirects #/superadmin off a marketplace host, and not off localhost', async ({ playwright }) => {
  test.setTimeout(60_000);

  const browser = await playwright.chromium.launch({
    args: [
      '--host-resolver-rules=' +
        `MAP ${ALIAS} 127.0.0.1, MAP *.localhost 127.0.0.1, MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost`,
      '--no-proxy-server',
    ],
  });
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });

    // No egress: the destination is served from the test itself.
    let gateServed = 0;
    await context.route('https://sa.zaraasan.ir/**', route => {
      gateServed += 1;
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>GATE-LANDED</body></html>',
      });
    });

    const page = await context.newPage();

    // Positive half: on the aliased marketplace host the SPA must leave for the platform.
    await gotoWithNavigationRace(page, `http://${ALIAS}:3017/#/superadmin/tenants`);
    await expect(page).toHaveURL('https://sa.zaraasan.ir/#/superadmin/tenants');
    await expect(page.locator('body')).toContainText('GATE-LANDED');
    expect(gateServed).toBeGreaterThan(0);

    // Negative half kills the "always redirect" mutant: the same hash opened on
    // talana.localhost (dev escape hatch) must stay on the dev server untouched.
    const localGateServed = gateServed;
    await page.goto('http://talana.localhost:3017/#/superadmin/tenants');
    expect(page.url()).toContain(':3017');
    expect(page.url()).not.toContain('sa.zaraasan.ir');
    expect(gateServed).toBe(localGateServed);
  } finally {
    await browser.close();
  }
});
