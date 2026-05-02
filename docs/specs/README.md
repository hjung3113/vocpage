# docs/specs — Documentation Hygiene

VOC 시스템의 모든 설계·계획·리뷰 문서가 모이는 위치. 본 문서가 **문서 관리 정본** (root `CLAUDE.md` §Documents가 참조).

## 0. Purpose

문서를 **최소·최신·AI agent가 따라가기 쉬운** 상태로 유지. 중복·오래된 문서가 쌓여 새 세션이 무엇을 정본으로 봐야 할지 혼동되는 상황을 방지.

## 1. Rules (강제)

- **신규 doc 금지** — 사용자가 명시적으로 요청한 경우에만 새 파일 생성. 그 외에는 기존 SoT 갱신.
- **SoT 우선 갱신** — 결정/사실은 §3 Source of Truth 순서에 따라 가장 위 정본부터 수정 후 하위로 전파.
- **One responsibility per doc** — 한 책임은 한 파일에. 시각 spec ↔ 동작 spec 혼합 금지.
- **임시 plan은 current-plan 위치에만** — `docs/specs/plans/next-session-tasks.md` + 진행 중 phase의 `phase-N.md`만 active.
- **머지된 리뷰/완료 plan은 `done/`로 이동** — `reviews/done/`, `plans/done/`. 절대 current 가이드로 다시 끌어오지 않는다.
- **archive는 참조용일 뿐 정본 아님** — `progress-archive.md`, `done/**` 는 git grep 용도. 새 결정의 근거로 인용 금지.

## 2. Directory layout (구조 — 변경 금지)

| 디렉토리        | 용도                                     | 수명                                               |
| --------------- | ---------------------------------------- | -------------------------------------------------- |
| `requires/`     | 요구사항·디자인 시스템 등 canonical spec | 영구                                               |
| `plans/`        | 활성 phase 계획 + current-plan + 백로그  | 활성 plan만. 완료 시 `plans/done/`로 이동          |
| `plans/done/`   | 완료 phase 계획 archive                  | 영구 (참조용, 정본 아님)                           |
| `reviews/`      | 진행 중 리뷰·갭 분석·브레인스토밍        | 결정이 spec에 흡수되면 즉시 `reviews/done/`로 이동 |
| `reviews/done/` | 완료 리뷰 archive                        | 영구 (참조용, 정본 아님)                           |

루트 외부 임시 디렉토리(`.omc/plans/`, `.superpowers/`)는 **canonical 아님** — 결정은 항상 `docs/specs/`로 흡수.

## 3. Source of Truth (위에서 아래로 우선)

| #   | 책임                                  | 정본 파일                                                                                                       |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Governance / 작업 룰 / 본 정책 (정본) | `CLAUDE.md` (root) + sub-`CLAUDE.md` (frontend/backend/prototype/.claude)                                       |
| 2   | AI agent 진입 포인터 (룰은 #1로 위임) | `AGENTS.md` (Codex/타 agent용 quick pointer)                                                                    |
| 3   | Project overview                      | `README.md` (root)                                                                                              |
| 4   | 결정 로그 (ADR)                       | 활성 phase의 `plans/phase-N.md §ADR` + `progress-archive.md` (역사)                                             |
| 5   | 기능·동작·API·비즈니스 규칙           | `requires/requirements.md` + `requires/feature-*.md` + `requires/dashboard.md` + `requires/external-masters.md` |
| 6   | 시각 디자인 (색·타이포·컴포넌트)      | `requires/uidesign.md` (English only)                                                                           |
| 7   | API contracts (코드 정본)             | `shared/contracts/**` (Phase 8 산출). 동작 의미는 §5 feature-\*.md                                              |
| 8   | Data model                            | `backend/migrations/**` + 관련 feature spec 섹션                                                                |
| 9   | Frontend / Backend architecture       | `frontend/CLAUDE.md` / `backend/CLAUDE.md`                                                                      |
| 10  | Current plan (활성)                   | `plans/next-session-tasks.md` + 진행 중 `plans/phase-N.md`                                                      |
| 11  | Backlog                               | `plans/nextgen-backlog.md`                                                                                      |
| 12  | Changelog                             | `claude-progress.txt` (현재) + `plans/progress-archive.md` (누적)                                               |

## 4. 결정을 어디에 쓰나 (분기표)

| 결정 종류                                       | 정본                                       | 전파 대상                          |
| ----------------------------------------------- | ------------------------------------------ | ---------------------------------- |
| 시각 디자인 (색·레이아웃·spacing·컴포넌트 패턴) | `requires/uidesign.md` (영어)              | 활성 phase 계획                    |
| 기능·동작·API·비즈니스 규칙                     | `requires/requirements.md` 또는 feature-\* | 활성 phase 계획                    |
| 구현 plan task 추가/제거                        | `plans/phase-N.md`                         | 그 plan이 구현하는 spec 섹션       |
| 신규 governance 룰                              | `CLAUDE.md`                                | 행동에 영향 시 spec 동기화         |
| Phase ADR (대안·근거 기록)                      | `plans/phase-N.md §ADR`                    | (close 시 progress-archive로 흘림) |

**역방향 금지**: `uidesign.md`에 동작 spec ✗, `requirements.md`에 시각 룰 ✗.

## 5. Cleanup Process (스킬 절차)

신규 세션 시작 시 / 큰 phase 종료 시 / 사용자가 "문서 정리" 요청 시:

1. `find docs -name "*.md"` 로 전체 doc 목록.
2. **중복·outdated 식별** — 기준:
   - 리뷰: PR 머지되고 결정이 §3 SoT에 흡수됨 → `reviews/done/`
   - plan: phase close 후 → `plans/done/`
   - 임시 노트(`.omc/`, `.superpowers/`): canonical로 흡수 후 삭제
3. 유효 정보를 §3 SoT 파일로 머지 (없는 정보면 보강, 있는 정보면 무시).
4. outdated → `done/`로 git mv (삭제 대신 archive — git history만으로 부족할 수 있는 분석 산출물 보존).
5. 구현이 바뀌었으면 `claude-progress.txt` + `progress-archive.md` 갱신.
6. `current-plan` (`next-session-tasks.md` + 진행 중 `phase-N.md`)에 active task만 남기기.
7. 변경 사항 + 남은 불확실성 보고.

## 6. Before Creating a New Doc — 체크리스트

새 `.md` 파일을 만들기 **전에** 자가 질문:

- [ ] §3 SoT 중에 이 책임을 이미 가진 파일이 있나? → 그쪽 갱신.
- [ ] 임시 산출물인가? → `next-session-tasks.md` 항목으로 흡수 가능한지 우선 검토.
- [ ] 프로젝트 특이 정보인가, 재사용 가능한 일반 룰인가? → 후자면 `CLAUDE.md`.
- [ ] 리뷰/브레인스토밍이라면 `reviews/<topic>.md` (결정 후 즉시 `reviews/done/`로 이동될 운명).
- [ ] 위 4개 모두 NO일 때만 신규 파일 작성. 그때도 §3 표에 한 줄 추가.

## 7. 운영 메모

- **삭제 vs archive** — 본 프로젝트는 **archive(`done/`) 우선**. 분석 산출물(갭 재스캔, 검증 리포트)은 git grep만으로 복원이 어려우므로 보존.
- **참조 끊김 허용** — `progress-archive.md`처럼 historical 로그가 archive된 파일을 가리키는 건 OK. 새 작성 문서가 archive를 정본으로 인용하면 ✗.
- **언어 정책** — `uidesign.md`는 English. 그 외 spec/plan/review는 한국어. CLAUDE.md/AGENTS.md는 한국어 + 코드 영어 혼합 OK.
- **Folder `CLAUDE.md` refresh** — PR이 폴더 역할, "when to look where", cross-file invariant를 바꾸면 해당 폴더의 `CLAUDE.md`를 갱신한다. 미래 세션이 폴더명, parent `CLAUDE.md`, `ls`만으로 추론 가능한 내용이면 만들지 않는다.
  - 생성 금지: `__tests__/`, `__snapshots__/`, `cache/`, `done/`, leaf `screenshots/`, gitignored runtime dirs, dot-folders.
  - 기존 child `CLAUDE.md`가 폴더명이나 parent의 paraphrase로 축약되면 삭제한다.
  - child `CLAUDE.md`는 `## Role`과 `## When to look where` 중심으로 제한한다.
