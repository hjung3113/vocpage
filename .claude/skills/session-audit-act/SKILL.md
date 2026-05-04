---
name: session-audit-act
description: Internal helper invoked ONLY when the user types the literal command /session-audit-act. Performs status transitions and fix-application logging in .claude/audit/registry.json (append-only). Inquiry-only when called without an action arg. Do NOT auto-load on keywords like "promote", "fix", "transition", "remediate" — only on the explicit /session-audit-act command.
---

# session-audit-act

## Purpose

Where `/session-audit` only observes and records, this skill handles **status transitions, fix-application logging, and verdict marking**. Splitting these responsibilities prevents simultaneous audit/transition collisions and accidental auto-promotions.

## When to use

- User explicitly types `/session-audit-act [args]`.
- Do not infer from keywords.

## Invocation

| Args                              | Behavior                                                                                                                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0                                 | Print backlog table (default filter: `status ∈ {candidate, regressed, remediation_inconclusive, detection_review}` AND promotion_rules gate satisfied). Pass `--all` to include the rest. |
| 1 (`item_id`)                     | Print available actions and required reference formats given the current status                                                                                                           |
| 2+ (`item_id <action> [args...]`) | Execute the transition                                                                                                                                                                    |

## Actions

| action                               | args                                                                | effect                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `promote <item_id> <target>`         | target ∈ {promoted, scoped, retired, detection_review}              | candidate → target. Validates promotion_rules gate.                                                                              |
| `queue_fix <item_id> <fix_type>`     | fix_type ∈ allowed_fix_types                                        | promoted/scoped/regressed → `<fix_type>_queued`                                                                                  |
| `mark_applied <item_id> <reference>` | reference: `commit:<sha>` or `file:<path>` or `hookify:<rule_path>` | `*_queued` → `*_added`. Appends `fix_history`, records `fix_applied_at`. Auto-transitions to `under_remediation` next.           |
| `confirm_remediation <item_id>`      | (none)                                                              | under_remediation → remediated. Validates promotion_rules.remediated gate (post_fix 5 sessions, conf<0.1, work_type matches ≥3). |
| `mark_regressed <item_id>`           | (none)                                                              | under_remediation/remediated → regressed. `regression_count++`.                                                                  |
| `mark_reactivated <item_id>`         | (none)                                                              | retired → regressed. `reactivation_count++` (kept separate from regression_count).                                               |
| `escalate <item_id> <new_fix_type>`  | new_fix_type: stronger entry in allowed_fix_types                   | regressed → `<new_fix_type>_queued`. If no stronger option exists, recommend `accept_residual`.                                  |
| `accept_residual <item_id>`          | (none)                                                              | regressed/remediation_inconclusive → accepted_residual. From here, stats are suppressed.                                         |
| `mark_fp <session_id> <item_id>`     | (none)                                                              | Set session.json finding's `user_verdict` → fp. Recompute precision.                                                             |
| `mark_tp <session_id> <item_id>`     | (none)                                                              | `user_verdict` → tp                                                                                                              |
| `seed_golden <jsonl_path>`           | (none)                                                              | Add to `.claude/audit/golden/samples/`. The user must hand-write `expected_findings.json`.                                       |

## Hard rules

1. **No auto-writing of rules**: This skill never writes to CLAUDE.md or hookify rules. The user performs the manual work; this skill only records the result via `mark_applied`. Auto-writing is too risky — fix quality depends on user review.
2. **Transition validation**: Check `registry.status_lifecycle.transitions`. Reject invalid transitions and reprint the available-actions table.
3. **Gate validation**: Reject if promotion_rules conditions are unmet, and report which condition failed (e.g., `min_sessions=5, current=3`).
4. **Append-only**: Never delete registry items. Toggle status and update fields only.
5. **Reference format validation**: Validate `mark_applied`'s reference against the regex. Reject on mismatch.
6. **Atomic write**: Update registry.json via `.tmp` → `mv`. On failure, auto-create `.bak`.

## Pipeline

### Step 1 — Parse args + dispatch

- 0/1/2+ branches.
- 0: Step 2 (backlog).
- 1: Step 3 (available actions).
- 2+: Step 4 (execute transition).

### Step 2 — Backlog table

Read stats.json + registry.json → compute view at read time:

```
## Backlog (default filter)
| item | status | conf(disp) | post_fix | regression | next action |
| R1   | candidate                  | 0.80 | -    | -    | promote R1 promoted |
| R3   | regressed                  | 0.65 | 0.30 | 2    | escalate R3 hookify |
| R7   | remediation_inconclusive   | 0.10 | 0.10 | 0    | accept_residual R7 |
```

`--all` reveals accepted_residual, retired, `*_queued`, `*_added`.

### Step 3 — Available-actions table (1 arg)

```
## R3 (current: regressed, conf 0.65)
| action | arg format | gate |
| escalate           | R3 hookify | hookify ∈ allowed_fix_types ✅ (one tier stronger) |
| escalate           | R3 spec    | spec ∈ allowed ✅ (two tiers stronger) |
| under_remediation  | R3         | (continue observation, defer escalation) |
| accept_residual    | R3         | (auto-recommended if no stronger fix_type) |
```

### Step 4 — Execute transition

1. Read registry.json → find item → check current status
2. Is the target action valid in `transitions[current]`? If not, reject and reprint Step 3 table.
3. Validate gates (promotion_rules or reference format)
4. Update registry:
   - status transition
   - append `fix_history` (on `mark_applied`)
   - increment `regression_count` / `reactivation_count`
5. Atomic write
6. Update session.json too if affected (`mark_fp`/`mark_tp`)
7. Report:
   ```
   ## R3 transition
   regressed → hookify_queued
   Next: write the hookify rule manually, then run /session-audit-act mark_applied R3 hookify:.claude/hookify.block-r3.local.md
   ```

### Step 5 — Follow-up notices

- Right after `mark_applied`: announce the post-fix measurement window has opened
- Right after `accept_residual`: print the next quarterly review date
- Right after `escalate`: provide a quick guide for the new fix_type (which CLAUDE.md section, hookify template path, etc.)

## Failure modes

- Wrong sessionId/item_id → stop; print available IDs
- Invalid transition → reject + Step 3 table
- Gate not met → reject + report missing condition
- Corrupt registry.json → propose `.bak` restore
- Atomic write failure → clean up `.tmp` and report

## Responsibility split (vs session-audit)

| Responsibility             | session-audit     | session-audit-act    |
| -------------------------- | ----------------- | -------------------- |
| jsonl analysis             | ✅                | ❌                   |
| Update stats.json          | ✅ (delta)        | ❌                   |
| Read registry.json         | ✅ (view only)    | ✅                   |
| Update registry.json       | ❌                | ✅                   |
| Propose status transitions | ✅ (Step 9 table) | ❌                   |
| Execute status transitions | ❌                | ✅                   |
| Record fix_history         | ❌                | ✅                   |
| Update user_verdict        | ❌                | ✅ (mark_fp/mark_tp) |

Never violate this boundary. If either side reaches into the other's responsibility, idempotency and blind integrity are broken.
