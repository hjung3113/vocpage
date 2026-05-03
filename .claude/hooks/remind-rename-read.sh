#!/usr/bin/env bash
# PostToolUse Bash: detect git mv / single-file mv and remind to Read the
# new path once before any Edit (Edit-tool internal tracker is path-keyed
# and won't recognize the renamed file otherwise).
set -u
cmd=$(jq -r '.command // empty' <<< "$CLAUDE_TOOL_INPUT" 2>/dev/null)
[ -z "$cmd" ] && exit 0

new_path=""
if [[ "$cmd" =~ git[[:space:]]+mv[[:space:]]+([^[:space:]]+)[[:space:]]+([^[:space:]]+) ]]; then
  new_path="${BASH_REMATCH[2]}"
elif [[ "$cmd" =~ ^[[:space:]]*mv[[:space:]]+([^[:space:]\-][^[:space:]]*)[[:space:]]+([^[:space:]]+)[[:space:]]*$ ]]; then
  new_path="${BASH_REMATCH[2]}"
fi

[ -z "$new_path" ] && exit 0
[ -d "$new_path" ] && exit 0

echo "🔔 Renamed → $new_path. Edit on this path will fail until you Read it. Run: Read('$new_path', limit=1) before any Edit."
exit 0
