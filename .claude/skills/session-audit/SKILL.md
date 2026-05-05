---
name: session-audit
description: Internal helper invoked ONLY when the user types the literal command /session-audit. Runs blind 4-expert audit of a Claude Code session jsonl, merges findings into .claude/audit/sessions/<id>.json, updates .claude/audit/stats.json (delta-safe, tuple-based), and proposes status transitions. Do NOT auto-load on keywords like "audit", "review", "tokens" — only on the explicit /session-audit command.
---

# session-audit

## Purpose

Analyze a session jsonl with 4 blind experts to accumulate behavior, cost, and rule-violation patterns into long-term statistics. Definitions, lifecycle, and operational rules live in `.claude/audit/checklist.md` + `.claude/audit/registry.json`. **This skill observes and records only** — state transitions and fix application are handled by `/session-audit-act`.

## When to use

- User explicitly types `/session-audit [sessionId]`. If sessionId is omitted, default to current session.
- Do not infer from keywords. Do not respond to general rule-violation questions with this skill.

## Hard rules

1. **Blind integrity**: None of the 4 experts or the mapper may read `.claude/audit/`, `registry.json`, `stats.json`, or `sessions/*.json`. Experts get free-discovery missions only; the mapper gets a registry view limited to `(id, title, category, allowed_fix_types)`. (Conclusion of Round 1+2 adversarial reviews.)
2. **JSON contract**: Experts and mapper output a single JSON block only. On parse failure, retry once; if it fails again, exclude that result and record `parse_failed: true`.
3. **Append-only**: Never delete `registry.items[*]`. Preserve `stats.items` keys.
4. **Versioning**: Hard stop on `registry_version` mismatch (until a migration tool exists, downgrade to warn-and-suggest-suspend in v0).
5. **Idempotency**: When re-auditing the same sessionId, subtract the prior session.json's contribution from stats and add the new contribution (delta). Increment `audit_revision`.
6. **No auto-transitions**: All status transitions go through `/session-audit-act` after explicit user approval. This skill only outputs candidate tables.
7. **Stats are tuple-only**: Store `(sum, sum_sq, count)` per stat. Compute means/variances at read time.

## Pipeline

### Step 1 — Input normalization + baseline_hooked indexing

- Resolve sessionId. Refuse to proceed with a wrong/missing ID.
- jsonl path: `~/.claude/projects/-Users-hyojung-Desktop-2026-vocpage/<sessionId>.jsonl`. Stop if missing.
- Index `.claude/hookify.*.local.md` → mark already-hooked registry items as `baseline_hooked: true` (in-memory only — do not modify registry.json; surface in this session's report).

### Step 2 — Stats collection (one-shot)

```bash
bash .claude/utils/session-stats.sh <sessionId>
```

**Whitelist for what experts see**: `span`, `tokens.{grand_total,cache_hit_rate,output,cache_create}`, `tokens.cache_invalidation`, `by_tool`, `by_prompt[*].{ts,calls,tokens,out}`, `events.by_type.{attachment,user,assistant}`. Everything else stays with main.

### Step 3 — Common-slice pre-extraction (main, one-shot)

Build `turns_summary` (in-memory; not persisted) and inject identically to all 4 experts:

```json
{
  "turns": [
    { "idx": <int>, "role": "user|assistant", "tool_uses": [{"name","args_summary":"<<=80 chars>"}], "out_tokens": <int|null>, "ts": "<ISO>" }
  ],
  "touched_paths": ["<path>", ...],
  "tool_sequence_per_prompt": [["Bash","Edit","Read",...], ...],
  "stats_summary": <Step 2 whitelist>
}
```

**Leakage-prevention masking** (apply immediately before passing to experts):

- Path matches `.claude/audit/**`, `.omc/**`, `.claude/scheduled_tasks.lock` → `[REDACTED-INTERNAL]`
- Body tokens matching `/hookify\.[a-z\-]+/`, `/audit_item_[0-9]+/`, `/\.omc\/[^\s]+/` → `[REDACTED]`
- Truncate from the tail when serialized payload exceeds 50KB (note `truncated: true` in main report).

### Step 4 — Auto-classify work_type (main)

Match `touched_paths` against the "work_type labels" rules in `checklist.md`. Multi-label allowed (top-2). Tie or empty → label `mixed`.

### Step 5 — Dispatch experts in parallel (size-gated)

**Session-size gate** (decide expert set from Step 2 stats):

- `tokens.grand_total < 50_000` OR `events.by_type.user < 5` → **2-expert mode**: dispatch only `cost` + `rule`. Skip `design` + `pattern` (lowest-yield on small sessions). Note `expert_set: "small"` in session.json `meta`.
- otherwise → **4-expert mode** (full set). `expert_set: "full"`.

Single-message parallel `Agent` calls. `subagent_type=general-purpose`. Per-expert model selection (cost-tuned):

- `cost`: `model=sonnet` — input is already pre-aggregated by `session-stats.sh`; deep reasoning unnecessary
- `rule`: `model=sonnet` — free-discovery across rule categories needs judgment
- `design`: `model=sonnet` — batching/timing assessment retains sonnet pending recall measurement
- `pattern`: `model=haiku` — surface keyword detection (apology, narration, guessing)

**Mission text — never reference R1~R10/C1~C7/P1~P7 IDs and never attach CLAUDE.md content** (Round 1+2 fix):

- `cost`: "Token efficiency — cache, attachments, output spikes, repeated calls, redundant absorption."
- `rule`: "Free-discover operating rules a model coding agent might violate. Reference categories only (no rule text): tool_routing / git_workflow / test_discipline / token_saving / design_tokens / review_delegation / decision_quality / completion_protocol / minimal_change / docs_sync."
- `design`: "Session prompt batching, decision timing, workflow appropriateness. EXCLUDE prompt sizing — that belongs to opt-prompt-eval."
- `pattern`: "Expression and habit — apologies, narration, guessing, unrequested work, deferring decisions, deferred batches."

**Common contract**: do NOT inline. Each dispatch sends a pointer instead — `Read .claude/audit/expert-contract.md for the output schema, rules, and JSON discipline. Mission: <line above>. Inputs: turns_summary (inline), raw jsonl path <abs>.` This avoids sending the ~40-line contract 2–4× per audit. The contract file is the single source of truth.

### Step 6 — Mapper expert (separate dispatch, conditional)

Mapping is performed by a dedicated mapper expert, not main, to block confirmation bias (Round 2 fix).

**Skip-mapper preconditions** (main evaluates before dispatch):

- All experts returned `findings: []` (zero work) → write empty mapper block (`mapped:[], new_candidates:[], ambiguous:[]`) and skip dispatch.
- Every `proposed_title` across experts is unique AND each appears in exactly one expert's findings (no cross-expert collisions, no within-expert duplicates) → main performs trivial 1:1 lookup against the registry view (normalize + exact/Levenshtein only, no semantic tiebreak needed) and skips dispatch. Record `mapper_skipped: "trivial"` in session.json.

Otherwise → dispatch mapper.

`Agent` dispatch, `model=sonnet` (Step 6 rule 2 requires semantic judgment for tied candidates — haiku rolled back after adversarial review flagged ambiguity-overflow risk; revisit after 5 sessions of golden-sample data). Mapper receives the expert findings + a registry view limited to `(id, title, category, allowed_fix_types)` (no detection text, no status, no history).

```
You are the session-audit mapper. Map 4-expert findings to registry items.

Rules:
- Never read files outside the registry view provided.
- Normalize proposed_title: lowercase, strip whitespace, remove punctuation.
- Matching rules:
  1. Levenshtein distance < 0.3 after normalization → same-item candidate
  2. Multiple candidates → main-LLM judgment (semantic). Ambiguous (>1 tie) → NEW
  3. Known unification cases (e.g. P4/P5) → merge into P4
- Single JSON output.

Schema:
{
  "mapped": [
    { "item_id": "R1", "found_by": ["rule","cost"], "merged_count": <int>, "merged_evidence": [...], "max_impact_ordinal": <int>, "max_tokens_est": <int|null> }
  ],
  "new_candidates": [
    { "proposed_title": "...", "proposed_by": ["pattern"], "count": <int>, "evidence": [...], "impact_ordinal": <int> }
  ],
  "ambiguous": [
    { "proposed_title": "...", "candidates": ["R1","R3"], "rationale": "..." }
  ]
}
```

### Step 7 — Save session file

`.claude/audit/sessions/<sessionId>.json`. If it already exists: load prior → subtract its contribution (Step 8 rollback) → replace with new data → bump `audit_revision`.

```json
{
  "session_id": "<id>",
  "audit_revision": <int>,
  "ts_audit": "<ISO>",
  "registry_version": 2,
  "skill_version": "v2",
  "claude_model": "<id>",
  "meta": {
    "duration_ms": <int>, "human_msgs": <int>, "tokens_total": <int>,
    "work_type": ["fe_componentization", ...],
    "pr_count": <int|null>, "loc_changed": <int|null>
  },
  "experts": { "cost": {...}, "rule": {...}, "design": {...}, "pattern": {...}, "mapper": {...} },
  "audit_cost_tokens": <int>,
  "detected_waste_tokens": <int>,
  "drift_unverified": <bool>,
  "findings": [
    { "item_id": "R1", "found_by": [...], "occurred": true, "count": <int>, "impact_ordinal": <int>, "impact_tokens_est": <int|null>, "evidence": [...], "user_verdict": "unknown" }
  ],
  "new_candidates": [...],
  "ambiguous": [...]
}
```

### Step 8 — Update stats.json (delta-safe, tuple-based)

Read → update → atomic write (`stats.json.tmp` then `mv`). On failure, auto-create `stats.json.bak`.

If a prior session.json existed (re-audit):

1. Subtract prior contribution per stat: `count_sum -= prior.count`, `count_sum_sq -= prior.count^2`, `tokens_est_sum -= prior.tokens_est`, `ordinal_sum -= prior.ordinal`, `agreement_sum -= prior.agreement`. If prior `occurred=true`, `sessions_occurred_count -= 1`.
2. `sessions_total` does not change for the same sessionId.

For a new session (or after rollback):

1. `sessions_total += 1` (new only)
2. For each finding (item_id assigned, status not `accepted_residual`):
   - `lifetime.sessions_occurred_count += 1`
   - Update `count_sum`, `count_sum_sq`, `tokens_est_sum/count`, `ordinal_sum/count`, `agreement_sum/count`
   - `by_work_type[<wt>]` same formula (this session's labels only)
   - `verdicts.unknown += 1` (default)
   - If item status ∈ `{*_added, under_remediation, remediated, regressed}`, also update `post_fix.*`. If work_type intersects with the fix-time work_type set (≥1), `post_fix.work_type_matches += 1`.
3. `audit_cost_cumulative += session.audit_cost_tokens`
4. `detected_waste_cumulative += session.detected_waste_tokens`
5. `audit_revisions_per_session[<id>] = audit_revision`
6. `updated = ISO_now`

`accepted_residual` items are excluded from stats updates (suppression).

### Step 9 — Lifecycle inspection (no auto-apply)

Compute candidates at read time per item:

- **Promotion**: `status=candidate AND sessions_total ≥ 5 AND promotion_rules satisfied` → propose `promoted/scoped`
- **Remediation**: `status=under_remediation AND post_fix conditions met` → propose `remediated`
- **Inconclusive**: `status=under_remediation AND post_fix_sessions ≥ 5 AND work_type_matches < 3` → propose `remediation_inconclusive`
- **Regressed**: `status ∈ {under_remediation, remediated, retired} AND occurred this session` → warn
- **Escalation**: `status=regressed AND regression_rate ≥ 0.4` (denominator: `matching_work_type_post_fix_sessions`) OR `reactivation_count ≥ 1` → propose stronger fix_type from `allowed_fix_types`. If none stronger, `accepted_residual`.
- **Detection review**: `precision_records ≥ 3 AND precision < 0.5` → propose

Output `displayed_confidence` with Hawthorne correction applied.

### Step 10 — Detection-drift regression (conditional)

If `sessions_total % 10 == 0` AND `.claude/audit/golden/samples/` is non-empty: re-run the 4 experts against each golden sample. If `recall < 0.7` or `fpr > 0.3`, recommend audit suspension. If golden samples are empty, mark this session `drift_unverified: true`.

### Step 11 — ROI check

If `detected_waste_cumulative / audit_cost_cumulative < 1.5` over the last 5 sessions, append an audit-suspension recommendation.

### Step 12 — Report

Tables only. Minimum prose. Never expose raw expert/mapper JSON (only in the session file).

```
## Session <id> (audit_rev=<n>, work_type=<wt>)

### Findings (top 3 by impact)
| item_id | title | found_by | count | impact | conf(disp) |
| R1 | Re-Read same file | rule, cost | 5 | 2 | 0.80 (Hawthorne adj.) |

### New candidates (N)
- "<title>" (proposed_by, count=1, ordinal=2)

### Ambiguous mappings (M — user decision required)
- "<title>" → R1 or R3?

### Lifecycle candidates
| item | current | proposed | trigger |
| R1 | candidate | promoted | 5 sessions, conf 0.80, 2 work_types |

### System notices
- ROI 1.2 (<1.5) — recommend audit suspension
- audit_density 0.45 (>0.3) — Hawthorne correction in effect
- drift_unverified — golden samples missing
```

End with one-line next action (recommend `/session-audit-act ...`).

## Failure modes

- Missing jsonl → stop, report path
- Expert/mapper JSON parse failure twice → exclude, mark `parse_failed: true`
- registry_version mismatch → hard stop (warn-and-continue with suspension recommendation in v0)
- Corrupt stats.json → propose `.bak` restore (do not auto-regenerate)
- Ambiguous mapping → return in `ambiguous` array (mapper does not invent new candidates)

## Output discipline

- Main response = tables + notices + one-line next action. Minimum prose.
- Expert/mapper raw JSON lives only in the session file.
- Never dump the whole jsonl. Main uses jq for metadata; experts use jq slices only.
