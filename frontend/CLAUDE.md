# frontend/CLAUDE.md

React SPA for the VOC management system. Read root `CLAUDE.md` first for cross-cutting governance.

## Status

Not yet scaffolded. This file is a spec stub — it captures architectural decisions so design-phase planning stays consistent.

## Commands (once scaffolded)

```bash
npm run dev                              # Vite dev server
npm run build                            # Production build
npm run test                             # Vitest
npm run test -- path/to/file.test.ts     # Single test file
```

## Architecture

- **Views:** VOC list (table with hierarchical accordion rows), side drawer for detail (preserves list context), modal for VOC creation with Toast UI rich text editor.
- **Key hooks:** `useVOCFilter`, `useAutoTag`, `useDrawer`.
- **State:** React Context or Redux for global filter/selection.
- **Base components:** Radix UI primitives — ghost buttons, translucent cards, border-focused inputs.

## Design Tokens (authoritative surface — echoed here because this is where UI is rendered)

Full reference: `docs/specs/requires/design.md §10 CSS Reference`. Use CSS custom properties only:

- **Background (OKLCH, blue-tinted):** `var(--bg-app)` / `var(--bg-panel)` / `var(--bg-surface)` / `var(--bg-elevated)`
- **Brand accent (Samsung Blue):** `var(--brand)` / `var(--accent)` / `var(--accent-hover)` — **do not use the old Linear indigo `#5e6ad2`**
- **Text:** `var(--text-primary)` / `var(--text-secondary)` / `var(--text-tertiary)` / `var(--text-quaternary)`
- **Typography:** Pretendard Variable (Korean + Latin UI), D2Coding (code blocks, issue IDs)
- **Spacing:** 8px grid base; max content width ~1200px
- **Elevation:** background opacity — `rgba(255,255,255,0.05)` for surfaces; multi-layer shadow reserved for dialogs

**Hard rule:** never write hex or raw OKLCH values in component CSS. Always go through a token. If a token doesn't exist for what you need, add it to `design.md` first.

## Safety Echoes (also in root)

- **No implementation without approval** — never write component code until the user explicitly says to start
- **Never push directly to main** — feature branch → PR → merge
- **Canonical docs live in `docs/specs/`** — not `.omc/plans/` or tool scratch dirs
