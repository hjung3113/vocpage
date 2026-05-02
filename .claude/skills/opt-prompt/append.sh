#!/usr/bin/env bash
# opt-prompt log append helper. Portable across macOS bash 3.2 (no flock).
#
# Usage:
#   append.sh decided <task> <fields-json | @file | -(stdin)>
#   append.sh retro   <decision_id> <fields-json | @file | -(stdin)>
#   append.sh void    <decision_id> <decided|retro> <reason> [task]
#
# Exit codes: 0 ok | 1 usage | 2 id collision | 3 dup decided | 4 retro w/o decided
#             5 void target missing | 6 lock timeout | 7 invalid fields-json
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Log lives under $HOME so it survives branch switches and repo cleans.
# Override with OPT_PROMPT_LOG=/abs/path for tests.
LOG="${OPT_PROMPT_LOG:-$HOME/.claude/opt-prompt/opt-prompt-log.jsonl}"
mkdir -p "$(dirname "$LOG")"
LOCK_DIR="$LOG.lock.d"
TRANSCRIPT_DIR="$HOME/.claude/projects/-Users-hyojung-Desktop-2026-vocpage"
LOCK_TIMEOUT=10  # seconds

now_iso()      { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
now_compact()  { date -u +"%Y%m%dT%H%M%SZ"; }
slug()         { local s; s=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | LC_ALL=C tr -c 'a-z0-9' '-' | sed 's/^-*//;s/-*$//'); [[ -n "$s" ]] || s="x"; printf '%s' "$s"; }

# Portable lock: mkdir is atomic on POSIX. Spin with timeout. Trap cleanup.
acquire_lock() {
  local waited=0
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    sleep 0.1
    waited=$((waited + 1))
    if (( waited > LOCK_TIMEOUT * 10 )); then
      echo "ERROR: lock timeout (${LOCK_TIMEOUT}s) — $LOCK_DIR held by another process?" >&2
      exit 6
    fi
  done
  trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT INT TERM
}

# Read fields-json from arg, @file, or stdin. Validate as JSON object.
read_fields() {
  local raw
  case "$1" in
    -)        raw=$(cat) ;;
    @*)       raw=$(cat "${1#@}") ;;
    *)        raw="$1" ;;
  esac
  if ! printf '%s' "$raw" | jq -e 'type == "object"' >/dev/null 2>&1; then
    echo "ERROR: fields must be a JSON object (got: $(printf '%s' "$raw" | head -c 80))" >&2
    exit 7
  fi
  printf '%s' "$raw"
}

capture_tokens() {
  local latest
  latest=$(ls -t "$TRANSCRIPT_DIR"/*.jsonl 2>/dev/null | head -1 || true)
  if [[ -z "${latest:-}" || ! -f "$latest" ]]; then echo 'null'; return; fi
  jq -s '
    [.[] | .. | objects | select(.input_tokens? != null and .output_tokens? != null)] as $u
    | if ($u | length) == 0 then null else
      { input:          ($u | map(.input_tokens // 0) | add),
        output:         ($u | map(.output_tokens // 0) | add),
        cache_read:     ($u | map(.cache_read_input_tokens // 0) | add),
        cache_creation: ($u | map(.cache_creation_input_tokens // 0) | add) }
      end
  ' "$latest" 2>/dev/null || echo 'null'
}

# Exact jq match — avoids substring false-positives of grep.
id_exists() {
  [[ -f "$LOG" ]] || return 1
  jq -e --arg id "$1" 'select(.decision_id == $id)' "$LOG" >/dev/null 2>&1
}

active_decided_for_task() {
  [[ -f "$LOG" ]] || return 0
  jq -c --arg t "$1" \
    'select(.task==$t and .phase=="decided" and (.status//"active")=="active")' "$LOG" 2>/dev/null
}

active_decided_by_id() {
  [[ -f "$LOG" ]] || return 0
  jq -c --arg id "$1" \
    'select(.decision_id==$id and .phase=="decided" and (.status//"active")=="active")' "$LOG" 2>/dev/null
}

cmd="${1:-}"; shift || true
case "$cmd" in
  decided)
    task="${1:?task required}"; raw_fields="${2:?fields required (JSON | @file | -)}"
    fields=$(read_fields "$raw_fields")
    acquire_lock
    if [[ -n "$(active_decided_for_task "$task")" ]]; then
      echo "ERROR: task '$task' already has active decided row; void it first" >&2; exit 3
    fi
    id="opt-$(now_compact)-$(slug "$task")"
    if id_exists "$id"; then
      echo "ERROR: decision_id '$id' already exists (clock collision?)" >&2; exit 2
    fi
    tokens=$(capture_tokens)
    # $fields first, helper-controlled fields second → helper wins on key conflicts (no injection).
    row=$(jq -nc \
      --arg ts "$(now_iso)" --arg task "$task" --arg id "$id" \
      --argjson fields "$fields" --argjson tokens "$tokens" \
      '$fields + {ts:$ts, task:$task, decision_id:$id, phase:"decided", status:"active",
        tokens_at_decision:$tokens}')
    printf '%s\n' "$row" >> "$LOG"
    printf '%s\n' "$id"
    ;;
  retro)
    id="${1:?decision_id required}"; raw_fields="${2:?fields required (JSON | @file | -)}"
    fields=$(read_fields "$raw_fields")
    acquire_lock
    decided=$(active_decided_by_id "$id" || true)
    if [[ -z "$decided" ]]; then
      echo "ERROR: no active 'decided' row for decision_id '$id'" >&2; exit 4
    fi
    task=$(jq -r '.task' <<<"$decided")
    decided_tokens=$(jq -c '.tokens_at_decision // null' <<<"$decided")
    tokens=$(capture_tokens)
    delta=$(jq -nc --argjson a "$decided_tokens" --argjson b "$tokens" '
      if $a == null or $b == null then null else
      { input:          ($b.input          - $a.input),
        output:         ($b.output         - $a.output),
        cache_read:     ($b.cache_read     - $a.cache_read),
        cache_creation: ($b.cache_creation - $a.cache_creation) }
      end')
    row=$(jq -nc \
      --arg ts "$(now_iso)" --arg task "$task" --arg id "$id" \
      --argjson fields "$fields" --argjson tokens "$tokens" --argjson delta "$delta" \
      '$fields + {ts:$ts, task:$task, decision_id:$id, phase:"retro", status:"active",
        tokens_at_retro:$tokens, tokens_delta:$delta}')
    printf '%s\n' "$row" >> "$LOG"
    printf '%s\n' "$id"
    ;;
  void)
    id="${1:?decision_id required}"; phase="${2:?phase required}"; reason="${3:?reason required}"
    task_filter="${4:-}"  # optional, for legacy collision disambiguation
    case "$phase" in decided|retro) ;; *) echo "ERROR: phase must be decided|retro" >&2; exit 1 ;; esac
    acquire_lock
    if [[ -n "$task_filter" ]]; then
      target=$(jq -c --arg id "$id" --arg p "$phase" --arg t "$task_filter" \
        'select(.decision_id==$id and .phase==$p and .task==$t and (.status//"active")=="active")' \
        "$LOG" 2>/dev/null | tail -1)
    else
      target=$(jq -c --arg id "$id" --arg p "$phase" \
        'select(.decision_id==$id and .phase==$p and (.status//"active")=="active")' \
        "$LOG" 2>/dev/null | tail -1)
    fi
    if [[ -z "${target:-}" ]]; then
      echo "ERROR: no active row for decision_id='$id' phase='$phase'${task_filter:+ task='$task_filter'}" >&2
      exit 5
    fi
    task=$(jq -r '.task' <<<"$target")
    row=$(jq -nc \
      --arg ts "$(now_iso)" --arg task "$task" --arg id "$id" \
      --arg phase "$phase" --arg reason "$reason" \
      '{ts:$ts, task:$task, decision_id:$id, phase:$phase, status:"void", void_reason:$reason}')
    printf '%s\n' "$row" >> "$LOG"
    ;;
  *)
    cat >&2 <<USAGE
Usage:
  $0 decided <task> <fields-json | @file | -(stdin)>
  $0 retro   <decision_id> <fields-json | @file | -(stdin)>
  $0 void    <decision_id> <decided|retro> <reason> [task]

Pass JSON containing single quotes via @file or stdin to avoid shell-quote issues.
Exit codes: 1 usage | 2 id collision | 3 dup decided | 4 retro w/o decided
            5 void target missing | 6 lock timeout | 7 invalid fields
USAGE
    exit 1
    ;;
esac
