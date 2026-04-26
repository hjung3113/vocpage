# VOCpage Design System

> **Revision history**: Initial Linear-inspired indigo palette → Samsung Blue palette + automatic system theme sync, fully overhauled (2025.06)

---

## 1. Core Philosophy

VOCpage's design language is inspired by **Samsung Galaxy / One UI**'s corporate blue palette. As an internal enterprise tool, it communicates trust and precision, and automatically follows the user's **system theme preference (light/dark).**

**3 keywords**: Precise · Trustworthy · Structured

- **Single chromatic color**: Samsung Blue is the only saturated color. Everything else is blue-tinted neutral.
- **Bidirectional theming**: Dark and light modes are equally beautiful and accessible.
- **OKLCH palette**: Ensures perceptually uniform color hierarchy.
- **Information density with breathing room**: Function before decoration. Table UI is the core interface — but every element needs sufficient padding to breathe. Density ≠ cramped. Aim for clear visual hierarchy through whitespace, not just color.
- **Visual hierarchy through contrast**: Page title, section headers, body text, and metadata must each occupy a distinct visual weight tier. Equal-weight layouts feel flat and hard to scan.

---

## 2. Theme System

### Automatic Theme Switching

Uses CSS `color-scheme: light dark` and `light-dark()` to **automatically detect browser/OS settings**. No manual theme toggle — respects system preferences.

```css
:root {
  color-scheme: light dark;
  --bg-app: light-dark(light-value, dark-value);
}
```

### Dark Mode

Deep blue-black canvas with Samsung Blue accents. Optimized for office night-shift work.

### Light Mode

Clean corporate look on blue-tinted white. Similar to the light version of Galaxy app UI.

---

## 3. Color Palette (OKLCH)

> Why OKLCH: perceptually uniform — equal lightness steps look equal visually. No chroma-lightness interference like HSL.

### Background Layers

| Role         | Light                    | Dark                     | Usage           |
| ------------ | ------------------------ | ------------------------ | --------------- |
| **App Base** | `oklch(98% 0.007 252)`   | `oklch(11% 0.016 264)`   | Lowest canvas   |
| **Panel**    | `oklch(96.5% 0.009 255)` | `oklch(14.5% 0.019 262)` | Sidebar, panels |
| **Surface**  | `oklch(100% 0 0)`        | `oklch(18.5% 0.021 260)` | Cards, drawer   |
| **Elevated** | `oklch(95% 0.011 256)`   | `oklch(23% 0.022 258)`   | Hover, popups   |

> **Principle**: All backgrounds must be micro-tinted with blue hue (250–268). Pure white/black forbidden.

### Text Hierarchy

| Role           | Light                  | Dark                     | Usage                |
| -------------- | ---------------------- | ------------------------ | -------------------- |
| **Primary**    | `oklch(18% 0.026 267)` | `oklch(95.5% 0.007 252)` | Headings, emphasis   |
| **Secondary**  | `oklch(36% 0.022 264)` | `oklch(79% 0.014 255)`   | Body, labels         |
| **Tertiary**   | `oklch(54% 0.016 260)` | `oklch(59% 0.012 258)`   | Supporting info      |
| **Quaternary** | `oklch(68% 0.010 258)` | `oklch(43% 0.010 260)`   | Timestamps, inactive |

### Samsung Blue — Brand Color

OKLCH palette inspired by Samsung's signature deep blue (`#1428A0`):

| Role             | Light                  | Dark                   | Usage                          |
| ---------------- | ---------------------- | ---------------------- | ------------------------------ |
| **Brand**        | `oklch(40% 0.22 265)`  | `oklch(63% 0.19 258)`  | Primary CTA, logo, emphasis    |
| **Accent**       | `oklch(47% 0.23 262)`  | `oklch(70% 0.21 255)`  | Links, active states           |
| **Accent Hover** | `oklch(35% 0.22 268)`  | `oklch(76% 0.18 252)`  | Hover state                    |
| **Brand BG**     | `oklch(93% 0.025 258)` | `oklch(22% 0.035 262)` | Tag backgrounds, selected rows |
| **Brand Border** | `oklch(80% 0.045 260)` | `oklch(35% 0.060 260)` | Tag borders, focus ring        |

> **Rule**: Samsung Blue is reserved for CTA, active states, tags, and focus rings only. No decorative use.

### Borders

| Role         | Light                  | Dark                          | Usage                         |
| ------------ | ---------------------- | ----------------------------- | ----------------------------- |
| **Subtle**   | `oklch(88% 0.012 254)` | `oklch(20% 0.018 261 / 0.8)`  | Row dividers, weak boundaries |
| **Standard** | `oklch(83% 0.016 256)` | `oklch(27% 0.020 259 / 0.85)` | Cards, inputs, drawer         |
| **Solid**    | `oklch(83% 0.016 256)` | `oklch(25% 0.019 260)`        | Button borders                |

### Status Colors

Status colors prioritize meaning over theme:

| Status      | Color      | OKLCH                        | Usage               |
| ----------- | ---------- | ---------------------------- | ------------------- |
| Received    | Quaternary | Uses text hierarchy          | Initial receipt     |
| In Review   | Blue       | `oklch(67% 0.17 240)` (dark) | Review in progress  |
| In Progress | Green      | `oklch(55% 0.17 150)`        | Active work         |
| Done        | Emerald    | `oklch(62% 0.19 158)`        | Completed           |
| On Hold     | Amber      | `oklch(70% 0.16 72)`         | Suspended           |
| Urgent      | Red        | `oklch(58% 0.22 25)`         | High-priority alert |

---

## 4. Typography

### Font Family

**Pretendard Variable** — geometric sans-serif optimized for Korean and Latin simultaneously. Similar feel to Samsung One UI typeface, Korean-optimized.

```css
--font-ui:
  'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo',
  sans-serif;
--font-mono: 'D2Coding', 'SF Mono', 'Menlo', ui-monospace, monospace;
```

CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css`

> Changed from Inter Variable + Berkeley Mono. Pretendard handles Korean character rendering optimally.

### Type Scale

| Role    | Size    | Weight  | Usage                                       |
| ------- | ------- | ------- | ------------------------------------------- |
| Display | 32px    | 700     | Rarely used                                 |
| Heading | 20–24px | 700     | Section titles                              |
| Title   | 15px    | 700     | **Page header title**, card/drawer headings |
| Body UI | 14px    | 400     | Default body text                           |
| Label   | 13px    | 400–600 | Table cells, form labels                    |
| Caption | 11–12px | 400–600 | Metadata, dates                             |
| Micro   | 10–11px | 600     | Badges, tags, uppercase labels              |

**Core principles**:

- Fixed px scale for app UI (fluid clamp is for marketing pages)
- Korean text: `line-height: 1.65–1.75` (0.1–0.15 higher than Latin)
- Uppercase labels: `letter-spacing: 0.06–0.08em` for legibility
- Monospace: D2Coding only for issue codes and code blocks

---

## 5. Components

### Buttons

**Primary (Samsung Blue)**

```css
background: var(--brand);
color: #ffffff;
border-radius: 8px;
padding: 7px 14px;
font-weight: 600;
```

**Ghost**

```css
background: var(--bg-surface);
border: 1px solid var(--border-solid);
border-radius: 8px;
padding: 6px 11px;
```

**Icon Button**

```css
width: 32px;
height: 32px;
border-radius: 8px;
border: 1px solid var(--border-subtle);
background: var(--bg-surface);
```

### Input & Select

```css
background: var(--bg-elevated);
border: 1px solid var(--border-standard);
border-radius: 8px;
padding: 9px 12px;
/* Focus */
border-color: var(--brand);
box-shadow: 0 0 0 3px var(--brand-bg);
```

### Tag Pill (Auto-tag)

```css
background: var(--brand-bg);
border: 1px solid var(--brand-border);
color: var(--accent);
border-radius: 9999px;
font-size: 11.5px;
font-weight: 600;
```

### Filter Tab (Status Quick-filter)

Pill-style tabs on the VOC list page — not generic `<select>`, not full buttons.

```css
/* base */
padding: 5px 12px 5px 10px;
border-radius: 9999px;
font-size: 13px;
font-weight: 500;
border: 1px solid var(--border-subtle);
background: transparent;
color: var(--text-tertiary);
transition:
  background 0.12s,
  border-color 0.12s,
  color 0.12s,
  box-shadow 0.12s cubic-bezier(0.16, 1, 0.3, 1);

/* active */
background: var(--brand-bg);
border-color: var(--brand-border);
color: var(--accent);
font-weight: 600;
box-shadow: 0 0 0 1px var(--brand-border); /* double-ring: intentional active signal */
```

- Active state uses double-ring (border + box-shadow outline) — unambiguous, not just a color tint
- Inactive pills are `transparent` — they recede and let active state dominate
- Press feedback: `transform: scale(0.94)` on `:active`
- Filterbar height: `44px` — deliberately secondary to topbar's `56px`
- Filter tab row: `height: 44px; padding: 0 var(--sp-5)` — distinct zone between topbar and list header

### Status Badge

Full pill style — background + border + text color, all semantic. Not dot-only.

| Status | BG (dark)             | Text (dark)           | Border (dark)         |
| ------ | --------------------- | --------------------- | --------------------- |
| 접수됨 | `bg-elevated`         | `text-quaternary`     | `border-subtle`       |
| 검토중 | `oklch(20% 0.06 240)` | `oklch(67% 0.17 240)` | `oklch(30% 0.09 240)` |
| 처리중 | `oklch(18% 0.06 150)` | `oklch(55% 0.17 150)` | `oklch(28% 0.09 150)` |
| 완료   | `oklch(18% 0.06 158)` | `oklch(62% 0.19 158)` | `oklch(28% 0.10 158)` |
| 보류   | `oklch(20% 0.06 72)`  | `oklch(70% 0.16 72)`  | `oklch(30% 0.09 72)`  |

```css
/* shared pill shell */
font-size: 11.5px;
font-weight: 600;
padding: 2px 8px;
border-radius: 4px;
display: inline-flex;
align-items: center;
gap: 5px;
```

- Always use both dot AND colored text — never dot-only (accessibility)
- Status dot: 6px circle, same color as text
- Status badge is metadata tier: **11.5px** (not 13px — see Typography Tiers below)

### Priority Badge

- Icon (arrow up/down/dash) + text combination
- Urgent: `oklch(58% 0.22 25)` (red) — icon + `font-weight: 700`
- High: `oklch(60% 0.18 45)` (orange-red) — `font-weight: 600`
- Medium: `var(--text-tertiary)` — `font-weight: 400`
- Low: `var(--text-quaternary)` — `font-weight: 400`
- `font-size: 11.5px` — metadata tier, weight carries the semantic signal

### Card & Container

Used **only for floating layers**: modal, drawer, notification panel.

```css
background: var(--bg-surface);
border: 1px solid var(--border-subtle);
border-radius: 8px; /* standard */ /* 12px: drawer, modal */
```

> **Do not** wrap page-level content (tables, lists, accordions) in cards. Page content always uses flat full-width layout. See §7 Layout Patterns.

### Sidebar Navigation Items

```css
/* base */
padding: 10px 12px;
border-radius: 6px;
font-size: 13.5px;
font-weight: 400;
color: var(--text-secondary);
display: flex;
align-items: center;
gap: 8px;

/* hover */
background: var(--bg-elevated);
color: var(--text-primary);

/* active (current page) */
background: var(--brand-bg);
color: var(--accent);
font-weight: 600;
```

- Count badge on nav items: `font-size: 11px; font-weight: 700; background: var(--brand); color: #fff; border-radius: 9999px; padding: 1px 6px`
- Active state must be visually unambiguous — background fill, not just color change

### Page Header

**Single component** for all pages — VOC, Notices, FAQ, Admin. `.topbar` and `.admin-topbar` must follow identical spec.

```css
height: 56px;
padding: 0 24px;
border-bottom: 1px solid var(--border-subtle);
/* Title */
font-size: 15px;
font-weight: 700;
color: var(--text-primary);
letter-spacing: -0.2px;
```

**Page count badge** (e.g., "12개" next to page title):

```css
font-size: 13px;
font-weight: 400;
color: var(--text-tertiary);
margin-left: 6px;
```

The count badge deliberately uses tertiary text color — supporting metadata, not the title itself.

> Diverging heights or title styles between pages misaligns the top border line across page transitions. Reuse the component class — never hard-code values per page.

### Load-more Button

Used when a list has paginated items (e.g., "7개 항목 더 보기 / 5 / 12개 표시 중").

```css
/* wrapper: centered row, separated from last data row */
display: flex;
flex-direction: column;
align-items: center;
gap: 4px;
padding: 16px 0 8px;
border-top: 1px solid var(--border-subtle);

/* primary text */
font-size: 13.5px;
font-weight: 600;
color: var(--accent);
cursor: pointer;

/* secondary meta (e.g., "5 / 12개 표시 중") */
font-size: 12px;
font-weight: 400;
color: var(--text-quaternary);
```

- Must have `border-top` to visually anchor it to the list — without it the button floats orphaned in whitespace
- Never use a full-width button style here — inline text link treatment fits better in a flat list layout

### Admin Table & Form

Management page components. **Always use classes — never inline `style=`.**

| Element            | Class                              | Usage                              |
| ------------------ | ---------------------------------- | ---------------------------------- |
| Table              | `.admin-table`                     | Row dividers, unified header style |
| Inline add form    | `.admin-add-form` + `.aform-field` | Collapsible form above table       |
| Action button      | `.a-btn`                           | Edit, view — secondary actions     |
| Destructive action | `.a-btn.danger`                    | Delete, disable                    |
| Count badge        | `.section-count-badge`             | Item count in page header          |

---

## 6. Shadows (Elevation)

Dark backgrounds suppress shadows — light/dark are separately optimized:

```css
--shadow-sm: light-dark(oklch(70% 0.04 260 / 0.1) 0 1px 3px, oklch(5% 0.01 265 / 0.4) 0 1px 3px);
--shadow-md: light-dark(
  oklch(65% 0.05 260 / 0.12) 0 4px 16px,
  oklch(5% 0.01 265 / 0.55) 0 4px 16px
);
--shadow-dialog: light-dark(
  oklch(60% 0.06 260 / 0.14) 0 12px 40px,
  oklch(5% 0.01 265 / 0.7) 0 12px 40px
);
```

**Dark mode**: Blue-black deep shadows for depth  
**Light mode**: Blue-tinted soft shadows (pure gray shadows forbidden)

---

## 7. Layout

### Spacing (4pt scale)

```
--sp-1: 4px   --sp-2: 8px   --sp-3: 12px
--sp-4: 16px  --sp-5: 24px  --sp-6: 32px
```

### Key Dimensions

- **Sidebar width**: 222px
- **Drawer width**: 528px
- **Max content width**: ~1200px (whole app layout)
- **Table row height**: 52px (body), 32px (header) — 20px gap creates unambiguous chrome vs content hierarchy
- **Filterbar height**: 44px — secondary zone, intentionally shorter than the 56px topbar
- **Page header height**: 56px — identical across VOC, Admin, Notices, FAQ
- **Sidebar logo area height**: 56px — must match page header exactly so the top edge of sidebar and main area are flush

### VOC List Typography Tiers

Three distinct tiers for scannable information density:

| Tier             | Elements                         | Size    | Weight  | Color                           |
| ---------------- | -------------------------------- | ------- | ------- | ------------------------------- |
| **1 — Content**  | VOC title                        | 13px    | 510     | `text-primary`                  |
| **2 — Metadata** | Status, priority, assignee, date | 11.5px  | varies  | semantic / `text-tertiary`      |
| **3 — Identity** | Issue code, tag pills            | 11–12px | 500–600 | `text-tertiary` / muted neutral |

- **Tag pills in rows**: neutral background (`bg-elevated`), muted text (`text-quaternary`) — they must not compete with content titles
- **Assignee avatars**: muted steel/teal/violet (not brand blue) to differentiate from brand accent
- **Dates**: `font-variant-numeric: tabular-nums` for column alignment

### Sidebar Spacing

- **Nav item padding**: `10px 12px` (vertical 10px gives breathing room without wasting space)
- **Section label**: `font-size: 11px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text-quaternary); padding: 16px 12px 6px` — clear visual anchor for each group
- **Gap between sidebar sections**: `8px` minimum spacing between the last item of one group and the label of the next
- **Section label purpose**: Acts as a visual divider — must have enough top padding (≥14px) to feel separate from the preceding nav group

### Content Width Policy

All page content areas expand freely with screen width. No per-page `max-width` constraint on the content body.

> For admin forms where readability benefits from narrower width, constrain at the individual form element level — never on the page body itself.

### Layout Patterns: Flat vs Card

VOCpage uses **two distinct layout patterns**:

| Pattern                     | When to use                   | Examples                                |
| --------------------------- | ----------------------------- | --------------------------------------- |
| **Flat / Full-width**       | All page-level content        | VOC list, Notices, FAQ, all Admin pages |
| **Card (elevated surface)** | UI that floats above the page | Modal, drawer, notification panel       |

**Why flat for page-level content**: Wrapping page tables or lists inside a card container creates a visually boxed, inset feel — content appears disconnected from the page flow. The VOC list is the primary UX reference: rows extend edge-to-edge, separated only by `border-bottom: 1px solid var(--border-subtle)`. All other pages (Admin, Notices, FAQ) follow this exact pattern.

**Card misuse symptom**: if a table or accordion sits inside a bordered, rounded box with a different background color, it is using the wrong pattern.

### Table Column Grid (VOC)

```css
grid-template-columns: 22px 144px 1fr 115px 108px 84px 96px;
/* toggle | issue ID | title | status | assignee | priority | date */
```

---

## 8. Do's and Don'ts

### Do

- Use `color-scheme: light dark` + `light-dark()` for automatic theme switching
- Define palette with OKLCH for perceptual uniformity
- Micro-tint all backgrounds with blue hue (250–268), chroma 0.007–0.025
- Reserve Samsung Blue for CTA, focus, and active states only
- Use Pretendard Variable for all Korean/Latin UI text
- Use flat full-width layout for all page-level tables, lists, and accordions
- Give table rows enough vertical padding (≥10px top/bottom) so content breathes
- Differentiate sidebar section labels clearly from nav items — size, weight, color, and top spacing all contribute
- Use varied font weight and size across hierarchy tiers — page title, section header, body, metadata must each feel distinct
- Show filter tab active state with both background color AND border change — not just one

### Don't

- Use pure `#000000` / `#ffffff` — always use blue-tinted values
- Use Samsung Blue decoratively (background patterns, section dividers)
- Use `border-left` color stripes on cards or list items
- Use gradient text (`background-clip: text`)
- Apply identical spacing everywhere — use rhythmic spacing
- Treat light mode as a simple color inversion of dark mode — design separately
- Use inline `style=` instead of component classes — use `.a-btn`, `.admin-add-form`, `.aform-field`, etc.
- Hard-code per-page `height`, `font-size`, `font-weight` — reuse Page Header component
- Wrap page-level tables or lists in card containers — card is for floating UI only
- Set table row height below 48px — cramped rows hurt scannability regardless of information density goals
- Use `bg-elevated` for row hover — use brand-tinted OKLCH value for premium hover feel
- Make page title the same visual weight as body text — it must anchor the page
- Place filter tabs and table header with zero gap between them — they are separate UI zones

---

## 9. Accessibility

- All text: WCAG AA or higher (4.5:1 normal text, 3:1 large text)
- Focus indicator: `box-shadow: 0 0 0 3px var(--brand-bg)` required on all interactive elements
- Status indicators: never convey state by color alone — always pair with text or icon
- `prefers-reduced-motion`: all transitions and animations must be disabled via `@media (prefers-reduced-motion: reduce)` — also guard JS-triggered animations with `window.matchMedia('(prefers-reduced-motion: reduce)').matches`
- Accordion/expand animations: use `grid-template-rows: 0fr → 1fr` instead of `max-height` to avoid layout-property animation jank
- Row entrance: staggered `opacity + translateY` with 28ms per-row delay; skip entirely under reduced-motion
- Standard easing: `cubic-bezier(0.16, 1, 0.3, 1)` (exponential ease-out) — used consistently across all transitions

---

## 10. CSS Reference

Full token set — copy into `:root` as the single source of truth.

```css
:root {
  color-scheme: light dark;

  /* Backgrounds */
  --bg-app: light-dark(oklch(98% 0.007 252), oklch(11% 0.016 264));
  --bg-panel: light-dark(oklch(96.5% 0.009 255), oklch(14.5% 0.019 262));
  --bg-surface: light-dark(oklch(100% 0 0), oklch(18.5% 0.021 260));
  --bg-elevated: light-dark(oklch(95% 0.011 256), oklch(23% 0.022 258));

  /* Text */
  --text-primary: light-dark(oklch(18% 0.026 267), oklch(95.5% 0.007 252));
  --text-secondary: light-dark(oklch(36% 0.022 264), oklch(79% 0.014 255));
  --text-tertiary: light-dark(oklch(54% 0.016 260), oklch(59% 0.012 258));
  --text-quaternary: light-dark(oklch(68% 0.01 258), oklch(43% 0.01 260));

  /* Brand (Samsung Blue) */
  --brand: light-dark(oklch(40% 0.22 265), oklch(63% 0.19 258));
  --accent: light-dark(oklch(47% 0.23 262), oklch(70% 0.21 255));
  --accent-hover: light-dark(oklch(35% 0.22 268), oklch(76% 0.18 252));
  --brand-bg: light-dark(oklch(93% 0.025 258), oklch(22% 0.035 262));
  --brand-border: light-dark(oklch(80% 0.045 260), oklch(35% 0.06 260));

  /* Borders */
  --border-subtle: light-dark(oklch(88% 0.012 254), oklch(20% 0.018 261 / 0.8));
  --border-standard: light-dark(oklch(83% 0.016 256), oklch(27% 0.02 259 / 0.85));
  --border-solid: light-dark(oklch(83% 0.016 256), oklch(25% 0.019 260));

  /* Shadows */
  --shadow-sm: light-dark(0 1px 3px oklch(70% 0.04 260 / 0.1), 0 1px 3px oklch(5% 0.01 265 / 0.4));
  --shadow-md: light-dark(
    0 4px 16px oklch(65% 0.05 260 / 0.12),
    0 4px 16px oklch(5% 0.01 265 / 0.55)
  );
  --shadow-dialog: light-dark(
    0 12px 40px oklch(60% 0.06 260 / 0.14),
    0 12px 40px oklch(5% 0.01 265 / 0.7)
  );

  /* Spacing */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 24px;
  --sp-6: 32px;

  /* Typography */
  --font-ui:
    'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo',
    sans-serif;
  --font-mono: 'D2Coding', 'SF Mono', 'Menlo', ui-monospace, monospace;

  /* Chart colors (dashboard) */
  --chart-blue: oklch(63% 0.19 258); /* new VOC, primary series */
  --chart-sky: oklch(72% 0.14 235); /* in-progress */
  --chart-emerald: oklch(62% 0.19 158); /* completed */
  --chart-amber: oklch(70% 0.16 72); /* on-hold, warning */
  --chart-red: oklch(58% 0.22 25); /* urgent, negative */
  --chart-teal: oklch(65% 0.16 195); /* auxiliary */
  --chart-indigo: oklch(55% 0.17 270); /* auxiliary */

  /* Status colors — badges, indicators, admin UI */
  --status-green: oklch(55% 0.17 150); /* admin active indicator */
  --status-amber: oklch(70% 0.16 72); /* on-hold badge, role-manager */
  --status-red: oklch(58% 0.22 25); /* urgent, form required */
  --status-blue: light-dark(oklch(50% 0.18 242), oklch(67% 0.17 240)); /* info */
  --status-purple: light-dark(oklch(52% 0.22 290), oklch(72% 0.16 290)); /* regex tag-rule */

  --status-amber-bg: light-dark(oklch(94% 0.025 72), oklch(18% 0.05 72));
  --status-amber-border: light-dark(oklch(78% 0.09 72), oklch(30% 0.09 72));
  --status-red-bg: light-dark(oklch(94% 0.03 25), oklch(18% 0.07 25));
  --status-red-border: light-dark(oklch(78% 0.1 25), oklch(30% 0.1 25));
  --status-purple-bg: light-dark(oklch(94% 0.025 290), oklch(18% 0.06 290));
  --status-purple-border: light-dark(oklch(78% 0.08 290), oklch(30% 0.09 290));

  /* Status dot colors — VOC list row indicator (matches status enum) */
  --status-dot-received: light-dark(oklch(60% 0.01 260), oklch(48% 0.01 260)); /* 접수됨 */
  --status-dot-reviewing: light-dark(oklch(48% 0.19 244), oklch(66% 0.18 242)); /* 검토중 */
  --status-dot-processing: light-dark(oklch(48% 0.17 152), oklch(64% 0.19 155)); /* 처리중 */
  --status-dot-done: light-dark(oklch(46% 0.19 155), oklch(63% 0.21 158)); /* 완료 */
  --status-dot-drop: light-dark(oklch(60% 0.18 70), oklch(70% 0.17 72)); /* 드랍 */
}
```

---

## 11. Dashboard Components

### 11.1 Filter Context Banner

```css
background: var(--brand-bg);
color: var(--brand);
border-bottom: 1px solid var(--brand-border);
padding: var(--sp-2) var(--sp-5);
font-size: 13px;
```

- Separator: `›` (U+203A)
- Hidden when at default state (level 1 tab + no assignee filter)

### 11.2 KPI Cards

Two rows: **VOLUME** and **QUALITY**. Row labels use `var(--text-quaternary)`, `11px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase`.

```css
/* Card base */
background: var(--bg-surface);
border: 1px solid var(--border-subtle);
border-radius: 8px;
padding: var(--sp-4);

/* Delta positive (improvement) */
color: oklch(62% 0.19 158);

/* Delta negative (regression) */
color: oklch(58% 0.22 25);

/* Note: avg resolution time delta is inverted — decrease = positive */
```

**Alert borders** (override standard border):

| Card               | Condition       | Border color                |
| ------------------ | --------------- | --------------------------- |
| Urgent·High 미해결 | count increased | `oklch(58% 0.22 25 / 0.35)` |
| 14일+ 미처리       | count increased | `oklch(70% 0.16 72 / 0.30)` |

### 11.3 Heatmap & Matrix Cell Gradient

Used by both the drilldown heatmap and the priority×status matrix.

```
cell background = oklch(63% 0.19 258 / α)
where α = lerp(0.06, 0.62, value / maxValue)
```

- Zero-value cells: `var(--bg-elevated)` background, display `—`, non-clickable.
- Table layout: `table-layout: fixed` + `colgroup` for stable column widths across X-axis changes.

### 11.4 Distribution Donut

- Size: 96×96px
- Technique: `conic-gradient` (no SVG/canvas)
- Center label: total count + `"총건수"` sub-label in `var(--text-tertiary)`
- Legend row: color dot · label · count · `%` · mini bar (proportional width, `var(--bg-elevated)` track)

**Color assignments by tab:**

| Tab      | Color source                                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 상태     | See §3 Status Colors                                                                                                         |
| 우선순위 | `--chart-red` / `oklch(60% 0.18 45)` / `var(--text-tertiary)` / `var(--text-quaternary)`                                     |
| 유형     | `voc_types.color` field                                                                                                      |
| 태그     | `--chart-blue` → `--chart-sky` → `--chart-red` → `--chart-amber` → `--chart-emerald` → `var(--text-tertiary)` (Top 6 + 기타) |

### 11.5 Weekly Trend Chart (3-line)

| Series               | Color token            | Data definition                                           |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| 신규 (new)           | `var(--chart-blue)`    | VOC created that week (`created_at`)                      |
| 진행중 (in-progress) | `var(--chart-sky)`     | Snapshot at Sunday 23:59 of that week                     |
| 완료 (done)          | `var(--chart-emerald)` | Transitioned to 완료/보류 that week (`status_changed_at`) |

- X-axis labels: W1–W12 (W1 = 12 weeks ago, W12 = current week; left → right = past → present)
- Legend: top-left, color line + label
- Period: always last 12 weeks, independent of the global date filter

### 11.6 Aging VOC Badge Colors

| Age        | Badge style                          |
| ---------- | ------------------------------------ |
| 14–29 days | `var(--chart-amber)` background tint |
| 30+ days   | `var(--chart-red)` background tint   |

---

## 12. Token Architecture

### 12.1 Single Source of Truth

All design tokens originate from `frontend/src/tokens.ts`. This file is the only place where raw values (hex, OKLCH, px) are allowed to appear.

```
tokens.ts  (raw values live here — only place hex/OKLCH is permitted)
    ├── tailwind.config.ts   → utility classes  (bg-brand, text-primary, …)
    └── CSS custom properties → var(--brand), var(--bg-app), …
```

Both Tailwind utilities and CSS vars are generated from `tokens.ts`. Editing a token in `tokens.ts` propagates to both surfaces automatically.

### 12.2 When to Use Tailwind Utilities vs CSS Vars

| Situation                                       | Use              | Example                                      |
| ----------------------------------------------- | ---------------- | -------------------------------------------- |
| Layout, spacing, flex, grid                     | Tailwind utility | `flex gap-2 px-4`                            |
| Static color on a standard element              | Tailwind utility | `bg-brand text-primary`                      |
| Dynamic color via JS (charts, Toast UI, canvas) | CSS var via JS   | `tokens.brand` imported from `tokens.ts`     |
| Inline style override in JSX                    | CSS var          | `style={{ color: 'var(--text-secondary)' }}` |
| Theme-aware color in custom CSS / `@apply`      | CSS var          | `color: var(--text-primary)`                 |

**Rule:** never write a raw hex or OKLCH value outside of `tokens.ts`. If a token does not exist for what you need, add it to `tokens.ts` + this file first, then use it.

### 12.3 Token File Structure

```ts
// frontend/src/tokens.ts
export const colors = {
  brand:        '#0f62fe',   // Samsung Blue
  bgApp:        'oklch(12% 0.01 250)',
  // …
} as const;

export const spacing = { … } as const;
export const fontSize = { … } as const;

// Re-export flat map for Tailwind config consumption
export default { colors, spacing, fontSize };
```

### 12.4 Enforcement

- **Stylelint `declaration-strict-value`** — rejects raw color/font values in `.css` / `.module.css` files; only `var(--*)` or Tailwind utility classes pass.
- **ESLint `no-restricted-syntax`** — rejects inline `style={{ color: '#...' }}` in JSX.
- **Pre-commit hook (husky + lint-staged)** — runs both linters; commit is rejected if violations exist.
- CI runs the same lint check and blocks merge on failure.

OS/browser dark mode setting automatically switches the entire theme.
