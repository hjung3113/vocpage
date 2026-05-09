# Wave 4 FE Visual Review Verdict

**Date:** 2026-05-09
**Branch:** feat/wave-4-fe
**Reviewer:** executor agent (automated visual review)

---

## Reference Summary

Reference: `servey_Remix App.html` capture (1440×900).

Key visual patterns from reference:

- 2-col card grid at 1440px viewport
- Status badge top-right of each card
- Filter tabs (진행중/완료/대기) below page header
- Filter + sort controls top-right
- "+ 새 설문" primary button top-right
- Content area has ~24px left/right padding with max-width cap (~1200px)
- Sidebar: WORKSPACE section + ADMIN section with clear label hierarchy
- Card elevation: subtle border + bg-panel; no hard shadow
- Typography: bold Korean title in card header, subdued metadata below

---

## Captured

| Screen             | Path                            |
| ------------------ | ------------------------------- |
| /notice (user)     | `captures/voc-notice.png`       |
| /faq (user)        | `captures/voc-faq.png`          |
| /notice?mode=admin | `captures/voc-notice-admin.png` |
| /faq?mode=admin    | `captures/voc-faq-admin.png`    |

Viewport: 1440×900, fullPage=true. Dev server from `feat/wave-4-fe` worktree with MSW fixture data.

---

## Findings

### P0 — Must Fix

**P0-1: Content area has no max-width container — rows span full ~1220px**

Both Notice and FAQ pages render list rows that extend to the full available content width (~1220px at 1440px viewport), with no max-width cap. The `/voc` page applies a content wrapper; these new pages do not. At 1440px, notice row titles are extremely long single lines — poor readability and inconsistent with the rest of the app.

Spec reference: uidesign.md §10 — `max-width ~1200px`. The content area already constrains to ~1220px inside the sidebar, but the page-level wrapper should add inner padding (`px-6` or `px-8`) consistent with `/voc`.

Action: wrap Notice and FAQ page content in a `max-w-[900px]` or match the VOC page's content-width convention.

---

### P1 — Should Fix

**P1-1: Page header visual weight missing — no separator or background band**

The page header (title + count + action buttons) sits directly above the list with no visual separation. In the reference, the header has a distinct band (light bg or border-bottom) separating it from content. Both `/voc` and the servey reference use a header divider. Notice and FAQ pages lack this, making the header blend into the list.

Action: Add `border-b border-[color:var(--border-standard)] pb-3 mb-1` to the header `<header>` element, consistent with `/voc` page's header pattern.

**P1-2: Inline 노출 checkbox in admin rows is low contrast and unstylable**

The admin mode rows show a native `<input type="checkbox">` with text "노출" using `text-xs text-[color:var(--text-secondary)]`. Native checkboxes are not token-styled and appear inconsistent with the button row controls. In the reference, toggle controls use styled switch components or icon-buttons.

Action: Replace with a styled toggle or use the existing Switch component from the design system, keeping the `data-testid` attribute.

**P1-3: Admin mode "삭제" button (destructive variant) is visually too prominent for inline table use**

The solid-red destructive button appears in every row in admin mode, creating a wall of red. The reference uses subtle ghost/icon actions in table rows, with destructive confirmation in a modal. The current implementation is functionally correct but visually aggressive for a list context.

Action: Change `variant="destructive"` to `variant="ghost"` with `text-[color:var(--danger)]` class, or use an icon-only button with tooltip. Destructive action confirmed via dialog (spec §10.3.4 may address this).

---

### P2 — Polish

**P2-1: FAQ category chip styling is `bg-elevated` — visually invisible on light background**

Category chips (e.g. "계정·로그인", "VOC 등록") use `bg-[color:var(--bg-elevated)]` which on the default light theme renders near-white, making the chip boundaries invisible. A subtle `bg-[color:var(--bg-panel)]` with `border border-[color:var(--border-muted)]` would be more legible.

**P2-2: Urgent sidebar badge circles overlap the icon in a visually crowded way**

The red "!" badge on the 공지사항 sidebar item is correctly present, but at small size it overlaps the Megaphone icon making both hard to read. Consider `top-0 right-0` absolute positioning on the icon container to avoid occlusion.

**P2-3: FAQ search input border token is correct but height inconsistency**

The FAQ search input uses `h-9` and `border-[color:var(--border-standard)]` — consistent with other inputs. No token violation. Minor: the search bar is at full content-width instead of being capped at ~400px, which makes it visually heavy on a 1200px content area. Consider `max-w-[400px]` on the search input.

**P2-4: TODO(security) DOMPurify comment in NoticeRow and FaqRow**

Both `NoticeRow.tsx:95` and `FaqRow.tsx:136` have `// TODO(security): wrap with DOMPurify` comments in production-bound code. These are legitimate security notes but should be tracked as issues, not left as inline TODOs.

---

## Token Discipline Audit

All inspected components pass:

- `LevelBadge.tsx`: uses `var(--status-blue)`, `var(--status-amber)`, `var(--status-red)`, `var(--bg-elevated)` — no hex
- `NoticeRow.tsx`: all colors via `var(--*)` or Tailwind token classes — no hex
- `FaqRow.tsx`: uses `var(--mark-bg)`, `var(--bg-elevated)`, `var(--border-standard)`, `var(--text-*)` — no hex
- `FaqItemsView.tsx` (search input): uses `var(--border-standard)`, `var(--bg-app)`, `var(--text-primary)` — no hex

**Token discipline: PASS. Zero hex or raw OKLCH values detected in production source.**

---

## Sidebar Fit

- 공지사항 entry in sidebar: PASS — item present with correct icon (Megaphone)
- Urgent badge: PASS — red "!" badge renders when urgent notice exists (긴급 fixture)
- FAQ entry: PASS — HelpCircle icon, correct label
- Admin sidebar section: PASS — appears only in admin mode

---

## Status Badge Style

- 긴급 (urgent): red pill — matches `var(--status-red)` — PASS
- 중요 (important): amber/orange pill — matches `var(--status-amber)` — PASS
- 일반 (normal): blue pill — uses `var(--status-blue)` — PASS (blue for "normal" is an intentional design choice per `LevelBadge.tsx`)

---

## Card / Accordion Rhythm

- Notice: inline expand on title click; body rendered in a bordered `bg-surface` panel — consistent with VOC detail expand pattern
- FAQ: accordion Q-click expand; answer in same bordered panel — consistent
- Row separation: `border-b border-[color:var(--border-standard)]` — matches VOC table row pattern

---

## Page Header Alignment

- Admin mode: title (공지사항/FAQ) + count left, "읽기 모드" + "+ 등록" right — correct per spec §10.5.1
- User mode: title + count only; no action buttons — correct
- `justify-between` flex layout detected — correct alignment

---

## Approval Status

**request-changes**

Two P0/P1 structural issues must be resolved before merge:

1. **P0-1**: Add content max-width wrapper with consistent inner padding to Notice and FAQ pages
2. **P1-1**: Add header visual separator to match VOC page header pattern

The P1-2 and P1-3 items are strongly recommended but can be addressed in a follow-up if timeline is tight. Token discipline is clean — no regressions on the color system.
