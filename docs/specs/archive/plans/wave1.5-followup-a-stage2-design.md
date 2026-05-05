# Wave 1.5 Follow-up A — Stage 2 Design: Component Visual Fixes

> Branch: `feat/wave1-followup-a-visual-parity`
> Status: design (architect output, autopilot iteration). 4 `[DECISION NEEDED]` items resolved in companion plan addendum.

## 1. Goal & Exit Criteria

Apply token-only visual corrections so the React `/voc` page reaches the closest visual parity the design system permits with `prototype/prototype.html#page-voc`. Stage 1 produced the diagnostic report (104 diffs); Stage 2 is the actual fix; Stage 3 will be screenshot iteration.

**Exit criteria:**

- Re-running `npm run visual-diff` produces a report with **HIGH count ≤ 5** (≥ 80% reduction from 26).
- All 3 overlay components (`voc-create-modal`, `voc-notif-dropdown`, `voc-review-drawer`) become MEASURED.
- Zero new hex literals or raw OKLCH outside `frontend/src/tokens.ts` and `frontend/src/styles/index.css`.
- Existing vitest suite stays green; no spec deletions.
- New diff report committed at `docs/specs/reviews/wave1.5-followup-a/voc-visual-diff-report-stage2.md` as proof.

## 2. Triage of the 104 Diffs

| Bucket                                                                         | Count                     | Treatment                                                   |
| ------------------------------------------------------------------------------ | ------------------------- | ----------------------------------------------------------- |
| A. Token mismatches (correct token already exists)                             | ~58                       | Component-level token swap                                  |
| B. Missing tokens                                                              | ~3 → 0 (per D-1 decision) | None — use existing border                                  |
| C. Real semantic differences (intentional evolution)                           | ~12                       | SKIP, document                                              |
| D. AA / rounding noise (font-family stack, font-size 14↔16, line-height 21↔24) | ~31                       | Widen diff thresholds + stack-prefix font-family normaliser |

### A. Token-mismatch examples (representative)

- `VocTopbar.tsx:26` `var(--bg-panel)` → `var(--bg-app)` (proto `topbar.css:17`).
- `VocTopbar.tsx:26` `var(--border-standard)` → `var(--border-subtle)` (proto `topbar.css:16`).
- `VocSortChips.tsx:39` no bg → add `var(--bg-panel)` (proto `list.css:344`).
- `VocAdvancedFilters.tsx` outer wrapper no bg → `var(--bg-panel)`; collapse-when-not-`open` semantics (proto `filter.css:83`).
- `NotificationBell.tsx:34-43` no border/background → match `.icon-btn` (proto `topbar.css:85-99`): `var(--bg-surface)` + `var(--border-subtle)` + `var(--text-tertiary)`.

### C. Real semantic differences (SKIP)

- `data-table display: grid vs table` — keep React `<table>` for a11y; prototype simulates table via grid.
- `data-table grid-template-columns` (HIGH) — same root cause; SKIP.
- `data-table align-items` — irrelevant under `<table>`; SKIP.
- `data-table height 32 vs 797` — comparing different DOM scopes; pin `data-pcomp="data-table"` to `<thead>` instead.
- 9× `font-family` MEDs — Tailwind v4 stack vs prototype stack; equivalent fonts; widen diff to stack-prefix equality.
- 17× font-size 14↔16 / line-height 21↔24 — set page-level font default to 14px on list region.
- `voc-pagination padding 12 vs 0` — wrapper standard padding; keep React.

### D. Threshold widening (harness-side, not component-side)

In `scripts/visual-diff/diff.ts`:

- `TYPOGRAPHY_APPROX_PROPS` tolerance `0.5` → `1.5` px.
- New `normalizeFontFamily()`: lowercase, strip quotes, split on `,`, trim; check whether one stack is a prefix of the other (strict enough to catch a real Pretendard-vs-Arial regression).
- `font-family` moves out of `TYPOGRAPHY_EXACT_PROPS` into a custom check.

## 3. Per-Component Fix List (HIGH-first)

### 3.1 `voc-topbar` (`VocTopbar.tsx:22-28`)

1. HIGH `background-color`: token-swap → `var(--bg-app)`.
2. HIGH `border-color`: bottom border → `var(--border-subtle)`.
3. MED `column-gap 16 vs 8`: class-swap `gap-4` → `gap-2`; height → `h-14` (56px).

### 3.2 `voc-status-filters` (`VocStatusFilters.tsx:58-63`)

1. HIGH `background-color`: add `var(--bg-app)`.
2. HIGH `border-color`: → `var(--border-subtle)`.
3. HIGH `flex-wrap nowrap`: remove wrap.
4. MED `height 44 vs 55`: `h-11 py-0`.
5. MED active-pill colour: pressed text → `var(--accent)`; pressed bg uses `var(--brand-bg)` (fix `STATUS_TOKEN[all]` fallback).

### 3.3 `voc-advanced-filters` (`VocAdvancedFilters.tsx:97-98`)

1. HIGH `background-color`: outer `bg-[color:var(--bg-panel)]`.
2. HIGH `border-color`: bottom border `var(--border-subtle)` (only when `open`).
3. HIGH `display block + flex-direction row`: restructure — outer wrapper is `block`, panel inside keeps grid; move toggle button OUT of the marker root.
4. MED `height 0 vs 36`: collapsed state matches once toggle is moved out.

### 3.4 `voc-sort-chips` (`VocSortChips.tsx:34-40`)

1. HIGH `background-color`: add `var(--bg-panel)`.
2. HIGH `border-color`: bottom-only → `var(--border-subtle)`.
3. HIGH `flex-wrap nowrap`: remove wrap.
4. MED spacing: `py-2 gap-1.5` → `py-1.5 gap-2`.

### 3.5 `voc-table`

All MEDs are font-family / font-size / `<table>` size — addressed by §2.D widening + page-level font default.

### 3.6 `data-table` (`DataTable.tsx:46-83`)

1. HIGH `display/grid-template-columns/align-items`: SKIP (intentional `<table>`).
2. HIGH `background-color`: `<thead>` → `bg-[color:var(--bg-panel)]`.
3. HIGH `border-color`: `<thead> tr` `border-b-2 border-[color:var(--border-subtle)]`.
4. LOW `box-shadow`: SKIP (per D-1 decision — `border-b-2` covers it).
5. MED padding: `<th>/<td>` add `px-6` (24px).
6. SCOPE: switch `data-pcomp="data-table"` to `<thead>` so we measure header band, not whole `<table>`.

### 3.7 `voc-pagination` (`VocPaginationBar.tsx:18-27`)

1. HIGH layout (display/justify): SKIP (React's summary+nav pattern is intentional).
2. HIGH `border-color`: top → `var(--border-subtle)`.
3. MED padding: SKIP.

### 3.8 `pagination` (`Pagination.tsx:54`)

1. HIGH `justify-content`: `<nav>` content → `flex items-center justify-center`.
2. MED border / font-size: covered globally.

### 3.9 `notification-bell` (`NotificationBell.tsx:34-43`)

1. HIGH bg: `var(--bg-surface)`.
2. HIGH border: `border var(--border-subtle)`.
3. HIGH color: → `var(--text-tertiary)`.
4. HIGH outline: `focus-visible:ring var(--accent)`.
5. MED `border-radius 6 vs 8`: `rounded-md` → `rounded-lg`.
6. MED `width/height 36 vs 32`: `h-9 w-9` → `h-8 w-8`.

## 4. Token Additions

**Per D-1 = drop compound shadow, use `border-b-2`.** Net new tokens: **0**.

## 5. Overlay Strategy (per D-2 = document-root)

Extend `harness.ts` with `openOverlays(side, page)` helper. Each overlay opened best-effort with timeouts; warnings on failure.

| Component            | Proto trigger                                   | React trigger                                                         |
| -------------------- | ----------------------------------------------- | --------------------------------------------------------------------- |
| `voc-create-modal`   | click `'#openModalBtn'` or `window.openModal()` | click `'button:has-text("새 VOC 등록")'`                              |
| `voc-notif-dropdown` | click `'#notifBtn'`; wait `#notifPanel.show`    | click `'[data-pcomp="notification-bell"]'`; wait Radix menu           |
| `voc-review-drawer`  | click first `.voc-row` (proto `openDrawer(id)`) | click first `'[data-pcomp="data-table"] tbody tr'`; wait Radix Dialog |

Roots: extracted at document level (Radix portals to `<body>`).

## 6. selectors.ts Cleanup

- Rename field `hasPcompMarker` → `isOverlay` (semantic truth: programmatic-open required).
- Rename function `getFallbackComponents` → `getFallbackBannerComponents` + docstring update.
- Update `report.ts` caller(s).

## 7. Refactor Candidates

All 13 touched files ≤ 195 lines. **No SRP split required.**

## 8. Implementation Order (TDD-aware)

- **Phase A** (1 commit per D-1=(c)): A1 harness threshold widening + font-family normaliser + `diff.test.ts` updates.
- **Phase B** (1 commit): selectors.ts rename + caller update.
- **Phase C** (7 commits, HIGH-first):
  - C1 `voc-topbar`
  - C2 `voc-status-filters`
  - C3 `voc-advanced-filters` (restructure: toggle moves out)
  - C4 `voc-sort-chips`
  - C5 `data-table` (incl. selectors.ts react path → `thead` per §3.6)
  - C6 `notification-bell`
  - C7 `voc-pagination` + `pagination` combined
- **Phase C-extra** (1 commit): C8 list-region font default `text-sm` (D-4 = list region only, not whole page).
- **Phase D** (2 commits): D1 overlay-open harness; D2 re-run + commit `voc-visual-diff-report-stage2.md`.

**Total fix commits: ~11.**

## 9. Test Impact

All 12 component test files use behavioral queries (RTL `getByRole/getByLabelText`); no className/snapshot assertions. Pure visual swaps don't break them.

- C2: `STATUS_TOKEN[all]` fallback edit — verify no test asserts the literal class.
- C3: toggle moved out of marker root — verify `VocAdvancedFilters.test.tsx` doesn't depend on the parent-child DOM relationship.
- A1: `diff.test.ts` updated — new threshold + new font-family normaliser cases.
- No new tests required for visual-only changes.

## 10. Resolved Decisions

- **D-1**: Drop `--shadow-table-header`. Use `border-b-2 var(--border-subtle)` on `<thead>`. Net new tokens = 0.
- **D-2**: Overlay extraction root = document-root.
- **D-3**: Font-family stack-prefix equality is acceptable mitigation.
- **D-4**: Scope page-level font default to the **list region only** (`VocListPage` outer container), not the entire `/voc` route — avoids cascading into modal/drawer.
