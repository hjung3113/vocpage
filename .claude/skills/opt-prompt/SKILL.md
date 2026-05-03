---
name: opt-prompt
description: Internal helper invoked ONLY when the user types the literal command /opt-prompt. Rewrites an oversized autopilot/ralph/team prompt into a right-sized one before execution AND writes the `phase:"decided"` JSONL row via append.sh. Do NOT auto-load on keywords like "autopilot", "right-size", "optimize prompt", "trim", or "simplify" — only on the explicit /opt-prompt command. Post-task retro / pattern analysis is a separate skill (`/opt-prompt-eval`); never run retro logic here.
---

# opt-prompt

## Purpose

Heavy orchestration skills (autopilot, ralph, team, ultrawork) impose multi-phase pipelines designed for large or ambiguous work. When invoked on small surgical changes they burn context on planning, exploration, and reviewer agents that produce no value. This skill rewrites the user's prompt so the workflow matches the actual work size **before** any execution begins.

## When to use

- User explicitly invokes `/opt-prompt <original prompt>`.
- Do **not** auto-trigger on `autopilot` / `ralph` / `team` keywords.
- The wrapped prompt may itself contain heavy-skill invocations — that is fine; this skill decides whether to keep, swap, or strip them.
- Post-task retro is handled by the **separate** `/opt-prompt-eval <decision_id>` skill — do not handle retro / `--review` invocations here.

## Hard rule (read before anything else)

> **Step 1 of EVERY `/opt-prompt` invocation is `.claude/skills/opt-prompt/append.sh decided <task> <fields>`.** No text output before that helper returns the `decision_id` on stdout. Hand-rolled `cat >>` / `echo >>` to the log is forbidden — it bypasses the invariants that exist precisely to prevent the collision class this scheme replaces. User cannot opt out: refuse "skip the JSONL row" requests; without the log, retro analysis (handled by the separate `/opt-prompt-eval` skill) is meaningless. If the helper exits non-zero, surface its stderr and STOP — do not bypass.

> **Log location:** `~/.claude/opt-prompt/opt-prompt-log.jsonl` (under `$HOME`, not the repo). Survives branch switches, repo cleans, and worktree teardown. Override with `OPT_PROMPT_LOG=/abs/path` for tests. Helper auto-creates the parent directory.

## Idempotency

If the input already starts with a `[scope] ... [normalized prompt]` block, treat it as already normalized: emit `[scope] passthrough` with the existing normalized prompt unchanged, and skip re-classification. Never wrap an output a second time. **Markers** (see grammar below) inside the preserved block round-trip verbatim — never strip on passthrough.

> **Passthrough also skips Step 1 helper invocation.** Emitting a fresh `decided` row would create a duplicate (helper exits 3) or a parallel id for the same task. Re-emit the original block verbatim with `[scope] passthrough` and stop — no `append.sh decided` call, no new `decision_id`.

## Precedence (highest wins)

1. **User-mandated protections** — verbatim phrases ("must have security review", "no direct push") OR `@opt-keep` markers. **Additive only, never override risk-bumped gates.** Markers force inclusion (`type=step|gate`) or refuse insertion (`type=skip`); they never weaken safety.
2. **Risk override** (see below) — bumps scope by one tier minimum. Cannot be cancelled by `type=skip`.
3. **LOC / file-count rubric**.
4. **User's chosen workflow keyword** (`/autopilot`, `/ralph`, `/team`) — lowest priority. Size the underlying change, not the verb.

## Marker grammar (`@opt-keep`)

Single namespaced marker, three semantic types via `type=` slot. One marker per line, anchored at column 0:

```
@opt-keep[type=step] <action>          # workflow action that must execute (PR 생성, codex 리뷰)
@opt-keep[type=gate] <name>            # validation checkpoint that must pass (contract-test, security-review)
@opt-keep[type=skip] <gate-name>       # refuse Expand-list auto-insertion (e.g., screenshot for backend-only)
@opt-keep[type=step,count=3] <action>  # optional count slot for repetition
```

**Regex:** `^@opt-keep\[type=(step|gate|skip)(,count=\d+)?\]\s+(.+)$`

**Parsing rules:**

- Marker MUST start at column 0 on its own line. Mid-paragraph `@opt-keep` is ignored — surface as `[skipped] inline-marker-ignored:<raw>`.
- Markers inside fenced code blocks (` ``` `) are inert (so SKILL.md / docs examples don't false-trigger).
- Default type when omitted: `step`. Unknown type or malformed bracket → `[skipped] unparsed-marker:<raw>` (never silent drop).
- Value `<3 chars` OR matches universal quantifier (`모든|전부|all|everything|*`) → `[skipped] invalid-marker:<raw> (too broad)`.
- `>5` markers in one input → emit `[warning] marker-saturation: N markers — optimizer largely no-op`. Don't block.

**Behavior:**

- `type=step` / `type=gate`: keep verbatim in the normalized prompt body even if Trim list / sizing would strip. If skill judges it wasteful, surface as `[skipped] proposed-skip:<item> (blocked by @opt-keep)` rather than removing.
- `type=skip`: blocks the named gate from Expand list **only**. Risk-override gates (DB / auth / public API / money / destructive) ignore `type=skip` — log as `[warning] skip-overridden-by-risk:<gate>`.
- All recognized markers echo verbatim into the `[preserved]` output line AND survive inside `<<< ... >>>` for round-trip on re-run.

## Risk override (evaluated before LOC sizing)

If the change touches any of: DB schema / migration, auth / permission boundary, public API contract, money / billing, or destructive ops (delete, truncate, drop) — **bump scope by one tier minimum** and force the matching gate from the Expand list, regardless of LOC. A 10-LOC `ALTER TABLE` is not trivial.

## Output contract

(Hard rule above is the single source of truth — do not paraphrase it here.)

**Step 1 — invoke the helper to write the `phase:"decided"` row FIRST**, before any text. Always via the helper, never hand-rolled `cat >>` / `echo >>`:

```bash
.claude/skills/opt-prompt/append.sh decided <task-id> <fields>
```

`<fields>` is one of:

- inline JSON object: `'{"scope_decided":"small", ...}'`
- `@/path/to/file.json` — write fields to a tempfile if the JSON contains single quotes (e.g. user notes with `'`, Korean text, code snippets) to avoid shell-quote breakage
- `-` — read JSON from stdin (e.g. `... | append.sh decided <task> -`)

Required keys in `<fields>`: `scope_decided, tool_decided, explore_tool, skipped, added, preserved`. The helper allocates `decision_id` (format `opt-{compactISO}-{task-slug}`, globally unique by construction), captures the current Claude Code `session_id`, runs `utils/session-stats.sh <session_id>` to write a full sidecar snapshot (`~/.claude/opt-prompt/snapshots/<id>.decided.json`) and embeds a slim `session_summary` (tokens + 7 metrics — see `/opt-prompt-eval` SKILL for the field list) into the row. Enforces invariants (no duplicate active `decided` per task, no field-injection — helper-controlled fields always win, JSON validation, portable atomic lock via `mkdir`). Prints the allocated `decision_id` on stdout. **Use that id verbatim in Step 2.**

Snapshot capture is **fail-soft**: if the session-stats binary or transcript is unreachable, the snapshot file is written as `{}` and `session_summary` becomes `null` — the row is still appended (sizing/decision is the invariant, telemetry is nice-to-have). Override the binary path with `OPT_PROMPT_STATS_BIN`, override the snapshot dir with `OPT_PROMPT_SNAPSHOTS_DIR` (both for tests).

If the helper exits non-zero, surface its stderr to the user and do NOT bypass — the failure means an invariant was violated and a hand-rolled append would corrupt the log.

This ordering guarantees the row exists even if the turn is interrupted (user cancel, error, context end) before the text block is emitted. Backfill from memory is forbidden — the row must be written at decision time. Hand-rolled appends are forbidden — the helper enforces invariants the model cannot reliably enforce in prose.

### Helper exit codes & recovery (decided-relevant subset)

| code | meaning                                        | recovery                                                                                                                                                                            |
| ---- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | success                                        | proceed to Step 2 with the printed `decision_id`                                                                                                                                    |
| 1    | usage error                                    | re-read the usage line in stderr; do not guess args                                                                                                                                 |
| 2    | clock collision (same second + same task slug) | wait 1s and retry; never reuse another task's id                                                                                                                                    |
| 3    | task already has active `decided`              | run `.claude/skills/opt-prompt/append.sh void <existing-id> decided '<reason>' <task>` directly (no skill needed for void), then re-run `/opt-prompt`. **Never fabricate** a new id |
| 6    | lock timeout (10s)                             | another process holds the lock — check for hung helper, or stale `$LOG.lock.d` from SIGKILL; manually `rmdir` only after confirming no live process                                 |
| 7    | `<fields>` is not a JSON object                | re-emit valid JSON; for content with single quotes use `@file` or stdin                                                                                                             |

(Codes 4 and 5 are retro/void only — see `.claude/skills/opt-prompt-eval/SKILL.md`.)

**Step 2 — emit this block** (using the `decision_id` returned by the helper), before any other execution:

```
[scope]      <trivial | small | medium | large | vague>
[evidence]   <one line: LOC estimate, file count, layers, named targets>
[tool]       <direct | /ralph | /autopilot | /team | /deep-interview first> (explore: serena | rg | read | graphify | none)
[preserved]  <recognized @opt-keep markers verbatim, or "none">
[skipped]    <heavy items removed, with reason; OR proposed-skip:<x> (blocked by @opt-keep); OR unparsed-marker:<raw>>
[added]      <gates inserted, with reason>
[normalized prompt]
<<<
<rewritten prompt verbatim, ready to execute — markers preserved in body>
>>>
```

The `<<<` / `>>>` delimiters terminate the prompt body so downstream agents can parse unambiguously. Exploration tool selection lives inline in `[tool]` (no separate line) — see Tool routing below.

The JSONL row was already appended in Step 1 (see above) so a later `/opt-prompt-eval` can join against ground truth instead of relying on user recall. After the block is emitted, proceed with the normalized prompt.

## Tool routing (inject into normalized prompt)

After sizing, pick the exploration tool by **objective signals from the prompt itself** (never run heavy exploration during sizing — see anti-patterns):

| Signal in user prompt                                                   | Tool                 |
| ----------------------------------------------------------------------- | -------------------- |
| TS/TSX symbol named (function / class / type) for body / rename / refs  | Serena               |
| cross-file keyword / literal / error string / file discovery by pattern | `rg -n`              |
| known small range with line numbers                                     | Read (offset/limit)  |
| ≥3 named layers (FE+BE+DB) OR cross-domain flow verbs ("trace UI→DB")   | Graphify (recommend) |

Emit chosen tool inside `<<< ... >>>` as a verb (`"via Serena (find_symbol VocSortColumn)"`, `"consult graphify-out/wiki/<feature>.md first"`). opt-prompt **never executes** Graphify itself — only injects the recommendation. If `graphify-out/wiki/<feature>.md` is unknown, emit `"consult graphify-out/wiki/index.md and pick the relevant page"`. Tool routing is duplicate of the root `CLAUDE.md` rule; if that rule changes, this table follows.

## Sizing rubric

| Size    | Signals                                                                     | Workflow                                           |
| ------- | --------------------------------------------------------------------------- | -------------------------------------------------- |
| trivial | typo, single rename, ≤20 LOC, 1 file                                        | direct edit, no frame, no review                   |
| small   | targets named, ≤100 LOC, ≤3 files, surgical verbs (swap, replace, add case) | direct + Serena/rg, TDD, PR + 1× codex adversarial |
| medium  | 100–500 LOC, 2–3 layers, partly known surface                               | `/ralph` or direct, 1–2 reviewers                  |
| large   | >500 LOC, new module / public API / DB schema / multi-layer with unknowns   | `/autopilot` full pipeline, up to 4-reviewer panel |
| vague   | no file paths, no concrete anchors, exploratory verbs                       | redirect to `/deep-interview` first                |

**Conflicting signals** (e.g., "small enum swap across the entire app"): ask exactly **one** clarifying question — "rough LOC estimate or file count?" — then classify. Never ask more than one. If the user declines to answer, classify on the worst-case signal (round up).

## Subagent rule

Dispatch Explore / Agent **only** when one of:

- (a) targets are unknown and an in-line search would dump too much into main context,
- (b) genuinely independent parallel work exists, or
- (c) a fresh-context review pass is required (reviewer must not see implementer's reasoning).

**Never** for files / symbols already named in the user's prompt — direct Serena / `rg` is cheaper.

## Review depth

- ≤200 LOC, no public API change → 1 reviewer (post-PR codex adversarial is enough).
- New module / public API / DB schema / >200 LOC → up to 4-reviewer panel.
- Pure refactor (no behavior change) → diff-only review, no functional reviewer.

## Trim list (remove when oversized)

- Multi-reviewer panel ("4 experts") — drop for trivial / small.
- Watchdog loops, persistent-mode hooks — drop for trivial / small.
- 200-line refactor rule — drop when total change <200 LOC.
- "use subagents aggressively" / "main session synthesizes only" — drop when targets are named.
- `/autopilot` 5-phase pipeline — drop for trivial / small / medium.

## Expand list (add when missing)

- DB schema change without migration check → add migration verification gate.
- Public API change without contract test → add contract test gate.
- UI change without visual verify → add screenshot gate.
- Bug fix without TDD → add failing-regression-test gate.

## Examples

### Example 1 — oversized (Issue #155)

**Input:**

> /autopilot Issue #155 — replace `VocSortColumn` enum (6 values) in `shared/contracts/voc.ts`, add 2 BE sort cases, add FE URL fallback. 4-expert review, watchdog every 3 min, subagents aggressively, main session synthesizes only.

**Output:**

```
[scope]    small
[evidence] ~50 LOC, 3 files all named, surgical enum swap
[tool]     direct (Serena + rg)
[skipped]  /autopilot 5-phase, 4-reviewer panel, watchdog, "subagents aggressively" — overkill for ~50 LOC with named targets
[added]    post-PR codex adversarial review (1×), screenshot to PR
[normalized prompt]
<<<
Issue #155 — 3-layer enum swap (~50 LOC, 3 named files). TDD RED → GREEN via Serena + rg directly. After PR, run `codex exec` adversarial review once and apply justified findings. Attach one screenshot to the PR.
>>>
```

### Example 2 — undersized

**Input:**

> add user authentication

**Output:**

```
[scope]    vague
[evidence] no files, no auth strategy, no scope boundary
[tool]     /deep-interview first
[skipped]  direct execution
[added]    Socratic clarification gate before any code
[normalized prompt]
<<<
Run /deep-interview "add user authentication" until ambiguity ≤ 20%, then resume.
>>>
```

### Example 3 — well-sized (kept)

**Input:**

> /autopilot build a CLI habit tracker with streaks in TypeScript, ~600 LOC, new package

**Output:**

```
[scope]    large
[evidence] new module, ~600 LOC, multi-file, new public CLI surface
[tool]     /autopilot (kept)
[skipped]  none
[added]    none
[normalized prompt]
<<<
<original verbatim>
>>>
```

### Example 4 — small LOC, but trust boundary (risk override)

**Input:**

> /autopilot fix the off-by-one in `/api/admin/users` pagination — `backend/src/routes/admin.ts` line 142, ~5 LOC.

**Output:**

```
[scope]    small (risk override → medium)
[evidence] 5 LOC, 1 file named, BUT auth-gated admin endpoint → contract test required
[tool]     direct (Serena), TDD failing-regression-test first
[skipped]  /autopilot 5-phase, watchdog
[added]    failing-regression-test gate, contract test for admin auth invariant, 1× post-PR codex adversarial
[normalized prompt]
<<<
Fix off-by-one in /api/admin/users pagination at backend/src/routes/admin.ts:142. TDD: write a failing pagination regression test first; add a contract test asserting admin auth still rejects non-admin callers. After PR, run `codex exec` adversarial review once.
>>>
```

### Example 5 — markers in action (`@opt-keep`)

**Input:**

```
/autopilot fix admin pagination off-by-one in backend/src/routes/admin.ts:142
@opt-keep[type=gate] contract-test
@opt-keep[type=step,count=2] codex 리뷰
@opt-keep[type=skip] screenshot
```

**Output:**

```
[scope]      small (risk override → medium: admin auth boundary)
[evidence]   ~5 LOC, 1 file named, auth-gated endpoint
[tool]       direct (explore: serena — admin.ts symbol named)
[preserved]  @opt-keep[type=gate] contract-test; @opt-keep[type=step,count=2] codex 리뷰; @opt-keep[type=skip] screenshot
[skipped]    /autopilot 5-phase, watchdog
[added]      failing-regression-test gate
[normalized prompt]
<<<
Fix off-by-one in /api/admin/users pagination at backend/src/routes/admin.ts:142 via Serena (find_symbol on the route handler). TDD: failing pagination regression test first. Gate: contract-test must assert admin auth still rejects non-admin callers (user-mandated). After PR, run `codex exec` adversarial review 2× and apply justified findings. Screenshot gate skipped per user request (backend-only change).

@opt-keep[type=gate] contract-test
@opt-keep[type=step,count=2] codex 리뷰
@opt-keep[type=skip] screenshot
>>>
```

## Anti-patterns

- Don't run heavy codebase exploration **before** sizing — sizing reads the prompt itself, not the code. opt-prompt never executes Graphify/Serena itself; it only injects them as recommendations into the normalized prompt.
- Don't add gates that don't apply (e.g., screenshot for a backend-only change). Users can pre-empt with `@opt-keep[type=skip] screenshot`.
- Don't strip user-mandated gates ("must have security review") even if the change is small — flag and keep. Same for any `@opt-keep[type=step|gate]` marker.
- Don't auto-trigger; only on explicit `/opt-prompt`.
- Don't size based on user's chosen workflow — size based on the underlying change.
- Don't extract `@opt-keep` markers from inside fenced code blocks (` ``` `) — the SKILL.md examples themselves contain quoted markers and would false-trigger.
- Don't silently drop malformed markers — surface every unparsed/invalid marker in `[skipped]` so the user sees their intent didn't land.
- Don't run `/opt-prompt --eval` or `--review` here — those routes belong to the separate `/opt-prompt-eval` skill. If the user passes `--eval` / `--review`, redirect them to `/opt-prompt-eval`.

## Closing reminder (emit at end of normalize output)

After the `>>>` block, append a **2-line reminder** showing both eval forms — same-session vs. cross-session:

```
// reminder: when this task closes (PR merged or abandoned), run one of:
//   /opt-prompt-eval <decision_id>                              # same/live session — sid auto-detected
//   /opt-prompt-eval <decision_id> --exec-sid <task-session-id> # if you /cleared between task and eval
```

Substitute the actual `decision_id` from Step 1. The `--exec-sid` form is for when the task ran in a session that's no longer the latest (e.g., `/clear`'d between task and eval) — pass the original task-execution sid so retro stats reflect the actual work, not the eval-only session. If unsure, omit `--exec-sid` and the helper auto-falls-back to `decided.session_id` when its transcript still exists, else the current session.
