# frontend/AGENTS.md

React SPA for the VOC management system. Read root `AGENTS.md` first for cross-cutting governance.

## Commands

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

## Styling Architecture

Token pipeline: `src/tokens.ts` → `tailwind.config.ts` (utility classes) + CSS custom properties (`var(--*)`)

Full token reference: `docs/specs/requires/design.md §10 CSS Reference` and `§12 Token Architecture`.

**When to use which:**

- Layout / spacing / flex / grid → Tailwind utility (`flex gap-2 px-4`)
- Static color on a standard element → Tailwind utility (`bg-brand text-primary`)
- Dynamic color passed to JS (charts, Toast UI, canvas) → import from `tokens.ts` directly
- Inline style in JSX → CSS var (`style={{ color: 'var(--text-secondary)' }}`)
- Custom CSS / `@apply` → CSS var (`color: var(--text-primary)`)

**Hard rules:**

- Never write hex or raw OKLCH values outside of `src/tokens.ts`
- If a token doesn't exist for what you need, add it to `src/tokens.ts` + `design.md §12` first, then use it
- Never duplicate a token value — one source, two surfaces (Tailwind + CSS vars)

Key tokens: `var(--bg-app)` / `var(--bg-panel)` / `var(--bg-surface)` / `var(--brand)` / `var(--accent)` / `var(--text-primary)` / `var(--text-secondary)`
