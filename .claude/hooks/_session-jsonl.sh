#!/usr/bin/env bash
# Resolve the current session's JSONL path. Picks the most recently modified
# JSONL under ~/.claude/projects/<encoded-cwd>/ which corresponds to the
# active session for this project.
proj_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
encoded=$(echo "$proj_dir" | sed 's|/|-|g')
JSONL_DIR="$HOME/.claude/projects/$encoded"
ls -t "$JSONL_DIR"/*.jsonl 2>/dev/null | head -1
