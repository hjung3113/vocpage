#!/usr/bin/env bash
# PreToolUse Read: block full re-read of a file that has been Edit/Write'd
# in this session. Suggests git diff or bounded Read instead.
set -u
f=$(jq -r '.file_path // empty' <<< "$CLAUDE_TOOL_INPUT" 2>/dev/null)
lim=$(jq -r '.limit // empty' <<< "$CLAUDE_TOOL_INPUT" 2>/dev/null)
[ -z "$f" ] || [ ! -f "$f" ] && exit 0
[ -n "$lim" ] && exit 0

jsonl=$(bash "$(dirname "$0")/_session-jsonl.sh")
[ -z "$jsonl" ] || [ ! -f "$jsonl" ] && exit 0

last=$(grep -F "\"file_path\":\"$f\"" "$jsonl" 2>/dev/null \
  | tail -50 \
  | grep -oE '"name":"(Read|Edit|Write|MultiEdit|NotebookEdit)"' \
  | tail -1 \
  | sed 's/.*"name":"\([^"]*\)".*/\1/')

case "$last" in
  Edit|Write|MultiEdit|NotebookEdit)
    echo "🚫 Full Read after $last on $f. Use: Bash('git diff -- $f') for changes, or Read with offset+limit for a region." >&2
    exit 2
    ;;
esac
exit 0
