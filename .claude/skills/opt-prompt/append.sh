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
# Session-stats binary (read-only consumer; we never modify it).
# Override path for tests via OPT_PROMPT_STATS_BIN.
STATS_BIN="${OPT_PROMPT_STATS_BIN:-$SCRIPT_DIR/../../../utils/session-stats.sh}"
# Sidecar snapshots: full session-stats JSON per phase per decision.
SNAPSHOT_DIR="${OPT_PROMPT_SNAPSHOTS_DIR:-$HOME/.claude/opt-prompt/snapshots}"
mkdir -p "$SNAPSHOT_DIR"

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

# Reserved keys helper-controlled by append.sh — user $fields must not collide.
RESERVED_KEYS='ts task decision_id phase status session_id session_summary tokens_at_decision tokens_at_retro tokens_delta void_reason'

# Read fields-json from arg, @file, or stdin. Validate as JSON object and reject reserved keys.
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
  local violations
  violations=$(printf '%s' "$raw" | jq -r --arg r "$RESERVED_KEYS" \
    '($r|split(" ")) as $reserved | [keys[] | select(. as $k | $reserved | any(. == $k))] | join(",")' 2>/dev/null)
  if [[ -n "$violations" ]]; then
    echo "ERROR: <fields> must not contain helper-controlled keys: $violations" >&2
    exit 7
  fi
  printf '%s' "$raw"
}

current_session_id() {
  local latest
  latest=$(ls -t "$TRANSCRIPT_DIR"/*.jsonl 2>/dev/null | head -1 || true)
  if [[ -z "${latest:-}" || ! -f "$latest" ]]; then return 0; fi
  basename "$latest" .jsonl
}

# Run session-stats <sid> and save full JSON snapshot to <out>.
# Fail-soft: write '{}' on any failure (missing bin, bad sid, transcript moved).
# Stays silent on stdout (snapshot path is the contract).
write_snapshot() {
  local sid="$1" out="$2"
  if [[ -z "$sid" ]]; then
    echo "WARNING: no session_id resolved; snapshot will be empty (telemetry skipped)" >&2
    echo '{}' > "$out"; return
  fi
  if [[ ! -x "$STATS_BIN" ]]; then
    echo "WARNING: session-stats binary not found at '$STATS_BIN'; snapshot will be empty" >&2
    echo '{}' > "$out"; return
  fi
  if ! "$STATS_BIN" "$sid" > "$out" 2>/dev/null; then
    echo "WARNING: session-stats failed for sid=$sid (transcript missing/corrupt); snapshot will be empty" >&2
    echo '{}' > "$out"
  fi
  if ! jq -e 'type == "object"' "$out" >/dev/null 2>&1; then echo '{}' > "$out"; fi
}

# Build the slim session_summary object from a snapshot file.
# Mirrors fields agreed in skill design (D-2.B): tokens + 7 metrics.
# Returns 'null' if snapshot is empty/invalid (fail-soft).
summary_from_snapshot() {
  local snap="$1"
  [[ -f "$snap" ]] || { echo 'null'; return; }
  jq -c '
    if (.tokens // null) == null then null else
    {
      api_calls: (.api_calls // 0),
      tokens: {
        input_uncached: (.tokens.input_uncached // 0),
        cache_create:   (.tokens.cache_create   // 0),
        cache_read:     (.tokens.cache_read     // 0),
        output:         (.tokens.output         // 0),
        grand_total:    (.tokens.grand_total    // 0)
      },
      cache_invalidation_events: (.cache_invalidation.events // 0),
      bash_failures:             (.bash_failures.count       // 0),
      subagent_calls:            (.subagents.total_calls     // 0),
      top3_tools: ((.by_tool // {}) | to_entries | sort_by(-.value) | .[0:3] | from_entries),
      claudemd_reads:            (.tool_use_details.read.claudemd_count // 0),
      p90_pause_min: ((.pause_distribution.p90_ms // 0) / 60000 | (. * 100 | round) / 100)
    } end
  ' "$snap" 2>/dev/null || echo 'null'
}

# tokens_delta from two summaries (objects, not snapshots).
# null if either side has no tokens, OR session ids differ (caller passes 'null' then).
tokens_delta_from_summaries() {
  local s_decided="$1" s_retro="$2"
  jq -nc --argjson a "$s_decided" --argjson b "$s_retro" '
    if $a == null or $b == null or ($a.tokens // null) == null or ($b.tokens // null) == null
    then null
    else {
      input_uncached: ($b.tokens.input_uncached - $a.tokens.input_uncached),
      cache_create:   ($b.tokens.cache_create   - $a.tokens.cache_create),
      cache_read:     ($b.tokens.cache_read     - $a.tokens.cache_read),
      output:         ($b.tokens.output         - $a.tokens.output),
      grand_total:    ($b.tokens.grand_total    - $a.tokens.grand_total)
    } end'
}

# Exact jq match — avoids substring false-positives of grep.
id_exists() {
  [[ -f "$LOG" ]] || return 1
  jq -e --arg id "$1" 'select(.decision_id == $id)' "$LOG" >/dev/null 2>&1
}

# "Active" = LATEST row at (id|task, phase) AND its status is "active". A later void row at the
# same (id, phase) supersedes the earlier active one, matching the analysis-join semantics in
# the eval skill SKILL.md. Pre-filter-then-tail would mis-return the earlier active row.
active_decided_for_task() {
  [[ -f "$LOG" ]] || return 0
  local latest
  latest=$(jq -c --arg t "$1" 'select(.task==$t and .phase=="decided")' "$LOG" 2>/dev/null | tail -1)
  [[ -n "$latest" ]] || return 0
  [[ "$(jq -r '.status // "active"' <<<"$latest")" == "active" ]] && printf '%s' "$latest"
}

active_decided_by_id() {
  [[ -f "$LOG" ]] || return 0
  local latest
  latest=$(jq -c --arg id "$1" 'select(.decision_id==$id and .phase=="decided")' "$LOG" 2>/dev/null | tail -1)
  [[ -n "$latest" ]] || return 0
  [[ "$(jq -r '.status // "active"' <<<"$latest")" == "active" ]] && printf '%s' "$latest"
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
    sid=$(current_session_id || true)
    snap="$SNAPSHOT_DIR/$id.decided.json"
    write_snapshot "$sid" "$snap"
    summary=$(summary_from_snapshot "$snap")
    [[ -n "$summary" ]] || summary='null'
    # $fields first, helper-controlled fields second → helper wins on key conflicts (no injection).
    row=$(jq -nc \
      --arg ts "$(now_iso)" --arg task "$task" --arg id "$id" --arg sid "$sid" \
      --argjson fields "$fields" --argjson summary "$summary" \
      '$fields + {ts:$ts, task:$task, decision_id:$id, phase:"decided", status:"active",
        session_id:$sid, session_summary:$summary}')
    printf '%s\n' "$row" >> "$LOG"
    printf '%s\n' "$id"
    ;;
  retro)
    id="${1:?decision_id required}"; raw_fields="${2:?fields required (JSON | @file | -)}"
    shift 2 || true
    # Optional flag: --exec-sid <sid> (B) — explicit task-execution session for stats.
    # If absent, auto-fallback (C): use decided.session_id when its transcript still exists,
    # else fall back to current latest session.
    exec_sid=""
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --exec-sid)
          if [[ -z "${2:-}" ]]; then
            echo "ERROR: --exec-sid requires non-empty <session_id>" >&2; exit 1
          fi
          exec_sid="$2"; shift 2 ;;
        *) echo "ERROR: unknown retro arg '$1'" >&2; exit 1 ;;
      esac
    done
    fields=$(read_fields "$raw_fields")
    acquire_lock
    decided=$(active_decided_by_id "$id" || true)
    if [[ -z "$decided" ]]; then
      echo "ERROR: no active 'decided' row for decision_id '$id'" >&2; exit 4
    fi
    task=$(jq -r '.task' <<<"$decided")
    sid_decided=$(jq -r '.session_id // ""' <<<"$decided")
    decided_summary=$(jq -c '.session_summary // null' <<<"$decided")
    # Resolve sid for snapshot: B (explicit) > C (decided sid if transcript present) > current.
    if [[ -n "$exec_sid" ]]; then
      sid="$exec_sid"
    elif [[ -n "$sid_decided" && -f "$TRANSCRIPT_DIR/$sid_decided.jsonl" ]]; then
      sid="$sid_decided"
    else
      sid=$(current_session_id || true)
    fi
    snap="$SNAPSHOT_DIR/$id.retro.json"
    write_snapshot "$sid" "$snap"
    summary=$(summary_from_snapshot "$snap")
    [[ -n "$summary" ]] || summary='null'
    # tokens_delta meaningful only when retro snapshot reflects the same session as decided.
    if [[ -n "$sid" && -n "$sid_decided" && "$sid" == "$sid_decided" ]]; then
      delta=$(tokens_delta_from_summaries "$decided_summary" "$summary")
    else
      delta='null'
    fi
    # Embed delta inside session_summary (alongside tokens) so review reads from one place.
    summary_with_delta=$(jq -nc --argjson s "$summary" --argjson d "$delta" \
      'if $s == null then null else $s + {tokens_delta:$d} end')
    row=$(jq -nc \
      --arg ts "$(now_iso)" --arg task "$task" --arg id "$id" --arg sid "$sid" \
      --argjson fields "$fields" --argjson summary "$summary_with_delta" \
      '$fields + {ts:$ts, task:$task, decision_id:$id, phase:"retro", status:"active",
        session_id:$sid, session_summary:$summary}')
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
