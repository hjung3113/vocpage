#!/usr/bin/env bash
# PreToolUse Read: TS/TSX full-file read → block (80-line threshold).
# Other large files (>200 lines) → soft warning (preserve existing behavior).
set -u
f=$(jq -r '.file_path // empty' <<< "$CLAUDE_TOOL_INPUT" 2>/dev/null)
lim=$(jq -r '.limit // empty' <<< "$CLAUDE_TOOL_INPUT" 2>/dev/null)
[ -z "$f" ] || [ ! -f "$f" ] && exit 0
[ -n "$lim" ] && exit 0
lines=$(wc -l < "$f" 2>/dev/null | tr -d ' ' || echo 0)
case "$f" in
  *.ts|*.tsx)
    if [ "${lines:-0}" -gt 80 ]; then
      echo "🚫 TS/TSX full read blocked: $f ($lines lines). Use Serena (find_symbol/get_symbols_overview) or Read with offset+limit." >&2
      exit 2
    fi
    ;;
  *)
    if [ "${lines:-0}" -gt 200 ]; then
      echo "Large file ($lines lines): use offset+limit"
    fi
    ;;
esac
exit 0
