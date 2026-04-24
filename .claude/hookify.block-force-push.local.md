---
name: block-force-push
enabled: true
event: bash
pattern: git\s+push\s+.*(--force|-f)(\s|$)
action: block
---

🚫 **Force push is forbidden.**

Per CLAUDE.md git workflow rules:

- Force push to main is strictly prohibited
- If you need to update a PR branch: `gh pr merge <n> --merge --delete-branch`, then create a new branch
- Never rewrite published history
