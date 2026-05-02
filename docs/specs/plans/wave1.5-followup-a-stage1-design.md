# Wave 1.5 Follow-up A — Stage 1 Design: `scripts/visual-diff.ts`

> **Branch:** `feat/wave1-followup-a-visual-parity`
> **Status:** Design draft (Stage 1 of 4). No code yet. Stage 2 consumes the report this harness emits.
> **Owner role:** Architect (read-only). Implementer is Stage 2's executor.

---

## 1. Goal & success criteria

Build a Playwright-driven dual-render harness that opens the static prototype (`prototype/prototype.html`, line 101 — `#page-voc`) **and** the React `/voc` route (rendered by `frontend/src/components/voc/VocListPage.tsx:19`), extracts a curated whitelist of computed CSS properties per matched component pair, diffs them with a token-aware comparator, and writes a prioritized markdown report at `docs/specs/reviews/wave1.5-followup-a/voc-visual-diff-report.md`. The harness exists so Stage 2's component-level fixes can be ranked by severity rather than by hunting.

**Exit conditions (Stage 1 done):**

- `scripts/visual-diff.ts` (or `scripts/visual-diff/`) runs end-to-end via `npx tsx`, exits 0 with a report on disk.
- Both surfaces render the 9 composition components + 3 primitives listed in §5.
- Report contains at least one row per component pair (or an explicit `[NOT MEASURABLE]` reason).
- Vitest unit specs cover `diff()` and `extract()` pure functions (no Playwright in CI).
- No raw hex / OKLCH literals leaked into the harness; tolerated values come from `frontend/src/tokens.ts:4` only.
- `npm install` lockfile delta is reviewed against phase-8 §7.2 closed-network constraint (see §2).

---

## 2. Where Playwright lives

**Decision: install at `frontend/` workspace as a `devDependency`.**

Rationale:

- Existing root `scripts/check-fixture-seed-parity.ts:21` runs as `tsx` from root and only imports project `shared/` modules — it has no browser dependency. Playwright would inflate the root closure for a single use.
- The harness _targets the React app_; co-locating with Vite + MSW + Vitest keeps the heavy browser binaries on the surface that already ships them in dev (`frontend/package.json:39` already pulls `jsdom`, `msw`, etc.).
- The script lives at _root_ (`scripts/visual-diff.ts`) but resolves Playwright via `require.resolve('playwright', { paths: [path.join(ROOT, 'frontend')] })` or simply runs as `npm exec -w frontend tsx ../../scripts/visual-diff.ts`. Documented entry is `npm run -w frontend visual-diff`.

Closed-network impact (phase-8 §7.2):

- Adds `playwright` (~12 MB JS) + browser binaries (~250 MB Chromium) on first run. Browsers are downloaded at install via `postinstall` of the `playwright` package — this **breaks** offline reproducibility unless we either:
  1. Vendor the Chromium tarball in `vendor/` and set `PLAYWRIGHT_BROWSERS_PATH=$(ROOT)/vendor/playwright-browsers`, or
  2. Use system Chromium via `channel: 'chrome'`.
- `[DECISION NEEDED]` Pick (1) vs (2). Default proposal: (1) for parity with phase-8 vendoring discipline; (2) only if the host CI image already has Chrome.

`package-lock.json` will gain ~30 transitive entries; this is acceptable but must land in its **own** commit per root CLAUDE.md "Refactoring vs feature" rule (this is a tooling addition, not a refactor).

---

## 3. Prototype loading strategy

`prototype/prototype.html` is **1080 lines** (verified) — a single document where every "page" (including `#page-voc` at line 101, `#page-voc-type` at 583, dashboard at 207, etc.) is **always in the DOM**, with visibility toggled by `setNav(this)` JS handlers (line 55). This means we do not need to navigate between sections — we just need `#page-voc` visible.

**Decision: serve via `npx http-server prototype -p 4174` (matches the prototype CLAUDE.md preview command).**

`file://` rejected because:

- `prototype/css/*.css` and `prototype/js/*.js` use relative paths that resolve cleanly under HTTP but trigger CORS/`file://` quirks for the lucide CDN script and CSS imports.
- The prototype's `data.js` attaches globals via `window.X = X` aliases (per `prototype/CLAUDE.md` "classic-script gotcha"); some browsers throttle module-eval ordering on `file://`.

**Visibility flow (Playwright):**

1. `await page.goto('http://127.0.0.1:4174/prototype.html');`
2. `await page.evaluate(() => { document.querySelectorAll('[id^="page-"]').forEach(el => (el).style.display = 'none'); document.getElementById('page-voc').style.display = ''; });` — explicit because the prototype's nav router (`setNav`) may attach late.
3. `await page.waitForFunction(() => document.querySelectorAll('#listArea > *').length > 0)` — wait for the JS data renderer to populate rows.
4. For modal/dropdown: call the prototype's own globals — `await page.evaluate(() => (window as any).openModal())` (referenced at `prototype.html:114`), `await page.evaluate(() => (window as any).toggleNotif())` (line 111).

A dedicated `prototype-server.ts` helper spawns `http-server` as a child process and tears it down on exit.

---

## 4. `/voc` loading strategy

**Decision: spawn `npm run -w frontend dev`, wait for `:5173` (verified `frontend/vite.config.ts:8`), then drive the existing `MockLoginPage` flow.**

Login flow (verified via `frontend/src/router.tsx` and `frontend/src/pages/MockLoginPage.tsx:1-30`):

- Without `VITE_AUTH_MODE=mock`, `MockLoginPage` is `null` and the app routes you to `/`. With it set, `/mock-login` renders a form; submitting calls `AuthContext.login(role)` then `navigate('/')`, which redirects to `/voc`.
- Authoritative flow: launch dev server with `VITE_AUTH_MODE=mock`, `page.goto('/mock-login')`, click submit (default role=`admin`), wait for URL `/voc`, wait for `[data-testid="voc-loading"]` (already present at `VocListPage.tsx:60`) to disappear.
- MSW (`frontend/src/mocks/browser.ts`) is already wired in dev and intercepts `/api/vocs` etc. via `frontend/src/mocks/handlers/voc.ts` — no extra mocking work.

Rejected alternatives:

- Cookie injection: requires reverse-engineering `AuthContext` token shape — fragile.
- Direct API call: same problem; the form is the stable contract.

A `frontend-server.ts` helper:

```ts
spawn('npm', ['run', '-w', 'frontend', 'dev'], { env: { ...process.env, VITE_AUTH_MODE: 'mock' } });
await waitForPort(5173, 30_000);
```

Killed on exit unless `--keep-server` (§10).

---

## 5. Selector mapping

The prototype uses semantic class names (`.topbar`, `.filterbar`, `.pill.active`, `.list-header`, `.sort-chip`); the React side uses Tailwind utilities + tokens with **no stable structural class**. We need a thin marker layer.

**Decision: introduce a single `data-pcomp="<componentId>"` attribute on the root element of each composition + primitive, on both sides.** One attribute, one canonical id. Not a `data-testid` sweep (that exists for testing internals). `data-pcomp` is exclusive to visual-diff.

Mapping table:

| componentId            | Prototype anchor                                              | React anchor                                     |
| ---------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| `voc-topbar`           | `#page-voc > .topbar` (line 103)                              | `VocTopbar.tsx:23` root `<div>`                  |
| `voc-status-filters`   | `#page-voc > .filterbar` (line 118)                           | `VocStatusFilters.tsx` root                      |
| `voc-advanced-filters` | `#advFilterWrap` (line 133)                                   | `VocAdvancedFilters.tsx` root                    |
| `voc-sort-chips`       | `.list-toolbar` (line 170)                                    | `VocSortChips.tsx` root                          |
| `voc-table`            | `.list-area` (line 168) **+** child `.list-header` (line 181) | `VocTable.tsx` root                              |
| `voc-pagination`       | `#paginationRow` (line 191)                                   | `VocPaginationBar.tsx` root                      |
| `voc-create-modal`     | modal opened by `openModal()` (line 114)                      | `VocCreateModal.tsx` root (Radix dialog content) |
| `voc-notif-dropdown`   | panel opened by `toggleNotif()` (line 111)                    | `VocNotificationsDropdown.tsx` root              |
| `voc-review-drawer`    | drawer (separate id, opened on row click)                     | `VocReviewDrawer.tsx` root                       |
| **Primitives**         |                                                               |                                                  |
| `notification-bell`    | `#notifBtn` (line 111)                                        | `NotificationBell.tsx` root                      |
| `pagination`           | inside `#paginationRow`                                       | `Pagination.tsx` root                            |
| `data-table`           | `.list-header` row                                            | `DataTable.tsx` root (semantic `<table>`)        |

Intrusion cost:

- Prototype: 12 attribute insertions, no behavior change. Acceptable per `prototype/CLAUDE.md` "visual sandbox" — the marker is invisible and ignored by the prototype JS.
- React: 12 attribute insertions on existing roots. Zero risk.

`[DECISION NEEDED]` Should `data-pcomp` insertions on the **prototype** land as part of Stage 1 (read-only architect role) or Stage 2 (executor)? Proposal: defer to Stage 2 with this design as the spec.

---

## 6. Computed style extraction

`page.evaluate` calls `getComputedStyle(el)` for each `data-pcomp` element **and recursively for its first-level children** (depth-1). Whitelist properties only — `getComputedStyle` returns ~400 keys; reading all is noise.

Whitelist (returned as ordered object so report tables are deterministic):

| Group      | Properties                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------- |
| Typography | `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-transform`        |
| Color      | `color`, `background-color`, `border-color`, `box-shadow` (color extracted), `outline-color`        |
| Spacing    | `padding-top/right/bottom/left`, `margin-top/right/bottom/left`, `gap`, `row-gap`, `column-gap`     |
| Border     | `border-top-width`, `border-radius`, `border-style`                                                 |
| Shadow     | `box-shadow` (full string, color split out separately)                                              |
| Layout     | `display`, `flex-direction`, `align-items`, `justify-content`, `flex-wrap`, `grid-template-columns` |
| Sizing     | `width`, `height`, `min-width`, `max-width` (only when not `auto`/`none` to reduce noise)           |

Anything outside the whitelist is dropped at extraction time.

Output shape:

```ts
type Extracted = {
  componentId: string;
  selector: string; // 'data-pcomp=voc-topbar > .child:nth-of-type(1)'
  role: 'root' | 'child';
  props: Record<string, string>; // raw CSS values
};
```

---

## 7. Diff algorithm

Token-aware, not pixel-aware. Comparing computed values directly works because `getComputedStyle` resolves `var(--brand)` to its `rgb(…)` form on both sides — if both sides truly use the token they'll match exactly.

Rules per property group:

- **Color group**: parse both sides via a tiny `rgba()` parser; compare component-wise; **exact match required**. Severity `HIGH` on mismatch (a wrong color = wrong token = design violation).
- **Spacing / border-width / sizing**: parse `Npx`; tolerance `±1px` (anti-aliasing artifacts). Severity `MED`.
- **Typography**: exact match on `font-family`, `font-weight`, `text-transform`. `font-size` and `line-height` get `±0.5px`. Severity `MED`.
- **Layout enums** (`display`, `flex-direction`, …): exact. Severity `HIGH` (structural).
- **Shadow**: normalize whitespace; exact. Severity `LOW` (commonly drifts, often acceptable).

Difference record:

```ts
type Diff = {
  componentId: string;
  selector: string;
  property: string;
  prototype: string;
  react: string;
  severity: 'HIGH' | 'MED' | 'LOW';
  suggestion?: string; // filled by tokenMappingHints() in §8
};
```

Sort: by componentId asc, severity desc, property asc.

---

## 8. Output format

Path: `docs/specs/reviews/wave1.5-followup-a/voc-visual-diff-report.md`.

Layout:

```markdown
# VOC Visual Diff — Prototype vs `/voc` (Wave 1.5 Follow-up A, Stage 1 output)

Generated: <ISO timestamp>
Prototype URL: http://127.0.0.1:4174/prototype.html#page-voc
React URL: http://127.0.0.1:5173/voc

## Summary

| Component  | HIGH | MED | LOW |
| ---------- | ---- | --- | --- |
| voc-topbar | 2    | 5   | 1   |
| …          |      |     |     |

## voc-topbar

| Property         | Prototype     | React         | Severity | Suggested Action                          |
| ---------------- | ------------- | ------------- | -------- | ----------------------------------------- |
| background-color | rgb(20,22,28) | rgb(24,26,32) | HIGH     | Use `var(--bg-panel)` (matches prototype) |
| padding-left     | 24px          | 16px          | MED      | Match prototype: `px-6` instead of `px-4` |

… (one H2 per componentId) …

## Token Mapping Hints

For each unique React color encountered, the nearest token from `frontend/src/tokens.ts:4`:

| Observed (React) | Closest token                       | ΔE (LAB) |
| ---------------- | ----------------------------------- | -------- |
| rgb(94,102,210)  | `var(--brand)` (oklch 63% 0.19 258) | 1.2      |
```

The Token Mapping appendix iterates `tokens.ts:4-42` (read at runtime), converts each token via Playwright (`getComputedStyle` on a hidden probe div with `color: var(--brand)`), then nearest-neighbours each observed React color in LAB space.

---

## 9. Module decomposition

Single-file budget: 300 lines (root CLAUDE.md). Realistic estimate is ~450 lines, so split from the start:

```
scripts/visual-diff/
  index.ts              # CLI entry, orchestration, ~80 lines
  harness.ts            # Playwright setup, dev-server + http-server spawn, ~120 lines
  extract.ts            # in-page getComputedStyle whitelist; pure adapter, ~80 lines
  diff.ts               # pure functions: parseColor, compareGroup, classify; ~120 lines
  report.ts             # Diff[] → markdown string; ~100 lines
  tokens.ts             # token loader + LAB nearest-neighbour, ~60 lines
```

A re-export shim `scripts/visual-diff.ts` (5 lines) keeps the documented CLI path working:

```ts
import('./visual-diff/index.js').then((m) => m.main(process.argv.slice(2)));
```

Public API signatures:

```ts
// extract.ts
export interface ExtractOptions {
  whitelist: readonly string[];
  depth: 0 | 1;
}
export async function extractFromPage(page: Page, opts: ExtractOptions): Promise<Extracted[]>;

// diff.ts
export function diff(a: Extracted[], b: Extracted[]): Diff[];
export function classify(
  prop: string,
  av: string,
  bv: string,
): { match: boolean; severity: Severity };

// report.ts
export function renderReport(diffs: Diff[], meta: ReportMeta): string;

// harness.ts
export interface HarnessHandles {
  protoPage: Page;
  reactPage: Page;
  teardown(): Promise<void>;
}
export async function bootHarness(opts: HarnessOptions): Promise<HarnessHandles>;
```

---

## 10. CLI surface

```
npx tsx scripts/visual-diff.ts [options]

Options:
  --component=<id>     Run only one componentId (e.g. voc-topbar). Repeatable.
  --out=<path>         Override report path. Default: docs/specs/reviews/wave1.5-followup-a/voc-visual-diff-report.md
  --keep-server        Don't kill spawned dev servers after run (debugging).
  --proto-port=<n>     Default 4174.
  --react-port=<n>     Default 5173.
  --headed             Run Playwright with headed Chromium (debugging).
  --severity=<level>   Filter report to >= level. Default LOW.
```

Process management: spawn handles tracked in a `Disposable[]`; `process.on('exit'|'SIGINT'|'SIGTERM', teardown)`. `--keep-server` skips teardown but logs PIDs so the dev can `kill` manually.

NPM script (root `package.json`): `"visual-diff": "tsx scripts/visual-diff.ts"`.

---

## 11. Test strategy

- **Unit (Vitest, in `frontend/`):**
  - `diff.test.ts`: `classify()` for each group with synthetic inputs (color exact, color ±1 channel = HIGH, spacing 12 vs 13 = match within tol, spacing 12 vs 16 = MED, layout `flex` vs `block` = HIGH).
  - `extract.test.ts`: feeds a fake `Page` (mock with `evaluate` returning fixture computed styles), asserts whitelist filtering drops non-listed props.
  - `report.test.ts`: snapshot test — given a fixed `Diff[]`, render markdown matches a committed golden file.
- **Integration (manual, deferred):** `npm run visual-diff` from a clean checkout; verify report exists and contains all 12 componentIds. Not run in CI in Stage 1.
- **Lint:** the harness must pass the project's `lint:tokens` rule (`frontend/package.json:12`) — no hex literals.

TDD ordering for Stage 2: write `diff.test.ts` first (red), then `diff.ts` (green), repeat per module.

---

## 12. Risks & open questions

`[DECISION NEEDED]` items, in priority order:

1. **Browser provisioning** (§2): vendor Chromium tarball vs system Chrome via `channel: 'chrome'`. Pick before lockfile commit.
2. **`data-pcomp` insertion timing** (§5): Stage 1 architect inserts (violates read-only) vs Stage 2 executor inserts (cleaner). Recommend latter.
3. **Drawer/modal interaction sequencing**: prototype `openModal()`, `toggleNotif()` are `window` globals (verified at `prototype.html:111,114`); need to confirm they're attached _after_ `DOMContentLoaded` not lazily — if lazy, harness needs a `waitForFunction(() => typeof window.openModal === 'function')` before calling.
4. **Review drawer trigger**: prototype opens drawer via row click; React drawer opens via `ctrl.drawer.open` (`VocListPage.tsx:73`). Both need a programmatic open path. **Currently undefined for the prototype** — may require adding a tiny `window.openDrawer(0)` helper to prototype JS, or simulating a click on the first row. Prefer the click simulation to keep prototype untouched.
5. **Token snapshot determinism**: `tokens.ts` exports OKLCH strings; browsers resolve them differently across Chromium versions. Pin Playwright Chromium version in lockfile.
6. **MSW handler coverage for empty/error states**: extraction depends on rendered DOM. If `voc-table` shows `EmptyState` (`VocListPage.tsx:62-64`) due to a handler hiccup, the diff for `voc-table` is meaningless. Harness must assert `rows.length > 0` before extracting that componentId, else mark `[NOT MEASURABLE]`.
7. **Sort key parity**: the prototype default sort is `date desc` (`prototype.html:188` has `.sort-active` on the date hcell); React default is whatever `useVocPageController` sets. If they differ, `voc-sort-chips` will mismatch on the active-state styling — but that's a real finding, not a harness bug. Surface it explicitly in the report header rather than hide it.
