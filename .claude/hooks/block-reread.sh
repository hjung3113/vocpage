#!/usr/bin/env bash
# PreToolUse Read: block re-read of a file already Read in this session,
# unless an Edit/Write occurred since.
set -u
f=$(jq -r '.file_path // empty' <<< "$CLAUDE_TOOL_INPUT" 2>/dev/null)
[ -z "$f" ] && exit 0
jsonl=$(bash "$(dirname "$0")/_session-jsonl.sh")
[ -z "$jsonl" ] || [ ! -f "$jsonl" ] && exit 0

# last tool_use entry mentioning this exact file_path
last=$(grep -F "\"file_path\":\"$f\"" "$jsonl" 2>/dev/null \
  | tail -50 \
  | grep -oE '"name":"(Read|Edit|Write|MultiEdit|NotebookEdit)"' \
  | tail -1 \
  | sed 's/.*"name":"\([^"]*\)".*/\1/')

if [ "$last" = "Read" ]; then
  echo "🚫 Re-read blocked: $f already Read this session with no Edit/Write since. Reuse existing context, or use offset+limit if you need a different region." >&2
  exit 2
fi
exit 0
