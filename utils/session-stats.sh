#!/usr/bin/env bash
# session-stats.sh — wrapper for session-stats.mjs
#
# Usage:
#   ./session-stats.sh                          # latest session in cwd's project (JSON)
#   ./session-stats.sh <sessionId>              # specific session (JSON)
#   ./session-stats.sh --pretty                 # latest session, human-readable
#   ./session-stats.sh <sessionId> --pretty     # specific session, human-readable
#   ./session-stats.sh <sessionId> > out.json   # save JSON
#   ./session-stats.sh <sessionId> | jq '.tokens'   # pipe to jq
#
# Examples:
#   ./session-stats.sh --latest --pretty
#   ./session-stats.sh 67e4a042-07dc-4a36-8e36-1f4a3ed055e9 | jq '.by_prompt[0:5]'

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/session-stats.mjs"

if [ $# -eq 0 ]; then
  exec node "$NODE_SCRIPT" --latest
fi

# pass through everything; if no sessionId-shaped arg given, default to --latest
HAS_SID=0
for a in "$@"; do
  if [[ "$a" =~ ^[0-9a-f]{8}- ]]; then HAS_SID=1; break; fi
done

if [ "$HAS_SID" -eq 0 ]; then
  exec node "$NODE_SCRIPT" --latest "$@"
else
  exec node "$NODE_SCRIPT" "$@"
fi
