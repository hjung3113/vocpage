# Style & Conventions

## Design system (HARD RULE)

- Use CSS custom properties only: `var(--bg-app)`, `var(--brand)`, `var(--text-primary)`, etc.
- **Never** write hex (`#5e6ad2`) or raw OKLCH literals. Always go through tokens.
- Typography: Pretendard Variable (UI), D2Coding (code/issue IDs)
- 8px spacing grid, max-width ~1200px, elevation via background opacity (not shadow darkness)
- Full spec: `docs/specs/requires/uidesign.md` §10, §12

## TypeScript / code

- TypeScript everywhere (FE + BE + shared)
- ESLint base: `.eslintrc.base.js`; tsconfig base: `tsconfig.base.json`
- Prettier: `.prettierrc`
- Match existing style — read 2–3 nearby files before adding new patterns
- YAGNI: no features beyond what the task requires
- Surgical changes only; touch only what the request requires

## Working style (from CLAUDE.md)

- **TDD only** — Vitest (FE) / Jest+Supertest (BE). Test-first, see fail, minimal pass, refactor.
- **No completion claims** without explicit user approval
- **No implementation** without user approval
- **90% certainty gate** — ask if <90% confident; never silently pick a default
- **Refactor ≠ feature change** — separate commits/PRs
- **CLAUDE.md ≤ 200 lines**
