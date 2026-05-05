# docs/specs — Documentation Hygiene

The single home for every design / plan / review document in the VOC system. This file is the **canonical doc-management policy** (referenced by root `CLAUDE.md` §Documents).

## 0. Purpose

Keep documentation **minimal, current, and easy for AI agents to follow**. Prevent the situation where new sessions get lost in duplicated or stale docs trying to find what counts as canonical.

---

## 0.1 Convention 파일 읽기 규칙

Convention 파일(`requires/*-conventions.md`)은 아래 절차로 읽는다.

1. **2줄만 먼저 읽기** — `Read(file, limit=2)` 로 제목 + `When to read` 확인
2. **관련 있으면** 전체 읽기 — 파일당 68~130줄, 토큰 부담 없음
3. **관련 없으면** 건너뜀 — 아래 §0.2 라우팅 테이블로 먼저 파일 특정

```
# 예시 — 파일명 규칙이 필요한 경우
Read("docs/specs/requires/naming-conventions.md", limit=2)
→ When to read: 파일명·폴더명·컴포넌트명... → 관련 있음 → 전체 읽기
```

---

## 0.2 작업 유형별 convention 파일 라우팅

| 작업                            | 읽어야 할 파일                                            | 핵심 섹션           |
| ------------------------------- | --------------------------------------------------------- | ------------------- |
| 새 파일·폴더 이름 결정          | `naming-conventions.md`                                   | §5.1, §5.2          |
| 컴포넌트명 결정 (suffix·prefix) | `naming-conventions.md`                                   | §5.3                |
| Hook 이름 결정                  | `naming-conventions.md`                                   | §5.4                |
| 상태 저장 위치 결정             | `state-management-conventions.md`                         | §8.1                |
| Context 사용 여부 판단          | `state-management-conventions.md`                         | §8.1, §8.2          |
| URL 필터 직렬화                 | `state-management-conventions.md`                         | §8.3                |
| API 파일 생성 위치              | `api-conventions.md`                                      | §9.2                |
| Query key 설계                  | `api-conventions.md`                                      | §9.4                |
| Cache 무효화 범위 결정          | `api-conventions.md`                                      | §9.5                |
| 라우트·URL 설계                 | `routing-conventions.md`                                  | §10.1, §10.3, §10.4 |
| 401/403 처리                    | `routing-conventions.md` + `error-loading-conventions.md` | §10.5, §12.1        |
| 에러·로딩·빈 상태 컴포넌트 선택 | `error-loading-conventions.md`                            | §12.1, §12.2, §12.3 |
| 권한별 UI 처리 (숨김/disabled)  | `error-loading-conventions.md`                            | §12.4               |
| 폼·schema 구조 설계             | `form-conventions.md`                                     | §13.2, §13.4        |
| 서버 422 에러 매핑              | `form-conventions.md` + `error-loading-conventions.md`    | §13.6, §12.1        |
| 테이블·페이지네이션 설계        | `table-filter-conventions.md`                             | §14.1, §14.2        |
| 필터 URL 동기화                 | `table-filter-conventions.md`                             | §14.3               |
| 날짜·시간 표시                  | `datetime-conventions.md`                                 | §15.3               |
| date-fns-tz 변환                | `datetime-conventions.md`                                 | §15.2, §15.3        |
| 테스트 종류 결정                | `test-conventions.md`                                     | §17.1               |
| fixture 위치 결정               | `test-conventions.md`                                     | §17.2               |
| MSW 핸들러 작성                 | `test-conventions.md`                                     | §17.3, §17.4        |
| 환경변수 추가                   | `env-conventions.md`                                      | §18.4, §18.5        |

---

## 1. Rules (mandatory)

- **No new docs by default** — only create a new file when the user explicitly asks. Otherwise update the existing source of truth.
- **Update SoT first** — propagate decisions/facts top-down from §3 Source of Truth.
- **One responsibility per doc** — one responsibility, one file. Do not mix visual spec with behavioral spec.
- **Active plans live only in current-plan slots** — only `docs/specs/plans/next-session-tasks.md` + the in-progress `phase-N.md` are active.
- **Merged reviews / completed plans move to `archive/`** — `archive/reviews/`, `archive/plans/`. Never re-promote them as current guidance.
- **Archive is reference-only, not canonical** — `progress-archive.md` and `archive/**` are for `git grep`. Do not cite them as the basis for new decisions.
- **Index consultation** — when assigning, citing, or closing any Wave / Phase / Task / FU ID, consult §7 (rules), [`plans/wave-index.md`](./plans/wave-index.md) (calling card), and [`plans/followup-bucket.md`](./plans/followup-bucket.md) (follow-up flat IDs). Update those documents at completion time.

## 2. Directory layout (do not change)

| Directory          | Purpose                                          | Lifetime                                                                  |
| ------------------ | ------------------------------------------------ | ------------------------------------------------------------------------- |
| `requires/`        | Canonical product / design spec                  | Permanent                                                                 |
| `plans/`           | Active phase plans + current-plan + backlog      | Active plans only. Move to `archive/plans/` on completion.                |
| `archive/plans/`   | Completed phase-plan archive                     | Permanent (reference-only, not canonical)                                 |
| `reviews/`         | In-progress reviews / gap analyses / brainstorms | Move to `archive/reviews/` as soon as the decision is absorbed into spec. |
| `archive/reviews/` | Completed review archive                         | Permanent (reference-only, not canonical)                                 |

Out-of-tree scratch dirs (`.omc/plans/`, `.superpowers/`) are **not canonical** — decisions always flow back into `docs/specs/`.

## 3. Source of Truth (top-down precedence)

| #    | Responsibility                                                | Canonical file                                                                                                                         |
| ---- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Governance / working rules / this policy                      | `CLAUDE.md` (root) + the 8-keep sub-`CLAUDE.md` (`.claude`, `frontend`, `frontend/src`, `backend`, `backend/src`, `docs`, `prototype`) |
| 2    | AI-agent entry pointer (rules delegate to #1)                 | `AGENTS.md` (Codex / other-agent quick pointer)                                                                                        |
| 3    | Project overview                                              | `README.md` (root)                                                                                                                     |
| 4    | Decision log (ADR)                                            | Active `plans/phase-N.md §ADR` + `progress-archive.md` (history)                                                                       |
| 5    | Features / behavior / API / business rules                    | `requires/requirements.md` + `requires/feature-*.md` + `requires/dashboard.md` + `requires/external-masters.md`                        |
| 6    | Visual design (color / typography / components)               | `requires/uidesign.md` (English only)                                                                                                  |
| 6.1  | Naming conventions (file / folder / hook / handler)           | `requires/naming-conventions.md`                                                                                                       |
| 6.2  | State management conventions (Query / URL / Context)          | `requires/state-management-conventions.md`                                                                                             |
| 6.3  | API conventions (file location / response shape / query keys) | `requires/api-conventions.md`                                                                                                          |
| 6.4  | Routing conventions (routes / URL rules / drawer / auth)      | `requires/routing-conventions.md`                                                                                                      |
| 6.5  | Error / Loading / Empty state conventions                     | `requires/error-loading-conventions.md`                                                                                                |
| 6.6  | Form / Validation conventions (RHF + Zod)                     | `requires/form-conventions.md`                                                                                                         |
| 6.7  | Table / Filter conventions (server pagination / URL filter)   | `requires/table-filter-conventions.md`                                                                                                 |
| 6.8  | Date / Time conventions (UTC → Asia/Seoul, date-fns-tz)       | `requires/datetime-conventions.md`                                                                                                     |
| 6.9  | Test / Mock conventions (Vitest / MSW v2 / fixtures)          | `requires/test-conventions.md`                                                                                                         |
| 6.10 | Environment variable conventions (Zod-validated env.ts)       | `requires/env-conventions.md`                                                                                                          |
| 7    | API contracts (canonical code)                                | `shared/contracts/**` (Phase 8 output). Behavioral meaning lives in §5 feature-\*.md.                                                  |
| 8    | Data model                                                    | `backend/migrations/**` + the related feature spec section                                                                             |
| 9    | Frontend / Backend architecture                               | `frontend/CLAUDE.md` / `backend/CLAUDE.md`                                                                                             |
| 10   | Current plan (active)                                         | `plans/next-session-tasks.md` + the in-progress `plans/phase-N.md`                                                                     |
| 11   | Wave calling card                                             | `plans/wave-index.md` (Wave lineage + batch glossary)                                                                                  |
| 12   | Follow-up bucket                                              | `plans/followup-bucket.md` (`FU-NNN` flat IDs across closed waves)                                                                     |
| 13   | Backlog                                                       | `plans/nextgen-backlog.md`                                                                                                             |
| 14   | Changelog                                                     | `claude-progress.txt` (current) + `plans/progress-archive.md` (cumulative)                                                             |

## 4. Where each decision goes (routing table)

| Decision kind                                       | Canonical file                              | Propagate to                                |
| --------------------------------------------------- | ------------------------------------------- | ------------------------------------------- |
| Visual design (color / layout / spacing / patterns) | `requires/uidesign.md` (English)            | Active phase plan                           |
| Feature / behavior / API / business rules           | `requires/requirements.md` or feature-\*.md | Active phase plan                           |
| Add/remove an implementation plan task              | `plans/phase-N.md`                          | The spec section that the plan implements   |
| New governance rule                                 | `CLAUDE.md`                                 | Spec sync if the rule affects behavior      |
| Phase ADR (alternatives / rationale)                | `plans/phase-N.md §ADR`                     | (Flows into `progress-archive.md` on close) |

**No reverse flow**: behavioral spec in `uidesign.md` ✗, visual rules in `requirements.md` ✗.

## 5. Cleanup process (skill workflow)

Run on session start / large phase close / when the user asks for "doc cleanup":

1. `find docs -name "*.md"` to enumerate.
2. **Identify duplicates / outdated** — criteria:
   - Reviews: PR merged + decision absorbed into §3 SoT → `archive/reviews/`
   - Plans: phase closed → `archive/plans/`
   - Scratch (`.omc/`, `.superpowers/`): absorb into canonical, then delete
3. Merge surviving info into the §3 SoT file (add what is missing, ignore what is already there).
4. Move outdated content to `archive/` via `git mv` (archive instead of delete — analysis artifacts often cannot be reconstructed from `git history` alone).
5. If implementation changed, update `claude-progress.txt` + `progress-archive.md`.
6. Trim `current-plan` (`next-session-tasks.md` + active `phase-N.md`) so only active tasks remain.
7. Report changes + remaining uncertainty.

## 6. Before creating a new doc — checklist

Before creating a new `.md`, ask:

- [ ] Does any §3 SoT file already own this responsibility? → update it.
- [ ] Is this a temporary artifact? → first see if it can fold into `next-session-tasks.md`.
- [ ] Project-specific or reusable as a general rule? → if reusable, it belongs in `CLAUDE.md`.
- [ ] Review/brainstorm? → use `reviews/<topic>.md` (will move to `archive/reviews/` once decided).
- [ ] All four NO? → only then create a new file. Even then, add a row to §3.

## 7. Index rules (Wave / Phase / Task / FU IDs — forward-only)

> Designed to prevent the past tangling: Wave 1.5 → 1.6 → 1.7 decimal injection, C-2 → **C-2.5** sub-decimal, **F-1/F-2/F-3 bundle** off-sequence IDs, Issue#155 used as a task ID, α/β/γ batch labels retro-attached to flat C-N. **Applies to IDs assigned from this rule's adoption onward.** Pre-existing IDs are grandfathered (cite-drift safety).

| #   | Rule                                                                                                                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Wave / Phase IDs are append-only.** Never inject a decimal between closed waves. Newly discovered work = next integer Wave.                                                                               |
| R2  | **Task IDs are flat integers within a wave.** C-1, C-2, …, C-N. No sub-decimals (no C-2.5) — a newly discovered sub-task simply gets the next integer.                                                      |
| R3  | **Grouping (batch α/β, sub-phase) lives in plan-doc table metadata.** Never bake grouping into the ID. Re-batching must not rename IDs.                                                                     |
| R4  | **GitHub issue# is a single cross-ref column.** Even if a GitHub issue triggered the work, the work itself gets a fresh task ID; the issue# is documented as `trigger: #NNN`.                               |
| R5  | **No bundle / hotfix off-sequence IDs.** Patterns like "F-1/F-2 bundle" are forbidden. Each task gets a regular integer ID; PR-level bundling lives in the PR description, not the ID.                      |
| R6  | **Closed waves cannot accept new tasks. Follow-ups go to a shared bucket.** Use `plans/followup-bucket.md` with flat global IDs `FU-001, FU-002, …` (append-only). The trigger column names the spawn wave. |
| R7  | **One work unit, one ID.** One PR = one task ID. If a PR bundles several tasks, track each task separately at the commit/section level — not by minting a parent meta-ID.                                   |

### When to consult these documents

The point of these rules is **AI-agent disambiguation**: a new session must never have to guess which ID belongs to which wave or whether a number is current. Therefore:

- **Assigning a new ID** → check `wave-index.md` (Wave/batch glossary) + `followup-bucket.md` (next free `FU`) + this §7.
- **Citing an existing ID** → resolve via `wave-index.md` first. If it's a follow-up, find it in `followup-bucket.md`.
- **Closing work** → mark the row in `wave-index.md` (Wave/Phase status) or `followup-bucket.md` (FU status) and update `claude-progress.txt` first 30 lines.

### AI agent quick pointers

- "What's next?" → first 30 lines of `claude-progress.txt`
- "Which wave / batch?" → `plans/wave-index.md`
- "Where do follow-ups live?" → `plans/followup-bucket.md`
- One ID per work unit, one work unit per ID, no new tasks on closed waves.

## 8. Operational notes

- **Delete vs archive** — this project prefers **archive (`archive/`)**. Analysis artifacts (gap rescans, verification reports) are hard to reconstruct from `git grep` alone and worth keeping.
- **Stale references are OK in archives** — historical files like `progress-archive.md` may point at archived files. New docs citing archive as canonical are not.
- **Language policy** — `uidesign.md` and this `docs/specs/README.md` are English. Other specs / plans / reviews are Korean. CLAUDE.md / AGENTS.md mix Korean prose with English code naturally.
- **Folder `CLAUDE.md` 8-keep set** — root, `.claude`, `frontend`, `backend`, `frontend/src`, `backend/src`, `docs`, `prototype`. Touch one only when its `## Role` / `## When to look where` actually changed in this PR.
  - No new leaf `CLAUDE.md` outside the 8-keep set — fold any directory guidance into the nearest ancestor.
  - On delete, do not leave stubs (`→ ancestor.md`) — they only add auto-loaded noise.
