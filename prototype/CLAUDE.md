# prototype/CLAUDE.md

Static HTML visual sandbox — dashboard mockups, widget experiments, layout studies. Read root `CLAUDE.md` first.

**Not a reference (2026-05-09~):** `prototype/` is no longer a visual / behavior reference. No pixel / DOM / CSS citation. Implementation references are `requirements.md` + `uidesign.md` only. Active reviews → `docs/specs/reviews/`; archived → `docs/specs/archive/reviews/`. Token / typography / grid rules live in `uidesign.md` — not duplicated here.

**Throwaway scope:**

- Not production code. Do not wire to backend APIs.
- When a prototype graduates to implementation, the real version goes into `frontend/`; the prototype stays as a snapshot.
- No bundler / no transpile. Static HTML with `<link>` to split CSS under `css/` and classic `<script>` tags loading modules under `js/`.
- `package.json` exists only for Playwright smoke verification under `scripts/`. No app-level build.

## Preview

Open `prototype.html` directly, or serve the directory:

```bash
npx http-server prototype -p 8080
```

After modifying prototype files, run `graphify update .` from project root.

## Layout & Sub-tree map

- `prototype.html` — single entry document (~929 lines, intentionally not split further).
- `css/admin/` — admin-page-only styles (tag rules, system menu, VOC type, users, notices, FAQ admin). Cross-page → `components/` or `layout/`.
- `css/components/` — reusable component styles (cards, buttons, badges, drawers, modals, tables). Visual reference for an FE component being implemented.
- `css/layout/` — app shell, grid, structural layout (navbar, sidebar, page frame proportions). Each CSS file ≤500 lines.
- `js/` — 16+ classic-script modules. Mock data → `data.js`; data exposed on `window` via explicit aliases (classic-script gotcha — `const NOTICES` does not auto-attach).
- `screenshots/` — captured reference snapshots.
- `scripts/` — Playwright smoke verification + tooling helpers.
