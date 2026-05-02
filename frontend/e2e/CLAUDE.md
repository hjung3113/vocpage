# frontend/e2e/CLAUDE.md

## Role

End-to-end browser tests (Playwright). Component/unit tests live in Vitest under `src/**/__tests__/`.

## When to look where

- A user flow spans pages/routes → here
- A regression depends on real browser behavior (focus, keyboard, scroll) → here
- Component-level coverage → Vitest under `src/`
