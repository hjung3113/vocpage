# prototype/CLAUDE.md

Static HTML prototypes for visual exploration. Read root `CLAUDE.md` first for cross-cutting governance.

## Purpose

This directory is a **visual sandbox** for design reviews — dashboard mockups, widget experiments, layout studies. Outputs feed into `docs/specs/requires/design.md` and `docs/specs/reviews/`.

## Throwaway Scope

- Prototype HTML is **not** production code. Do not wire it to backend APIs.
- When a prototype graduates to implementation, the real version goes into `frontend/` — the prototype stays as a reference snapshot.
- Do not add build tooling here. Plain HTML + `<style>` blocks + inline `<script>` only.

## Design Tokens (authoritative — echoed here because this is a rendered visual surface)

Full reference: `docs/specs/requires/design.md §10 CSS Reference`. Every color, spacing, and typography value must go through a CSS custom property:

- **Background (OKLCH, blue-tinted):** `var(--bg-app)` / `var(--bg-panel)` / `var(--bg-surface)` / `var(--bg-elevated)`
- **Brand accent (Samsung Blue):** `var(--brand)` / `var(--accent)` / `var(--accent-hover)` — **never the old Linear indigo `#5e6ad2`**
- **Text:** `var(--text-primary)` / `var(--text-secondary)` / `var(--text-tertiary)` / `var(--text-quaternary)`
- **Typography:** Pretendard Variable (UI), D2Coding (code/issue IDs)
- **Spacing:** 8px grid base; max content width ~1200px
- **Elevation:** via background opacity (`rgba(255,255,255,0.05)`) — multi-layer shadow only for dialogs
