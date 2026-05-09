---
name: block-force-push
enabled: true
event: bash
pattern: git\s+push\s+.*(--force(-with-lease|-if-includes)?|-f)(\s|$|=)
action: block
---

🚫 **Force push is forbidden.**

Per CLAUDE.md git workflow rules:

- Force push is strictly prohibited (including `--force-with-lease`, `--force-if-includes`, `-f`)
- If you need to update a PR branch: `gh pr merge <n> --merge --delete-branch`, then create a new branch
- Never rewrite published history
