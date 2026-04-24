---
name: warn-delete-local-branch
enabled: true
event: bash
pattern: gh\s+pr\s+merge\s+
action: warn
---

⚠️ **PR merged — delete the local branch too.**

Remote branch is deleted by `--delete-branch`. Now clean up locally:

```bash
git branch -D <branch-name>
```

Per CLAUDE.md git workflow: always delete local branches after merging.
