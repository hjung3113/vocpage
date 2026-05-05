---
name: block-cat-fullfile
enabled: true
event: bash
item_id: R4
introduced_at: 2026-05-05
pattern: (^|[;&|]\s*)cat(\s+-[a-zA-Z]+)*\s+[^<\s][^\s]*\.(ts|tsx|js|jsx|py|go|sql)\b
action: warn
---

⚠️ **`cat` on a source file — pick the right tool instead:**

- **Know the symbol name?** → `mcp__serena__find_symbol` or `get_symbols_overview`
- **Know the line range?** → `Read` with `offset` and `limit`
- **Searching across files?** → `rg -n "<pattern>" <path>`

Per CLAUDE.md: `cat <file>` dumps the entire file into context. Never do this for source files.
