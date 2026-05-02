# prototype/js/CLAUDE.md

## Role

Classic-script JS modules driving the prototype. 16+ files; data exposed on `window` via explicit aliases in `data.js` (no auto-attach for `const`).

## When to look where

- Mock data shape (the source of truth for prototype-driven UX) → `data.js`
- Behavior of a specific screen → matching script file
- Stage A-2 / A-4 split rationale → `docs/specs/plans/done/prototype-phase7-wave3-plan.md`
