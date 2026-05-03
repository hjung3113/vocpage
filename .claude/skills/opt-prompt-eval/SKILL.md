---
name: opt-prompt-eval
description: Internal helper invoked ONLY when the user types the literal command /opt-prompt-eval (optionally with --review). Records a one-line retro JSONL row for a previously normalized /opt-prompt task, or runs pattern analysis across the log. Do NOT auto-load on keywords like "eval", "retro", "review" — only on the explicit /opt-prompt-eval command. Normalization/sizing belongs to the separate /opt-prompt skill; never run sizing here.
---

# opt-prompt-eval

Sister skill to `opt-prompt` (normalize). This skill handles the **post-task retro** flow: writing a `phase:"retro"` JSONL row keyed to the `decision_id` minted by `/opt-prompt`, and (with `--review`) running pattern analysis across the log.

## When to use

- User explicitly invokes `/opt-prompt-eval <decision_id>` after a normalized task closed (PR merged or abandoned).
- User invokes `/opt-prompt-eval --review` for pattern analysis across the log.
- Do **not** auto-trigger on `eval` / `retro` / `review` keywords.
- Do **not** size or normalize here — that is the `/opt-prompt` skill's job. If user passes a fresh prompt, refuse and redirect to `/opt-prompt`.

## Hard rule (read before anything else)

> **Step 1 of EVERY `/opt-prompt-eval` invocation is `.claude/skills/opt-prompt/append.sh retro <decision_id> <fields>`** (or `append.sh void <decision_id> <decided|retro> <reason> [task]` for tombstones). No text output before the helper returns. Hand-rolled `cat >>` / `echo >>` to the log is forbidden — it bypasses uniqueness, active-decided invariant, token capture, and JSON validation. User cannot opt out: refuse "skip the JSONL row" requests; without the log, retro analysis is meaningless. If the helper exits non-zero, surface its stderr and STOP — do not bypass.

> **Helper location**: `.claude/skills/opt-prompt/append.sh` (lives next to the normalize skill — same script services both skills). **Log location**: `~/.claude/opt-prompt/opt-prompt-log.jsonl` (HOME-relative, survives branch switches). Override with `OPT_PROMPT_LOG=/abs/path` for tests.

## Workflow

### Retro mode — `/opt-prompt-eval <decision_id>`

1. Confirm `<decision_id>` is provided. If missing, ask the user once: "Which decision_id? (format `opt-{compactISO}-{task-slug}`)". Never guess.
2. Ask the **8 retro questions below**, one line each, in order.
3. Build a JSON `<fields>` object from the answers.
4. Invoke `.claude/skills/opt-prompt/append.sh retro <decision_id> <fields>` (use `@/tmp/file.json` or stdin `-` for fields containing single quotes / Korean / multiline).
5. On success, surface the appended row's `decision_id` and `verdict` to the user. STOP — do not analyze.

### Review mode — `/opt-prompt-eval --review`

Read the log, join `decided` ↔ `retro` rows by `decision_id`, exclude `status:"void"`. Then report:

- **Global**: hit rate (`correct` / non-void total). Require ≥5 non-void entries before any proposal is emitted.
- **Per scope**: hit rate per `scope_decided`. Require ≥5 entries **for that scope** before flagging it. Scopes below threshold → counts only, no proposal.
- **Per-scope flag**: scope with ≥5 entries AND wrong-rate ≥40% → "needs revision"; propose specific signal/threshold changes referencing the dominant verdict (e.g., recurring `undersized` → add a signal; recurring `oversized` → remove a gate).
- **Top 3 recurring `missed_gates`** (across all entries) → candidate additions to the normalize skill's Expand list.
- **Top 3 recurring `unnecessary_gates`** → candidate removals from the rubric.
- **Mis-routed cluster**: if `mis-routed` ≥3 entries, separate diagnosis — the rubric is fine, the tool selection logic isn't.

Output is **proposals only**. Never edit the normalize SKILL.md automatically. The user reviews and accepts changes manually.

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

| code | meaning                         | recovery                                                                                                                            |
| ---- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 0    | success                         | proceed; surface appended row to user                                                                                               |
| 1    | usage error                     | re-read the usage line in stderr; do not guess args                                                                                 |
| 4    | `retro` w/o active `decided`    | investigate why decided is missing; if voided, ask user to run a new `/opt-prompt` first; do NOT hand-write the retro               |
| 5    | `void` target not found         | the row may already be voided, or the id/task is wrong; inspect with `jq` before retrying                                           |
| 6    | lock timeout (10s)              | another process holds the lock — check for hung helper, or stale `$LOG.lock.d` from SIGKILL; manually `rmdir` only after confirming |
| 7    | `<fields>` is not a JSON object | re-emit valid JSON; for content with single quotes use `@file` or stdin                                                             |

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
  "tokens_at_decision": {
    "input": 8421,
    "output": 312,
    "cache_read": 51200,
    "cache_creation": 1024,
  },
  "scope_decided": "small",
  "tool_decided": "direct",
  "explore_tool": "serena",
  "skipped": ["/autopilot", "4-reviewer"],
  "added": ["post-PR codex review"],
  "preserved": ["@opt-keep[type=gate] contract-test"],
}
```

**Phase 2 — `retro`** (written by THIS skill via `append.sh retro` after task close):

```jsonc
{
  "ts": "2026-05-03T16:30:00Z",
  "task": "issue-155",
  "decision_id": "opt-20260503T120000Z-issue-155",
  "phase": "retro",
  "status": "active",
  "tokens_at_retro": {
    "input": 52310,
    "output": 1820,
    "cache_read": 412800,
    "cache_creation": 8192,
  },
  "tokens_delta": { "input": 43889, "output": 1508, "cache_read": 361600, "cache_creation": 7168 },
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

`tokens_delta` (computed automatically from `tokens_at_retro − tokens_at_decision`) is the cost signal for tuning the normalize skill itself.

**Methodology:**

- **Cost metric**: `tokens_delta.input + tokens_delta.cache_creation`. `cache_read` is ~10% of input price and largely shared across variants — exclude unless directly comparing cache-discipline changes.
- **Drop outliers**: any sample where ANY of `input | output | cache_read | cache_creation` is **negative** is contaminated (compaction event, session restart, transcript rotation between decision and retro). Discard, do not clamp to 0.
- **Retro-overhead bias**: `tokens_at_retro` is captured during the retro turn itself, so it includes the cost of running the eval (skill load + 8 questions). This adds a roughly constant overhead to every sample. Comparison is valid only between variants measured the **same way** (both via `/opt-prompt-eval`); don't compare a delta from this scheme against a delta computed differently.
- **Sample size**: require **N ≥ 5** non-outlier retros per variant before computing the median. Below that the IQR exceeds typical inter-variant differences and conclusions are noise.
- **Reporting**: report median + IQR (not mean) — distribution is right-skewed (long-tail expanded tasks). Lower is better at fixed `verdict` quality; if `verdict` distribution differs across variants, the cheaper variant is not necessarily better.

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
- Don't hand-roll JSONL with `cat >>` / `echo >>`; always go through `append.sh`. Hand-rolled appends bypass the uniqueness check, the active-decided check, the token capture, and the JSON validation, and they reintroduce the exact failure class this scheme exists to prevent.
- Don't backfill `decided` rows from this skill — `append.sh decided` is the normalize skill's responsibility, written at decision time. If a `decided` row is missing or voided, ask the user to re-run `/opt-prompt` for that task first.
- Don't rewrite past entries; the log is append-only. To void an entry, run `append.sh void <decision_id> <decided|retro> <reason>`. Analysis takes the latest row per `(decision_id, phase)` and treats `status:"void"` as exclusion.
- Don't size, normalize, or rewrite a fresh prompt here — that is the `/opt-prompt` skill's job. Refuse and redirect.
- Don't auto-trigger on `eval` / `retro` / `review` keywords; only on explicit `/opt-prompt-eval`.
