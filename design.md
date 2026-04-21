# VOCpage Design System

> **Revision history**: Initial Linear-inspired indigo palette → Samsung Blue palette + automatic system theme sync, fully overhauled (2025.06)

---

## 1. Core Philosophy

VOCpage's design language is inspired by **Samsung Galaxy / One UI**'s corporate blue palette. As an internal enterprise tool, it communicates trust and precision, and automatically follows the user's **system theme preference (light/dark).**

**3 keywords**: Precise · Trustworthy · Structured

- **Single chromatic color**: Samsung Blue is the only saturated color. Everything else is blue-tinted neutral.
- **Bidirectional theming**: Dark and light modes are equally beautiful and accessible.
- **OKLCH palette**: Ensures perceptually uniform color hierarchy.
- **Information density first**: Function before decoration. Table UI is the core interface.

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

| Role | Light | Dark | Usage |
|------|-------|------|-------|
| **App Base** | `oklch(98% 0.007 252)` | `oklch(11% 0.016 264)` | Lowest canvas |
| **Panel** | `oklch(96.5% 0.009 255)` | `oklch(14.5% 0.019 262)` | Sidebar, panels |
| **Surface** | `oklch(100% 0 0)` | `oklch(18.5% 0.021 260)` | Cards, drawer |
| **Elevated** | `oklch(95% 0.011 256)` | `oklch(23% 0.022 258)` | Hover, popups |

> **Principle**: All backgrounds must be micro-tinted with blue hue (250–268). Pure white/black forbidden.

### Text Hierarchy

| Role | Light | Dark | Usage |
|------|-------|------|-------|
| **Primary** | `oklch(18% 0.026 267)` | `oklch(95.5% 0.007 252)` | Headings, emphasis |
| **Secondary** | `oklch(36% 0.022 264)` | `oklch(79% 0.014 255)` | Body, labels |
| **Tertiary** | `oklch(54% 0.016 260)` | `oklch(59% 0.012 258)` | Supporting info |
| **Quaternary** | `oklch(68% 0.010 258)` | `oklch(43% 0.010 260)` | Timestamps, inactive |

### Samsung Blue — Brand Color

OKLCH palette inspired by Samsung's signature deep blue (`#1428A0`):

| Role | Light | Dark | Usage |
|------|-------|------|-------|
| **Brand** | `oklch(40% 0.22 265)` | `oklch(63% 0.19 258)` | Primary CTA, logo, emphasis |
| **Accent** | `oklch(47% 0.23 262)` | `oklch(70% 0.21 255)` | Links, active states |
| **Accent Hover** | `oklch(35% 0.22 268)` | `oklch(76% 0.18 252)` | Hover state |
| **Brand BG** | `oklch(93% 0.025 258)` | `oklch(22% 0.035 262)` | Tag backgrounds, selected rows |
| **Brand Border** | `oklch(80% 0.045 260)` | `oklch(35% 0.060 260)` | Tag borders, focus ring |

> **Rule**: Samsung Blue is reserved for CTA, active states, tags, and focus rings only. No decorative use.

### Borders

| Role | Light | Dark | Usage |
|------|-------|------|-------|
| **Subtle** | `oklch(88% 0.012 254)` | `oklch(20% 0.018 261 / 0.8)` | Row dividers, weak boundaries |
| **Standard** | `oklch(83% 0.016 256)` | `oklch(27% 0.020 259 / 0.85)` | Cards, inputs, drawer |
| **Solid** | `oklch(83% 0.016 256)` | `oklch(25% 0.019 260)` | Button borders |

### Status Colors

Status colors prioritize meaning over theme:

| Status | Color | OKLCH | Usage |
|--------|-------|-------|-------|
| Received | Quaternary | Uses text hierarchy | Initial receipt |
| In Review | Blue | `oklch(67% 0.17 240)` (dark) | Review in progress |
| In Progress | Green | `oklch(55% 0.17 150)` | Active work |
| Done | Emerald | `oklch(62% 0.19 158)` | Completed |
| On Hold | Amber | `oklch(70% 0.16 72)` | Suspended |
| Urgent | Red | `oklch(58% 0.22 25)` | High-priority alert |

---

## 4. Typography

### Font Family

**Pretendard Variable** — geometric sans-serif optimized for Korean and Latin simultaneously. Similar feel to Samsung One UI typeface, Korean-optimized.

```css
--font-ui: "Pretendard Variable", "Pretendard",
  -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif;
--font-mono: "D2Coding", "SF Mono", "Menlo", ui-monospace, monospace;
```

CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css`

> Changed from Inter Variable + Berkeley Mono. Pretendard handles Korean character rendering optimally.

### Type Scale

| Role | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 32px | 700 | Rarely used |
| Heading | 20–24px | 700 | Section titles |
| Title | 15px | 700 | **Page header title**, card/drawer headings |
| Body UI | 14px | 400 | Default body text |
| Label | 13px | 400–600 | Table cells, form labels |
| Caption | 11–12px | 400–600 | Metadata, dates |
| Micro | 10–11px | 600 | Badges, tags, uppercase labels |

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
width: 32px; height: 32px;
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
font-size: 11.5px; font-weight: 600;
```

### Status Badge
- Color dot (7px circle) + text combination
- No background fill — color applied to text and dot only

### Card & Container

Used **only for floating layers**: modal, drawer, notification panel.

```css
background: var(--bg-surface);
border: 1px solid var(--border-subtle);
border-radius: 8px;   /* standard */   /* 12px: drawer, modal */
```

> **Do not** wrap page-level content (tables, lists, accordions) in cards. Page content always uses flat full-width layout. See §7 Layout Patterns.

### Page Header

**Single component** for all pages — VOC, Notices, FAQ, Admin. `.topbar` and `.admin-topbar` must follow identical spec.

```css
height: 50px;
padding: 0 24px;
border-bottom: 1px solid var(--border-subtle);
/* Title */
font-size: 15px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.2px;
```

> Diverging heights or title styles between pages misaligns the top border line across page transitions. Reuse the component class — never hard-code values per page.

### Admin Table & Form

Management page components. **Always use classes — never inline `style=`.**

| Element | Class | Usage |
|---------|-------|-------|
| Table | `.admin-table` | Row dividers, unified header style |
| Inline add form | `.admin-add-form` + `.aform-field` | Collapsible form above table |
| Action button | `.a-btn` | Edit, view — secondary actions |
| Destructive action | `.a-btn.danger` | Delete, disable |
| Count badge | `.section-count-badge` | Item count in page header |

---

## 6. Shadows (Elevation)

Dark backgrounds suppress shadows — light/dark are separately optimized:

```css
--shadow-sm:     light-dark(oklch(70% 0.04 260 / 0.10) 0 1px 3px,  oklch(5% 0.01 265 / 0.40) 0 1px 3px);
--shadow-md:     light-dark(oklch(65% 0.05 260 / 0.12) 0 4px 16px, oklch(5% 0.01 265 / 0.55) 0 4px 16px);
--shadow-dialog: light-dark(oklch(60% 0.06 260 / 0.14) 0 12px 40px, oklch(5% 0.01 265 / 0.70) 0 12px 40px);
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
- **Table row height**: 40px (body), 34px (header)
- **Page header height**: 50px — identical across VOC, Admin, Notices, FAQ

### Content Width Policy

All page content areas expand freely with screen width. No per-page `max-width` constraint on the content body.

> For admin forms where readability benefits from narrower width, constrain at the individual form element level — never on the page body itself.

### Layout Patterns: Flat vs Card

VOCpage uses **two distinct layout patterns**:

| Pattern | When to use | Examples |
|---------|-------------|---------|
| **Flat / Full-width** | All page-level content | VOC list, Notices, FAQ, all Admin pages |
| **Card (elevated surface)** | UI that floats above the page | Modal, drawer, notification panel |

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

---

## 9. Accessibility

- All text: WCAG AA or higher (4.5:1 normal text, 3:1 large text)
- Focus indicator: `box-shadow: 0 0 0 3px var(--brand-bg)` required on all interactive elements
- Status indicators: never convey state by color alone — always pair with text or icon
- `prefers-reduced-motion`: transition disable media query to be applied

---

## 10. CSS Reference

```css
:root {
  color-scheme: light dark;

  --bg-app:       light-dark(oklch(98% 0.007 252), oklch(11% 0.016 264));
  --brand:        light-dark(oklch(40% 0.22 265),  oklch(63% 0.19 258));
  --brand-bg:     light-dark(oklch(93% 0.025 258), oklch(22% 0.035 262));
  --text-primary: light-dark(oklch(18% 0.026 267), oklch(95.5% 0.007 252));

  --font-ui: "Pretendard Variable", "Pretendard",
    -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif;
}
```

OS/browser dark mode setting automatically switches the entire theme.
