# opt-prompt-feedback

Sister skill to `opt-prompt` and `opt-prompt-eval`. Captures free-form human feedback about opt-prompt skill behavior for incorporation during `/opt-prompt-eval --review`.

## When to use

- User explicitly invokes `/opt-prompt-feedback [inline feedback]`
- Use anytime opt-prompt or opt-prompt-eval behavior was unexpected or wrong
- Use when a retro `note` field was insufficient for the full observation

## Storage

`~/.claude/opt-prompt/feedback.jsonl` — append-only, one JSON object per line.
Parent dir auto-created on first write.

## Schema

**Creation entry:**

```json
{
  "id": "fb-{compactISO}-{6-char-md5-slug}",
  "ts": "<ISO UTC>",
  "category": "<category vocab>",
  "feedback": "<free-form text>",
  "related_decision_id": "opt-...-slug | null",
  "resolved": false
}
```

**Resolve tombstone** (appended by `--resolve`, never overwrites):

```json
{
  "id": "<same id as creation entry>",
  "ts": "<ISO UTC of resolution>",
  "resolved": true,
  "resolved_ts": "<ISO UTC>"
}
```

Analysis always takes the **latest entry per `id`**. A tombstone with `resolved: true` supersedes the creation entry.

**Category vocab:** `rubric` | `directive-parsing` | `gate` | `output-format` | `workflow` | `other:<tag>`

## Workflow

### Standard mode — `/opt-prompt-feedback [inline text]`

1. If inline text is provided after the command, use it as `FEEDBACK_TEXT` and skip the feedback prompt. Ask only for category (and related_id if not obvious from context). Otherwise ask:
   - "피드백 내용? (한 단락)"
2. Ask: "카테고리? (rubric / directive-parsing / gate / output-format / workflow / other:<tag>)"
   - Infer from inline text if obvious: mentions "Phase" or "normalized prompt structure" → `output-format`; mentions "\*\*필수사항" or "directive" or "instruction" → `directive-parsing`; mentions "gate" or "added/skipped" → `gate`; mentions "retro" or "feedback" or "note field" → `workflow`; mentions "rubric" or "scope" or "sizing" → `rubric`. When ambiguous, ask.
3. Ask: "관련 decision_id? (opt-... 또는 Enter로 생략)"
4. Write entry using the env-var python3 block below.
5. Confirm: `Feedback recorded: <id>`

### Resolve mode — `/opt-prompt-feedback --resolve <id>`

Append a tombstone entry with the same `id` and `"resolved": true`. Never edit existing entries.

```bash
FEEDBACK_ID="<id to resolve>" python3 << 'PYEOF'
import json, datetime, os

fb_id = os.environ["FEEDBACK_ID"]
ts = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
tombstone = {
    "id": fb_id,
    "ts": ts,
    "resolved": True,
    "resolved_ts": ts
}
log_path = os.path.expanduser("~/.claude/opt-prompt/feedback.jsonl")
with open(log_path, "a", encoding="utf-8") as f:
    f.write(json.dumps(tombstone, ensure_ascii=False) + "\n")
print(f"Resolved: {fb_id}")
PYEOF
```

### List mode — `/opt-prompt-feedback --list`

Print all unresolved entries (latest per id, `resolved: false`) as a numbered table.
If no unresolved entries exist (or the file is missing/empty), print: `"No unresolved feedback entries. Run /opt-prompt-eval --review to see resolved history."`

```
1. [directive-parsing] fb-20260504T184423-ee41a7 — 사용자가 프롬프트 뒤에 **필수사항...
2. [output-format]     fb-20260504T184423-5c7fa6 — large scope + planning 동사...

Run /opt-prompt-eval --review to see these as Tier 0 proposals.
```

## Writing the entry

Use env-var injection for JSON safety (handles Korean, quotes, special chars without shell escaping):

```bash
FEEDBACK_CATEGORY="directive-parsing" \
FEEDBACK_TEXT="피드백 내용 여기에" \
FEEDBACK_RELATED="opt-20260504T183535Z-fe-convention-refactor" \
python3 << 'PYEOF'
import json, datetime, hashlib, os

category = os.environ["FEEDBACK_CATEGORY"]
feedback_text = os.environ["FEEDBACK_TEXT"]
related_id = os.environ.get("FEEDBACK_RELATED", "")

ts = datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
slug = hashlib.md5(feedback_text.encode()).hexdigest()[:6]
entry = {
    "id": f"fb-{ts.replace('-','').replace(':','').replace('Z','')}-{slug}",
    "ts": ts,
    "category": category,
    "feedback": feedback_text,
    "related_decision_id": related_id if related_id else None,
    "resolved": False
}
log_path = os.path.expanduser("~/.claude/opt-prompt/feedback.jsonl")
os.makedirs(os.path.dirname(log_path), exist_ok=True)
with open(log_path, "a", encoding="utf-8") as f:
    f.write(json.dumps(entry, ensure_ascii=False) + "\n")
print(entry["id"])
PYEOF
```

## Integration with --review

`/opt-prompt-eval --review` reads `feedback.jsonl`, groups by `id`, takes the latest entry per id, and surfaces all with `resolved: false` as **Tier 0 — User-Mandated Proposals** before Tier 1 cohort analysis.

To see your recorded feedback surface as proposals, run: **`/opt-prompt-eval --review`**

After a Tier 0 proposal is accepted and the skill is updated, mark it resolved:

```
/opt-prompt-feedback --resolve fb-20260504T184423-ee41a7
```

## Anti-patterns

- Don't use this skill to normalize or evaluate a prompt — those belong to `/opt-prompt` and `/opt-prompt-eval`.
- Don't hand-roll entries with `echo >>` — use the python3 env-var block for JSON safety.
- Don't resolve an entry by editing the file — append a tombstone via `--resolve`.
- Don't pass feedback text as a shell argument with unescaped quotes — use the env-var pattern.
