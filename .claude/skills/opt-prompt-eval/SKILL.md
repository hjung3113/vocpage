---
name: opt-prompt-eval
description: Internal helper invoked ONLY when the user types the literal command /opt-prompt-eval. Records a retro JSONL row for a previously normalized /opt-prompt task. Do NOT auto-load on keywords like "eval", "retro", "review" — only on the explicit /opt-prompt-eval command. Normalization/sizing belongs to /opt-prompt; skill improvement analysis belongs to /opt-prompt-improve.
---

# opt-prompt-eval

Sister skill to `opt-prompt` (normalize) and `opt-prompt-improve` (skill analysis). This skill handles the **post-task retro** flow: writing a `phase:"retro"` JSONL row keyed to the `decision_id` minted by `/opt-prompt`.

> **스킬 개선 분석은 `/opt-prompt-improve`를 사용하세요.** 이 스킬은 retro 로그 기록만 담당합니다.

## When to use

- User explicitly invokes `/opt-prompt-eval <decision_id>` after a normalized task closed (PR merged or abandoned).
- Do **not** auto-trigger on `eval` / `retro` / `review` keywords.
- Do **not** size or normalize here — that is the `/opt-prompt` skill's job. If user passes a fresh prompt, refuse and redirect to `/opt-prompt`.
- Do **not** run pattern analysis or generate proposals here — that is the `/opt-prompt-improve` skill's job. If user passes `--review`, redirect to `/opt-prompt-improve`.

## Hard rule (read before anything else)

> **Step 1 of EVERY `/opt-prompt-eval` invocation is `.claude/skills/opt-prompt/append.sh retro <decision_id> <fields>`** (or `append.sh void <decision_id> <decided|retro> <reason> [task]` for tombstones). No text output before the helper returns. Hand-rolled `cat >>` / `echo >>` to the log is forbidden — it bypasses uniqueness, active-decided invariant, session-stats capture (snapshot file + `session_summary` embedding), and JSON validation. User cannot opt out: refuse "skip the JSONL row" requests; without the log, retro analysis is meaningless. If the helper exits non-zero, surface its stderr and STOP — do not bypass.

> **Helper location**: `.claude/skills/opt-prompt/append.sh` (lives next to the normalize skill — same script services both skills). **Log location**: `~/.claude/opt-prompt/opt-prompt-log.jsonl` (HOME-relative, survives branch switches). **Snapshot dir**: `~/.claude/opt-prompt/snapshots/<decision_id>.{decided,retro}.json` — full session-stats JSON per phase, written by the helper as a sidecar to the slim `session_summary` embedded in the row. Overrides for tests: `OPT_PROMPT_LOG=/abs/path`, `OPT_PROMPT_SNAPSHOTS_DIR=/abs/dir`, `OPT_PROMPT_STATS_BIN=/abs/session-stats.sh`.

## Workflow

### Retro mode — `/opt-prompt-eval <decision_id> [--exec-sid <sid>]`

1. Confirm `<decision_id>` is provided. If missing, ask the user once: "Which decision_id? (format `opt-{compactISO}-{task-slug}`)". Never guess.
2. Parse optional `--exec-sid <session_id>` from the user's prompt. Pass it through to the helper unchanged. If the user typed it inside the literal command line (e.g., `/opt-prompt-eval opt-...-foo --exec-sid abc-123`), forward verbatim. Don't fabricate a sid if the user didn't supply one.
3. Ask the **8 retro questions below**, one line each, in order.
4. Build a JSON `<fields>` object from the answers.
5. Invoke `.claude/skills/opt-prompt/append.sh retro <decision_id> <fields> [--exec-sid <sid>]` (use `@/tmp/file.json` or stdin `-` for fields containing single quotes / Korean / multiline). The helper resolves the snapshot session by precedence: **(B) explicit `--exec-sid`** > **(C) `decided.session_id`** if its transcript still exists > **current latest session**. Then runs `utils/session-stats.sh <resolved_sid>` to write `~/.claude/opt-prompt/snapshots/<decision_id>.retro.json`, and embeds the slim `session_summary` (tokens + 7 metrics) + `tokens_delta` (only when resolved sid matches decided sid; `null` otherwise) into the row.
6. On success, surface the appended row's `decision_id` and `verdict` to the user. STOP — do not analyze.

**When does `--exec-sid` matter?** If you ran `/opt-prompt`, then did the work, then `/clear`'d, then opened a fresh session for eval — the helper's auto-fallback (C) only works if the original transcript file still exists at `~/.claude/projects/-Users-hyojung-Desktop-2026-vocpage/<sid>.jsonl`. It usually does (Claude Code keeps transcripts), so most of the time you can omit `--exec-sid` and trust auto-fallback. Pass it explicitly when (a) you want to be unambiguous about which session reflects the task, (b) the task ran in a different session from `/opt-prompt` (rare — e.g., decision in session A, but actual implementation in session B because you context-switched).

## Eval questions (ask in order, one line each)

1. Task identifier? (must match the `task` from the `phase:"decided"` row)
2. Did execution stay on the normalized prompt, or did the workflow expand mid-task? (`as-planned` | `expanded` | `shrunk`)
3. Did the chosen tool change mid-task? (`yes` | `no`) — separates rubric error from executor mis-route.
4. Any gate the rubric **skipped** that turned out to be needed? (short tag from controlled vocab: `migration` | `contract-test` | `auth-test` | `screenshot` | `regression-test` | `none` | `other:<short>`)
5. Any gate the rubric **added** that turned out to be unnecessary? (same vocab as Q4)
6. Actual LOC? (integer)
7. Rework rounds? (integer; PR review cycles + post-merge fixes)
8. Free-form note on why mis-sized, if anything was off (one line, optional).

Q4/Q5 use a controlled vocabulary so "Top 3 recurring" aggregation works. Free text goes in Q8.

## Helper invocations (cheat-sheet)

```bash
# inline JSON (use @file or - for content with single quotes / multiline / Korean):
.claude/skills/opt-prompt/append.sh retro <decision_id> '<retro-fields-json>'
.claude/skills/opt-prompt/append.sh retro <decision_id> @/tmp/retro.json
echo '{"outcome":"as-planned",...}' | .claude/skills/opt-prompt/append.sh retro <decision_id> -

# Optional: --exec-sid <sid> tells the helper which session to snapshot for retro stats.
# Use when the task ran in a session different from the latest (e.g., /clear'd between task and eval).
# Precedence: explicit --exec-sid > decided.session_id (if its transcript still exists) > current latest.
.claude/skills/opt-prompt/append.sh retro <decision_id> @/tmp/retro.json --exec-sid c4b8a60b-fa3f-4335-9540-9f607f69074d

# void: 4th arg [task] is REQUIRED for legacy collision rows where decision_id is shared across tasks
.claude/skills/opt-prompt/append.sh void <decision_id> <decided|retro> '<reason>' [task]
# Reasons containing single quotes / Korean / multiline: use a heredoc-fed variable to avoid shell-quote breakage:
REASON=$(cat <<'EOF'
사용자가 "skip this" 라고 해서 voided
EOF
)
.claude/skills/opt-prompt/append.sh void <decision_id> decided "$REASON" <task>
```

`retro` requires an active `decided` for the id (else the helper exits 4). `void` appends a tombstone row with `status:"void"` for the latest active row at `(decision_id, phase)`; analysis treats voided rows as not present. **For any decision_id minted before the helper existed (legacy rows where decision_id is not globally unique), pass `task` as the 4th arg to void** so you tombstone only the bogus task's row, not a sibling task's legitimate row at the same id.

## Helper exit codes (eval-relevant subset)

| code | meaning                         | recovery                                                                                                                                                      |
| ---- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | success                         | proceed; surface appended row to user                                                                                                                         |
| 1    | usage error                     | re-read the usage line in stderr; do not guess args                                                                                                           |
| 4    | `retro` w/o active `decided`    | STOP and tell the user verbatim: "Run `/opt-prompt <task>` first to mint a new decided row; this skill cannot mint decided rows." Do NOT hand-write the retro |
| 5    | `void` target not found         | the row may already be voided, or the id/task is wrong; inspect with `jq` before retrying                                                                     |
| 6    | lock timeout (10s)              | another process holds the lock — check for hung helper, or stale `$LOG.lock.d` from SIGKILL; manually `rmdir` only after confirming                           |
| 7    | `<fields>` is not a JSON object | re-emit valid JSON; for content with single quotes use `@file` or stdin                                                                                       |

(Full table including `decided`-only codes lives in `.claude/skills/opt-prompt/SKILL.md`.)

## JSONL schema (reference)

All rows carry `status: "active" | "void"` at the top level. Append-only — to invalidate a row, append a tombstone with the same `(decision_id, phase)` and `status:"void"` via `append.sh void`.

`decision_id` format: `opt-{compactISO}-{task-slug}` (e.g. `opt-20260503T120000Z-issue-155`). Allocated by `append.sh decided` (in the normalize skill), globally unique by construction.

**Phase 1 — `decided`** (written by the normalize skill at decision time; shown for join reference only — eval skill does NOT write this):

```jsonc
{
  "ts": "2026-05-03T12:00:00Z",
  "task": "issue-155",
  "decision_id": "opt-20260503T120000Z-issue-155",
  "phase": "decided",
  "status": "active",
  "session_id": "c4b8a60b-fa3f-4335-9540-9f607f69074d",
  "session_summary": {
    "api_calls": 14,
    "tokens": {
      "input_uncached": 8421,
      "cache_create": 1024,
      "cache_read": 51200,
      "output": 312,
      "grand_total": 60957,
    },
    "cache_invalidation_events": 0,
    "bash_failures": 0,
    "subagent_calls": 0,
    "top3_tools": { "Read": 6, "Bash": 3, "Edit": 2 },
    "claudemd_reads": 1,
    "p90_pause_min": 0.04,
  },
  "scope_decided": "small",
  "tool_decided": "direct",
  "explore_tool": "serena",
  "skipped": ["/autopilot", "4-reviewer"],
  "added": ["post-PR codex review"],
  "preserved": ["@opt-keep[type=gate] contract-test"],
}
```

Sidecar (full session-stats JSON, ~5–500 KB) lives at `~/.claude/opt-prompt/snapshots/<decision_id>.decided.json` for Tier-3 deep-dive. Slim `session_summary` (above) is enough for Tier-1/Tier-2 review without opening the sidecar.

**Phase 2 — `retro`** (written by THIS skill via `append.sh retro` after task close):

```jsonc
{
  "ts": "2026-05-03T16:30:00Z",
  "task": "issue-155",
  "decision_id": "opt-20260503T120000Z-issue-155",
  "phase": "retro",
  "status": "active",
  "session_id": "c4b8a60b-fa3f-4335-9540-9f607f69074d",
  "session_summary": {
    "api_calls": 47,
    "tokens": {
      "input_uncached": 52310,
      "cache_create": 8192,
      "cache_read": 412800,
      "output": 1820,
      "grand_total": 475122,
    },
    "cache_invalidation_events": 1,
    "bash_failures": 1,
    "subagent_calls": 0,
    "top3_tools": { "Read": 18, "Bash": 12, "Edit": 6 },
    "claudemd_reads": 3,
    "p90_pause_min": 6.1,
    // tokens_delta is null when session_id_decided != session_id_retro
    "tokens_delta": {
      "input_uncached": 43889,
      "cache_create": 7168,
      "cache_read": 361600,
      "output": 1508,
      "grand_total": 414165,
    },
  },
  "outcome": "as-planned", // as-planned | expanded | shrunk
  "tool_swapped": false,
  "missed_gates": [], // controlled vocab: migration|contract-test|auth-test|screenshot|regression-test|other:<tag>
  "unnecessary_gates": [],
  "loc_actual": 52,
  "rework_rounds": 0,
  "note": "",
  "verdict": "correct", // correct | undersized | oversized | mis-routed | scope-creep
}
```

Sidecar at `~/.claude/opt-prompt/snapshots/<decision_id>.retro.json` mirrors the decided sidecar.

**Tombstone — `status:"void"`** (written by `append.sh void`):

```jsonc
{
  "ts": "...",
  "task": "...",
  "decision_id": "...",
  "phase": "decided",
  "status": "void",
  "void_reason": "...",
}
```

## Analysis join

Group rows by `decision_id`. For each group, take the **latest row per (decision_id, phase)**. If that latest row has `status:"void"`, exclude that phase from analysis. A decision is fully active iff its latest `decided` AND latest `retro` are both `status:"active"`.

Helper guarantees `decision_id` is globally unique going forward. Legacy rows from before this scheme may share an id across tasks; for those, additionally filter by `task` when grouping.

## Token-delta usage for skill optimization

`session_summary.tokens_delta` (computed automatically from retro − decided session-stats output, but **only when both phases ran in the same Claude Code session** — `null` otherwise) is the cost signal for tuning the normalize skill itself.

**Methodology:**

- **Cost metric**: `session_summary.tokens_delta.input_uncached + session_summary.tokens_delta.cache_create`. `cache_read` is ~10% of input price and largely shared across variants — exclude unless directly comparing cache-discipline changes.
- **Drop nulls and outliers**: rows with `tokens_delta == null` are cross-session (decided and retro happened in different Claude Code sessions) — exclude from cost analysis. Other Tier-2 metrics still apply. Any sample where `input_uncached` or `cache_create` is **negative** is contaminated (compaction event, transcript rotation) — discard, don't clamp. Negative `cache_read`/`output` may legitimately occur (lighter retro session, fewer outputs) and are kept.
- **Retro-overhead bias**: retro session-stats is captured during the retro turn itself, so it includes the cost of running the eval (skill load + 8 questions + session-stats invocation). Roughly constant overhead per sample. Comparison is valid only between variants measured the **same way** (both via `/opt-prompt-eval`).
- **Sample size**: require **N ≥ 5** non-null, non-outlier retros per variant before computing the median.
- **Reporting**: report median + IQR (not mean) — distribution is right-skewed. Lower is better at fixed `verdict` quality; if `verdict` distribution differs across variants, the cheaper variant is not necessarily better.
- **Legacy rows**: rows from before the session_summary scheme have top-level `tokens_at_decision`/`tokens_at_retro`/`tokens_delta` with the older 4-key shape (`input/output/cache_read/cache_creation`). Map old `cache_creation` → new `cache_create` and old `input` → new `input_uncached` when including legacy rows in a variant comparison.

## Verdict derivation

Evaluated in order; first match wins:

1. `status === "void"` → `void` (excluded from analysis).
2. `outcome === "expanded"` AND `tool_swapped === true` → `mis-routed` (rubric scope was right, tool choice wasn't).
3. `outcome === "expanded"` AND `missed_gates.length > 0` → `undersized` (rubric should have caught a gate).
4. `outcome === "expanded"` AND `missed_gates.length === 0` → `scope-creep` (work grew for reasons outside the rubric's control; not a rubric failure).
5. `outcome === "as-planned"` AND `unnecessary_gates.length > 0` AND those gates **not in `preserved`** → `oversized`. (User-forced gates are user choice, not rubric error — exclude.)
6. otherwise → `correct`.

## Anti-patterns

- Don't run `/opt-prompt-eval` mid-task; only after the task is closed (PR merged or abandoned).
- Don't hand-roll JSONL with `cat >>` / `echo >>`; always go through `append.sh`. Hand-rolled appends bypass the uniqueness check, the active-decided check, the session-stats snapshot/`session_summary` capture, and the JSON validation, and they reintroduce the exact failure class this scheme exists to prevent.
- Don't backfill `decided` rows from this skill — `append.sh decided` is the normalize skill's responsibility, written at decision time. If a `decided` row is missing or voided, ask the user to re-run `/opt-prompt` for that task first.
- Don't rewrite past entries; the log is append-only. To void an entry, run `append.sh void <decision_id> <decided|retro> <reason>`. Analysis takes the latest row per `(decision_id, phase)` and treats `status:"void"` as exclusion.
- Don't size, normalize, or rewrite a fresh prompt here — that is the `/opt-prompt` skill's job. Refuse and redirect.
- Don't auto-trigger on `eval` / `retro` / `review` keywords; only on explicit `/opt-prompt-eval`.
- **`/clear` between task and eval gives bogus retro stats** — if you `/clear`'d and the new session can't reach the original task transcript, retro `session_summary` will reflect only the eval session (tiny `api_calls`, near-zero deltas), `tokens_delta` will be `null`, and the row's `session_id` won't match the decided `session_id`. Recovery: `append.sh void <id> retro 'wrong session captured'` then `/opt-prompt-eval <id> --exec-sid <original-task-sid>`. Find the original sid via `ls -t ~/.claude/projects/-Users-hyojung-Desktop-2026-vocpage/*.jsonl`. Confirm by comparing the row's `session_id` against decided's.
- Don't tell users to use the legacy `--review` flag — it no longer exists. Direct them to `/opt-prompt-improve` as a separate command.
