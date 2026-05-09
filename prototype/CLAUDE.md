# prototype/CLAUDE.md

Static HTML prototypes for visual exploration. Read root `CLAUDE.md` first for cross-cutting governance.

## Purpose

This directory is a **visual sandbox** for design reviews — dashboard mockups, widget experiments, layout studies. Outputs feed into `docs/specs/requires/uidesign.md` (정본) — 활성 리뷰는 `docs/specs/reviews/`, 완료된 것은 `docs/specs/archive/reviews/`.

## Throwaway Scope

- Prototype HTML is **not** production code. Do not wire it to backend APIs.
- When a prototype graduates to implementation, the real version goes into `frontend/` — the prototype stays as a reference snapshot.
- No bundler / no transpile. The prototype loads as static HTML with `<link>` to split CSS files under `css/` and classic `<script>` tags loading modules under `js/` (Stage A-2 / A-4 split, see `docs/specs/archive/plans/prototype-phase7-wave3-plan.md`).
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

## Design Tokens

토큰 정의·use rule·hex/OKLCH 금지 룰은 root `CLAUDE.md` + `docs/specs/requires/uidesign.md` 정본을 그대로 따른다. 본 디렉토리는 rendered visual surface 라 토큰을 직접 소비하지만, 룰을 여기 복제하지 않는다.

## graphify

After modifying prototype HTML files, run `graphify update .` from the project root to keep the knowledge graph current.

## Sub-tree map

- `css/` — split modules (each ≤500 lines). Spec: `uidesign.md §10`. Tokens defined at top of the prototype CSS chain.
  - `css/admin/` — admin-page-only styles (tag rules, system menu, VOC type, users, notices, FAQ admin). Cross-page → `components/` or `layout/`.
  - `css/components/` — reusable component styles (cards, buttons, badges, drawers, modals, tables). Visual reference for an FE component being implemented.
  - `css/layout/` — app shell, grid, structural layout (navbar, sidebar, page frame proportions).
- `js/` — 16+ classic-script modules. Mock data (source of truth for prototype-driven UX) → `data.js`; data exposed on `window` via explicit aliases (classic-script gotcha — `const NOTICES` doesn't auto-attach). Stage A-2/A-4 split rationale → `docs/specs/archive/plans/prototype-phase7-wave3-plan.md`.
- `scripts/` — Playwright smoke verification + tooling helpers. Generated graph artifacts → `graphify-out/`.
