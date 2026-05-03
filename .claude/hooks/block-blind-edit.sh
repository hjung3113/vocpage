#!/usr/bin/env bash
# PreToolUse Edit: block Edit on a >80-line file that has never been
# Read/Edit/Write'd in this session. Suggests the minimal Read range
# by locating the first line of old_string in the target file.
set -u
f=$(jq -r '.file_path // empty' <<< "$CLAUDE_TOOL_INPUT" 2>/dev/null)
old=$(jq -r '.old_string // empty' <<< "$CLAUDE_TOOL_INPUT" 2>/dev/null)
[ -z "$f" ] || [ ! -f "$f" ] && exit 0
lines=$(wc -l < "$f" 2>/dev/null | tr -d ' ' || echo 0)
[ "${lines:-0}" -le 80 ] && exit 0

jsonl=$(bash "$(dirname "$0")/_session-jsonl.sh")
[ -z "$jsonl" ] || [ ! -f "$jsonl" ] && exit 0

# any tool_use of this file_path anywhere in this session?
seen=$(grep -c -F "\"file_path\":\"$f\"" "$jsonl" 2>/dev/null || echo 0)
[ "${seen:-0}" -gt 0 ] && exit 0

first_line=$(printf '%s\n' "$old" | head -1)
locs=""
if [ -n "$first_line" ]; then
  locs=$(rg -n -F -- "$first_line" "$f" 2>/dev/null | head -3 | cut -d: -f1 | paste -sd, -)
fi

if [ -n "$locs" ]; then
  first=$(echo "$locs" | cut -d, -f1)
  off=$((first > 5 ? first - 5 : 1))
  echo "🚫 Blind Edit on $f ($lines lines, never Read in session). old_string matches at lines: $locs. Run: Read('$f', offset=$off, limit=20) before Edit." >&2
else
  echo "🚫 Blind Edit on $f ($lines lines, never Read in session). old_string not found — Edit will fail anyway. Read the file first with explicit offset+limit." >&2
fi
exit 2
