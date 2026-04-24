---
name: block-push-to-main
enabled: true
event: bash
pattern: git\s+push\s+.*origin\s+main|git\s+push\s+--set-upstream\s+origin\s+main
action: block
---

🚫 **Direct push to main is forbidden.**

Per CLAUDE.md git workflow rules:

- Never push directly to main
- Always create a feature branch: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`
- Push to feature branch, open a PR, merge via `gh pr merge <n> --merge --delete-branch`
