# Session Audit Checklist v2

> **Blind principle**: expert agents must never read this file, `registry.json`, `stats.json`, or `sessions/*.json`. Free-discovery only — the mapper expert handles post-hoc mapping.
> This document is a human-readable reference for lifecycle and operating rules. Source of truth is `registry.json`.

## Operating Rules v2

- **Confidence formula**: computed at read time. `confidence = sessions_occurred / sessions_total`. `displayed_confidence = raw_confidence * max(0, 1 - audit_density * 0.3)` (Hawthorne correction)
- **Stats storage**: `(sum, sum_sq, count)` tuples only. Mean/variance computed at read time. Prevents floating-point drift.
- **Idempotency**: when re-auditing the same sessionId, subtract the prior contribution then add the new one (delta).
- **Append-only**: never delete registry items. Toggle status flags only.
- **Versioning**: hard stop on `registry_version` mismatch (warn-and-continue + suspend recommendation until migration tool exists).
- **Hawthorne**: `audit_density = audited sessions / last-30-day sessions`. If >0.3, apply the formula to displayed_confidence and surface a warning.

## Lifecycle

```
candidate
  ├──→ promoted (5 sessions, conf≥0.4, ≥2 work_types)
  ├──→ scoped   (5 sessions, conf≥0.7, 1 work_type)
  ├──→ retired  (5 sessions, conf<0.1)              ← re-detection triggers regressed
  └──→ detection_review (precision<0.5, ≥3 verdicts)

promoted/scoped
  ├──→ claude_md_queued ──→ claude_md_added ──→ under_remediation
  ├──→ hookify_queued   ──→ hookified       ──→ under_remediation
  ├──→ spec_queued      ──→ spec_added      ──→ under_remediation
  └──→ under_remediation (observation only, no fix)

under_remediation
  ├──→ remediated              (post_fix 5 sessions, post_fix_conf<0.1, work_type matches ≥3)
  ├──→ regressed               (re-occurred during post_fix)
  └──→ remediation_inconclusive (post_fix 5 sessions, work_type matches <3)

regressed
  ├──→ under_remediation       (keep same fix, re-observe)
  ├──→ {claude_md|hookify|spec}_queued  (escalate within allowed_fix_types)
  └──→ accepted_residual       (allowed_fix_types exhausted)

accepted_residual ─ TERMINAL (excluded from stats, quarterly review notice only)
retired ──→ regressed (on re-detection; reactivation_count tracked separately)
```

**Escalation triggers** (either condition):

- `regression_rate = regression_count / matching_work_type_post_fix_sessions ≥ 0.4`
- `reactivation_count ≥ 1` (retired item re-detected)

No auto-apply. All transitions go through `/session-audit-act` after explicit user approval.

## Fix Type Strength (strongest → weakest)

| fix_type    | Why stronger                                    | Limitation                                 |
| ----------- | ----------------------------------------------- | ------------------------------------------ |
| `hookify`   | Runtime enforcement, automatic block/warn       | Only feasible for hookify-compatible items |
| `claude_md` | Injected into every session as explicit context | Model can still ignore                     |
| `spec`      | Codified in `docs/specs/`, caught at PR review  | Long-cycle, depends on human review        |
| `manual`    | Tracking placeholder only                       | No enforcement, user-behavior only         |

Escalate only within an item's `allowed_fix_types`. If no stronger option exists → `accepted_residual`.

## Categories

- `rule_violation` — code-level violations (Read/Bash/Edit patterns)
- `process_violation` — process violations (review, lint, git workflow, agent delegation, docs sync)
- `cost_anomaly` — token metric anomalies (cache, attachment, spike) — **model-controllable only**
- `behavior_pattern` — expression and habit patterns (apology, narration, guessing, unrequested work)
- `infra_noise` — **model-uncontrollable** infrastructure metrics (HTTP retry duplicate_request_ids, client-injected attachments, etc.). Excluded from stats. Fix queue forbidden. On reclassification, retroactively zero the stats contribution.

**infra_noise test**: "Would a CLAUDE.md rule or hookify reduce this pattern?" → If No, it is an infra_noise candidate. Flag with `infra_noise_candidate: true` in registry. (Formal `/session-audit-act reclassify` command is v2 deferred — use manual flag for now.)

## Fast-Track Rules (core violation priority)

Certain conditions shorten or bypass the 5-session observation gate:

- An item with `fast_track: true` AND `occ ≥ 5` → surface as **[FAST TRACK]** in audit report, recommend immediate promote.
- **Core CLAUDE.md violations** (TDD, git workflow, review delegation): attach `fast_track: true` at `occ ≥ 4`. At `occ = 5`: immediately promote + queue hookify first.
- **R2 quarterly hookify re-evaluation**: even as `accepted_residual`, items with `quarterly_review_note` must be re-assessed for hookify feasibility at the review date. A warn-only hook has near-zero false-positive cost and warrants reconsideration.

## Deferred Item Rules

Items with a recorded `defer_reason`:

- On next re-detection, surface at the top of the audit report as "previously deferred, re-detected."
- `defer_review_trigger: next_session_redetect` → reassess promotion immediately on re-detection.
- A `promoted` item with no fix queued for 3+ sessions triggers a `stale_promoted` warning.

## Items (31 total)

Details in `registry.json`. Categories:

- **R1–R17**: rule_violation / process_violation
- **C1–C7**: cost_anomaly (C5 flagged as infra_noise candidate)
- **P1–P7**: behavior_pattern (P4/P5 semantic overlap — mapper unifies into P4)

## work_type Labels (auto-classified)

Classified from `touched_paths`. Multi-label allowed (top-2).

- `fe_componentization` — many new `.tsx` files under `frontend/src/**`
- `fe_prototype_parity` — `prototype/**` Read + `frontend/src/**` Edit
- `fe_feature` — `frontend/src/**` Edit, unrelated to prototype
- `be_api` — `backend/src/routes/**` or `backend/src/services/**`
- `be_db` — `backend/migrations/**` or `shared/contracts/**`
- `docs_only` — 100% changes under `docs/**` or `*.md`
- `refactor` — `git mv` or majority import-only changes
- `infra` — `.claude/**`, `scripts/**`, `package.json`, `vite.config.*`

Matching for remediation/escalation normalization: set intersection ≥ 1.

## False Positive Tracking

- Per-finding `user_verdict: tp|fp|unknown` (default: unknown)
- `/session-audit-act mark_fp <session_id> <item_id>`
- Unknown verdicts older than 30 days → assumed tp (conservative, verdict_aging rule)
- precision = TP / (TP + FP). If precision < 0.5 with ≥ 3 verdicts → `detection_review`

## Cost ROI

- `audit_cost_tokens` per session.json (4 experts + main total)
- `detected_waste_tokens` = deterministic count only (no expert estimates) — duplicate tool calls, redundant reads, etc.
- ROI = `detected_waste_cumulative / audit_cost_cumulative`. If < 1.5 over the last 5 sessions → append audit suspension recommendation.
- **Marginal ROI** (single-session detected_waste / audit_cost) tracked separately. Warning if marginal ROI < 2.0 for 2+ consecutive sessions.

## Detection Drift / Golden Samples

`.claude/audit/golden/` — 5 frozen jsonl files + `expected_findings.json`. Regression run every N=10 sessions. If recall < 0.7 or false_positive_rate > 0.3 → suspend audit. Missing golden samples → all metrics marked `drift_unverified`.

## Deferred (v2 not yet implemented)

- `opt-prompt-eval` integration (separate system, orthogonal)
- `claude-md-management` handoff (manual workaround available)
- `digest` command (monthly bulk decisions)
- `fix_batch_id` (separate concurrent fix tracking)
- Migration tool (`/session-audit-migrate`)
- Formal `reclassify` action for infra_noise items

## Leakage Prevention (turns_summary)

Mask before passing to experts:

- Paths matching `.claude/audit/**`, `.omc/**`, `.claude/scheduled_tasks.lock` → `[REDACTED-INTERNAL]`
- Body tokens matching `/hookify\.[a-z\-]+/`, `/audit_item_[0-9]+/`, `/\.omc\/[^\s]+/` → `[REDACTED]`
- Expert input cap: 50 KB; truncate if exceeded
