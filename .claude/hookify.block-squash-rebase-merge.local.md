---
name: block-squash-rebase-merge
enabled: true
event: bash
pattern: gh\s+pr\s+merge\s+.*--(squash|rebase)
action: block
---

🚫 **Squash and rebase merges are forbidden.**

Per CLAUDE.md git workflow rules:

- `--squash`: destroys individual commit history
- `--rebase`: replays commits directly onto main, erasing PR boundaries

Always merge with: `gh pr merge <n> --merge --delete-branch`
