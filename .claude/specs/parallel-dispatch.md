# Parallel Dispatch Spec (R2)

**Scope:** Every tool call in every session. Violations are tracked as R2 in the audit registry.
**Full pattern examples and rationalizations are here** — the CLAUDE.md rule is the summary; this file is the authoritative reference.

---

## The Rule

Independent tool calls MUST be sent in a single message. Two calls are independent if and only if **call B's exact arguments can be written down before call A executes**.

This is the only gate. Apply it literally:

- Can you write `Read(path/to/file.md)` right now, before the previous tool returns? → **batch it**
- Does B need a value (path, SHA, symbol name, line number) that only A's result will reveal? → sequential is valid

Everything else is a rationalization. The table at the end lists them explicitly.

---

## Violation Patterns

### 1. Subagent / Task dispatch

```
❌ Wrong
message 1: Task(subagent_type=critic, description="routing review")
message 2: Task(subagent_type=critic, description="form review")
message 3: Task(subagent_type=critic, description="datetime review")

✅ Correct
message 1: Task(subagent_type=critic, description="routing review")
           Task(subagent_type=critic, description="form review")
           Task(subagent_type=critic, description="datetime review")
```

Applies to: Task, Agent, Skill, or any subagent-dispatch tool.

### 2. Writing multiple independent files

```
❌ Wrong
message 1: Write(routing-conventions.md)
message 2: Write(error-loading-conventions.md)
message 3: Write(form-conventions.md)
...

✅ Correct
message 1: Write(routing-conventions.md)
           Write(error-loading-conventions.md)
           Write(form-conventions.md)
           Write(table-filter-conventions.md)
           Write(datetime-conventions.md)
           Write(test-conventions.md)
```

### 3. Reading multiple files

```
❌ Wrong
message 1: Read(claude-progress.txt)
message 2: Read(next-session-tasks.md)

✅ Correct
message 1: Read(claude-progress.txt)
           Read(next-session-tasks.md)
```

**The "let me read A first to decide what to read next" trap:** If you already know you will need file B from task context (e.g., progress.txt always pairs with next-session-tasks.md at session start), batch them now. Only defer to sequential if B's path is genuinely unknown until A's content is read.

### 4. Bash searches / greps

```
❌ Wrong
message 1: Bash(rg useSearchParams frontend/src)
message 2: Bash(rg zustand frontend/src)
message 3: Bash(rg useContext frontend/src)

✅ Correct — batch as separate Bash calls or chain with &&
message 1: Bash(rg useSearchParams frontend/src)
           Bash(rg zustand frontend/src)
           Bash(rg useContext frontend/src)
```

### 5. Verification steps (typecheck / test / lint)

```
❌ Wrong
message 1: Bash(npm run typecheck -w frontend)
message 2: Bash(npm run test -w frontend -- --run | tail -20)
message 3: Bash(npm run lint -w frontend)

✅ Correct — one message or && chain
message 1: Bash(npm run typecheck -w frontend && npm run test -w frontend -- --run | tail -20)
```

Reference: `.claude/CLAUDE.md §"Test batch"` — already required by existing rule.

### 6. Mixed tool types

Batching is not limited to like-with-like. Cross-tool batching is the norm:

```
✅ Correct
message 1: Read(src/components/VocList.tsx)
           Bash(rg "useVocStore" frontend/src)
           Bash(git log --oneline -5)
```

---

## When Sequential IS Valid

Sequential messages are valid only when call B needs a specific runtime value from call A's result:

```
✅ Valid — B needs the commit SHA
message 1: Bash(git commit -m "...")
message 2: Bash(git status)            ← verifies commit result

✅ Valid — B's path is unknown until A runs
message 1: Bash(rg "configPath" --json | jq -r '.data.path')
message 2: Read(<path extracted from result>)

✅ Valid — B's exact content depends on A's output
message 1: Bash(npm run build 2>&1 | tail -5)
message 2: Edit(fix the error reported in A's output)
```

If you can hardcode B's arguments right now → it is independent → batch it.

---

## Exceptions (closed list)

Only these two patterns justify sequential calls that don't meet the dependency test:

1. **Same-file Edit where B's patch location depends on A's result**: B must insert/replace at a line number or symbol that A's Edit creates or moves. Default: batch Edits to the same file in one message — Claude Code applies non-overlapping patches sequentially without conflict.

2. **Process-ordering side effects (closed allowlist)**: `DB migration → seed`, `npm install → build`, `git commit → git push`. No other tool combinations qualify.

Any other justification is a rationalization. See below.

---

## Common Rationalizations (all invalid)

| Rationalization                                              | Why it fails                                                                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| "These feel like separate steps"                             | Feeling ≠ dependency. Apply the argument-writability gate.                                                               |
| "Let me read A first to know what else to read"              | If B was predictable from task context, batch it now.                                                                    |
| "I want to be careful, one at a time"                        | Sequential without dependency is a rule violation, not caution.                                                          |
| "The user might want to review each step"                    | User controls cadence via approval prompts, not message count.                                                           |
| "Batching looks noisy"                                       | Cosmetic preference, not a rule.                                                                                         |
| "I'll batch the next ones once I see this works"             | Delayed batching ≠ batching. Retroactive grouping is not allowed.                                                        |
| "These tools might conflict if batched"                      | Conflicts arise from overlapping patches, not batching itself. Overlapping patches need fixing, not sequential dispatch. |
| "These have different latency profiles"                      | Irrelevant. All calls in a batch proceed concurrently.                                                                   |
| "This is a destructive operation so I want to be sequential" | Destructiveness → user confirmation prompt, not sequential dispatch.                                                     |
| "I need to check A worked before doing B"                    | Only valid if B's arguments change based on A's result. If B is always the same, batch.                                  |

This list is non-exhaustive. Any rationalization not reducible to the dependency gate (can I write B's args now?) is invalid by default.

---

## Background Tasks

`run_in_background: true` counts as part of the current message's batch. You can dispatch a background build and continue with other independent tool calls in the same message:

```
✅ Correct
message 1: Bash(npm run build, run_in_background=true)
           Read(src/components/VocList.tsx)
           Bash(rg "useVocStore" frontend/src)
```

The next message begins a new batching context — it does not need to wait for the background task unless it depends on its result.

---

## Detection

Every assistant turn with ≥1 tool call is logged. A turn whose first tool call is independent of the previous turn's last result is auto-flagged as R2 by the session-audit skill. R2 is tracked in `.claude/audit/registry.json` and recurs in stats across sessions. This spec is the escalated fix after a prior CLAUDE.md rule failed (regression confirmed 2026-05-05).
