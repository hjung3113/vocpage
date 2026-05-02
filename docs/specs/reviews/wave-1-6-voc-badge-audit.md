# Wave 1.6 — VOC Badge Audit & Archetype Lock

> Status: DRAFT — pending user approval
> Scope: VOC pages only (list, detail expand-in-place, VocSubRow). Other pages (공지, FAQ, 태그 규칙, 관리자 등) deferred to separate audit.

---

## §0. Definitions (lock)

| Term                       | Definition                                                                                                                                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Badge / Chip primitive** | Presentational `<span>`-based component. No click handler, no focus management, no ARIA role beyond the element's natural semantics. Owns: height, padding, radius, font, gap — the structural shell. Does NOT own: domain color, domain label, domain icon mapping.                               |
| **Semantic wrapper**       | Thin domain component (`VocTypeBadge`, `VocTagPill`, `VocStatusBadge`, `VocPriorityBadge`) that accepts a domain enum (or string for tags) and internally calls the matching primitive with the correct `variant` + `icon` props. Callsites in `features/voc/**` never import primitives directly. |
| **Interactive component**  | `<button>`-based component (`FilterChip`, `SortControl`, future `ToggleChip`). Shares CSS dimension tokens with primitives but shares **zero component code**. Has hover / active / focus states and `aria-pressed`. Never extends a primitive via `interactive` prop — that prop is forbidden.    |
| **Token sharing rule**     | Primitives and interactive components share only `--chip-*` dimension tokens (height, padding, radius, font-size, gap). They do NOT share color tokens — interactive components have their own hover/focus/active color logic.                                                                     |

---

## §1. Audit table — 4 VOC badges

All badges are `sm` size. No badges appear in VOC detail (expand-in-place) or VocSubRow beyond what is listed here.

| #   | Badge               | Archetype   | Variant enum                   | iconMode                       | Size | Dynamic?                                             | Source file (current)                              | Ship status   |
| --- | ------------------- | ----------- | ------------------------------ | ------------------------------ | ---- | ---------------------------------------------------- | -------------------------------------------------- | ------------- |
| 1   | 유형 (Type)         | TextMark    | per type slug (4 v1 values)    | `icon-only`                    | `sm` | static enum (admin-managed, user-customizable in v2) | `VocTypeBadge` (new — C-2.6)                       | new           |
| 2   | 태그 (Tag)          | OutlineChip | `tag` (single neutral variant) | `icon+text` (icon = `#` glyph) | `sm` | dynamic (admin + user adds tags)                     | `VocTagPill` (new — C-3)                           | new           |
| 3   | 상태 (Status)       | SolidChip   | per status slug (5 values)     | `dot+text`                     | `sm` | static enum (6 from C1.D1~D6, one is deprecated)     | `frontend/src/components/voc/VocStatusBadge.tsx`   | shipped (C-1) |
| 4   | 우선순위 (Priority) | TextMark    | per priority value (4 values)  | `icon+text`                    | `sm` | static enum                                          | `frontend/src/components/voc/VocPriorityBadge.tsx` | shipped (C-2) |

**Notes:**

- `VocTypeBadge` does not yet exist; it is a C-2.6 deliverable.
- Tags are dynamic strings, not a closed enum. The `OutlineChip` primitive handles them uniformly.
- Status has 5 active values (접수/검토중/처리중/완료/드랍). `보류` was renamed to `드랍` (requirements.md §4, v3 §1.4).
- `source='import'` "Jira Imported" badge (requirements.md §4) is **out of scope for this audit** — it is informational metadata, not a VOC domain badge. It will use an existing pattern (e.g., `OutlineChip`) when implemented.

---

## §2. Archetype set — 3 for VOC

### §2.1 TextMark

**Purpose:** Semantic color signal with no chip container. Content is the signal — the absence of a background keeps table rows visually quiet.

**Visual spec:**

- Height: `--chip-height-sm` (20px)
- Padding: `0` (no horizontal padding — text sits flush in the cell; icon gap handled by gap token)
- Background: none
- Border: none
- Border-radius: n/a
- Font-size: `--chip-font-size-sm` (11.5px) — metadata tier (uidesign.md §7 Table Typography)
- Gap (icon↔text): `--chip-gap` (4px)
- Font-weight: **fixed per variant** — callsite cannot override

**Props:**

```ts
interface TextMarkProps {
  variant: VocTypeVariant | VocPriorityVariant; // closed set, no free color prop
  iconMode: 'icon-only' | 'icon+text';
  icon: LucideIcon;
  label: string; // required even for icon-only (used as aria-label)
  size?: 'sm'; // VOC uses sm exclusively; md reserved for future
}
```

**Variants and color mapping:**

_Priority variants (VocPriorityBadge → TextMark):_
| Variant | Color token | Font-weight |
|---|---|---|
| `urgent` | `var(--status-red)` | 700 |
| `high` | `var(--status-orange)` | 600 |
| `medium` | `var(--text-tertiary)` | 400 |
| `low` | `var(--text-quaternary)` | 400 |

_Type variants (VocTypeBadge → TextMark) — see §3 for full icon+color mapping._

**Used by:** `VocPriorityBadge`, `VocTypeBadge`

---

### §2.2 OutlineChip

**Purpose:** Neutral labeled chip for dynamic content (tags). The `#` glyph icon signals "tag" universally. No semantic color — all instances use the same neutral brand-tinted appearance.

**Visual spec:**

- Height: `--chip-height-sm` (20px)
- Padding: `2px var(--chip-padding-x-sm)` → `2px 7px`
- Background: `var(--brand-bg)` (blue-tinted neutral, matches existing Tag Pill spec in uidesign.md §5)
- Border: `1px solid var(--brand-border)`
- Border-radius: `--chip-radius-pill` (9999px) — full pill
- Font-size: `--chip-font-size-sm` (11.5px)
- Gap: `--chip-gap` (4px)
- Font-weight: 600 (fixed)
- Color: `var(--accent)`

**Props:**

```ts
interface OutlineChipProps {
  label: string;
  icon?: LucideIcon | '#'; // '#' is a literal glyph, not a lucide icon
  size?: 'sm';
}
```

**Variants:** single neutral variant (no enum — OutlineChip is always brand-tinted for VOC tags)

**Used by:** `VocTagPill`

**Note:** This matches the existing "Tag Pill (Auto-tag)" spec in uidesign.md §5 exactly. The primitive formalizes what was already described there.

---

### §2.3 SolidChip

**Purpose:** Status indication with filled background + dot prefix. The filled container gives status strong visual weight; the dot reinforces color meaning for accessibility.

**Visual spec:**

- Height: `--chip-height-sm` (20px)
- Padding: `2px var(--chip-padding-x-sm)` → `2px 8px`
- Background: `var(--status-{slug}-bg)` (per-variant)
- Border: `1px solid var(--status-{slug}-border)` (per-variant)
- Border-radius: `--chip-radius-rounded` (4px) — rectangular, not pill
- Font-size: `--chip-font-size-sm` (11.5px)
- Gap: `--chip-gap` (4px)
- Font-weight: 600 (fixed)
- Color: `var(--status-{slug}-fg)` (per-variant)
- Dot: `--chip-dot-size` (6px) circle, same color as text (`currentColor`)

**Props:**

```ts
interface SolidChipProps {
  variant: VocStatusVariant; // 'received' | 'reviewing' | 'processing' | 'done' | 'drop'
  label: string;
  size?: 'sm';
}
```

**Variants and token mapping:**
| Variant | bg token | fg token | border token |
|---|---|---|---|
| `received` | `--status-received-bg` | `--status-received-fg` | `--status-received-border` |
| `reviewing` | `--status-reviewing-bg` | `--status-reviewing-fg` | `--status-reviewing-border` |
| `processing` | `--status-processing-bg` | `--status-processing-fg` | `--status-processing-border` |
| `done` | `--status-done-bg` | `--status-done-fg` | `--status-done-border` |
| `drop` | `--status-drop-bg` | `--status-drop-fg` | `--status-drop-border` |

All tokens already exist in `frontend/src/styles/index.css` (shipped in C-1 and Phase B violet move).

**Used by:** `VocStatusBadge`

---

### §2.4 Why no 4th archetype? (closed-set proof)

The 4 VOC badges decompose exhaustively into 3 archetypes:

| Property            | TextMark                 | OutlineChip                   | SolidChip                    |
| ------------------- | ------------------------ | ----------------------------- | ---------------------------- |
| Has background fill | No                       | Translucent (brand-bg)        | Yes (semantic)               |
| Has border          | No                       | Yes (neutral brand-border)    | Yes (semantic)               |
| Icon semantics      | Domain-specific (lucide) | Structural glyph (`#`)        | Dot only                     |
| Color signal        | Text color = semantic    | Neutral (always brand-tinted) | Bg+border+fg trio = semantic |
| Closed set?         | Yes (enum-driven)        | No (dynamic strings)          | Yes (enum-driven)            |

No VOC badge needs a 4th archetype because:

1. There is no case requiring **filled background + domain icon** (which would be a 4th type). Type uses icon-only with no fill. Status uses fill with dot only.
2. **CountPill** (filled solid-brand background, number-only) has no VOC use case. Deferred to other-page audit (공지, FAQ, 휴지통 등 — see §6).
3. A hypothetical "FilledIconChip" would combine SolidChip + TextMark properties, but no current VOC badge requires this combination.

---

## §3. Type icon mapping (v1 fixed)

VOC type is stored in `voc_types` table with a user-customizable `color` field (hex). However, **icon mapping is FE-only** — the DB has no icon column. v1 icons are fixed below; v2 will move to a 유형관리 admin page where users can customize icons (deferred — see §6).

The `voc_types` seed data contains 4 initial values (requirements.md §4: `버그/기능 요청/개선 제안/문의`). Icon assignment uses lucide-react (confirmed icon library: frontend/CLAUDE.md, requirements.md §3).

**Color tokens** are chosen from the existing `--status-*` and `--text-*` token set. No new tokens are introduced for type icons — the TextMark archetype uses `color` (text color only, no background).

| Type name | slug (inferred)   | Lucide icon             | Icon rationale                                | Color token            | TextMark font-weight |
| --------- | ----------------- | ----------------------- | --------------------------------------------- | ---------------------- | -------------------- |
| 버그      | `bug`             | `Bug`                   | Direct semantic match; universally understood | `var(--status-red)`    | 600                  |
| 기능 요청 | `feature-request` | `Sparkles`              | Suggests new capability / enhancement         | `var(--accent)`        | 500                  |
| 개선 제안 | `improvement`     | `Wrench`                | Tool/fix connotation, distinct from feature   | `var(--status-green)`  | 500                  |
| 문의      | `inquiry`         | `MessageCircleQuestion` | Question/inquiry, direct semantic match       | `var(--text-tertiary)` | 400                  |

**Autonomous decision notes:**

- `버그` → `var(--status-red)`: red is already established as "urgent/error" in this system. Bug = error signal. Consistent with `--status-red` usage for Urgent priority.
- `기능 요청` → `var(--accent)` (Samsung Blue): new capability requests align with positive/brand intent.
- `개선 제안` → `var(--status-green)`: improvement is a constructive/positive signal, green is already the "done/active work" color in the system.
- `문의` → `var(--text-tertiary)`: inquiry is neutral/passive — the lowest visual weight is appropriate.
- `iconMode = 'icon-only'` for type (brief spec): the VOC list is already visually dense. Type is an identity signal, not primary metadata — icon-only saves column space while `aria-label` preserves accessibility.

---

## §4. Token sharing strategy

### §4.1 New `--chip-*` shared tokens

These tokens are added to `frontend/src/styles/index.css` `:root` block and documented in uidesign.md §13 (new Badge System section). They are shared between all primitives AND interactive components (FilterChip, SortControl) via CSS only — no shared component code.

| Token                   | Value    | Used by                                      | Notes                                                         |
| ----------------------- | -------- | -------------------------------------------- | ------------------------------------------------------------- |
| `--chip-height-sm`      | `20px`   | TextMark, OutlineChip, SolidChip, FilterChip | Consistent row-height budget for all badge/chip types         |
| `--chip-padding-x-sm`   | `7px`    | OutlineChip, SolidChip                       | Horizontal padding inside chip container; TextMark uses 0     |
| `--chip-radius-pill`    | `9999px` | OutlineChip, FilterChip                      | Full pill — matches existing Tag Pill in uidesign.md §5       |
| `--chip-radius-rounded` | `4px`    | SolidChip                                    | Rectangular — matches existing Status Badge in uidesign.md §5 |
| `--chip-font-size-sm`   | `11.5px` | TextMark, OutlineChip, SolidChip, FilterChip | Metadata tier (uidesign.md §7 VOC List Typography Tiers)      |
| `--chip-gap`            | `4px`    | TextMark, OutlineChip, SolidChip             | Gap between icon and text                                     |
| `--chip-dot-size`       | `6px`    | SolidChip                                    | Status dot diameter — matches existing spec in uidesign.md §5 |

**Total: 7 new tokens.** Per §5.1 precedent policy (`wave-1-6-phase-c-precedent.md`): ≤3 leaf tokens can be added inside a component PR; ≥4 requires a Phase B addendum. **7 tokens → these must ship in a dedicated Phase B addendum PR (B-add-2), separate from C-2.6 implementation.** (See §7 acceptance criteria.)

### §4.2 Reused existing tokens (no change)

| Token                                      | Already defined in                 | Used by                               |
| ------------------------------------------ | ---------------------------------- | ------------------------------------- |
| `--status-{slug}-bg/fg/border` (×5 sets)   | `index.css` (C-1 + Phase B violet) | SolidChip via VocStatusBadge          |
| `--status-red`, `--status-orange`          | `index.css` (Phase B, C-2)         | TextMark via VocPriorityBadge         |
| `--text-tertiary`, `--text-quaternary`     | `index.css` (original)             | TextMark via VocPriorityBadge         |
| `--brand-bg`, `--brand-border`, `--accent` | `index.css` (original)             | OutlineChip via VocTagPill            |
| `--status-green`                           | `index.css` (original)             | TextMark via VocTypeBadge (개선 제안) |

---

## §5. Interactive components — out of scope, principle only

### §5.1 Separation principle

| Dimension             | Primitive (TextMark / OutlineChip / SolidChip) | Interactive (FilterChip / SortControl)           |
| --------------------- | ---------------------------------------------- | ------------------------------------------------ |
| HTML element          | `<span>`                                       | `<button>`                                       |
| ARIA                  | none beyond element semantics                  | `role="button"`, `aria-pressed` where applicable |
| Hover state           | none                                           | background shift, cursor: pointer                |
| Active state          | none                                           | `transform: scale(0.94)`                         |
| Focus ring            | none                                           | `box-shadow: 0 0 0 3px var(--brand-bg)`          |
| Shared with primitive | CSS dimension tokens only (`--chip-*`)         | —                                                |

### §5.2 Forbidden patterns

- `interactive?: boolean` prop on any primitive — forbidden. Interactive behavior requires a separate component.
- Wrapping a `<span>` primitive in an `onClick` handler at the callsite — forbidden. Use a dedicated interactive component.
- Sharing color tokens between primitive active states and interactive hover states — forbidden. They have different semantic meanings.

### §5.3 FilterChip and SortControl

Out of scope for this audit. They share `--chip-*` dimension tokens with primitives (height, padding, font-size, gap, radius) but are entirely separate components with their own color/state logic. Spec is deferred to the filter UI work phase (§6).

---

## §6. Deferred decisions (explicit tracking)

| Decision                      | Trigger condition                                           | Target phase / doc                                                       |
| ----------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| 유형 아이콘 사용자 커스텀     | 유형관리 admin page 구현 시점                               | v2 / TBD — `voc_types` table will need an `icon` column or FE config map |
| CountPill archetype 추가 여부 | 다른 페이지 audit (공지/FAQ/휴지통/사이드바 카운트 등) 시점 | 별도 audit doc (post Wave 1.6)                                           |
| FilterChip 구현 상세          | filter UI 작업 phase                                        | TBD — shares `--chip-*` tokens, separate PR                              |
| SortControl 구현 상세         | sort UI 작업 phase                                          | TBD                                                                      |
| "Jira Imported" source badge  | `source='import'` UI 구현 시점 (requirements.md §4)         | OutlineChip 사용 예정 — 구현 PR에서 확정                                 |
| `voc_types.icon` DB 컬럼 추가 | v2 유형관리 admin page 기획 확정 시                         | migration + API 확장 PR                                                  |
| `md` size variant 개방 여부   | VOC 외 다른 페이지에서 bigger badge 필요 시                 | 별도 audit에서 확정                                                      |

---

## §7. Acceptance criteria for downstream phases

### C-2.5 (this PR — audit doc)

- [ ] 이 문서 사용자 승인
- [ ] B-add-2 (7개 `--chip-*` 토큰) 계획 wave-1-6-voc-parity.md §7.2에 삽입

### B-add-2 (새 Phase B addendum — `--chip-*` 토큰 PR)

- [ ] 7개 `--chip-*` 토큰이 `frontend/src/styles/index.css` `:root`에 추가됨
- [ ] uidesign.md §13 Badge System 섹션이 동시 갱신됨
- [ ] 토큰 lint 통과 (`grep -rE '#[0-9a-fA-F]{3,8}\b' src/` → 0 hits outside token definition)

### C-2.6 (Primitive Implementation + existing wrapper refactor)

- C-2.6 implementer reads this doc → can implement primitive layer + refactor existing wrappers without further questions
- Specifically:
  - [ ] `TextMark`, `OutlineChip`, `SolidChip` primitives created under `frontend/src/shared/ui/badge/` (or equivalent shared location)
  - [ ] `VocStatusBadge` refactored to call `SolidChip` internally (no external behavior change)
  - [ ] `VocPriorityBadge` refactored to call `TextMark` internally (no external behavior change)
  - [ ] `VocTypeBadge` created, calls `TextMark` with §3 icon mapping
  - [ ] All existing `VocStatusBadge` and `VocPriorityBadge` tests remain green
  - [ ] B-add-2 must be merged before C-2.6 (tokens must exist before primitives reference them)

### C-3 (VocTagPill)

- [ ] C-3 implementer builds `VocTagPill` as an `OutlineChip` wrapper using §2.2 spec
- [ ] `OutlineChip` primitive shipped in C-2.6 — C-3 cannot start until C-2.6 lands

### C-4 (VocSubRow)

- [ ] C-4 implementer reuses existing wrappers (`VocStatusBadge`, `VocPriorityBadge`, `VocTypeBadge`) — no new badge types
- [ ] No new archetypes introduced in C-4

---

## §8. Cross-references

- Precedent C1.D1~D6 + per-leaf checklist: `docs/specs/plans/wave-1-6-phase-c-precedent.md`
- Wave 1.6 batch plan (updated in this PR): `docs/specs/plans/wave-1-6-voc-parity.md` §7.2
- Design system tokens: `docs/specs/requires/uidesign.md` §10 (CSS Reference), §12 (Token Architecture), §13 (Badge System — added in this PR)
- Existing status tokens: `frontend/src/styles/index.css` lines ~104–230
- Existing wrapper implementations: `frontend/src/components/voc/VocStatusBadge.tsx`, `VocPriorityBadge.tsx`
- CLAUDE.md design-system rule: no hex/raw OKLCH outside `:root` token block
- requirements.md §4 voc_types: initial seed 버그/기능 요청/개선 제안/문의
