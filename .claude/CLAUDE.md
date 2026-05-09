# .claude/CLAUDE.md

Tool-specific supplements only. Root `CLAUDE.md` is authoritative — if a rule appears in both, root wins.

## Token-Saving

- Use `limit=30` (or similar) when reading progress / state files.
- Check `git diff` for changes instead of re-reading full files.
- Reference external docs via links — never duplicate into context.

## Test Batch (per workspace, single call)

- FE: `npm run typecheck -w frontend && npm run test -w frontend -- --run | tail -20`
- BE: `npm run typecheck -w backend && npm run test -w backend | tail -20`
- Both sides touched → run the two commands as parallel bash in one message (root §Engineering Rules).
- Do not split `tsc` and Vitest / Jest into separate calls.
