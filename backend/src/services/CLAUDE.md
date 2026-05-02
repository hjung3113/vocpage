# backend/src/services/CLAUDE.md

## Role

Business logic. Coordinates repositories, enforces domain rules, runs side-effects (auto-tagging, notifications).

## When to look where

- Permission checks (`assertCanManageVoc`) → `permissions/`
- Auto-tagging, notifications, hierarchy rules → service file for the resource
- Behavioral spec → `docs/specs/requires/feature-voc.md` (and related `feature-*.md`)
- HTTP/SQL details (not business rules) → `controllers/` and `repository/`
