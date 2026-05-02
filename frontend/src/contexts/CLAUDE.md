# frontend/src/contexts/CLAUDE.md

## Role

App-level React contexts — providers for global filter, drawer state, selection, auth session.

## When to look where

- Cross-page state shared by multiple features → here
- Tests for provider behavior → `__tests__/`
- Local component state → keep in the component, not here
