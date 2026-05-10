---
name: warn-no-verify
enabled: true
event: bash
pattern: git\s+(commit|push|merge|rebase)\s+.*(--no-verify|--no-gpg-sign)
action: warn
---

⚠️ **`--no-verify` / `--no-gpg-sign` blocked unless user explicitly asked for it.**

Per CLAUDE.md (root) and system rules:

- Never skip pre-commit hooks. If a hook fails, fix the underlying issue.
- Never bypass commit signing.
- Only proceed if the user has explicitly authorized this in the current turn.
