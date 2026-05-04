---
name: opt-prompt-improve
description: Internal helper invoked ONLY when the user types /opt-prompt-improve. Analyzes opt-prompt-log.jsonl and feedback.jsonl across Tier 0-3, presents numbered proposals, and applies approved changes directly to skill files with user confirmation. Do NOT auto-trigger on keywords like "improve", "review", "analyze", or "feedback" — only on explicit /opt-prompt-improve.
---

# opt-prompt-improve

Sister skill to `opt-prompt` (normalize) and `opt-prompt-eval` (retro). This skill handles **skill improvement**: analyzing the log + feedback to generate proposals, getting user approval, and editing skill files.

## When to use

- User explicitly invokes `/opt-prompt-improve`.
- Do **not** auto-trigger on any keyword.
- Do **not** write retro rows or normalize prompts here — those belong to `opt-prompt-eval` and `opt-prompt` respectively.

## In-flight guard (run before any analysis)

Count active `decided` rows with no matching active `retro`:

```bash
python3 - <<'EOF'
import json, os
log_path = os.path.expanduser("~/.claude/opt-prompt/opt-prompt-log.jsonl")
if not os.path.exists(log_path):
    print("INFO: opt-prompt-log.jsonl not found — no retro data yet. Skipping Tier 1-3.")
    exit(0)
latest = {}
for i, line in enumerate(open(log_path), 1):
    line = line.strip()
    if not line:
        continue
    try:
        r = json.loads(line)
        key = (r.get("decision_id", ""), r.get("phase", ""))
        latest[key] = r
    except json.JSONDecodeError:
        print(f"[warn] skipped malformed line {i} in opt-prompt-log.jsonl")
decided = {did for (did, ph), r in latest.items() if ph == "decided" and r.get("status") == "active"}
retrod  = {did for (did, ph), r in latest.items() if ph == "retro"   and r.get("status") == "active"}
inflight = decided - retrod
if inflight:
    print(f"WARNING: {len(inflight)} task(s) in-flight (no retro yet) — excluded from cohort analysis:")
    for did in sorted(inflight): print(f"  {did}")
EOF
```

If the log file does not exist, emit `INFO: opt-prompt-log.jsonl not found` and skip Tier 1–3 (Tier 0 still runs from `feedback.jsonl`). Print in-flight warnings if any tasks are unretro'd, then proceed with only fully-closed decisions.

## Workflow

### Step 1 — Tier 0: User-Mandated Proposals

Read `~/.claude/opt-prompt/feedback.jsonl`. Group all entries by `id`; for each `id`, take the **latest entry** (last line wins). Exclude entries where the latest row has `resolved: true`.

- If the file does not exist or all entries are resolved, skip Tier 0 silently.
- If a line fails JSON parsing, emit `[warn] skipped malformed line N in feedback.jsonl` and continue.
- List each unresolved entry as: `[<category>] <id> — <feedback>`

Tier 0 proposals are **user-mandated** — they always appear first and are never suppressed by sample-size gates.

### Step 2 — Tier 1: Qualitative Cohorts

Read `~/.claude/opt-prompt/opt-prompt-log.jsonl`. Join `decided` ↔ `retro` rows by `decision_id`. Exclude `status:"void"` rows and in-flight decisions (decided but no retro yet).

- **Global hit rate** (`correct` / non-void total). Require ≥5 non-void entries before emitting any proposal.
- **Per scope**: hit rate per `scope_decided`. Require ≥5 entries **for that scope** before flagging. Scopes below threshold → counts only, no proposal.
- **Per-scope flag**: scope with ≥5 entries AND wrong-rate ≥40% → "needs revision"; propose specific signal/threshold changes referencing the dominant verdict (e.g., recurring `undersized` → add a signal; recurring `oversized` → remove a gate).
- **Top 3 recurring `missed_gates`** → candidate additions to opt-prompt's Expand list.
- **Top 3 recurring `unnecessary_gates`** → candidate removals from the rubric.
- **Mis-routed cluster**: if `mis-routed` ≥3 entries, separate diagnosis — rubric scope was right, tool selection logic wasn't.

### Step 3 — Tier 2: Quantitative Cohorts

Require ≥5 retros with non-null `session_summary`. Read directly from the JSONL row's `session_summary` — no sidecar load needed.

Compare median values per verdict cohort (require N≥5 per cohort before reporting):

- `tokens.grand_total` — `oversized` cohort should not exceed `correct`; if it does, added gates are not paying for themselves.
- `cache_invalidation_events` — elevated in `undersized` cohort = scope creep causing context churn.
- `subagent_calls` — elevated in `undersized`/`mis-routed` = rubric under-allocated workflow tier.
- `bash_failures` — elevated in any cohort = pre-flight check candidate.
- `top3_tools` — recurring tool dominating `oversized` cases = routing rule violation.
- `claudemd_reads` — high count across many tasks → CLAUDE.md slimming candidate.

**Cross-session caveat**: when `session_id_decided != session_id_retro`, `tokens_delta` is `null` — exclude from token cost comparisons. Other Tier-2 metrics (counts, tool patterns) are still valid. Flag the cohort as cross-session-mixed in the report.

**Legacy rows**: rows without `session_summary` → fall back to top-level `tokens_at_decision`/`tokens_at_retro`/`tokens_delta` if present (mapping old `cache_creation` → `cache_create`, old `input` → `input_uncached`), else exclude from Tier-2.

**Token-delta methodology**:

- Cost metric: `tokens_delta.input_uncached + tokens_delta.cache_create` (exclude `cache_read` — ~10% price, largely shared).
- Discard rows where `input_uncached` or `cache_create` is negative (compaction contamination).
- Require N≥5 non-null, non-outlier rows before computing median + IQR.

### Step 4 — Tier 3: Sidecar Deep-Dive

Only when Tier 2 flags a cohort. Read `~/.claude/opt-prompt/snapshots/<id>.{decided,retro}.json` for the flagged ids. Look at fields absent from `session_summary`:

- `by_prompt[]` — which user prompts dominated tokens
- `tool_use_details.read.top_files` — which files were over-read
- `subagents.agents[]` — which subagent type/prompt drove cost
- `pause_distribution` — human-in-the-loop gaps

Use these to make proposals **specific** (e.g., "rubric should down-weight tasks where top read file is `frontend/CLAUDE.md` ×N").

### Step 5 — Numbered Proposal List

After all tiers, emit a consolidated numbered list:

```
Proposals
─────────
[T0] #1  [output-format] fb-20260504T184423-5c7fa6
         Phase 필드가 '설계 결과물'이 아닌 '탐색 순서'여야 함.
         → opt-prompt/SKILL.md §Phase output format 수정

[T1] #2  scope=medium wrong-rate 60% (3/5), dominant: undersized
         → opt-prompt/SKILL.md Expand list에 `contract-test` gate 추가

[T2] #3  oversized cohort median tokens > correct cohort (+40%)
         → opt-prompt/SKILL.md Trim list에서 `post-PR codex review` 조건 완화

none     샘플 부족으로 Tier-2 추가 제안 없음 (N<5)
```

If no proposals exist at any tier, emit: `제안 없음 — 현재 로그/피드백으로는 충분한 패턴이 없습니다.` and STOP.

### Step 6 — User Approval Gate

After the proposal list, ask exactly:

> 적용할 제안 번호? (전체 / 1,3 / none)

Wait for the user's response. Parse:

- `전체` or `all` → apply all proposals
- Digits / commas / spaces → extract all integers with `re.findall(r'\d+', response)`, deduplicate, sort
  - If any extracted number exceeds the proposal count, ask once: "다음 번호는 무효합니다: [X]. 다시 입력해주세요."
- `none`, `취소`, `x`, or empty response → STOP without editing

### Step 7 — Apply

For each approved proposal, edit the target SKILL.md using the `Edit` tool. Rules:

- **One edit per proposal** — do not batch unrelated proposals into a single `Edit` call.
- **Surgical changes only** — change only the exact lines the proposal targets; do not reformat surrounding text.
- **Never delete the `## Anti-patterns` section** of any skill.
- If the edit would conflict with another approved proposal (overlapping lines), apply in numbered order and re-read the file between edits.
- **"Ambiguous"** means: (a) the proposal describes only intent without enough text to form a unique `old_string` for the `Edit` tool, or (b) the `Edit` tool returns a mismatch/not-found error. In either case, pause and ask: "제안 #N의 대상 위치를 찾지 못했습니다. 수동 편집하시겠어요?" Do NOT mark the proposal as applied.
- **"Applied"** means the `Edit` tool returned success with no error. Skipped (ambiguous) proposals are NOT applied regardless of user approval.

After all edits, show a summary:

```
적용 완료
─────────
#1 → opt-prompt/SKILL.md 수정됨
#2 → opt-prompt/SKILL.md 수정됨
건너뜀: #3 (위치 모호 — 수동 편집 필요)
```

### Step 8 — Resolve Feedback

For each **applied** (Edit tool success) Tier 0 proposal linked to a `fb-*` id, append a resolve tombstone using the python3 block below. Run once per id — do NOT hand-roll JSON.

```bash
FEEDBACK_ID="<fb-id>" python3 << 'PYEOF'
import json, datetime, os
fb_id = os.environ["FEEDBACK_ID"]
ts = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
tombstone = {"id": fb_id, "ts": ts, "resolved": True, "resolved_ts": ts}
log_path = os.path.expanduser("~/.claude/opt-prompt/feedback.jsonl")
with open(log_path, "a", encoding="utf-8") as f:
    f.write(json.dumps(tombstone, ensure_ascii=False) + "\n")
print(f"Resolved: {fb_id}")
PYEOF
```

**Skipped proposals are never resolved** — if Step 7 marked a proposal as skipped (ambiguous), do not run the resolve block for its `fb-*` id. It remains unresolved and will reappear in the next `/opt-prompt-improve` run.

Do NOT resolve feedback entries for Tier 1/2/3 proposals — those are derived from log analysis, not user-submitted feedback.

## Analysis join

Group rows by `decision_id`. For each group, take the **latest row per (decision_id, phase)**. If that latest row has `status:"void"`, exclude that phase. A decision is fully active iff its latest `decided` AND latest `retro` are both `status:"active"`.

Legacy rows (before unique decision_id scheme) may share an id across tasks — additionally filter by `task` when grouping.

## Verdict derivation (for Tier 1 cohort assignment)

Evaluated in order; first match wins:

1. `status === "void"` → excluded.
2. `outcome === "expanded"` AND `tool_swapped === true` → `mis-routed`.
3. `outcome === "expanded"` AND `missed_gates.length > 0` → `undersized`.
4. `outcome === "expanded"` AND `missed_gates.length === 0` → `scope-creep`.
5. `outcome === "as-planned"` AND `unnecessary_gates.length > 0` AND not in `preserved` → `oversized`.
6. otherwise → `correct`.

## Anti-patterns

- Don't auto-trigger on keywords — only on explicit `/opt-prompt-improve`.
- Don't skip the in-flight guard — proposals derived from incomplete retros are noise.
- Don't batch multiple proposal edits into one `Edit` call — each proposal is an independent surgical change.
- Don't resolve Tier 1/2/3 feedback via `--resolve` — only Tier 0 entries (user-submitted, linked to a `fb-*` id) get resolved on apply.
- Don't hand-roll resolve tombstones — always invoke `/opt-prompt-feedback --resolve <id>` so the tombstone format stays consistent.
- Don't emit proposals when sample size is below threshold — counts-only output is correct when N < 5.
- Don't edit any skill file without user approval — the gate in Step 6 is mandatory.
- Don't run while tasks are mid-flight if you want complete Tier-2 metrics — in-flight rows are excluded from cohort math but their absence may skew medians; mention this if ≥3 tasks are in-flight.
