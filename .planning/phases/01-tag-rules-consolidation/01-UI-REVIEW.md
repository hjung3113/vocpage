# Phase 1 — UI Review (Tag Rules Consolidation)

**Audited:** 2026-05-11
**Baseline:** `.planning/phases/01-tag-rules-consolidation/01-UI-SPEC.md` + `docs/specs/requires/uidesign.md` (visual SSOT)
**Stance:** Adversarial — assume each pillar has failures until evidence proves otherwise.
**Screenshots:** Captured at 1440×900 against `http://localhost:5173/admin/tags` and `?view=rules`. Both render as blank SPA shells (no auth/data session in raw curl context) — visual diff is **code-only**. Saved as `.planning/ui-reviews/01-20260511-012303/admin-tags-{desktop,rules}.png` for record (gitignored).

---

## Pillar Scores

| # | Pillar | Score | Verdict | Headline finding |
|---|--------|-------|---------|------------------|
| 1 | Visual hierarchy & layout | **5/10** | FLAG | UI-SPEC declares `--sp-1..6` only, but only 2 of ~120 spacing values use the token; rest are raw `'4px'/'6px'/'8px'/'12px'/'16px'/'24px'` literals. |
| 2 | Typography & copywriting | **7/10** | FLAG | Copywriting Contract is largely respected, but two error-state copies are missing/wrong (`flat` table inline error, modal subtitle font size). |
| 3 | Color & state | **6/10** | BLOCK | Token-purity OK (no hex/rgb/oklch), but UI-SPEC §Forbidden accent uses violation: `flat` table tag-name button uses `--accent` text + underline as decorative link styling; `flat` table pulls `border: var(--border-subtle)` chip border that the modal sub-table chip omits — chip recipe is inconsistent across surfaces. |
| 4 | Interaction & feedback | **5/10** | BLOCK | Optimistic update visual contract (UI-SPEC §Optimistic update visual contract) is **not implemented**: no `opacity: 0.6` placeholder row, no `상태: 저장 중...` text appended on `+ 규칙 추가` submit. Mutations rely on TanStack invalidate only. |
| 5 | Accessibility | **6/10** | FLAG | `role="alertdialog"` + `aria-modal` set on TagRuleConfirmDialog but no `aria-labelledby`/`aria-describedby` linkage; no focus-trap implementation; chip remove buttons lack visible focus ring; tab nav order on modal not asserted. |
| 6 | Edge cases & responsive | **6/10** | FLAG | Modal hard-codes `minWidth: 560px`, no dynamic 560→680 resize (UI-SPEC §Layout); long keyword chips have no truncation strategy; no responsive collapse for `flat` table at <768px. |

**Overall: 35/60** — fails the visual-alignment wave gate (`feedback_visual_alignment_gate` requires impeccable:critique ≥8/10 + sign-off; current pillar scores below 8 across the board).

---

## Top 3 Priority Fixes (BLOCK before ADR-0008 sign-off)

1. **BLOCK — Spacing tokens absent (Pillar 1).**
   UI-SPEC §Spacing declares "all values trace to uidesign.md §7" and binds `--sp-1..6`. Implementation uses 2 token references vs ~120 raw `Npx` literals across `TagRulesManagerModal.tsx`, `TagRuleAddForm.tsx`, `TagRuleConfirmDialog.tsx`, `TagRulesSubTable.tsx`, `TagRulesModalStates.tsx`, `KeywordChipInput.tsx`, `TagRulesFlatTable.tsx`, `TagRulesFlatRow.tsx`, `TagMasterRow.tsx`, `TagMasterTable.tsx`. Any later token rebalancing in `uidesign.md` will not reach this surface — token contract is broken.
   *Fix:* mechanical sweep — replace `'4px'`→`var(--sp-1)`, `'8px'`→`var(--sp-2)`, `'12px'`→`var(--sp-3)`, `'16px'`→`var(--sp-4)`, `'24px'`→`var(--sp-5)`, `'32px'`→`var(--sp-6)`. Non-conforming values (`6px`, `7px`, `10px`, `13px`, `14px`) need design call: round to nearest token or escalate to `uidesign.md` amendment.
   *Per CLAUDE.md §3:* visual-surface divergence from `uidesign.md` tokens is **irreversible** — token-definition changes require spec update first. This blocks merge.

2. **BLOCK — Optimistic update visual contract not implemented (Pillar 4).**
   UI-SPEC §Optimistic update visual contract: "On `+ 규칙 추가` submit: append a new row to sub-table immediately with `opacity: 0.6` placeholder + `상태: 저장 중...` text. Row resolves on `onSuccess`. On `onError`: row removes with 120ms fade, error banner appears, form chips restored." `TagRulesManagerModal.tsx:67-78` calls `createRule.mutate` and only resets local state on success — no optimistic placeholder row, no `저장 중...` text. `TagRulesSubTable.tsx` has no rendering branch for an in-flight pending row. The `저장 중…` literal exists in **other** modals (`TagMasterEditModal.tsx:88`, `TagMasterSuspendModal.tsx:82`) but **not** in the rule create flow.
   *Fix:* Add optimistic update via TanStack `onMutate` → patch `['admin','tags',tagId,'rules']` cache with synthetic row `{ id: '__pending__', keywords, status: 'pending' }`. Render branch in sub-table reads `rule.id === '__pending__'` → render with `opacity: 0.6` and status cell `저장 중...`. Honor `prefers-reduced-motion` (instant swap).

3. **BLOCK — Confirmation dialog accessibility incomplete (Pillar 5).**
   UI-SPEC §Destructive actions matrix specifies `AlertDialog (Radix)` for delete + suspend + resume. `TagRuleConfirmDialog.tsx:80-96` is a **hand-rolled** `<div role="alertdialog">`, **not** the Radix `AlertDialog` primitive listed in `01-UI-SPEC.md §Registry Safety`. Consequences: no focus trap, no `aria-labelledby` (no title element exists — only body copy), no `Escape` handler, no portal mount, no automatic return-focus on close. ADR-0008 visual gate explicitly cites Radix AlertDialog as the contract; bespoke replacement breaks that gate.
   *Fix:* Swap to `@shared/ui/alert-dialog` (already in `frontend/src/shared/ui/` per UI-SPEC §Registry Safety table). Add visible title (`AlertDialogTitle`) — current dialog renders only body, missing title hierarchy. Confirmation copy already correct.

---

## Detailed Findings

### Pillar 1 — Visual hierarchy & layout (5/10) FLAG → BLOCK

- **Spacing token violation (BLOCK).** See Top Fix 1. Evidence: `frontend/src/pages/admin/tags.tsx:77,79` are the only consumers of `var(--sp-*)`. All sibling files in `features/admin/tag-master/ui/` use raw px literals.
- **Modal width contract not honored.** UI-SPEC §Spacing "Modal width: 560px → 680px (when sub-table N≥3)". `TagRulesManagerModal.tsx:140` hard-codes `minWidth: '560px'` with no growth path. OQ-UI-3 left this as executor empirical call — implementation chose the static-560 fallback silently without recording it. Note required in SUMMARY but absent.
- **No `border-bottom` on modal header.** UI-SPEC §Modal header recipe: `border-bottom: 1px solid var(--border-subtle)`. `TagRulesManagerModal.tsx:141-153` has no separator — header bleeds into add form.
- **Flat-row vs sub-table chip recipe drift.** Sub-table chip (`TagRulesSubTable.tsx:58-64`) has no border; flat-row chip (`TagRulesFlatRow.tsx:36-44`) adds `border: 1px solid var(--border-subtle)`. Same data, two visuals.
- **Subtitle font-size deviation.** UI-SPEC §Modal Header Subtitle: 12px / 400 / `--text-tertiary`. `TagRulesManagerModal.tsx:144-150` uses `12px` but no explicit weight. PASS-edge — flag for explicitness.

### Pillar 2 — Typography & copywriting (7/10) FLAG

- **Copywriting Contract drift on `flat` table error.** UI-SPEC requires `규칙을 불러오지 못했습니다` + `네트워크 상태를 확인한 후 다시 시도해 주세요`. `TagRulesFlatTable.tsx:87` renders `규칙 목록을 불러오지 못했습니다.` (added "목록", trailing period) and **no body copy, no retry button**. `TagMasterTable.tsx:65-68` has the same issue (`태그 목록을 불러오지 못했습니다.`).
- **Loading copy leak.** UI-SPEC: "no copy — skeleton rows only". `TagMasterTable.tsx:55-60` renders raw text `로딩 중...` instead of skeleton. Inconsistent with `TagRulesModalStates.tsx:51-67` which does provide skeletons.
- **Inline empty keyword error never wired.** Copywriting Contract row "Inline empty keyword error: `키워드를 한 개 이상 입력하세요`". `KeywordChipInput.tsx` only emits dup + cap errors. Submit on empty form is silently no-op'd in `TagRuleAddForm.tsx:25-27` (`if (empty) return`) without showing the spec'd inline error.
- **Cap-warning copy invented.** `KeywordChipInput.tsx:53` emits `최대 ${max}개까지 추가할 수 있습니다` — not in Copywriting Contract. Either add to spec or align verbiage.
- **Search placeholder mismatch.** Spec: `키워드 또는 태그명으로 검색`. Implementation `tags.tsx:120`: `키워드 또는 태그명으로 검색` ✓ PASS.
- **Page title mismatch.** Spec §Copywriting `태그 관리`. Implementation `tags.tsx:71` renders `태그 마스터` via `PageHeader`. Internal label, but Copywriting Contract is explicit: violates contract.

### Pillar 3 — Color & state (6/10) BLOCK

- **No hex/rgb/oklch literals on this surface.** Token-purity grep returned 0 hits across the audited files — PASS on raw color literal rule.
- **Forbidden accent use (BLOCK).** UI-SPEC §Forbidden accent uses lists `decorative dividers` — `TagRulesFlatRow.tsx:65-67` styles tag-name button with `color: var(--accent); textDecoration: underline; fontWeight: 500`. Underlined `--accent` text on a row cell is decorative link styling, not the reserved CTA / tab-active / row-badge / focus-ring usages. Should use `--text-primary` or a button affordance per `Filter Tab` recipe.
- **Suspended state visual partial.** UI-SPEC: `SolidChip 일시중지됨` in **trailing slot of `매칭 방식` column**. Implementation places it in the **`상태` column** (`TagRulesSubTable.tsx:140-157`). Same column does not carry `매칭 방식` text. Spec wording is a contradiction (matrix lists `상태` as a separate column too) — flag for spec clarification, but implementation chose one valid reading. Accept with annotation.
- **Hover/focus ring missing on row badge.** UI-SPEC §Row badge states declares hover background mix and `--focus-ring`. `TagMasterRow.tsx:77-87` has no `:hover` / `:focus-visible` styling — using inline style means hover state is impossible without `onMouseEnter` or migration to CSS-class. Token contract requires the focus ring; not implemented.
- **Optimistic transition token absent.** UI-SPEC: `transition: background 120ms cubic-bezier(0.16, 1, 0.3, 1)`. Zero `transition` declarations across audited files (grep result empty).
- **Reduced-motion path absent.** UI-SPEC twice declares "Reduced-motion: instant swap." No `@media (prefers-reduced-motion: reduce)` rules and no JS guard. Inline-style architecture cannot express media queries → architectural mismatch.

### Pillar 4 — Interaction & feedback (5/10) BLOCK

- **Optimistic update missing (BLOCK).** Top Fix 2.
- **Mutation error banner copy correct.** `TagRulesManagerModal.tsx:41-45` matches Copywriting Contract for create/update/delete. PASS.
- **`다시 시도` button is a dismiss, not a retry.** `TagRulesModalStates.tsx:32-46` button labeled `다시 시도` calls `onDismiss` (sets banner null), not a re-mutate. UI-SPEC §Error: "retry button `다시 시도`". User clicks expecting retry → mutation does not re-fire. Functional defect.
- **Search debounce respected.** `tags.tsx:22,40-55` uses 250ms `setTimeout` matching spec. PASS.
- **View-tab transition token missing.** UI-SPEC §View-mode tabs: `transform: scale(0.94)` press feedback, `Filter Tab` double-ring active recipe. `tags.tsx:99-108` produces single `1px box-shadow` ring (close), but no `:active` press transform, no transition. Press feedback absent.
- **Disabled state styling on submit button.** UI-SPEC §Add form: `Disabled when chips.length === 0`. `TagRuleAddForm.tsx:60-69` disables correctly and styles `--bg-subtle` background. PASS.
- **Backspace-on-empty chip removal.** `KeywordChipInput.tsx:67-71` matches spec ("`Backspace` on empty input removes last chip"). PASS.
- **Suspend "far-future ISO" workaround.** `TagRulesManagerModal.tsx:47` uses `2999-12-31` sentinel — surfaces as a Plan-04 contract design, not UI defect. Note for Phase 2 visibility.

### Pillar 5 — Accessibility (6/10) FLAG

- **Hand-rolled `alertdialog` (BLOCK).** Top Fix 3.
- **No labelledby/describedby chain.** `TagRuleConfirmDialog.tsx:80-83` sets `role="alertdialog"` + `aria-modal` but no `aria-labelledby` or `aria-describedby` — screen reader announces unlabeled dialog.
- **Modal overlay close on outside-click without focus-trap.** `TagRulesManagerModal` reuses `ModalOverlay` from `TagMasterCreateModal`; not audited here, but the alert-dialog inside this modal stacks at z-index 60 (`TagRuleConfirmDialog.tsx:91`) over the modal — keyboard focus return-path on close not guaranteed.
- **Chip remove button has no visible focus state.** `KeywordChipInput.tsx:117-128` `<button>` removes default outline (browser default still applies), but no `--focus-ring` token applied. UI-SPEC §Color §Focus ring requires `box-shadow: 0 0 0 3px var(--brand-bg)` on all interactive elements.
- **Search input outline.** `tags.tsx:115-134` has no focus styling either — same defect.
- **`role="alert"` correctly applied** on `KeywordChipInput.tsx:159` (chip dup error) and `TagRulesModalStates.tsx:18` (mutation banner). PASS.
- **`role="tablist"` present** on view-tabs (`tags.tsx:82`) but no `role="tabpanel"` on the data area below — partial ARIA.
- **`aria-label` on row badge** correctly named per spec (`TagMasterRow.tsx:62`). PASS.

### Pillar 6 — Edge cases & responsive (6/10) FLAG

- **Long-keyword overflow undefined.** UI-SPEC implies `max 3 visible + +N overflow chip` for keyword rendering. Implementation respects count cap (`TagRulesSubTable.tsx:55-77`, `TagRulesFlatRow.tsx:21-22`) but no `max-width` or `text-overflow: ellipsis` on individual chips. A 60-char chip will blow out the table cell.
- **Modal max-height unenforced.** UI-SPEC: `min(720px, calc(100vh - 96px))` with internal scroll for sub-table N>10. `TagRulesManagerModal.tsx:140` declares no `maxHeight`, no internal scroll container — N=20 rules will overflow viewport.
- **Empty modal state padding consistent.** `TagRulesModalStates.tsx:69-91` uses `minHeight: 220px`. PASS — matches spec.
- **Flat table no responsive collapse.** Six columns at narrow widths (e.g., 480px) will horizontal-scroll; spec doesn't require responsive collapse but expects the surface to not be unusable at narrow widths. No `overflow-x: auto` wrapper.
- **`view=tags` URL with `?q` left over.** `tags.tsx:62-67` clears `q` on tab switch — handles deep-link case. PASS.
- **`flat` table jump-to-tag ignores tag id.** `tags.tsx:141-148` `onJumpToTag` only switches view; never scrolls to the row (UI-SPEC: "switches `?view=tags` and scrolls to that tag row"). Function signature accepts `tagId` but discards it.
- **Suspend resume button copy inconsistency.** Per UI-SPEC §Suspended-rule state visual: "Action column shows `재개` button replacing `일시중지`". Implementation correctly toggles in `TagRuleActionMenu.tsx:53-62`. PASS.

---

## Registry Safety

UI-SPEC §Registry Safety declares **shadcn official only**. Audit:

- `TagRuleActionMenu.tsx:8-13` correctly imports shadcn `dropdown-menu`. PASS.
- `TagRuleConfirmDialog.tsx` does **NOT** import shadcn `alert-dialog` — hand-rolled implementation. Violates Registry Safety table row "alert-dialog" claim. Functional + a11y consequences captured in Top Fix 3.
- `TagRulesManagerModal.tsx` reuses `ModalOverlay` / `ModalHeader` from `TagMasterCreateModal` (not shadcn `dialog`) — pattern reuse acceptable per UI-SPEC reused-component list, but it means `dialog` from registry is not consumed; the registry-safety table is aspirational.

No third-party registries flagged.

---

## Wave Gate Verdict

Per `feedback_visual_alignment_gate` memory + ADR-0008:

- impeccable:critique ≥ 8/10 required → **failed** (max pillar 7, four pillars below 7)
- 사용자 sign-off → **deferred until BLOCKs resolved**
- recritique loop → **mandatory** after fixes 1–3 land

**Recommendation:** Do **not** advance Phase 1 to `implemented` status in `.planning/STATE.md`. Schedule a fix-skill batch (3 BLOCKs + 4 FLAGs) before the visual-diff baseline refresh declared in UI-SPEC §Reference Alignment.

---

## Files Audited

- `frontend/src/features/admin/tag-master/ui/KeywordChipInput.tsx`
- `frontend/src/features/admin/tag-master/ui/TagMasterRow.tsx`
- `frontend/src/features/admin/tag-master/ui/TagMasterTable.tsx`
- `frontend/src/features/admin/tag-master/ui/TagRuleActionMenu.tsx`
- `frontend/src/features/admin/tag-master/ui/TagRuleAddForm.tsx`
- `frontend/src/features/admin/tag-master/ui/TagRuleConfirmDialog.tsx`
- `frontend/src/features/admin/tag-master/ui/TagRulesFlatRow.tsx`
- `frontend/src/features/admin/tag-master/ui/TagRulesFlatTable.tsx`
- `frontend/src/features/admin/tag-master/ui/TagRulesFlatTableEmptyState.tsx`
- `frontend/src/features/admin/tag-master/ui/TagRulesManagerModal.tsx`
- `frontend/src/features/admin/tag-master/ui/TagRulesModalStates.tsx`
- `frontend/src/features/admin/tag-master/ui/TagRulesSubTable.tsx`
- `frontend/src/pages/admin/tags.tsx`

Specs consulted: `01-UI-SPEC.md`, project `CLAUDE.md`, `frontend/CLAUDE.md`, `frontend/src/CLAUDE.md`. `uidesign.md` consulted indirectly via UI-SPEC token-binding tables (Read tool guidance redirected to symbolic tools — Bash grep used for token-presence audit).
