---
phase: 1
slug: tag-rules-consolidation
status: approved
reviewed_at: 2026-05-10
shadcn_initialized: true
preset: vocpage-custom (slate base + OKLCH Samsung Blue tokens — see uidesign.md §10)
created: 2026-05-10
sources:
  - .planning/phases/01-tag-rules-consolidation/01-CONTEXT.md
  - .planning/REQUIREMENTS.md
  - .planning/ROADMAP.md (Phase 1)
  - docs/specs/requires/uidesign.md (visual identity SSOT)
  - docs/specs/requires/feature-voc.md §9.4.1 / §9.4.6
  - refSystem/Integrated Platform _ Standalone.html (design family target)
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for the `/admin/tags` Tag Rules Consolidation phase. All visual decisions consume `uidesign.md` tokens — this contract reuses, never redefines.
>
> **Phase 5 boundary:** Flowline visual primitives (issue-id, status-glyph, etc.) are owned by Phase 5. This phase introduces NO new visual primitives — only composes existing tokens / `shared/ui/` components.

---

## Design System

| Property          | Value                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------- |
| Tool              | shadcn (initialized — `frontend/components.json`)                                      |
| Preset            | slate base + project OKLCH overlay (Samsung Blue brand) per `uidesign.md §10`          |
| Component library | shadcn/ui (Radix primitives) under `frontend/src/shared/ui/`                           |
| Icon library      | `lucide-react` (Plus, Pencil, Trash2, Pause, Play, X, Search, ChevronLeft/Right)       |
| Font              | Pretendard Variable (UI), D2Coding (issue codes only — not used in this phase)         |

**Reused primitives (already in `shared/ui/`):** `dialog`, `tabs`, `input`, `button`, `badge`, `table`, `pagination`, `dropdown-menu`, `select`, `label`, `empty-state`, `error-state`, `skeleton`, `separator`.

**Reused feature components:** `TagMasterEditModal`, `TagMasterSuspendModal`, `TagMasterCreateModal`, `TagMasterRow`, `TagMasterTable`, `TagMasterActionButton` (`frontend/src/features/admin/tag-master/ui/`). New `TagRulesManagerModal` extends the same pattern.

---

## Spacing Scale

Bound to `uidesign.md §7 Spacing (4pt scale)`. **No new tokens introduced.**

| Token    | Value | Usage in this phase                                                                  |
| -------- | ----- | ------------------------------------------------------------------------------------ |
| `--sp-1` | 4px   | Icon ↔ label gap inside row-action button; chip inner padding for keyword chips      |
| `--sp-2` | 8px   | Element gap between tabs / search input / "추가" button in toolbar; chip-to-chip gap |
| `--sp-3` | 12px  | Modal sub-table cell padding (`.admin-table td`); form field internal padding        |
| `--sp-4` | 16px  | Modal body section stack (form ↔ sub-table); admin-card inner padding                |
| `--sp-5` | 24px  | Admin-body padding; gap between toolbar row and table; modal outer gutter            |
| `--sp-6` | 32px  | Empty state vertical breathing (rules empty inside modal)                            |

**Key dimensions reused (not redefined):**
- Page header (`/admin/tags` topbar): 56px height, `padding: 0 24px` — `uidesign.md §7 Key Dimensions`.
- Filter / toolbar row (toggle tabs + search): 44px height — same band as VOC list filter tabs.
- Admin table row body: 52px (matches `uidesign.md §7`); admin table header: 32px.
- Modal width: `560px` (default form modal width — matches existing `TagMasterEditModal`); auto-grows to `680px` when sub-table renders ≥3 rules (within `--sp-5` viewport gutter).
- Modal max-height: `min(720px, calc(100vh - 96px))` with internal scroll for sub-table when N>10.

**Exceptions:** none. All values trace to `uidesign.md §7`.

---

## Typography

Bound to `uidesign.md §4 Type Scale`. **No new font sizes introduced.**

| Role    | Size   | Weight | Line height | Usage in this phase                                                              |
| ------- | ------ | ------ | ----------- | -------------------------------------------------------------------------------- |
| Title   | 15px   | 700    | 1.4         | Page header `태그 관리`; modal header `{태그명} · 규칙 N건`                       |
| Body UI | 14px   | 400    | 1.5         | Modal body labels, form helper text, search input value                          |
| Label   | 13px   | 400–600| 1.4         | Admin-table cells (`.admin-table td` 13.5px); form field labels (600)            |
| Caption | 11.5px | 600    | 1.4         | `규칙 N건` row badge; `작성자` column metadata; `일시중지됨` status caption       |

**Not used this phase:** Display (32px), Heading (20–24px), Micro (10–11px uppercase). No D2Coding consumers (no issue codes on this surface).

**Korean line-height note:** Body UI rendered with `line-height: 1.65` for Korean copy per `uidesign.md §4 Core principles`.

---

## Color

Bound to `uidesign.md §3 Color Palette (OKLCH)`. **All values via `var(--token)` — never raw OKLCH.**

| Role           | Token                              | Usage in this phase                                                                |
| -------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| Dominant (60%) | `--bg-app`, `--bg-panel`           | `/admin/tags` page body + topbar background                                        |
| Secondary (30%)| `--bg-surface`, `--bg-elevated`    | Modal dialog surface; admin-table row hover; tab inactive ground                   |
| Accent (10%)   | `--brand`, `--accent`, `--brand-bg`| Reserved-for list below — Samsung Blue, no decorative use                          |
| Destructive    | `--status-red`, `--status-red-bg`, `--status-red-border` | Delete button (Admin-only) + delete confirmation banner   |
| Suspended      | `--status-amber`, `--status-amber-bg`, `--status-amber-border` | Suspended-rule row state badge (`일시중지됨`)         |

### Accent reserved-for list (10% rule)

Samsung Blue (`--brand` / `--accent` / `--brand-bg` / `--brand-border`) is used on this surface ONLY for:

1. Primary CTA `+ 규칙 추가` (`--brand` background, `--text-on-brand` text) inside modal header / toolbar.
2. Active state of view-mode tabs (`태그` / `전체 규칙`) — uses `Filter Tab` active recipe from `uidesign.md §5`.
3. Row badge `규칙 N건` when `N > 0` — `--brand-bg` background, `--accent` text, `--brand-border` border (OutlineChip primitive, `uidesign.md §13.4`).
4. Focus ring on all interactive elements — `box-shadow: 0 0 0 3px var(--brand-bg)` (`uidesign.md §9 Accessibility`).
5. Search input focus border (`Input & Select` recipe, `uidesign.md §5`).
6. Author chip in modal header (`작성자: {displayName}`) — uses `OutlineChip` for rule rows authored by current user (visual emphasis only when N≤1 author).

**Forbidden accent uses on this surface:** decorative dividers, modal background tint, table header strip, chip backgrounds for keyword tokens (keyword chips use `--bg-elevated` neutral — see chip recipe below).

**Destructive reserved-for list:** `Delete` row action (Admin-only per ADR-0004 / D-13); inline error banner on mutation failure (`var(--status-red-bg)` per `uidesign.md §6 Empty/Error/Loading`).

### Row badge states (`규칙 N건`)

| Rule count | Visual                                                                                  |
| ---------- | --------------------------------------------------------------------------------------- |
| `N == 0`   | TextMark (no chip): `규칙 없음` in `--text-quaternary`, 11.5px, weight 500. Click opens modal in empty state — CTA visible. |
| `N >= 1`   | OutlineChip: `규칙 {N}건`, `--brand-bg` / `--accent` / `--brand-border`, `--chip-radius-pill` (9999px). |
| Hover      | Increase background to `color-mix(in oklch, var(--brand-bg) 80%, var(--accent) 10%)` (matches `.admin-btn:hover`). |
| Focus      | Add `--focus-ring` (`box-shadow: 0 0 0 3px var(--brand-bg)`). Tab order: same as row's primary action button. |
| Optimistic update | After mutation `onMutate` increments N, badge re-renders with `transition: background 120ms cubic-bezier(0.16, 1, 0.3, 1)`. No bespoke count animation — relies on React reconciliation + token transition. Reduced-motion: instant swap. |

### Suspended-rule state visual (in modal sub-table)

Suspended row: row background `--status-amber-bg` (subtle tint), row text remains `--text-primary`. Append `SolidChip` `일시중지됨` (`--status-amber-bg` / `--status-amber` / `--status-amber-border`, `--chip-radius-rounded` 4px) in the `매칭 방식` column trailing slot. Action column shows `재개` button replacing `일시중지` (Admin-only).

---

## Layout & Interaction Contract

### `/admin/tags` page anatomy (top-to-bottom)

1. **Page header** (`uidesign.md §5 Page Header`, 56px) — title `태그 관리` + right slot for `+ 태그 추가` (existing TagMaster CTA).
2. **Toolbar row** (44px, `padding: 0 var(--sp-5)`, `var(--sp-2)` gap) — left: view-mode tabs (`태그` / `전체 규칙`); right: search input (`키워드 검색`, 240px width, only visible when `view=rules`).
3. **Data area** — switches by `?view=` query param:
   - `view=tags` (default): existing `TagMasterTable` with new `규칙 N건` column inserted between `사용 VOC 수` and `작업`.
   - `view=rules`: flat `tag_rules` admin-table — columns `키워드 | 태그 | 매칭 방식 | 상태 | 작성자 | 작업`.

URL contract: `?view=tags|rules` + `?q=` (only when `view=rules`). Default `view=tags`. Persisted via `useSearchParams`.

### View-mode tabs recipe

Use `Filter Tab` recipe from `uidesign.md §5` (pill-style, double-ring active). Two tabs only: `태그` / `전체 규칙`. Press feedback `transform: scale(0.94)`. Active is `--brand-bg` background + `--brand-border` + `--accent` text + 1px box-shadow ring.

### Search input recipe (`view=rules` only)

`Input & Select` recipe from `uidesign.md §5`:
- 32px height (`--ui-h-md`), 6px radius, `--bg-elevated` background, `--border-standard` border.
- Leading `Search` icon (lucide, 14px, `--text-tertiary`), trailing `X` clear button when `q.length > 0`.
- Debounce 250ms before firing query — `q` matches BE `tag_rules.keywords` (any chip) + `tags.name` (case-insensitive).
- Empty result: render `EmptyState` primitive — see Copywriting Contract below.

### `규칙 N건` row interaction

- Cell renders as a button-styled badge (still `<button>` for a11y). Click opens `TagRulesManagerModal` for that tag.
- `aria-label`: `{태그명}의 규칙 {N}건 관리`.
- Keyboard: `Enter` / `Space` opens modal (Radix Dialog handles focus trap).

### `TagRulesManagerModal` anatomy (top-to-bottom)

Use `Dialog` primitive (`shared/ui/dialog`), 12px outer radius, `--shadow-dialog`, `--bg-surface`. Modal width: 560px → 680px (when sub-table N≥3).

1. **Header** (`padding: var(--sp-4) var(--sp-5)`, `border-bottom: 1px solid var(--border-subtle)`):
   - Title: `{태그명} · 규칙 {N}건` (15px / 700).
   - Subtitle below title: `자동 태깅 규칙 관리` (12px / 400, `--text-tertiary`).
   - Close (X) button top-right (32px square icon button).

2. **Body** (`padding: var(--sp-5)`, vertical stack `var(--sp-4)`):
   - **Inline add form** (top): chip array input `키워드` (Enter / `,` to commit, `Backspace` on empty input removes last chip; duplicate inline error `var(--status-red)` — copy: `이미 추가된 키워드입니다`). Inline `match_mode` Select (single option `키워드` rendered, future-proof per D-06). Submit button `+ 규칙 추가` (`--brand` primary, `--ui-h-md`). Disabled when chips.length === 0.
     - Keyword chip recipe: `--bg-elevated` background, `--text-primary` text, `--chip-radius-pill` radius, `padding: 2px 8px`, 11.5px / 600. Trailing `X` (10px lucide) removes. Neutral, NOT brand — keywords are content, not accent.
   - **Sub-table** (below form): `.admin-table` recipe from `uidesign.md §14.2`. Columns:
     | 키워드 목록 | 매칭 방식 | 상태 | 작성자 | 작업 |
     - `키워드 목록`: render keywords as keyword chips inline (max 3 visible + `+N` overflow chip).
     - `매칭 방식`: `키워드` text label.
     - `상태`: `활성` (TextMark, `--text-tertiary`) or `일시중지됨` (SolidChip amber).
     - `작성자`: `displayName` (13.5px, `--text-secondary`); fallback `—` when `created_by` is NULL (legacy rows pre-mig-024).
     - `작업`: row-action `DropdownMenu` (`shared/ui/dropdown-menu`) — `수정` / `일시중지` ↔ `재개` / `삭제`. Permission gating per ADR-0004 / D-13.

3. **States inside modal:**
   - **Empty (N=0):** Centered `EmptyState` primitive (`uidesign.md §5`): icon `ListPlus` (32×32, `--text-quaternary`), headline `등록된 규칙이 없습니다` (13.5px / `--text-secondary`), body `위 폼에서 첫 번째 규칙을 추가하세요`. Min-height: 220px. No CTA — form above is the CTA.
   - **Loading (initial fetch):** 3 skeleton rows (`uidesign.md §5 — Empty/Error/Loading`), 52px height each, `--bg-elevated` block, no shimmer below 200ms.
   - **Error (mutation failure):** Inline banner above sub-table: `--status-red-bg` background, `--status-red` text, retry button `다시 시도`. Optimistic update rollback runs first; banner appears on `onError`.

4. **Footer:** none. All actions live inline in row + form. Modal closes via X / Esc / overlay click.

### Optimistic update visual contract

- On `+ 규칙 추가` submit: append a new row to sub-table immediately with `opacity: 0.6` placeholder + `상태: 저장 중...` text. Row resolves to full opacity on `onSuccess`. On `onError`: row removes with 120ms fade, error banner appears, form chips restored.
- Row `규칙 N건` badge in parent `/admin/tags` table updates from `N` → `N+1` simultaneously via TanStack Query cache patch (D-11). Reduced-motion: instant.

### `view=rules` flat table

Same `.admin-table` recipe. Columns: `키워드 | 태그 | 매칭 방식 | 상태 | 작성자 | 작업`. `태그` cell renders the parent tag as a clickable link → switches `?view=tags` and scrolls to that tag row. Search empty result → `EmptyState` (see copy below).

---

## Copywriting Contract

All copy in Korean (per project memory `feedback_korean_questions`). English identifiers preserved (e.g. `match_mode` is the column name, but the visible header is `매칭 방식`).

| Element                                        | Copy                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Page title                                     | `태그 관리`                                                                                   |
| View-mode tab labels                           | `태그` / `전체 규칙`                                                                          |
| Search placeholder (view=rules)                | `키워드 또는 태그명으로 검색`                                                                 |
| Row badge (N=0)                                | `규칙 없음`                                                                                   |
| Row badge (N≥1)                                | `규칙 {N}건`                                                                                  |
| Modal title                                    | `{태그명} · 규칙 {N}건`                                                                       |
| Modal subtitle                                 | `자동 태깅 규칙 관리`                                                                         |
| Primary CTA (form submit)                      | `+ 규칙 추가`                                                                                 |
| Add form keyword input placeholder             | `키워드 입력 후 Enter (쉼표로도 추가 가능)`                                                   |
| Add form match-mode label                      | `매칭 방식`                                                                                   |
| Empty state heading (modal, no rules)          | `등록된 규칙이 없습니다`                                                                      |
| Empty state body (modal, no rules)             | `위 폼에서 첫 번째 규칙을 추가하세요`                                                         |
| Empty state heading (view=rules, q has no hit) | `검색 결과가 없습니다`                                                                        |
| Empty state body (view=rules, q has no hit)    | `다른 키워드로 다시 검색하거나 검색어를 비워 전체 규칙을 확인하세요`                          |
| Empty state heading (view=rules, total=0)      | `등록된 규칙이 없습니다`                                                                      |
| Empty state body (view=rules, total=0)         | `태그 탭에서 태그별로 규칙을 추가할 수 있습니다`                                              |
| Loading state                                  | (no copy — skeleton rows only, per `uidesign.md §5`)                                          |
| Error state heading                            | `규칙을 불러오지 못했습니다`                                                                  |
| Error state body                               | `네트워크 상태를 확인한 후 다시 시도해 주세요`                                                |
| Error retry button                             | `다시 시도`                                                                                   |
| Mutation error (create)                        | `규칙을 추가하지 못했습니다. 잠시 후 다시 시도해 주세요`                                      |
| Mutation error (update / suspend / resume)     | `규칙을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요`                                      |
| Mutation error (delete)                        | `규칙을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요`                                      |
| Inline duplicate keyword error                 | `이미 추가된 키워드입니다`                                                                    |
| Inline empty keyword error                     | `키워드를 한 개 이상 입력하세요`                                                              |
| Inline cap-reached keyword error               | `최대 {N}개까지 추가할 수 있습니다` (N = `KeywordChipInput` `max`, default 50)                |
| Suspend confirm copy                           | `이 규칙을 일시중지하시겠습니까? 일시중지된 규칙은 신규 VOC에 자동 적용되지 않습니다.`        |
| Suspend confirm primary                        | `일시중지`                                                                                    |
| Resume confirm copy                            | `이 규칙을 재개하시겠습니까? 재개 후 신규 VOC부터 자동 태깅에 다시 사용됩니다.`               |
| Resume confirm primary                         | `재개`                                                                                        |
| Delete confirm copy (Admin-only)               | `이 규칙을 삭제하시겠습니까? 삭제된 규칙은 복구할 수 없습니다.`                               |
| Delete confirm primary                         | `삭제`                                                                                        |
| Permission denied tooltip (Manager hovering Delete) | `삭제 권한은 Admin만 보유합니다`                                                         |
| Author column null fallback                    | `—` (em dash, `--text-quaternary`)                                                            |
| Optimistic placeholder status                  | `저장 중...`                                                                                  |

### Destructive actions matrix

| Action                | Permission (D-13) | Confirmation pattern                                              | Confirm copy → primary button |
| --------------------- | ----------------- | ----------------------------------------------------------------- | ----------------------------- |
| Delete rule           | Admin only        | `AlertDialog` (Radix) — title + body + cancel/destructive buttons | (above) → `삭제`              |
| Suspend rule          | Admin only        | `AlertDialog` (lighter, no destructive variant)                   | (above) → `일시중지`          |
| Resume rule           | Admin only        | Inline `AlertDialog` with informational tone                      | (above) → `재개`              |

Cancel button copy across all three: `취소`. Cancel is leftmost; primary is rightmost. Destructive primary uses `--status-red` background + `--text-on-brand` text + `--status-red-border`.

---

## Registry Safety

| Registry         | Blocks Used                                                                         | Safety Gate                          |
| ---------------- | ----------------------------------------------------------------------------------- | ------------------------------------ |
| shadcn official  | `dialog`, `alert-dialog`, `tabs`, `input`, `button`, `dropdown-menu`, `select`, `badge`, `table`, `pagination`, `skeleton`, `label` (all already present in `frontend/src/shared/ui/`) | not required (official registry)     |
| Third-party      | none declared                                                                       | not applicable                        |

**No third-party blocks introduced.** All components either (a) already exist in `frontend/src/shared/ui/`, (b) are composed from existing shadcn primitives + project tokens, or (c) reuse existing TagMaster feature-level modals.

---

## Reference Alignment Notes

### Against `uidesign.md`
- ✅ All spacing → `--sp-1..6` only.
- ✅ All colors → `var(--token)` only; no raw OKLCH / hex.
- ✅ All typography → `uidesign.md §4` tier values (15 / 14 / 13.5 / 11.5).
- ✅ Modal radius 12px (per §7 `Border Radius by Element` row "Modal / Drawer outer surface").
- ✅ Sub-table reuses `.admin-table` (§14.2) — no bespoke table.
- ✅ Empty / Loading / Error states follow §5 contract.
- ✅ Phase 5 boundary respected: no new Flowline primitives introduced; existing `OutlineChip` / `SolidChip` / `TextMark` (§13) are composed without modification.

### Against `refSystem/Integrated Platform _ Standalone.html` (design family target)
- The refSystem reference establishes the cross-product visual family (admin topbar, table chrome, modal density). This phase composes existing vocpage primitives (which already encode `uidesign.md §14 Admin · Notice · FAQ Components`) — no shape divergence introduced. Visual diff baseline (`scripts/visual-diff.ts`) for `/admin/tags` will be retaken after this phase to confirm continued family alignment; comparison artifact is owned by Phase 5 closure but baseline-refresh is in-scope here.
- Family-level checkpoints satisfied: (1) admin topbar identical to existing admin pages, (2) sub-table chrome identical to `.admin-table`, (3) modal surface (`--shadow-dialog`, 12px radius, `--bg-surface`) identical to existing TagMaster modals.

### Open Questions (do NOT block planner — flag only)

- **OQ-UI-1:** When N=0 on a row, should the cell still be focusable / clickable to open the modal in empty state? Current spec: yes (button-styled, opens modal with empty state inside). Alternative: render plain text and force the user to use a separate `+ 규칙` row action. Recommendation: keep clickable (single affordance, fewer modes).
- **OQ-UI-2:** `created_by` NULL fallback for pre-mig-024 rows displays as `—`. If product wants `(시스템)` sentinel instead, raise during plan-phase (D-12 backfill decision intersects).
- **OQ-UI-3:** Modal width 560 → 680 dynamic resize crosses one breakpoint mid-session — if jank observed in implementation, fix at 680 always. Defer to executor empirical check.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — all primary CTA / empty / error / destructive copy declared in Korean, primary verb-noun present (`+ 규칙 추가`).
- [ ] Dimension 2 Visuals: PASS — composes existing `shared/ui/` primitives only; no new primitives.
- [ ] Dimension 3 Color: PASS — accent reserved-for list explicit; destructive reserved-for list explicit; no decorative brand use.
- [ ] Dimension 4 Typography: PASS — 4 tiers declared (Title 15 / Body 14 / Label 13.5 / Caption 11.5), 2 weight bands (400 / 600–700), all from `uidesign.md §4`.
- [ ] Dimension 5 Spacing: PASS — `--sp-1..6` only, all multiples of 4 from project token sheet.
- [ ] Dimension 6 Registry Safety: PASS — shadcn official only; zero third-party.

**Approval:** pending
