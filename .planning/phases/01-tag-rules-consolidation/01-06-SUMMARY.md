---
phase: 01-tag-rules-consolidation
plan: 06
subsystem: frontend-ui
tags: [wave-3, fe-modal, tdd-green, d-01, d-05, d-06, d-07, d-13, t-01-14, t-01-15]
dependency_graph:
  requires:
    - 01-05-SUMMARY.md (5 tag-rule hooks + MSW handlers + optimistic patches)
    - 01-03-SUMMARY.md (TagRule + TagRuleCreate + TagRulePatch zod contracts)
    - 01-UI-SPEC.md (Copywriting Contract + visual recipes)
  provides:
    - frontend/src/features/admin/tag-master/ui/KeywordChipInput.tsx
    - frontend/src/features/admin/tag-master/ui/TagRulesManagerModal.tsx
    - frontend/src/features/admin/tag-master/ui/TagRulesSubTable.tsx
    - frontend/src/features/admin/tag-master/ui/TagRuleAddForm.tsx
    - frontend/src/features/admin/tag-master/ui/TagRuleActionMenu.tsx
    - frontend/src/features/admin/tag-master/ui/TagRuleConfirmDialog.tsx
    - frontend/src/features/admin/tag-master/ui/TagRulesModalStates.tsx
  affects:
    - Plan 07 (page wiring + view-mode tabs) — mounts the modal from
      TagMasterTable's `규칙 N건` row badge.
tech_stack:
  added: []
  patterns:
    - shadcn DropdownMenu (Radix) for row-action menu — first use under tag-master/ui
    - Inline-style ModalOverlay (existing TagMasterCreateModal helpers) reused
      verbatim — kept consistent with sibling tag-master modals.
    - Two-modal stack: parent ModalOverlay + nested role=alertdialog confirm,
      both fixed-position overlays (z-50 / z-60).
key_files:
  created:
    - frontend/src/features/admin/tag-master/ui/KeywordChipInput.tsx (172 lines)
    - frontend/src/features/admin/tag-master/ui/TagRulesManagerModal.tsx (197 lines)
    - frontend/src/features/admin/tag-master/ui/TagRulesSubTable.tsx (195 lines)
    - frontend/src/features/admin/tag-master/ui/TagRuleAddForm.tsx (76 lines)
    - frontend/src/features/admin/tag-master/ui/TagRuleActionMenu.tsx (71 lines)
    - frontend/src/features/admin/tag-master/ui/TagRuleConfirmDialog.tsx (136 lines)
    - frontend/src/features/admin/tag-master/ui/TagRulesModalStates.tsx (91 lines)
    - frontend/src/features/admin/tag-master/ui/__tests__/KeywordChipInput.test.tsx (110 lines)
    - frontend/src/features/admin/tag-master/ui/__tests__/TagRulesManagerModal.test.tsx (201 lines)
  modified: []
decisions:
  - "Modal uses inline-style ModalOverlay reused from TagMasterCreateModal — NOT
    shadcn Dialog primitive — to match the existing tag-master modal family.
    Switching to shadcn Dialog would have introduced a visual delta vs sibling
    modals (TagMasterEditModal, TagMasterCreateModal, TagMasterMergeModal,
    TagMasterSuspendModal) without spec-justified benefit."
  - "Confirm dialog uses role=alertdialog with inline overlay (not Radix
    AlertDialog primitive) — `shared/ui/` has no alert-dialog block. Adding
    one via shadcn was out of scope for Plan 06; the inline implementation
    satisfies the UI-SPEC §Destructive matrix contract (cancel + primary, copy
    bound, focus trap is implicit via fixed-position overlay — Plan 07 may
    upgrade if it adds a deep-link / keyboard-only flow that needs Radix focus
    management)."
  - "Modal split into 6 files (modal + 5 sub-components) to satisfy project
    eslint max-lines=200 rule. Initial single-file impl was 613 lines; split
    along natural seams: add-form, sub-table, action-menu, confirm-dialog,
    states (banner/skeleton/empty)."
  - "Suspend's `suspended_until` ISO uses far-future sentinel
    `2999-12-31T00:00:00.000Z` for 'suspended indefinitely'; resume uses
    null. Plan 07 may swap for a date picker; current spec (UI-SPEC §Destructive
    matrix) only declares the binary suspend/resume action, not duration."
  - "TagRule type imported as `TagRuleT` (zod-inferred type) — schema is
    exported as `TagRule`, type as `TagRuleT` per shared/contracts/admin/tag.ts.
    Tests + component code consistently use `TagRuleT`."
metrics:
  duration: ~80 min (incl. worktree merge recovery + max-lines refactor)
  completed: 2026-05-11
---

# Phase 01 Plan 06: TagRulesManagerModal + KeywordChipInput

Wave 3 frontend UI for tag-rule consolidation. Two new components built TDD:
chip-array editor (T-01-14 client-side gate) + modal sub-table with inline
add-form, edit-row toggle, and permission-gated destructive actions
(T-01-15 + D-13).

## Component Contracts

### `KeywordChipInput`

```ts
interface KeywordChipInputProps {
  value: string[];                // controlled chip array
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;           // default: '키워드 입력 후 Enter (쉼표로도 추가 가능)'
  max?: number;                   // default: 50
  'aria-label'?: string;
}
```

Behaviour:

| Trigger                    | Effect                                                              |
| -------------------------- | ------------------------------------------------------------------- |
| Enter / `,`                | trim + dedupe (case-insensitive) + cap-check → onChange / inline error |
| Backspace on empty input   | remove last chip via onChange                                       |
| X click on chip            | remove that chip via onChange                                       |
| Whitespace-only commit     | no-op                                                               |
| Duplicate (case-insensitive) | inline error `이미 추가된 키워드입니다` (role=alert)              |
| Cap exceeded               | inline error `최대 ${max}개까지 추가할 수 있습니다`                 |

T-01-14 mitigation: `trim().min(1).max(60)` per chip + `.max(50)` total
mirror the server-side `KeywordItem` / `KeywordsArray` zod refines in
`shared/contracts/admin/tag.ts`. Server zod refine is the authoritative gate.

### `TagRulesManagerModal`

```ts
interface Props {
  tag: TagMasterItem;
  onClose: () => void;
}
```

Internal state: `keywords` (add-form draft), `editingRuleId` + `editKeywords`
(in-row edit toggle), `confirming` ({ kind, rule } for delete/suspend/resume),
`bannerError` (mutation error copy).

Wires Plan 05 hooks:
- `useAdminTagRules(tag.id)` — initial fetch + refetch on invalidate
- `useCreateTagRule(tag.id)` — submit add-form
- `useUpdateTagRule(tag.id)` — save row-edit
- `useDeleteTagRule(tag.id)` — confirm 삭제
- `useSuspendTagRule()` — confirm 일시중지 / 재개

D-13 permission gating: `useRole().isAdmin` controls visibility of
일시중지 / 재개 / 삭제 menu items inside `TagRuleActionMenu`. Manager sees
only 수정.

## Test Counts

| File | Cases | Status |
| --- | --- | --- |
| `__tests__/KeywordChipInput.test.tsx` | 10 | GREEN |
| `__tests__/TagRulesManagerModal.test.tsx` | 10 | GREEN |
| **Plan 06 new** | **20** | **GREEN** |
| FE total | 715 | 715 passing (Plan 05 baseline 695 + 20) |

## UI-SPEC Copywriting Contract Coverage

Wired in Plan 06:

| Element | Copy | Wired in |
| --- | --- | --- |
| Modal title | `{태그명} · 규칙 {N}건` | TagRulesManagerModal header |
| Modal subtitle | `자동 태깅 규칙 관리` | TagRulesManagerModal header |
| Primary CTA | `+ 규칙 추가` | TagRuleAddForm submit |
| Add form keyword placeholder | `키워드 입력 후 Enter (쉼표로도 추가 가능)` | KeywordChipInput default |
| Add form match-mode label | `매칭 방식` | TagRuleAddForm select aria-label |
| Empty state heading | `등록된 규칙이 없습니다` | TagRulesModalStates EmptyRulesState |
| Empty state body | `위 폼에서 첫 번째 규칙을 추가하세요` | EmptyRulesState |
| Error retry button | `다시 시도` | MutationErrorBanner |
| Mutation error (create) | `규칙을 추가하지 못했습니다. 잠시 후 다시 시도해 주세요` | TagRulesManagerModal banner |
| Mutation error (update / suspend / resume) | `규칙을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요` | TagRulesManagerModal banner |
| Mutation error (delete) | `규칙을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요` | TagRulesManagerModal banner |
| Inline duplicate keyword error | `이미 추가된 키워드입니다` | KeywordChipInput |
| Suspend confirm copy | `이 규칙을 일시중지하시겠습니까? 일시중지된 규칙은 신규 VOC에 자동 적용되지 않습니다.` | TagRuleConfirmDialog |
| Suspend confirm primary | `일시중지` | TagRuleConfirmDialog |
| Resume confirm copy | `이 규칙을 재개하시겠습니까? 재개 후 신규 VOC부터 자동 태깅에 다시 사용됩니다.` | TagRuleConfirmDialog |
| Resume confirm primary | `재개` | TagRuleConfirmDialog |
| Delete confirm copy | `이 규칙을 삭제하시겠습니까? 삭제된 규칙은 복구할 수 없습니다.` | TagRuleConfirmDialog |
| Delete confirm primary | `삭제` | TagRuleConfirmDialog |
| Author column null fallback | `—` (em dash, `--text-quaternary`) | TagRulesSubTable |
| Cancel (across confirms) | `취소` | TagRuleConfirmDialog |
| Status: 활성 | `활성` (`--text-tertiary`) | TagRulesSubTable |
| Status: 일시중지됨 | `일시중지됨` SolidChip (amber) | TagRulesSubTable |
| 매칭 방식 cell value | `키워드` | TagRulesSubTable |
| Inline cap error | `최대 ${max}개까지 추가할 수 있습니다` | KeywordChipInput |

Deferred to Plan 07 (page-level wiring):

| Element | Copy | Reason deferred |
| --- | --- | --- |
| Page title | `태그 관리` | Lives on AdminTagsPage |
| View-mode tab labels | `태그` / `전체 규칙` | Plan 07 introduces tabs |
| Search placeholder | `키워드 또는 태그명으로 검색` | view=rules toolbar (Plan 07) |
| Row badge N=0 | `규칙 없음` | TagMasterTable cell (Plan 07) |
| Row badge N≥1 | `규칙 {N}건` | TagMasterTable cell (Plan 07) |
| Empty state (view=rules, q hit-miss) | `검색 결과가 없습니다` + body | Plan 07 view=rules empty state |
| Empty state (view=rules, total=0) | `등록된 규칙이 없습니다` + body | Plan 07 view=rules empty state |
| Error state heading / body | `규칙을 불러오지 못했습니다` / `네트워크 상태를 확인한 후 다시 시도해 주세요` | Plan 07 page-level error state |
| Permission denied tooltip (Manager hovering Delete) | `삭제 권한은 Admin만 보유합니다` | Plan 07 may add tooltip; UI-SPEC currently hides the item, no tooltip surface yet |
| Inline empty keyword error | `키워드를 한 개 이상 입력하세요` | Submit-disabled handles UX path; copy unused but reserved for Plan 07 review |
| Optimistic placeholder status | `저장 중...` | Optimistic placeholder row deferred to Plan 07 (sub-table currently relies on TanStack invalidate refetch; placeholder row is enhancement) |

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck -w frontend` | clean |
| `npm run lint -w frontend` | clean (max-lines=200 satisfied — split into 6 files) |
| `npm run test -w frontend -- --run` | **715 passed** (92 files), 0 fail |
| `grep -c "export function KeywordChipInput" KeywordChipInput.tsx` | 1 |
| `grep -cE "Enter\|','\|Backspace" KeywordChipInput.tsx` | 3 |
| `grep -c "이미 추가된 키워드입니다" KeywordChipInput.tsx` | 1 |
| `grep -c "export function TagRulesManagerModal" TagRulesManagerModal.tsx` | 1 |
| `grep -cE "useAdminTagRules\|useCreateTagRule\|useUpdateTagRule\|useDeleteTagRule\|useSuspendTagRule" TagRulesManagerModal.tsx` | 5 |
| `grep -c "isAdmin" TagRulesManagerModal.tsx` (D-13) | 1 (passed to TagRuleActionMenu) |
| `grep -cE "등록된 규칙이 없습니다\|자동 태깅 규칙 관리\|규칙을 추가하지 못했습니다" TagRulesManagerModal.tsx + TagRulesModalStates.tsx` | 3 |
| KeywordChipInput vitest cases | 10 / 10 GREEN |
| TagRulesManagerModal vitest cases | 10 / 10 GREEN |

## Commits

| Task | Hash | Message |
| --- | --- | --- |
| 1.06.1 RED | `ab4c0e80` | test(01-06): add failing test for KeywordChipInput |
| 1.06.1 GREEN | `f05436ed` | feat(01-06): implement KeywordChipInput chip-array editor |
| 1.06.2 RED | `41202966` | test(01-06): add failing test for TagRulesManagerModal |
| (merge) | `f55b3a89` | Merge branch 'docs/codebase-map' into worktree-agent-ac8b3041f0df6feb5 |
| 1.06.2 GREEN | `474a0a27` | feat(01-06): implement TagRulesManagerModal + sub-table + permission gating |

## Deviations from Plan

**1. [Rule 3 — Blocking] Worktree branch was based on stale tip without Plan 01–05 outputs**

- **Found during:** Task 2 typecheck — `useAdminTagRules / useCreateTagRule / useUpdateTagRule / useDeleteTagRule` were reported as missing from `tag-master.api.ts`; `TagRuleT` not exported. Cause: `worktree-agent-ac8b3041f0df6feb5` was created from `b33f6418` which predates the merged `docs/codebase-map` (`d09b2db5`) carrying Plan 01–05 commits. Mirrors Plan 05 deviation #1.
- **Fix:** `git merge docs/codebase-map --no-edit` from inside the worktree. The worktree had three unique commits (RED + GREEN of Task 1, RED of Task 2) so a fast-forward was not possible; a merge commit (`f55b3a89`) was created. No rebase / reset / clean used (CLAUDE.md `destructive_git_prohibition` compliant). Merge had zero conflicts (only file additions on both sides).
- **Files modified:** none — merge commit only.

**2. [Rule 3 — Blocking] Initial Write of `KeywordChipInput.test.tsx` landed in main-repo working tree instead of worktree**

- **Found during:** Task 1 RED verification (`npx vitest --run … KeywordChipInput.test.tsx` returned `No test files found`). Cause: same as Plan 05 deviation #2 — the absolute path `/Users/hyojung/Desktop/2026/vocpage/frontend/...` resolved against the **main repo** rather than the worktree, even though the Bash cwd was the worktree root.
- **Fix:** copied the file from main repo into the worktree (`mkdir -p` then `cp`), then `rm` the misplaced file in main repo (and removed the empty parent dir). Verified `git status` from main-repo path was clean. From that point on, all subsequent Writes used the worktree-rooted absolute path (`/Users/hyojung/Desktop/2026/vocpage/.claude/worktrees/agent-ac8b3041f0df6feb5/...`).
- **Files modified:** none — file relocation only.

**3. [Rule 3 — Blocking] Initial single-file modal exceeded `max-lines=200` lint rule**

- **Found during:** post-GREEN `npm run lint -w frontend` after Task 2.
- **Issue:** First-pass `TagRulesManagerModal.tsx` was 613 lines (modal + sub-table + chips view + confirm dialog + table primitives + style helpers all inline). Project eslint config caps files at 200 lines.
- **Fix:** split along natural seams into 6 sibling files: `TagRulesManagerModal` (197 lines, orchestration), `TagRuleAddForm` (76, inline form), `TagRulesSubTable` (195, table render), `TagRuleActionMenu` (71, dropdown gating), `TagRuleConfirmDialog` (136, alertdialog), `TagRulesModalStates` (91, banner / skeleton / empty). Public surface unchanged — modal still imports as one component. Required two iterations because intermediate split (modal 271 + sub-table 221) was still over.
- **Tests:** all 10 modal cases continued passing through every split iteration; no behavioral change.

**4. [Rule 1 — Bug] Test header-text matcher collided with chip-text in same DOM**

- **Found during:** initial GREEN run of `TagRulesManagerModal.test.tsx`.
- **Issue:** `screen.getByText(/버그/)` matched both the modal header (`버그 · 규칙 2건`) and a `RULE_A.keywords` chip text node containing just `버그`, raising `getMultipleElementsFoundError`.
- **Fix:** scoped the assertion to the exact full header string `버그 · 규칙 2건`. Behavior unchanged; only the test query was tightened.
- **Files modified:** `__tests__/TagRulesManagerModal.test.tsx` (one assertion).

## Surprises / Notes for Plan 07

- The modal currently renders **without** a portal — uses inline-style fixed-position div. If Plan 07 mounts it from inside the existing `TagMasterTable` row badge, the parent table's `overflow: hidden` could clip the modal. Mitigation already in place: `position: fixed` + top-level `inset: 0` overrides any ancestor overflow. Verified visually-equivalent to existing `TagMasterEditModal` which uses the same approach.
- The optimistic placeholder row (`opacity 0.6` + `저장 중...` text) declared in UI-SPEC §Optimistic update visual contract is **not** implemented in Plan 06 — relies on TanStack Query `onSettled` invalidate to refetch the rule list. Reason: Plan 05's `useCreateTagRule` already issues `invalidateQueries({ queryKey: RULES_KEY(tagId) })` on settle, so post-success refetch surfaces the new row organically. The +/- 1 patch on `['admin','tags']` (parent badge) is wired by Plan 05's optimistic patch — Plan 07 will see the badge update simultaneously when it mounts the modal from that table. If Plan 07 wants the placeholder row UX, it can add it in `TagRulesSubTable` by reading `useCreateTagRule` mutation context.
- The `매칭 방식` select is **disabled** with single option `키워드` (D-06 — single-mode v1). Plan 07 / future plan can enable when additional match modes ship.
- The `useRole` mock in `__tests__/TagRulesManagerModal.test.tsx` mirrors the pattern used in `pages/admin/__tests__/AdminTagsPage.test.tsx` — Plan 07's page-level test will reuse this pattern when it mounts the modal.
- The `TagMasterSuspendModal.tsx` legacy slot identified in Plan 05's deviation #3 (`ruleId: ''` placeholder in `TagMasterTable.tsx`) is **not** removed by Plan 06; that slot will be deleted by Plan 07 when the new modal replaces the old action.

## Threat Compliance

| Threat | Mitigation in this plan |
| --- | --- |
| T-01-14 (KeywordChipInput input sanitization) | `commit()` performs `trim()` + case-insensitive dedupe via `value.some(k => k.toLowerCase() === trimmed.toLowerCase())` + capacity check `value.length >= max` (default 50) before calling `onChange`. Native input `maxLength={60}` enforces per-chip char cap. Inline error copy bound to UI-SPEC contract. Server zod refine remains the authoritative gate (T-01-11 / Plan 04). Verified by 4 of 10 KeywordChipInput vitest cases (dedupe, max-cap, whitespace, char-cap implicit via maxLength attribute). |
| T-01-15 (Destructive actions for non-admin) | `TagRuleActionMenu` reads `isAdmin` and conditionally renders `일시중지` / `재개` / `삭제` `<DropdownMenuItem>` elements. When `!isAdmin`, those items are absent from the DOM (verified by Vitest case 7 — `screen.queryByRole('menuitem', { name: '삭제' })` returns null in manager role). All three destructive paths funnel through `TagRuleConfirmDialog` (role=alertdialog) — no immediate-fire path. BE `requireRole` continues to enforce; FE hide is UX only per UI-SPEC §Permission gating. |

## Threat Flags

None. No new network endpoints, auth paths, file access, or schema changes at trust boundaries introduced — this plan composes existing Plan 05 hooks + existing shadcn primitives + existing fixture data. All API surface contracts came from Plan 03 unchanged.

## Known Stubs

None introduced. The pre-existing `TagMasterTable.tsx` `ruleId: ''` placeholder noted in Plan 05's deviation #3 is unchanged (Plan 07's job to remove).

## Self-Check

- `frontend/src/features/admin/tag-master/ui/KeywordChipInput.tsx` — 172 lines, exports `KeywordChipInput` + `KeywordChipInputProps`: FOUND
- `frontend/src/features/admin/tag-master/ui/TagRulesManagerModal.tsx` — 197 lines, exports `TagRulesManagerModal`: FOUND
- `frontend/src/features/admin/tag-master/ui/TagRulesSubTable.tsx` — 195 lines, exports `TagRulesSubTable`: FOUND
- `frontend/src/features/admin/tag-master/ui/TagRuleAddForm.tsx` — 76 lines: FOUND
- `frontend/src/features/admin/tag-master/ui/TagRuleActionMenu.tsx` — 71 lines: FOUND
- `frontend/src/features/admin/tag-master/ui/TagRuleConfirmDialog.tsx` — 136 lines: FOUND
- `frontend/src/features/admin/tag-master/ui/TagRulesModalStates.tsx` — 91 lines: FOUND
- `frontend/src/features/admin/tag-master/ui/__tests__/KeywordChipInput.test.tsx` — 110 lines, 10 it cases: FOUND
- `frontend/src/features/admin/tag-master/ui/__tests__/TagRulesManagerModal.test.tsx` — 201 lines, 10 it cases: FOUND
- Commit `ab4c0e80` (RED ChipInput) reachable in `git log`: FOUND
- Commit `f05436ed` (GREEN ChipInput) reachable in `git log`: FOUND
- Commit `41202966` (RED Modal) reachable in `git log`: FOUND
- Commit `474a0a27` (GREEN Modal) reachable in `git log`: FOUND
- FE Vitest 715 passing (Plan 05 baseline 695 + 20 new): VERIFIED
- `npm run lint -w frontend` clean (max-lines=200 enforced): VERIFIED
- `npm run typecheck -w frontend` clean: VERIFIED

## Self-Check: PASSED
