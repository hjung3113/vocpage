# Wave 1.5 Follow-up A — Stage 3: Screenshot Parity Loop

> Branch `feat/wave1-followup-a-visual-parity`. Branch from HEAD `890bb70` (post-Stage-2 fixes).
> Stage 3 produces side-by-side screenshots so the user can visually verify the Stage 1+2 work and call out remaining gaps the computed-style diff missed.

## Goal & exit criteria

Capture full-page + per-component PNGs at viewport 1280 (and 1440 for the full page only) for both prototype and React `/voc`, lay them out side-by-side in a single markdown report, and document one round of visible-but-not-computed-style-detectable gaps. The user inspects the report; this stage exits after the screenshots are committed and any obvious one-round fixes land.

**Exit conditions:**

- PNGs at `docs/specs/reviews/wave1.5-followup-a/screenshots/` (one per component pair + 2 full-page pairs).
- Markdown index `voc-visual-screenshots.md` referencing them with side-by-side embeds.
- One pass of obvious fixes for gaps the user would call out at first glance (e.g., wrong icon, wrong border radius missed by the harness because root selector is wrong).
- Re-running `npm run visual-diff` after Stage 3 fixes produces a HIGH count not greater than the Stage-2-fix baseline (9).

## Implementation

### Phase 3-A — capture script (1 commit)

Add `scripts/visual-diff/screenshot.ts` (or extend `index.ts` with a `--screenshots` flag). Reuses `bootHarness()` from Stage 1; for each `data-pcomp` componentId on each side:

- locate the element by selector (existing SELECTOR_MAP)
- if found and visible: `element.screenshot({ path: 'screenshots/<id>-{proto|react}.png' })`
- full-page: `page.screenshot({ path: 'screenshots/full-{1280|1440}-{proto|react}.png' })`

Wire entry point: `npm run visual-diff -- --screenshots` (or a separate `npm run visual-screenshots`).

### Phase 3-B — markdown index (1 commit)

Generate `voc-visual-screenshots.md` with H2 per component, two-column markdown image embeds (or a 2-cell HTML table for side-by-side):

```md
## voc-topbar

| Prototype                             | React                                 |
| ------------------------------------- | ------------------------------------- |
| ![](screenshots/voc-topbar-proto.png) | ![](screenshots/voc-topbar-react.png) |
```

### Phase 3-C — single fix pass (1-3 commits as needed)

After visual scan: address any clear gap not caught by the harness (icon mismatch, missing badge, wrong corner radius, etc.). Token-only fixes per the same rules as Stage 2.

### Phase 3-D — re-run visual-diff and update report (1 commit)

After Phase 3-C fixes, regenerate the visual-diff report so reviewers see the final delta vs Stage 1 baseline.

## Total commits anticipated

4-6 commits.

## Out of scope

- Restoring measurement for the 3 unmeasurable React-side overlays (`voc-advanced-filters`, `voc-notif-dropdown`, `voc-review-drawer`). They need React-side `data-pcomp` markers added to the open-state DOM (Radix portals) — that's Stage 4 territory or deferred follow-up.
- Pixel-% comparison or visual regression testing (per project decision, deferred to Wave 2).
