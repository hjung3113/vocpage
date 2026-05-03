# Task Completion Checklist

Before claiming any task complete:

1. **Tests pass** — Vitest (FE) / Jest+Supertest (BE), tail output only
2. **Typecheck passes** — `tsc --noEmit` in the relevant sub-dir
3. **Lint clean** — ESLint, Prettier
4. **For refactors**: `grep -rn "<old-name>" .` returns 0 hits across imports, dynamic strings, config, `docs/specs/**`, plan files, README/CLAUDE.md, comments
5. **For UI changes**: exercise the surface in a browser before declaring done
6. **For API changes**: hit the endpoint
7. **claude-progress.txt updated** + git commit on a feature branch
8. **Any design decision** written to spec or ADR before session ends

## Completion declaration rule

**Never say "done" / "complete" / "finished" until the user explicitly approves it.**
TDD discipline: red → green → refactor. No "tests later" PRs.

## Doc hygiene at phase close

Run `docs/specs/README.md §5` 7-step cleanup. Move merged reviews → `archive/reviews/`,
completed plans → `archive/plans/`. Archive must not be cited as canonical.
