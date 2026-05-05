# Wave 1.5 Follow-up A — Stage 1 Implementation Plan (addendum to design)

> Companion to `wave1.5-followup-a-stage1-design.md`. Resolves the 7 `[DECISION NEEDED]` items and locks the implementation order.

## Resolved decisions

1. **Browser provisioning** — Use Playwright's bundled Chromium (default `playwright install chromium`). The harness is a **dev-only tool** never deployed to production / closed-network targets, so phase-8 §7.2 vendoring discipline does not apply. We document this exemption in the script's header comment and in `docs/specs/plans/phase-8-mirror-check.md` (one-line entry under "Dev-only exemptions"). No `vendor/` tarball.
2. **`data-pcomp` insertion** — Lands in **Stage 2** (executor role). Stage 1 implementation falls back to structural CSS selectors derived from the §5 mapping table; harness emits a `[SELECTOR FALLBACK]` warning row in the report when forced to use the fallback path, so Stage 2 sees exactly which markers it needs to add.
3. **Modal/dropdown interaction** — Wrap `window.openModal()` / `window.toggleNotif()` calls in `page.waitForFunction(() => typeof window.openModal === 'function', { timeout: 5_000 })`. Prefix all such calls in `harness.ts`.
4. **Review drawer trigger** — Use a programmatic click on the first table row on both sides. No prototype source change. Wait for drawer DOM via `[data-pcomp="voc-review-drawer"]` (or, until Stage 2 markers land, a structural fallback per §5).
5. **Token snapshot determinism** — Pin Playwright Chromium by committing `package-lock.json`; document required `npm exec playwright install chromium` step in `scripts/visual-diff/README.md` (one-line installation note).
6. **MSW empty-state guard** — Before extracting `voc-table`, assert `rows.length > 0`. If 0, emit `componentId: 'voc-table', status: '[NOT MEASURABLE]', reason: 'list empty'`. Report renderer prints these in a banner above the per-component sections.
7. **Sort key parity** — Surface as a top-of-report banner ("⚠️ Default sort key differs: prototype=`date desc`, react=`<observed>`") computed from the resolved active sort chip on each side. Do not suppress the sort-chip diff rows.

## Implementation order (TDD)

1. **package.json wiring**
   - Add `playwright`, `http-server`, `wait-on` (or hand-rolled tcp probe) to `frontend/devDependencies`.
   - Root `package.json` script: `"visual-diff": "tsx scripts/visual-diff.ts"`.
   - Run `npm install` (will be a separate commit, per design §2).

2. **Pure-function modules (red → green per Vitest spec)**
   - `scripts/visual-diff/diff.ts` — write `diff.test.ts` first in `frontend/src/__tests__/visual-diff/diff.test.ts` (or co-located in `scripts/visual-diff/__tests__/`; pick the path Vitest already covers — `frontend/vitest.config.ts` `include` glob decides).
   - `scripts/visual-diff/extract.ts` — pure adapter, mock `Page` in tests.
   - `scripts/visual-diff/report.ts` — golden-file snapshot.
   - `scripts/visual-diff/tokens.ts` — token loader (parses `frontend/src/tokens.ts` AST or imports it directly via tsx).

3. **Side-effecting modules (no unit tests, manually exercised)**
   - `scripts/visual-diff/harness.ts` — server spawn + Playwright bootstrap + teardown.
   - `scripts/visual-diff/index.ts` — CLI orchestration.
   - `scripts/visual-diff.ts` — 5-line re-export shim.

4. **Smoke run** — `npm run visual-diff` from clean checkout; verify report file exists and contains 12 componentId sections (or fallback warnings).

5. **Multi-agent review** — Stage 1 review pass dispatches 3 reviewers in parallel (architect, code-reviewer, security-reviewer) with a checklist derived from §1 exit conditions + decisions above.

## Out of scope for Stage 1

- `data-pcomp` attribute insertion on prototype + React (Stage 2).
- Component CSS fixes (Stage 2).
- Screenshot capture (Stage 3).
- e2e spec (Stage 4).

## Goal (verifiable)

`npm run visual-diff` exits 0, writes a valid markdown report covering all 12 componentIds (or marks them `[NOT MEASURABLE]` / `[SELECTOR FALLBACK]` with reasons), passes `npm test -w frontend` for the new pure-function specs, and doesn't introduce any hex/raw OKLCH literals (lint:tokens clean).
