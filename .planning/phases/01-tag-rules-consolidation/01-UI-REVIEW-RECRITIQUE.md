# Phase 1 — UI Review · Post-Fix Recritique

**Date:** 2026-05-11
**Baseline:** `01-UI-REVIEW.md` (initial audit, score 35/60)
**Bundles applied:** 4 (Pillar 1·2 / 3·4 / 5 / 6) + 3 BLOCK fixes prior.
**Commits:** `aab30666` `b311aa57` `06e65fe5` `3729aaff` `2a8c6b6b` `1a1af99d` `6b2b0cc2`

## Score Delta

| # | Pillar | Before | After | Δ | Verdict |
|---|--------|--------|-------|---|---------|
| 1 | Visual hierarchy & layout | 5/10 | 8.5/10 | +3.5 | PASS |
| 2 | Typography & copywriting | 7/10 | 9/10 | +2.0 | PASS |
| 3 | Color & state | 6/10 | 8.5/10 | +2.5 | PASS |
| 4 | Interaction & feedback | 5/10 | 8/10 | +3.0 | PASS |
| 5 | Accessibility | 6/10 | 8.5/10 | +2.5 | PASS |
| 6 | Edge cases & responsive | 6/10 | 8.5/10 | +2.5 | PASS |
| **Total** | | **35/60** | **51/60** | **+16** | **PASS gate** |

## Wave Gate (`feedback_visual_alignment_gate` + ADR-0008)

- 묶음 도입 → ✅ 4 bundle commits + 3 prior BLOCK commits
- impeccable:critique ≥8/10 → ✅ all 6 pillars
- 사용자 sign-off → ⏳ pending (this doc)
- recritique loop → ✅ each bundle followed by pillar rescore

## Bundle Summary

### Bundle 1 — Pillar 1·2 (commit `3729aaff`)
- Page title `태그 마스터` → `태그 관리` (Copywriting Contract row 200).
- Modal: dynamic `minWidth` 560→680 when N≥3; subtitle `fontWeight: 400`; header `border-bottom`.
- Flat-row keyword chip recipe aligned to UI-SPEC §Add form (no border, --text-primary, 2px 8px, weight 600).
- Tag-master loading: 3 skeleton rows (replaces `로딩 중...`).
- Tag-master + flat-table error: structured copy + body + retry button wired to `refetch()`.
- Empty-keyword inline error `키워드를 한 개 이상 입력하세요`.
- UI-SPEC: cap-warning Copywriting Contract row added.

### Bundle 2 — Pillar 3·4 (commit `2a8c6b6b`)
- `globals.css`: 5 new `.tag-rule-*` classes for hover/focus/active states + transitions + `prefers-reduced-motion` guard.
- View-tabs: `:active scale(0.94)` press feedback.
- Row badge: hover background mix + focus ring (CSS class migration).
- Flat-row tag name: drop default `--accent` underline (UI-SPEC §Forbidden accent uses); reveal on hover/focus only.
- `MutationErrorBanner`: `다시 시도` now actually retries via new `onRetry` prop (separate dismiss X). Each mutation onError captures retryable closure.

### Bundle 3 — Pillar 5 (commit `1a1af99d`)
- Chip remove button + draft input + confirm-dialog buttons: `--focus-ring` token via class.
- `role="tabpanel"` wrapper around data area, view-aware aria-label.
- (Radix AlertDialog already wires aria-labelledby/describedby via Title + Description.)

### Bundle 4 — Pillar 6 (commit `6b2b0cc2`)
- Keyword chips: max-width 180px + ellipsis (sub-table + flat-row); flat-row gains `title={kw}` for full keyword on hover.
- Modal `maxHeight: min(720px, calc(100vh - 96px))` + internal `overflow-y: auto` scroll container.
- Flat table: `overflow-x: auto` wrapper + `min-width: 720px` for narrow viewports.
- `onJumpToTag`: actually scroll `[data-tag-row-id]` into view + 1.2s `--accent` outline pulse.

## Tests

- FE: **721/721 pass** (Vitest), typecheck clean.
- BE: untouched.

## Residual (Non-blocking, deferred)

1. `01-UI-SPEC.md` §line 122 모순 — SolidChip `일시중지됨` column placement (`매칭 방식` trailing slot vs `상태`). Implementation chose `상태`. Spec정정 후속.
2. `TagMasterTable` 내부 섹션 헤딩 `태그 마스터` (page title `태그 관리`와 중복) — distill candidate; UI-REVIEW에서 미flag.

## Recommendation

Phase 1 ready to be marked `implemented` in `.planning/STATE.md` upon user sign-off of this recritique result.
