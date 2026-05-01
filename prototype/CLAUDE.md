# prototype/CLAUDE.md

Static HTML prototypes for visual exploration. Read root `CLAUDE.md` first for cross-cutting governance.

## Purpose

This directory is a **visual sandbox** for design reviews — dashboard mockups, widget experiments, layout studies. Outputs feed into `docs/specs/requires/uidesign.md` (정본) — 활성 리뷰는 `docs/specs/reviews/`, 완료된 것은 `docs/specs/reviews/done/`.

## Throwaway Scope

- Prototype HTML is **not** production code. Do not wire it to backend APIs.
- When a prototype graduates to implementation, the real version goes into `frontend/` — the prototype stays as a reference snapshot.
- No bundler / no transpile. The prototype loads as static HTML with `<link>` to split CSS files under `css/` and classic `<script>` tags loading modules under `js/` (Stage A-2 / A-4 split, see `docs/specs/plans/done/prototype-phase7-wave3-plan.md`).
- `package.json` exists only for Playwright-driven smoke verification (`scripts/`); no app-level build step.

## Layout

- `prototype.html` — single entry document (~929 lines, intentionally not split further).
- `css/` — split modules (`admin/`, `components/`, `layout/`); each file ≤500 lines.
- `js/` — 16+ modules; data exposed on `window` via explicit aliases in `data.js` (classic-script gotcha — `const NOTICES` etc. don't auto-attach).
- `screenshots/` — captured reference snapshots.
- `scripts/` — Playwright + tooling helpers.

## Preview

Open `prototype.html` directly in a browser, or serve the directory:

```bash
npx http-server prototype -p 8080
```

## Design Tokens (authoritative — echoed here because this is a rendered visual surface)

Full reference: `docs/specs/requires/uidesign.md §10 CSS Reference`. Every color, spacing, and typography value must go through a CSS custom property:

- **Background (OKLCH, blue-tinted):** `var(--bg-app)` / `var(--bg-panel)` / `var(--bg-surface)` / `var(--bg-elevated)`
- **Brand accent (Samsung Blue):** `var(--brand)` / `var(--accent)` / `var(--accent-hover)` — **never the old Linear indigo `#5e6ad2`**
- **Text:** `var(--text-primary)` / `var(--text-secondary)` / `var(--text-tertiary)` / `var(--text-quaternary)`
- **Typography:** Pretendard Variable (UI), D2Coding (code/issue IDs)
- **Spacing:** 8px grid base; max content width ~1200px
- **Elevation:** via background opacity (`rgba(255,255,255,0.05)`) — multi-layer shadow only for dialogs

**Hard rule:** **never hardcode hex or raw OKLCH values** in prototype HTML. If a token doesn't exist, add it to `uidesign.md` first, then use it here. A prototype with hex values silently drifts from the real design system.

## graphify

After modifying prototype HTML files, run `graphify update .` from the project root to keep the knowledge graph current.
