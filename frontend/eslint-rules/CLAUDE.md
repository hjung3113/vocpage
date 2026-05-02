# frontend/eslint-rules/CLAUDE.md

## Role

Project-local custom ESLint rules (e.g. token-purity: no hex/raw OKLCH outside `src/tokens.ts`).

## When to look where

- Token-purity check failed → rule source here
- Adding a new project-specific lint rule → here, then wire into `.eslintrc.base.js`
