import { expect, test, type Page } from '@playwright/test';

// Browser-level guard for the App-level superadmin gate (src/App.tsx applyHostRouting).
// The helper-call assertions in host-surface.spec.ts can never see the redirect: every
// localhost host is the dev escape hatch, so the resolver returns null there. This spec
// maps a marketplace hostname to 127.0.0.1 via its own browser launch args and proves
// the SPA actually leaves the page for SUPERADMIN_ORIGIN — and stays put on localhost.
// Nothing here touches the real network: sa.zaraasan.ir is intercepted locally, and the
// launch rules send every other unmapped hostname to ~NOTFOUND.

const ALIAS = 'talaana.ir'; // marketplace landing base per src/host.ts §۵ — alias host only

async function gotoAppDocument(page: Page, url: string): Promise<void> {
  // 'commit' resolves once the app document has started loading, which is before the gate
  // effect can abort this navigation — so the race needs no try/catch, and a refused,
  // 403-from-a-stale-server or otherwise non-200 load fails here instead of being read as
  // "the gate did something".
  const response = await page.goto(url, { waitUntil: 'commit' });
  expect(response?.status(), `app document status for ${url}`).toBe(200);
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

    // No egress: the platform origin is served from the test itself, so landing on it can
    // only mean the SPA navigated there.
    await context.route('https://sa.zaraasan.ir/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>GATE-LANDED</body></html>',
      }),
    );

    const page = await context.newPage();

    // Positive half: on the aliased marketplace host the SPA must leave for the platform.
    await gotoAppDocument(page, `http://${ALIAS}:3017/#/superadmin/tenants`);
    await expect(page).toHaveURL('https://sa.zaraasan.ir/#/superadmin/tenants', { timeout: 15_000 });
    await expect(page.locator('body')).toContainText('GATE-LANDED');

    // Negative half kills the "always redirect" mutant. Waiting for the token-less landing
    // at #/login witnesses that the SPA really booted on the dev host, so "stayed put"
    // cannot be satisfied by a page that never ran; an unconditional gate would have
    // navigated this page to the intercepted platform origin instead.
    await gotoAppDocument(page, 'http://talana.localhost:3017/#/superadmin/tenants');
    await expect(page).toHaveURL('http://talana.localhost:3017/#/login', { timeout: 15_000 });
  } finally {
    await browser.close();
  }
});
