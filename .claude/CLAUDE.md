# .claude/CLAUDE.md

**Root `CLAUDE.md` is authoritative.** This file contains only tool-specific supplements — not governance, not session ritual, not doc structure. If a rule appears in both files, root wins.

## Token-Saving Protocol

- Use `limit=30` (or similar) when reading progress/state files
- Check `git diff` for changes instead of re-reading full files
- Reference external docs via links (don't duplicate into context)
- **Test batch** — 검증은 워크스페이스별 단일 호출:
  - FE: `npm run typecheck -w frontend && npm run test -w frontend | tail -20`
  - BE: `npm run typecheck -w backend && npm run test -w backend | tail -20`
  - 양쪽 touched면 두 명령을 같은 message에서 parallel bash로 (root §"Parallel tool calls" 룰 적용).
  - tsc/vitest 별도 split 금지. (backend lint script 미정의 — 추후 추가 시 lint도 동일 패턴)

## Pointers

- Canonical docs → `docs/specs/` (the `requires/`, `plans/`, `reviews/` layout in root governs )
