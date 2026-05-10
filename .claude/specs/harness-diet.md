# Harness Diet — Week 1 Baseline & Plan

> Adversarial-reviewed harness slimming. Goal: cut meta-work cost without breaking
> Wave 1.6 visual-parity definition. Source review: `chore/harness-diet-week1`.

## What changed in Week 1 (this branch)

1. **CLAUDE.md Working Style rewrite** — replaced the three blocking rules
   ("no implementation without approval", "no completion claims",
   "90% certainty gate") with a single reversibility gate:
   - Irreversible (DB / contracts / merged commits / external comms /
     auth-billing-permissions / visual-surface during a parity wave)
     → stop and ask, ≥90% confidence required.
   - Reversible (intra-branch code / style / tests / naming / local refactors)
     → state assumption in one line, proceed, summarize at end.
     Approval scope made explicit: a plan/batch ack carries to its leaves;
     leaf-level re-asks are dropped except for irreversible decisions.

2. **TDD scope narrowed** — TDD remains mandatory for irreversible surface
   (auth, billing, contracts, BE routes, migrations). Reversible UI leaves
   need a single happy-path render test plus the visual-diff baseline.

3. **`warn-doc-cleanup-before-pr` scoped** — the 8-step doc cleanup
   checklist now applies only to phase-close or wave-close PRs. Intra-phase
   PRs run only step 8 (typecheck / lint). Cuts the doc-sync overhead
   that doubled the merge train in the 5/2–5/6 batch.

4. **Plugin pruning** — `claude-md-management` disabled in
   `.claude/settings.local.json` (0 invocations in last 30 days).
   Kept: `impeccable`, `playwright`, `codex` (all show real use).
   `superpowers` already false locally. `oh-my-claudecode` (OMC) was
   kept here originally but fully uninstalled on 2026-05-10 — see
   `## Week 5 supplemental diet (2026-05-10)`.

5. **opt-prompt skill family frozen** — see `Sunset clauses` below.

## What was rejected (per critic, do not apply this week)

- **Batch-level user gate replacing leaf gate (B)**: revert-loop risk on
  visual leaves. Kept leaf gate for visual-surface decisions; relaxed only
  for non-visual reversible leaves via the reversibility gate above.
- **Re-read / read-after-edit hook removal (E)**: hook block stats show
  ~1/day, not zero. Keep hooks; revisit only if 7-day count hits 0.
- **5px visual-diff tolerance (G)**: would void Wave 1.6 parity definition.
  Requires user-approved wave redefinition first. Not done.
- **batch-PR replacing leaf-PR (A)**: deferred to Week 3 pending
  baseline data. When applied, the rule will be ≤500 LOC, ≤6 files,
  one-screen-per-batch.

## Sunset clauses

- `opt-prompt`, `opt-prompt-eval`, `opt-prompt-feedback`,
  `opt-prompt-improve`: feature-frozen as of 2026-05-09. No further
  development until 6 months of usage data is collected. Delete after
  2026-11-09 if invocation count is < 50/month per skill.
- Plugin re-enable: `claude-md-management` may be re-enabled when an
  actual use case appears; until then, stays off.

## Regression metrics (measure 2026-05-16)

Track these three numbers over the next 7 days. If any regresses past the
threshold, roll back the corresponding change.

1. **Session ramp time** — minutes from new session start to first code
   edit. Baseline: collect from next 3 sessions on this branch.
   Threshold: +50% over baseline triggers a doc-sync rollback.

2. **Per-PR LOC + revert-PR ratio** — measured on PRs merged after
   2026-05-09. Baseline (5/2–5/6): mostly < 200 LOC, no reverts logged.
   Threshold: revert ratio ≥ 5% over 7 days triggers a reversibility-rule
   tightening.

3. **Hook block count** — `block-reread` + `block-read-after-edit`
   firings in the last 7 days. Baseline: 8 events / 7 days (~1/day).
   Threshold: ≥ 3 events/day means model is fighting the hooks; reverse.
   Zero events means the hooks are no longer earning their cost; relax
   the trigger or remove.

## Week 5 supplemental diet (2026-05-10)

Trigger: noticeable per-prompt freezes during Wave 2 Phase B work. Audit
showed OMC magic-word path was never used in practice while still firing
~1k+ lines of JS per prompt and per Stop. Branch: `docs/claude-harness-diet`.

Changes:

1. **OMC fully uninstalled** — `npm uninstall -g oh-my-claude-sisyphus` plus
   removal of `~/.omc/`, `~/.claude/.omc*`, `~/.claude/plugins/oh-my-claudecode/`,
   and 8 OMC hook files (`keyword-detector.mjs`, `session-start.mjs`,
   `post-tool-use.mjs`, `post-tool-use-failure.mjs`, `persistent-mode.mjs`,
   `code-simplifier.mjs`, `pre-tool-use.mjs`, `find-node.sh`) plus the
   `hooks/lib/` shared modules. GSD (`gsd-*`) is a separate plugin and
   stays — used in other repos.
2. **`~/.claude/settings.json` slimmed** — UserPromptSubmit, PostCompact,
   PostToolUseFailure blocks removed (all OMC-driven); Stop block emptied
   (was OMC `persistent-mode` + `code-simplifier`); SessionStart trimmed
   to two GSD entries. 232 → 158 lines.
3. **`~/.claude/read-once/`** — disabled (project-side
   `block-reread`/`block-read-after-edit` already cover the same role
   per spec). Still on disk in case re-enable is needed.
4. **`vocpage/.claude/settings.local.json`** — SessionStart printf for
   Serena `initial_instructions` removed (project-side `serena-hooks
   activate` already handles activation).
5. **CLAUDE.md surface** — `AGENTS.md` deleted (one-line redirect to
   `CLAUDE.md`; Codex now reads `CLAUDE.md` directly via project rule).
   `prototype/CLAUDE.md` opening duplicate (the "not a reference 2026-05-09~"
   line, already in root §1) removed.
6. **`hookify.warn-no-verify.local.md`** added — was previously text-only
   in root §3 / system prompt; now hookify catches `--no-verify` /
   `--no-gpg-sign` on `git commit|push|merge|rebase`.

Anti-pattern note (below) still applies: this is the second one-shot
diet, not a recurring loop. Next diet only when metrics regress.

## Anti-pattern: "do not optimize the harness while building the product"

This branch is a one-shot diet, not the start of a recurring optimization
loop. Once Week 1 changes are merged, harness changes pause until a
repeated failure pattern is observed in the metrics above. The external
"Build Mode / Quality Mode" doc is informative but not adopted wholesale —
vocpage's UI surface is its product surface during Wave 1.6, so "UI fast"
does not apply.
