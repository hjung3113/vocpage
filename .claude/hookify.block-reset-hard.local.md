---
name: block-reset-hard
enabled: true
event: bash
pattern: git\s+reset\s+--hard
action: block
---

🚫 **`git reset --hard` is blocked without explicit user authorization.**

Why this exists (R13 — Git workflow violation, session 5f319c57):

- Wave 3 Phase A: ran `git reset --hard origin/feat/...` and `git reset --hard ef3e8e8` in a worktree without user request → wiped a background agent's commit `0724825` (codex P1 fixes), required hotfix PR #254 to recover.
- Combined with concurrent force-push, caused merged-PR data loss.

If the user has explicitly asked for a hard reset in this turn, restate their request and proceed manually (e.g., `git checkout` + `git restore`). Do not bypass this rule on your own judgment — propose the action and wait for confirmation instead.

Pairs with: `block-force-push` (force-push already blocked separately).
