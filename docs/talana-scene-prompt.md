# PROMPT — Scene/Transition System + Performance & Memory Layer for Talana

Copy everything below this line into a new agent session.

---

## ROLE

You are a senior front-end engineer working in an existing production codebase. You build a
scene + transition system, a landing page builder, and a performance/memory layer for Talana.
You work with the code that is already there. No greenfield rewrite, no placeholder code, no
mock data, no "out of scope" answers.

## CODEBASES (read before writing anything)

Frontend: `D:\talana`

- React 19 + TypeScript 5.8 + Vite 6, Tailwind 4 (`@tailwindcss/vite`), `motion` v12 (`motion/react`).
- Entry: `src/main.tsx` → `TenantProvider` → `src/App.tsx`.
- Landing: `src/components/LandingPage.tsx` (302 lines). Currently plain sections + 3 `motion`
  `whileInView` reveals and an animated hero. No scene system, no builder.
- Tenant resolution: `src/tenant.tsx` — slug / domain / `?tenant=` / `/s/<slug>`, sets a
  module-level current tenant consumed as `X-Tenant` by `src/api.ts`.
- Theme per tenant: `TenantConfig.brand_color`, `silver_tab_color`, `logo` (see `src/types.ts`).
- Installer wizard: `src/components/InstallerPage.tsx` (tenant self-registration).
- Admin: `src/admin/` (`AdminPanel.tsx` + `pages/*`).
- PWA shell: `public/sw.js` (same-origin static cache, API bypassed), `public/manifest.json`.
- `index.html`: RTL (`dir="rtl"`, `lang="fa"`), Vazirmatn via Google Fonts, JSON-LD, skip-link.

Backend: `D:\talana-backend`

- Laravel, API under `routes/api.php`, controllers in `app/Http/Controllers/Api/`.
- Multi-tenant: `App\Models\Tenant` (`fillable` includes `settings` cast to array,
  `brand_color`, `silver_tab_color`, `logo`), tenant-scoped routes behind `auth:api` + `tenant`
  middleware, admin routes behind `permission:admin.access`.
- Tenant admin CRUD lives in `app/Http/Controllers/Api/Admin/TenantController.php`.
- Public resolution endpoint: `GET /api/tenants/resolve` (`TenantResolutionController`).
- Migrations live in `database/migrations/`, tenant scoping is added per table
  (`add_tenant_id_to_*`). Follow that exact pattern.

Constraints from this project:

- Persian RTL first. Vazirmatn. Persian numerals. Mobile-first.
- Per-tenant everything: assets, theme, content, caches. No cross-tenant bleed.
- MySQL in production, SQLite locally, but every migration must be MySQL-compatible.
- Shell is git-bash on Windows. Verify with `npm run lint` (tsc --noEmit) and `npm run build`.

## WHAT WILL EXIST AFTER THIS TASK

1. A shared scene runtime inside `src/scene/` — used by the platform landing page AND served to
   tenants.
2. A **landing page builder** in the tenant admin: each gold business composes its own landing
   page from scenes, transitions, theme tokens, and its real catalog data.
3. A performance/memory layer applied to both consumers, including optimizations for Iranian
   network conditions (high latency, flaky mobile data, heavy censorship-era CDN failures).

## PART 1 — SCENE RUNTIME (`src/scene/`)

Build a framework-agnostic core (plain TS, no React imports) plus a thin React adapter.

### 1.1 Declarative scene schema (versioned)

```ts
interface SceneDocument {
  version: 1;
  tenantId: number | null;          // null = platform landing page
  theme: { brandColor: string; silverTabColor: string; logoUrl: string | null };
  scenes: Scene[];
  transitions: TransitionEdge[];    // edges between scene ids, forward + optional reverse
  quality: QualityHints;
}

interface Scene {
  id: string;
  kind: 'hero' | 'feature' | 'catalog' | 'stats' | 'testimonial' | 'cta' | 'text';
  media: MediaVariant[];            // portrait + landscape variants
  poster: string;                   // ALWAYS present — first paint
  content: SceneContent;            // text blocks, Persian copy, CTA target
  motion: 'cinematic' | 'reveal' | 'static';
  durationMs?: number;
  reducedMotionFallback: { poster: string; contentVisible: boolean };
}

interface TransitionEdge {
  from: string; to: string;
  kind: 'crossfade' | 'video' | 'slide' | 'wipe';
  videoUrl?: string; videoUrlReverse?: string;   // direction-aware
  audioUrl?: string; audioUrlReverse?: string;
  inPointMs?: number; outPointMs?: number;       // trims dead frames
  durationMs: number;
  easing: string;
}
```

Requirements:

- Runtime validator with actionable Persian error messages ("صحنه «hero» پوستر ندارد").
- Migration function `migrate(doc)` — older versions open losslessly, migrate on read.
- The schema is the ONLY contract between builder, preview, and production render. Preview and
  production must run the identical renderer. Never write a second simplified preview renderer.

### 1.2 Three render backends behind one interface

```
SceneBackend: mount(host, doc, tier) / play(edge) / pause() / seek() / destroy()
```

- `VideoBackend` — video scenes and video transitions with crossfade, dual `<video>` elements
  ping-ponged (never creating elements per transition).
- `DomBackend` — DOM/CSS + `motion` driven scenes (reveals, slides, wipes, counters).
- `PosterBackend` — static images with CSS crossfade. Universal fallback, zero JS animation.

Backend selection is decided once by the quality tier controller and may step DOWN mid-session,
never oscillate.

### 1.3 Quality tier controller (`SceneQuality`)

Decide the tier at mount, then only downgrade:

- `prefers-reduced-motion: reduce` → `PosterBackend`, no video playback, full content parity.
- `navigator.deviceMemory <= 4` OR `hardwareConcurrency <= 4` → DOM + poster crossfades.
- `navigator.connection.saveData === true` → poster tier, preload depth 1.
- `effectiveType` in `slow-2g` / `2g` → poster tier.
- Live frame-time EMA: after ~300 frames, if EMA > 23ms, downgrade one tier (and if the tier was
  video, drop video entirely).
- Expose the chosen tier for telemetry and for the builder's health panel.

### 1.4 Performance techniques to implement

1. **Single rAF clock.** One `requestAnimationFrame` loop drives all DOM-backed motion; store the
   handle, `cancelAnimationFrame` on stop. Never one rAF per scene. Clamp
   `dt = min(deltaMs, 50)` so a tab stall cannot jump the timeline.
2. **Layered z-order.** Fixed, explicit layers (poster → media → transition → content → overlay).
   Effects never live in the content layer.
3. **Two-element video ping-pong.** Two `<video>` elements per runtime, swapped by `src`. Never
   `new Video()` per transition. `preload="auto"`, `muted`, `playsInline`, `crossOrigin="anonymous"`.
4. **Bounded LRU media cache** with a protected window (current ±2 scenes and every transition
   touching them, forward and reverse). Evict beyond the window, least-recently-used first.
   Eviction frees the real resource: `pause()`, `removeAttribute('src')`, `load()`, revoke blob URLs.
5. **Byte-budget eviction in addition to LRU distance.** Estimate decoded bytes
   (video: resolution × duration heuristic; audio: bitrate × duration; images: w×h×4) and evict
   against a configurable ceiling. Memory ceiling must be enforced, not hoped for.
6. **Neighborhood preloading** on scene change: current ±1 scenes + their posters + ambient audio +
   every transition touching current/adjacent, both directions.
7. **Predictive preload by velocity.** Track scroll/swipe velocity and direction; buffer 1–3 steps
   ahead along the direction of travel; decay the depth when the user slows down.
8. **Poster-first paint guarantee.** The poster is fetched with high priority and is always the
   first thing painted, at the schema's intrinsic aspect ratio. No layout shift on variant swap.
9. **Aspect-ratio locking.** Container reserves space from intrinsic dimensions (portrait/landscape
   variants both declared) so orientation changes and variant swaps cause zero CLS.
10. **IntersectionObserver gating.** Scenes off-viewport pause all media work. The whole runtime
    pauses when the tab is hidden (`visibilitychange`).
11. **ResizeObserver, coalesced.** Layout recomputation is debounced to one rAF and de-duplicated
    on sub-pixel deltas. Never `window.resize` per-scene.
12. **Code-split backends.** `VideoBackend` and the heavy transition code load lazily via dynamic
    `import()`; the initial landing bundle must not include video machinery. Report bundle deltas.
13. **Deterministic teardown.** Every mount returns a `destroy()` that removes listeners, cancels
    the rAF, disconnects both observers, pauses and detaches every media element, revokes every
    blob URL, and clears every cache entry it owns. Nothing survives its React tree.
14. **No per-frame allocation.** Reuse objects in the clock loop; no array/object literals inside
    the hot path.
15. **Iranian network resilience.** Per-request timeout (e.g. 8s) → one retry → poster fallback.
    No unbounded retry loops, no waterfall blocking: posters and critical content never wait on
    video. Tolerate a dead CDN by resolving media through the tenant's own asset root first.
16. **PWA integration.** Media no larger than a configurable budget may be added to the existing
    SW shell cache; the SW already bypasses `/api/` — keep that. Cache name must be versioned
    (`talana-shell-v4`) and per-tenant media must not leak into the platform shell cache.

### 1.5 React adapter

- `useSceneRuntime(doc, hostRef)` — mounts, subscribes to runtime events (scene change, transition
  start/end, tier change), returns `{ tier, currentSceneId, play, pause, destroy }`.
- Events are typed and unsubscribable. The UI never polls runtime internals.
- StrictMode double-mount must not leak: prove it with the leak audit (Part 4).

## PART 2 — PLATFORM LANDING PAGE (`src/components/LandingPage.tsx`)

- Rebuild the landing page to render from a `SceneDocument` served by the backend, with the
  current hardcoded content as the platform document (seeded, not hardcoded in the component).
- Keep every existing section (features, two business modes, demo stores, supplier CTA, pricing,
  CTA, footer) — they become scenes in the document, not JSX blocks.
- Existing `motion` reveals stay, but move behind the runtime so reduced-motion works uniformly.
- The page must stay fully readable with JS-disabled and with reduced-motion: posters + content are
  the baseline, motion is the enhancement.
- Preserve SEO: JSON-LD, OG tags, canonical stay in `index.html`; add per-scene semantic headings.
- LCP element (hero) must not be blocked by scene code.

## PART 3 — LANDING PAGE BUILDER

### 3.1 Backend (`D:\talana-backend`)

- Migration: `landing_pages` — `id, tenant_id (nullable for platform), version, document (json),
  status (draft|published), published_at, timestamps`, unique on `(tenant_id, status='published')`
  semantics enforced in app logic, plus an immutable `landing_page_revisions` table
  (`landing_page_id, version, document json, created_by, created_at`) so every publish is revertible.
- Model `LandingPage` with `tenant()` relation; add `landingPage()` to `Tenant`.
- Endpoints (tenant-scoped, behind existing `auth:api` + `tenant` middleware):
  - `GET /api/landing-page` — current tenant document (published) + draft if the editor is open.
  - `PUT /api/landing-page/draft` — save draft (validation, returns validator errors).
  - `POST /api/landing-page/publish` — validate, snapshot a revision, flip status.
  - `GET /api/landing-page/revisions` / `POST /api/landing-page/revisions/{rev}/restore`.
- Public: `GET /api/landing-page/public?tenant=<slug|domain>` — published document only, cached,
  no auth. Platform document (`tenant_id = null`) served for the root domain.
- Server-side validation of the `SceneDocument` (mirror the TS rules): required posters, transition
  endpoints must reference existing scene ids, media URLs must be same-tenant, size/duration
  budgets, reverse variant warnings. Reject at save, never at playback.
- Media uploads: store per tenant (`tenants/{tenant_id}/landing/...`), return absolute URLs,
  enforce MIME + size limits, and sanitize the document (no arbitrary URLs from user input).
- Cache: cache the published document per tenant with tag-based invalidation on publish/restore.
- Tests (Pest): validation rejects missing posters and dangling transition edges; tenant A cannot
  read/publish tenant B's document; publish creates a revision; restore works; public endpoint
  never returns another tenant's document.

### 3.2 Frontend builder (`src/admin/pages/LandingBuilder.tsx` + subcomponents)

- Lives in the existing admin panel pattern (`src/admin/AdminPanel.tsx` + `pages/*`), follows
  `src/admin/api.ts` conventions.
- Two panes: scene list (add/reorder/delete, drag) and inspector (media, copy, CTA, motion kind,
  reduced-motion fallback, transition to the next scene with forward + reverse media).
- **Live preview runs the production runtime** (`useSceneRuntime`) with the same document — never a
  simplified preview. Preview mount/unmount must be leak-free (the builder mounts/unmounts previews
  constantly).
- Reorder validation: dragging a scene rewrites the affected transition edges and keeps reverse
  variants attached to the correct direction.
- Device toggle: portrait/landscape and mobile/desktop viewport preview, driving variant selection.
- Upload UI for media + posters with instant local preview, then the backend URL. Warn when
  onboarding a video without a poster.
- Health panel: chosen quality tier, cache hit rate, evictions, p50/p95 frame times, document
  budget warnings (too many scenes in the preload window, oversized media, missing reverse clips).
- Publish flow with server validation errors surfaced per field, plus revision list with restore.
- Builder UI strings in Persian, RTL, Vazirmatn, per-tenant `brand_color`.

## PART 4 — ADDITIONAL TECHNIQUES (beyond what the project already has)

These are the delta. They do not exist in the Talana codebase today.

1. **Scene schema versioning + forward migrations** (documents saved by older builder versions open
   losslessly; persist migrated form on next save).
2. **Per-tenant cache keying** (`tenantId:assetRoot:url`) so two tenants with identically named
   files never collide in the same session.
3. **Byte-budget eviction** on top of LRU distance (item 5 in 1.4).
4. **Directional/asymmetric transitions** with explicit reverse media and reverse easing — walking
   backwards must read as intentional.
5. **Transition pre-roll trimming** (`inPointMs` / `outPointMs`) so playback seeks past dead frames.
6. **First-paint poster guarantee + aspect-ratio locking** (zero CLS on variant swap and rotation).
7. **Sampled, opt-in frame-time telemetry**: p50/p95 frame time, cache hit rate, eviction count,
   long tasks. No PII, off in production by default, surfaced in the builder health panel.
8. **Session budget controller** — single decision point for the quality tier; only steps down.
9. **Iranian-network hardening** — timeouts, retry-once-then-poster, no waterfalls, tenant asset root
   first, tolerant of a dead CDN.
10. **Deterministic leak audit** — a dev-only assertion that after N mount/unmount cycles the count
    of media elements, listeners, timers, and cache entries returns to baseline. Wire it into a test
    that fails the run on regression.
11. **Accessibility parity for motion** — every scene has a text-equivalent content block; motion
    layer is `aria-hidden` decoration; full keyboard navigation without motion; reduced-motion path
    reaches feature parity, not a degraded page.
12. **Catalog-bound scenes** — `catalog` / `stats` scenes render live tenant data (products, silver/gold
    rates from the existing `/api/prices/current`), so a tenant's landing page is never stale
    marketing copy. Data fetch is server-provided or SSR-safe, never a client waterfall blocking LCP.

## PART 5 — NON-NEGOTIABLE RULES

- No placeholder code, no TODOs, no mock data. Every shipped path is the real path.
- No new pages for builder sub-views: the admin uses the existing panel + pages pattern.
- Persian RTL first; no emojis in UI; clean professional design; per-tenant brand color.
- No cross-tenant leakage in data, cache, media, or timers. Prove it with a test.
- TypeScript strict, no `any` escapes except annotated third-party boundaries.
- Every cache is bounded; every acquisition has a matching release.
- Verify with `npm run lint` and `npm run build`; run the Pest suite for the backend.

## PART 6 — ACCEPTANCE CRITERIA (measured, not claimed)

- `npm run lint` and `npm run build` pass with zero new warnings; Pest suite green.
- DevTools Memory: 50+ scene transitions and 20+ builder preview mount/unmount cycles stay bounded
  (flat after GC); no detached media elements; listener counts return to baseline.
- Lighthouse mobile on the landing page: CLS < 0.02; LCP unaffected by scene code (scene/video
  bundle is lazy and does not block LCP).
- p95 frame time < 20ms on a mid-range Android profile during DOM-tier and video-tier playback.
- Reduced-motion run: zero video playback, full content parity.
- Two tenants with identically named assets load their own media (test).
- Builder preview output === production output for the same document (visual + DOM comparison).
- No loading spinner appears during normal navigation in either consumer.
- Report actual measured numbers. Anything that failed: state it with the reason.

## PART 7 — EXECUTION ORDER

1. Read the codebases listed above; write a short territory map (what exists, what is added, what
   is reused) before touching code.
2. Land the schema + validator + migrations with tests first.
3. Build the core runtime (`src/scene/`): clock, tier controller, backends, LRU/byte-budget cache,
   preloader, teardown. Unit-test pool/cache policy, tier downgrade, and validator.
4. Add the React adapter + leak-audit test; make it pass.
5. Backend: migration, model, endpoints, server validation, public endpoint, Pest tests.
6. Rebuild the landing page on the runtime; measure Lighthouse + memory; record numbers.
7. Build the admin builder + live preview + health panel + publish/revisions.
8. Run the full acceptance checklist; report measured numbers and any unmet requirement with the
   specific reason.

Final report: files created/changed, public API surface of `src/scene/`, endpoint list, measured
perf/memory numbers, and the leak-audit result.
