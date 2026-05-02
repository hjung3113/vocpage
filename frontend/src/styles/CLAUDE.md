# frontend/src/styles/CLAUDE.md

## Role

Global CSS — `@font-face`, CSS-vars layer (derived from `tokens.ts`), reset, top-level utilities. C-marker blocks (e.g. C-7) live in `index.css`.

## When to look where

- Global CSS variable definitions → `index.css`
- Token-purity marker blocks for component CSS (C-6, C-7, …) → `index.css`
- Font face declarations → `index.css`
- Tests for marker purity → `__tests__/`
