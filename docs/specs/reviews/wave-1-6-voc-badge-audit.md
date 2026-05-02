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

| #   | Badge               | Archetype   | Variant enum                   | iconMode                       | Size | Dynamic?                                                                 | Source file (current)                              | Ship status   |
| --- | ------------------- | ----------- | ------------------------------ | ------------------------------ | ---- | ------------------------------------------------------------------------ | -------------------------------------------------- | ------------- |
| 1   | 유형 (Type)         | TextMark    | per type slug (4 v1 values)    | `icon-only`                    | `sm` | static enum (admin-managed, user-customizable in v2)                     | `VocTypeBadge` (new — C-2.6)                       | new           |
| 2   | 태그 (Tag)          | OutlineChip | `tag` (single neutral variant) | `icon+text` (icon = `#` glyph) | `sm` | dynamic (admin + user adds tags)                                         | `VocTagPill` (new — C-3)                           | new           |
| 3   | 상태 (Status)       | SolidChip   | per status slug (5 values)     | `dot+text`                     | `sm` | static enum (5 values, locked per requirements.md §1.4 + plan §C1.D1~D6) | `frontend/src/components/voc/VocStatusBadge.tsx`   | shipped (C-1) |
| 4   | 우선순위 (Priority) | TextMark    | per priority value (4 values)  | `icon+text`                    | `sm` | static enum                                                              | `frontend/src/components/voc/VocPriorityBadge.tsx` | shipped (C-2) |

**Notes:**

- `VocTypeBadge` does not yet exist; it is a C-2.6 deliverable.
- Tags are dynamic strings, not a closed enum. The `OutlineChip` primitive handles them uniformly.
- Status has exactly 5 values (접수/검토중/처리중/완료/드랍) — locked per requirements.md §1.4. `보류` was renamed to `드랍` in-place; there is no 6th deprecated value. The 6 C1.D-series entries (D1~D6) are decisions, not enum values. Authoritative slug source: `frontend/src/components/voc/VocStatusBadge.tsx` → `received|reviewing|processing|done|drop`.
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

> **VocTypeBadge dynamic type contract:** `VocTypeBadge` accepts a single-shape prop (`slug: string; name: string; color?: string`) rather than a discriminated union. When `slug` matches a v1 known value (`bug|feature-request|improvement|inquiry`), the component uses the fixed icon+color mapping from §3. When `slug` does not match, it falls through to the unknown-type fallback (see §3 below). This single shape is preferred over a discriminated union because: (1) callsites always have a DB row with both `slug` and `name` available — no callsite needs to distinguish "known vs unknown" in its own code, and (2) the union form would require callsites to predicate on `VocTypeVariant` membership before constructing props, leaking domain knowledge upward.
>
> ```ts
> // VocTypeBadge-specific prop shape (not part of generic TextMarkProps):
> interface VocTypeBadgeProps {
>   slug: string; // from voc_types.slug — known seed slugs use fixed mapping; others hit fallback
>   name: string; // from voc_types.name — used as aria-label and tooltip for all cases
>   color?: string; // admin-set hex — deferred to v2 (intentionally ignored in v1, see §3)
> }
> ```

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
- Padding: `2px var(--chip-padding-x-sm)` → `2px 8px`
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
- Border-radius: `--chip-radius-pill` (9999px) — full pill, matches existing shipped `.status-badge` visual (`frontend/src/styles/index.css` L184)
- Font-size: `--chip-font-size-sm` (11.5px)
- Gap: `--chip-gap` (4px)
- Font-weight: 600 (fixed)
- Color: `var(--status-{slug}-fg)` (per-variant)
- Dot: `--chip-dot-size` (6px) circle, same color as text (`currentColor`)

> **Radius note:** SolidChip uses pill radius (`var(--chip-radius-pill)`) to match the existing shipped `.status-badge` visual (`frontend/src/styles/index.css` L184: `border-radius: 9999px`). The earlier `--chip-radius-rounded` (4px) entry was incorrect — the §2.4 rationale ("pill = tag/dynamic, rounded = state/closed-enum") is updated below to reflect this correction.

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

| Property            | TextMark                 | OutlineChip                   | SolidChip                     |
| ------------------- | ------------------------ | ----------------------------- | ----------------------------- |
| Has background fill | No                       | Translucent (brand-bg)        | Yes (semantic, opaque)        |
| Has border          | No                       | Yes (neutral brand-border)    | Yes (semantic)                |
| Border-radius       | n/a                      | `--chip-radius-pill` (9999px) | `--chip-radius-pill` (9999px) |
| Icon semantics      | Domain-specific (lucide) | Structural glyph (`#`)        | Dot only                      |
| Color signal        | Text color = semantic    | Neutral (always brand-tinted) | Bg+border+fg trio = semantic  |
| Closed set?         | Yes (enum-driven)        | No (dynamic strings)          | Yes (enum-driven)             |

For the 4 VOC badges enumerated in §1, no 4th archetype is required:

1. There is no case requiring **filled background + domain icon** (which would be a 4th type). Type uses icon-only with no fill. Status uses fill with dot only.
2. **CountPill** (filled solid-brand background, number-only) has no VOC use case. Deferred to other-page audit (공지, FAQ, 휴지통 등 — see §6). When CountPill is added in a future audit, it will be a **new 4th archetype**, not a variant of OutlineChip/SolidChip — its filled-brand-bg + number-only + full-pill shape overlaps both existing archetypes' shape but doesn't fit either's color or content semantics. Documenting this prevents pressure to shoehorn it later.
3. A hypothetical "FilledIconChip" would combine SolidChip + TextMark properties, but no current VOC badge requires this combination.

**Pre-existing non-VOC patterns that may require future archetype expansion:**

- Role Pill (now uidesign.md §14.3 after P0-1 renumber): outlined pill with per-role color — not currently a primitive archetype candidate for VOC scope.
- Notice Severity Badge (now §14.6.1): outlined chip with 3-tier severity color — not in VOC scope.
- If v2 admin extends icon-customization to status (parallel to the v2 type-icon plan in §6), the SolidChip archetype must be re-audited as it may pull in a 4th "filled+custom-icon" pattern.

**Why OutlineChip and SolidChip are separate archetypes and not one chip with `variant='outline'|'solid'`:**

- Both archetypes use pill radius (`9999px`) — radius is therefore NOT the differentiating axis between them. The separation is entirely on the color-source axis.
- Color-source axis differs: OutlineChip is single-neutral (always brand-tinted regardless of content), SolidChip is per-domain-enum (color driven by variant, three tokens: bg + fg + border). Merging forces callsites to reason on both fill and color axes simultaneously.
- Background fill differs: OutlineChip is translucent brand-bg; SolidChip is opaque semantic bg. Same radius, fundamentally different visual weight and semantic intent.
- Merging would force callsites to specify both fill strategy and color source, defeating the wrapper-encapsulation goal of this audit.

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

**Unknown / admin-created type fallback (v1):**

When `slug` does not match a v1 known value (`bug|feature-request|improvement|inquiry`), `VocTypeBadge` renders:

- icon: `Tag` (lucide)
- color token: `--text-tertiary`
- tooltip: `name` (admin-set)

This contract is testable: a non-seed slug must render the fallback icon, not throw or return empty. Required acceptance test in C-2.6 (see §7).

**Type icon — admin color override:**

- v1 type icon uses `--status-*` / `--text-*` tokens; admin-set `voc_types.color` (hex) is intentionally NOT applied to the icon in v1 to preserve table density and color consistency. Re-evaluation in v2 alongside icon customization.

**Type variant TS union:**

```ts
// Known seed slugs — used internally by VocTypeBadge for fixed icon+color mapping.
// VocTypeBadge's public prop is { slug: string; name: string; color?: string } — NOT this union.
// Callsites never import VocTypeVariant; it is an implementation detail of VocTypeBadge.
export type VocTypeVariant = 'bug' | 'feature-request' | 'improvement' | 'inquiry';
```

**Status and priority variant TS unions** (source: `frontend/src/components/voc/VocStatusBadge.tsx` → `frontend/src/lib/voc-status-slug.ts` → `shared/contracts/voc/entity.ts`; `frontend/src/components/voc/VocPriorityBadge.tsx` → `shared/contracts/voc/entity.ts`):

```ts
export type VocStatusVariant = 'received' | 'reviewing' | 'processing' | 'done' | 'drop';
export type VocPriorityVariant = 'urgent' | 'high' | 'medium' | 'low';
```

---

## §3.2 Priority icon mapping (v1 fixed)

Verified from `frontend/src/components/voc/VocPriorityBadge.tsx` (icons) and `frontend/src/styles/index.css` (color tokens).

| Priority | Lucide icon   | Color token              | Font-weight | Source                                        |
| -------- | ------------- | ------------------------ | ----------- | --------------------------------------------- |
| `urgent` | `Flame`       | `var(--status-red)`      | 700         | preserved from current `VocPriorityBadge.tsx` |
| `high`   | `ChevronUp`   | `var(--status-orange)`   | 600         | preserved                                     |
| `medium` | `Minus`       | `var(--text-tertiary)`   | 400         | preserved                                     |
| `low`    | `ChevronDown` | `var(--text-quaternary)` | 400         | preserved                                     |

These icon+color assignments are **ratified** as of C-2 (VocPriorityBadge shipped, tests green). No change required for C-2.6 wrapper refactor — the TextMark primitive receives them via `VocPriorityBadge`'s internal mapping.

---

**Autonomous decision notes:**

- `버그` → `var(--status-red)`: red is already established as "urgent/error" in this system. Bug = error signal. Consistent with `--status-red` usage for Urgent priority.
- `기능 요청` → `var(--accent)` (Samsung Blue): new capability requests align with positive/brand intent.
- `개선 제안` → `var(--status-green)`: improvement is a constructive/positive signal, green is already the "done/active work" color in the system.
- `문의` → `var(--text-tertiary)`: inquiry is neutral/passive — the lowest visual weight is appropriate.
- `iconMode = 'icon-only'` for type (brief spec): the VOC list is already visually dense. Type is an identity signal, not primary metadata — icon-only saves column space while `aria-label` preserves accessibility.

---

## §4. Token sharing strategy

### §4.1 New `--chip-*` shared tokens

These tokens are added to `frontend/src/styles/index.css` `:root` block and documented in uidesign.md §13 (new Badge System section — note: §14 is the Admin·Notice·FAQ section renumbered in this review iteration). They are shared between all primitives AND interactive components (FilterChip, SortControl) via CSS only — no shared component code.

| Token                   | Value    | Used by                                         | Notes                                                                                                                                        |
| ----------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `--chip-height-sm`      | `20px`   | TextMark, OutlineChip, SolidChip, FilterChip    | Consistent row-height budget for all badge/chip types                                                                                        |
| `--chip-padding-x-sm`   | `8px`    | OutlineChip, SolidChip                          | Horizontal padding inside chip container; TextMark uses 0. Reconciled to match shipped `VocStatusBadge` (`index.css:183` `padding: 2px 8px`) |
| `--chip-radius-pill`    | `9999px` | OutlineChip, SolidChip, FilterChip              | Full pill — matches existing Tag Pill (uidesign.md §5) and shipped `.status-badge` (`index.css` L184)                                        |
| `--chip-radius-rounded` | `4px`    | (reserved — no current VOC archetype uses this) | Rectangular — available for future archetypes (e.g. CountPill or notice chips); not used by any v1 badge                                     |
| `--chip-font-size-sm`   | `11.5px` | TextMark, OutlineChip, SolidChip, FilterChip    | Metadata tier (uidesign.md §7 VOC List Typography Tiers)                                                                                     |
| `--chip-gap`            | `4px`    | TextMark, OutlineChip, SolidChip                | Gap between icon and text                                                                                                                    |
| `--chip-dot-size`       | `6px`    | SolidChip                                       | Status dot diameter — matches existing spec in uidesign.md §5                                                                                |

**Total: 7 new tokens.** Per §5.1 precedent policy (`wave-1-6-phase-c-precedent.md`): ≤3 leaf tokens can be added inside a component PR; ≥4 requires a Phase B addendum. **7 tokens → these must ship in a dedicated Phase B addendum PR (B-add-2), separate from C-2.6 implementation.** (See §7 acceptance criteria.)

> **§12.1 SSOT gap (partially closed):** B-add-2 closes the SSOT gap for chip tokens by writing to `tokens.ts` first and mirroring to `index.css :root` in the same PR. Broader `--status-*` token migration (and remaining hand-authored `:root` tokens) remains a separate follow-up tracked in §6 Deferred decisions.

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

| Decision                                                                                                | Trigger condition                                           | Target phase / doc                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 유형 아이콘 사용자 커스텀                                                                               | 유형관리 admin page 구현 시점                               | v2 admin custom type → tooltip + icon + color all admin-set; the unknown fallback contract added in v1 already provides the prop shape (`slug: string; name: string; color?: string`), only the _resolution_ (admin DB → icon registry) needs to be wired in v2. `voc_types` table will need an `icon` column or FE config map. |
| CountPill archetype 추가 여부                                                                           | 다른 페이지 audit (공지/FAQ/휴지통/사이드바 카운트 등) 시점 | 별도 audit doc (post Wave 1.6)                                                                                                                                                                                                                                                                                                  |
| FilterChip 구현 상세                                                                                    | filter UI 작업 phase                                        | TBD — shares `--chip-*` tokens, separate PR                                                                                                                                                                                                                                                                                     |
| SortControl 구현 상세                                                                                   | sort UI 작업 phase                                          | TBD                                                                                                                                                                                                                                                                                                                             |
| "Jira Imported" source badge                                                                            | `source='import'` UI 구현 시점 (requirements.md §4)         | OutlineChip 사용 예정 — 구현 PR에서 확정                                                                                                                                                                                                                                                                                        |
| `voc_types.icon` DB 컬럼 추가                                                                           | v2 유형관리 admin page 기획 확정 시                         | migration + API 확장 PR                                                                                                                                                                                                                                                                                                         |
| `md` size variant 개방 여부                                                                             | VOC 외 다른 페이지에서 bigger badge 필요 시                 | 별도 audit에서 확정                                                                                                                                                                                                                                                                                                             |
| Migrate existing `--status-*` tokens (and remaining hand-authored `:root` tokens) into `tokens.ts` SSOT | Next token-touching PR after C-2.6                          | Separate refactoring PR (post-Wave 1.6)                                                                                                                                                                                                                                                                                         |

---

## §7. Acceptance criteria for downstream phases

### C-2.5 (this PR — audit doc)

- [ ] 이 문서 사용자 승인
- [ ] B-add-2 (7개 `--chip-*` 토큰) 계획 wave-1-6-voc-parity.md §7.2에 삽입

### B-add-2 (새 Phase B addendum — `--chip-*` 토큰 PR)

- [ ] 7개 `--chip-*` 토큰 값을 `frontend/src/tokens.ts` (SSOT)에 먼저 추가하고, 같은 PR에서 `index.css :root`에 CSS custom property로 미러링함. 두 파일의 값이 일치해야 함.
- [ ] 값 일치 검증: `grep -E 'chip' frontend/src/tokens.ts` 와 `grep -E '\-\-chip-' frontend/src/styles/index.css` 결과를 비교하여 7개 토큰이 양쪽에 동일한 값으로 존재함을 확인
- [ ] uidesign.md §13 Badge System 섹션이 동시 갱신됨
- [ ] 토큰 lint 통과 (`grep -rE '#[0-9a-fA-F]{3,8}\b' src/` → 0 hits outside token definition)
- [ ] Tag Pill (uidesign §5, L197/L209) and Filter Tab raw `9999px` literals → migrated to `var(--chip-radius-pill)` atomically in same PR. Confirmed literals: uidesign.md L197, L209 (tag pill / filter tab `border-radius: 9999px`)
- [ ] §5 Tag Pill spec text (uidesign.md L197) is updated in the same PR to reference `var(--chip-radius-pill)` rather than the raw `9999px` literal — the spec text and the implementation token must move together.

### C-2.6 (Primitive Implementation + existing wrapper refactor)

- C-2.6 implementer reads this doc → can implement primitive layer + refactor existing wrappers without further questions
- Specifically:
  - [ ] `TextMark`, `OutlineChip`, `SolidChip` primitives created under `frontend/src/shared/ui/badge/` (or equivalent shared location)
  - [ ] `VocStatusBadge` refactored to call `SolidChip` internally (no external behavior change)
  - [ ] `VocPriorityBadge` refactored to call `TextMark` internally (no external behavior change)
  - [ ] `VocTypeBadge` created, calls `TextMark` with §3 icon mapping
  - [ ] All existing `VocStatusBadge` and `VocPriorityBadge` tests remain green
  - [ ] B-add-2 must be merged before C-2.6 (tokens must exist before primitives reference them)
  - [ ] ESLint `no-restricted-imports` rule (or path-based equivalent) blocks `frontend/src/features/voc/**` from importing badge primitives directly — all badge access must go through wrapper barrel
  - [ ] CI grep guard: `grep -rE 'interactive\??\s*:\s*boolean' frontend/src/shared/ui/badge/` returns 0 hits

#### Migration delta — VocPriorityBadge

| Axis        | Current                                                          | Target                                                                  |
| ----------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Font-weight | Tailwind classes (`font-bold` / `font-semibold` / `font-normal`) | TextMark with numeric font-weight via token (700 / 600 / 400 / 400)     |
| Icon        | Direct lucide imports + `className` styling inside wrapper       | TextMark receives `icon` + `variant` props; wrapper passes them through |
| Color       | CSS class `.p-{priority}` resolved in `index.css`                | TextMark resolves color from `variant` prop internally                  |

Tests to keep green (from `VocPriorityBadge.test.tsx` — 5 tests total):

1. `renders priority=urgent with label Urgent, icon flame, weight class font-bold`
2. `renders priority=high with label High, icon chevron-up, weight class font-semibold`
3. `renders priority=medium with label Medium, icon minus, weight class font-normal`
4. `renders priority=low with label Low, icon chevron-down, weight class font-normal`
5. `does not leak inline style (lint hard rule)`

#### Migration delta — VocStatusBadge

| Axis      | Current                                                  | Target                                                                      |
| --------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| Container | Minimal `<span>` with `.status-badge.s-{slug}` CSS class | SolidChip wrapper with `variant` prop                                       |
| Dot       | `<span className="status-dot">` child element            | SolidChip owns the dot rendering internally                                 |
| Color     | CSS class `.s-{slug}` resolved in `index.css`            | SolidChip resolves color from `variant` prop via `--status-{slug}-*` tokens |

Tests to keep green (from `VocStatusBadge.test.tsx` — 6 tests total):

1. `renders 접수 with class s-received, Korean label text, status-dot child, and aria-label`
2. `renders 검토중 with class s-reviewing, Korean label text, status-dot child, and aria-label`
3. `renders 처리중 with class s-processing, Korean label text, status-dot child, and aria-label`
4. `renders 완료 with class s-done, Korean label text, status-dot child, and aria-label`
5. `renders 드랍 with class s-drop, Korean label text, status-dot child, and aria-label`
6. `does not leak inline color/background style (lint hard rule)`

#### TDD RED-phase spec

**`data-testid` convention:**

- Primitives: `text-mark-{variant}`, `outline-chip-{variant}`, `solid-chip-{variant}`
- Wrappers: existing testids preserved — `priority-badge-{slug}`, `status-badge-{slug}`

**DOM structure:**

- All primitives render a `<span>` element
- No `role` attribute (natural `<span>` semantics)
- `aria-label` is required when `iconMode='icon-only'` (TextMark only)
- Icon child carries `aria-hidden="true"`

**Behavioral assertions (RED phase must fail on these before GREEN):**

- `variant` prop maps to correct color token: assert via `className` regex matching `p-{variant}` / `s-{slug}` or computed style assertion
- Icon presence matches `iconMode`: `icon-only` → icon present, no text rendered; `icon+text` → both present; `dot+text` → dot child present
- No `onClick` handler attached to any primitive `<span>`
- No inline `style` attribute leaks (existing `does not leak inline style` tests preserved)
- **VocTypeBadge unknown slug fallback:** `<VocTypeBadge slug="custom-foo" name="Custom Foo" />` → assert `data-testid="text-mark-unknown"`, lucide `Tag` icon present, color = `var(--text-tertiary)` (does not throw, does not render empty)

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
- Design system tokens: `docs/specs/requires/uidesign.md` §10 (CSS Reference), §12 (Token Architecture), §13 (Badge System — added in C-2.5 PR), §14 (Admin·Notice·FAQ Components — renumbered from old §13 in iter-1 review)
- Existing status tokens: `frontend/src/styles/index.css` lines ~104–230
- Existing wrapper implementations: `frontend/src/components/voc/VocStatusBadge.tsx`, `VocPriorityBadge.tsx`
- CLAUDE.md design-system rule: no hex/raw OKLCH outside `:root` token block
- requirements.md §4 voc_types: initial seed 버그/기능 요청/개선 제안/문의
- Priority icon+color source: `frontend/src/components/voc/VocPriorityBadge.tsx` + `frontend/src/styles/index.css` L247–258
- Status slug source: `frontend/src/components/voc/VocStatusBadge.tsx` + `frontend/src/lib/voc-status-slug.ts`
