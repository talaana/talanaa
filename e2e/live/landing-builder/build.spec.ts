import { test, expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authFile, openAdmin, adminNav } from '../support/helpers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', '..', '..', 'e2e-output', 'landing-builder');
const CAMPAIGN_JSON = path.join(OUTPUT_DIR, 'pars-gold-showcase.json');

const CAMPAIGN_NAME = 'نمایشگاه پارس گلد';
const SLUG = 'pars-gold-showcase';
const SEO_TITLE = 'نمایشگاه پارس گلد — تجربه سینمایی طلا و جواهر';
const HALLS = ['سرسرای اصلی', 'گالری عروس', 'سالن خصوصی VIP'] as const;
const HOTSPOT_LABEL = 'انگشتر سولیتر الماس';
const HOTSPOT_PRODUCT = 'prod-solitaire-ring';

test.use({ storageState: authFile('storeAdmin') });

/** Node card on the canvas — the canvas root also has cursor-grab but carries data-canvas. */
function nodeCard(page: Page, title: string): Locator {
  return page.locator('div.cursor-grab:not([data-canvas])', { has: page.locator(`span:text-is("${title}")`) });
}

/** Step evidence goes to the delivery folder e2e-output/landing-builder. */
async function artifactShot(page: Page, info: TestInfo, name: string) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const file = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, timeout: 30_000 });
  await info.attach(name, { path: file, contentType: 'image/png' });
}

/**
 * Drag from a node's right port to another node to create a transition edge.
 * Chromium occasionally kills the pointer stream mid-drag (document-wide
 * pointerleave cascade), so the gesture verifies the dashed cable appears
 * after pointerdown, stays alive mid-drag, and that the edge materializes —
 * retrying on any dead stream.
 */
async function connectEdge(page: Page, fromTitle: string, toTitle: string): Promise<void> {
  const edges = page.locator('svg g.cursor-pointer');
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const before = await edges.count();
    const from = await nodeCard(page, fromTitle).boundingBox();
    const to = await nodeCard(page, toTitle).boundingBox();
    if (!from || !to) throw new Error('cannot read node boxes for connecting');
    const sx = from.x + from.width - 3;
    const sy = from.y + from.height / 2;
    const tx = to.x + to.width / 2;
    const ty = to.y + to.height / 2;

    await page.mouse.move(sx, sy);
    await page.mouse.down();
    const cable = page.locator('svg path[stroke-dasharray]');
    const committed = await cable.first().waitFor({ state: 'visible', timeout: 3_000 }).then(() => true).catch(() => false);
    if (committed) {
      await page.mouse.move(tx, ty, { steps: 10 });
      const alive = await cable.first().isVisible().catch(() => false);
      await page.mouse.up();
      if (alive) {
        const created = await expect
          .poll(() => edges.count(), { timeout: 3_000 })
          .toBe(before + 1)
          .then(() => true)
          .catch(() => false);
        if (created) return;
      }
    } else {
      await page.mouse.up();
    }
    await page.mouse.click(1_100, 700);
    await page.waitForTimeout(200);
  }
  throw new Error(`یال از «${fromTitle}» به «${toTitle}» ساخته نشد`);
}

/**
 * Select a node by clicking where the card is. The invisible dropzone layer paints
 * above the card and intercepts locator clicks; a real click there selects the node,
 * so we assert the inspector shows the node's title afterwards.
 */
async function selectNode(page: Page, title: string): Promise<void> {
  const box = await nodeCard(page, title).boundingBox();
  if (!box) throw new Error(`node card ${title} has no bounding box`);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByLabel('عنوان', { exact: true })).toHaveValue(title);
}

test.describe('Experience builder (سازنده تجربه)', () => {
  test('builds a 3-hall campaign, wires edges and a hotspot, previews, publishes and exports JSON', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'سازنده تجربه فقط در حالت دسکتاپ تست می‌شود');
    test.setTimeout(180_000);

    await openAdmin(page, 'pars-gold');
    await adminNav(page, 'سازنده تجربه');

    // Fresh storage seeds exactly one default campaign.
    await expect(page.locator('select')).toBeVisible();
    await expect(page.getByRole('option', { name: 'گالری اصلی طلا و جواهر' })).toBeAttached();
    await artifactShot(page, info, '01-builder-initial');

    await page.getByTitle('کمپین جدید').click();
    await page.getByLabel('نام', { exact: true }).fill(CAMPAIGN_NAME);
    await page.getByLabel('اسلاگ', { exact: true }).fill(SLUG);
    await page.getByLabel('عنوان SEO', { exact: true }).fill(SEO_TITLE);
    await expect(page.locator('select')).toContainText(CAMPAIGN_NAME);
    await expect(page.getByText(`/experience/${SLUG}`, { exact: true })).toBeVisible();

    // Add three sequence nodes; each new node is auto-selected: rename, then drag it into place.
    // Heights are staggered so edges between halls are diagonal — a same-row edge is a
    // zero-height line whose <g> bounding box is empty and cannot be clicked by Playwright.
    const spots: Array<[number, number]> = [[420, 280], [690, 340], [940, 290]];
    for (let i = 0; i < HALLS.length; i += 1) {
      await page.getByRole('button', { name: 'سکانس', exact: true }).click();
      await page.getByLabel('عنوان', { exact: true }).fill(HALLS[i]);
      const card = nodeCard(page, HALLS[i]);
      await expect(card).toBeVisible();
      const box = await card.boundingBox();
      if (!box) throw new Error(`node card ${HALLS[i]} has no bounding box`);
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(spots[i][0], spots[i][1], { steps: 10 });
      await page.mouse.up();
    }

    // Connect hall1→hall2 and hall2→hall3 from each node's right port.
    await connectEdge(page, HALLS[0], HALLS[1]);
    await connectEdge(page, HALLS[1], HALLS[2]);
    await expect(page.locator('svg g.cursor-pointer')).toHaveCount(2);

    // Clicking an edge opens the transition inspector for hall1→hall2.
    await page.locator('svg g.cursor-pointer').first().click();
    await expect(page.getByText('ترنزیشن‌سکانس (یال)')).toBeVisible();
    await expect(page.getByText(`${HALLS[0]} → ${HALLS[1]}`)).toBeVisible();
    await artifactShot(page, info, '02-edge-inspector');

    // Entry-point round trip: start from hall3, then move it back to hall1.
    await selectNode(page, HALLS[2]);
    await page.getByRole('button', { name: 'تنظیم به‌عنوان نقطه شروع' }).click();
    await expect(page.getByText('نقطه شروع', { exact: true })).toBeVisible();
    await selectNode(page, HALLS[0]);
    await page.getByRole('button', { name: 'تنظیم به‌عنوان نقطه شروع' }).click();
    await expect(page.getByText('نقطه شروع', { exact: true })).toBeVisible();

    // Hotspot on hall1, wired to the demo-catalog product.
    await page.getByRole('button', { name: 'افزودن', exact: true }).click();
    await page.getByLabel('نام هات‌اسپات').fill(HOTSPOT_LABEL);
    await page.getByLabel('شناسه محصول', { exact: true }).fill(HOTSPOT_PRODUCT);
    await expect(page.getByText('هات‌اسپات‌ها (1)')).toBeVisible();
    await artifactShot(page, info, '03-canvas-graph');

    await page.getByRole('button', { name: 'ذخیره', exact: true }).click();
    await expect(page.getByText('ذخیره شد.', { exact: true })).toBeVisible();

    // Preview renders the built journey with the same player.
    await page.getByRole('button', { name: 'پیش‌نمایش', exact: true }).click();
    await expect(page.getByText('پیش‌نمایش کمپین')).toBeVisible();
    await expect(page.getByRole('heading', { name: HALLS[0], exact: true })).toBeVisible();
    await expect(page.getByText('تالار ۱ از ۳')).toBeVisible();
    for (const hall of HALLS) await expect(page.getByRole('button', { name: hall, exact: true })).toBeVisible();
    await artifactShot(page, info, '04-preview');
    await page.getByRole('button', { name: 'بستن ✕' }).click();
    await expect(page.getByText('پیش‌نمایش کمپین')).toBeHidden();

    await page.getByRole('button', { name: 'انتشار', exact: true }).click();
    await expect(page.getByText('منتشر شد.', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'منتشر شده' })).toBeVisible();
    await artifactShot(page, info, '05-published');

    // Export the campaign JSON through the builder's own download button.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTitle('خروجی JSON').click(),
    ]);
    expect(download.suggestedFilename()).toBe(`${SLUG}.json`);
    await download.saveAs(CAMPAIGN_JSON);

    // The exported artifact must describe exactly what was built in the canvas.
    const campaign = JSON.parse(fs.readFileSync(CAMPAIGN_JSON, 'utf8')) as {
      slug: string;
      name: string;
      seo: { title: string };
      published: boolean;
      graph: {
        entryNodeId: string | null;
        nodes: Array<{ id: string; title: string; hotspots: Array<{ label: string; productId: string }> }>;
        edges: Array<{ source: string; target: string; kind: string; durationMs: number }>;
      };
    };
    expect(campaign.slug).toBe(SLUG);
    expect(campaign.name).toBe(CAMPAIGN_NAME);
    expect(campaign.seo.title).toBe(SEO_TITLE);
    expect(campaign.published).toBe(true);
    expect(campaign.graph.nodes.map((n) => n.title).sort()).toEqual([...HALLS].sort());
    const byId = new Map(campaign.graph.nodes.map((n) => [n.id, n]));
    expect(byId.get(campaign.graph.entryNodeId)?.title).toBe(HALLS[0]);
    const pairs = campaign.graph.edges
      .map((e) => `${byId.get(e.source)?.title}→${byId.get(e.target)?.title}`)
      .sort();
    expect(pairs).toEqual([`${HALLS[0]}→${HALLS[1]}`, `${HALLS[1]}→${HALLS[2]}`]);
    expect(campaign.graph.edges.every((e) => e.kind === 'crossfade' && e.durationMs === 900)).toBe(true);
    const entryNode = byId.get(campaign.graph.entryNodeId);
    expect(entryNode?.hotspots).toHaveLength(1);
    expect(entryNode?.hotspots[0].label).toBe(HOTSPOT_LABEL);
    expect(entryNode?.hotspots[0].productId).toBe(HOTSPOT_PRODUCT);

    // Human-readable flow + settings for the delivery folder.
    const hallLines = campaign.graph.nodes.map((n) => {
      const hs = n.hotspots.map((h) => `${h.label} (شناسه محصول: ${h.productId})`).join('، ') || '—';
      return `- ${n.title}${n.id === campaign.graph.entryNodeId ? ' — نقطه شروع' : ''} | هات‌اسپات‌ها: ${hs}`;
    });
    const edgeLines = campaign.graph.edges.map(
      (e, i) =>
        `${i + 1}. ${byId.get(e.source)?.title} → ${byId.get(e.target)?.title} (${e.kind === 'video' ? 'ویدیوی ترنزیشن' : 'کراس‌فید'}، ${e.durationMs} میلی‌ثانیه)`,
    );
    const flow = [
      `# خروجی سازنده تجربه — کمپین ${CAMPAIGN_NAME}`,
      '',
      '## تنظیمات کمپین',
      `- نام: ${campaign.name}`,
      `- اسلاگ: ${campaign.slug}`,
      `- عنوان SEO: ${campaign.seo.title}`,
      `- وضعیت انتشار: ${campaign.published ? 'منتشر شده' : 'پیش‌نویس'}`,
      `- مسیر عمومی: /experience/${SLUG}`,
      '',
      '## فلو تجربه (گراف سکانس‌ها)',
      ...hallLines,
      '',
      '## یال‌های ترنزیشن',
      ...edgeLines,
      '',
      '## فایل‌های این پوشه',
      '- pars-gold-showcase.json — خروجی کامل کمپین از دکمه «خروجی JSON» سازنده',
      '- flow.md — همین فایل: فلو و تنظیمات کمپین',
      '- 01…05 — اسکرین‌شات گام‌به‌گام ساخت، پیش‌نمایش و انتشار',
      '- render-desktop.png / render-mobile.png — رندر کمپین در /experience/pars-gold-showcase',
    ].join('\n');
    fs.writeFileSync(path.join(OUTPUT_DIR, 'flow.md'), flow, 'utf8');
  });
});
