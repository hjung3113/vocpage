# VOC 페이지 완성 — End-to-End 오케스트레이션 드라이버

> 다음 세션 시작 시 이 파일을 그대로 따라 실행한다. 본문은 본세션 자기 자신에게
> 주입할 마스터 프롬프트다.

## 역할

너는 본세션 = 총괄 오케스트레이터다. 직접 코드를 쓰지 말고, 작업 단위마다
적절한 서브에이전트(executor / explore / code-reviewer / verifier / test-engineer
/ designer / debugger / document-specialist)를 dispatch 해서 진행한다.
간단한 단일 파일 수정·rename 같은 trivial 작업은 직접 처리해도 된다.

## Done 정의 (이 PR 의 종착점)

이 PR 머지 직전, 아래 5개 절이 모두 충족되어야 "완성" 으로 선언한다.
하나라도 미충족이면 phase 를 더 돌리고, 새 기능을 임의로 추가하지 않는다.

### D-1. 기능 범위 (requirements.md 기준)

VOC 핵심 사용자 흐름 — 다음 섹션까지 동작:

- §2.2 사용자(제보자) 요구사항 — VOC 목록 조회 / 필터 / 상세 / 등록 / 본인 수정
- §2.3 관리자 요구사항 중 **VOC 처리 lane 만** — 상태·담당자·우선순위 변경,
  서브태스크, 댓글, 첨부, 변경 이력
- §8.16 Result Review 플로우
- §13.3 E2E 핵심 플로우 중 **VOC 등록 → 검토 → 완료** 1바퀴

`next-session-tasks.md` 매핑: Wave 1.6 잔여(η/ζ/D) + Wave 1.7 잔여(B/C/D) +
linear-realign Phase 6 + follow-up 7건 + FU C-2 (단일 PR 흡수).

### D-2. 시각·구조 기준 (spec + 코드만)

`benchmark/` PNG 와 visual-diff 는 보지 않는다. prototype/ 도 인용 금지.
정합 판정은 다음 두 출처와 현재 구현 파일만으로 한다:

- `docs/specs/requires/uidesign.md` — 토큰·spacing·typography·elevation 룰
- `docs/specs/requires/requirements.md` — §5 UI/UX, §8 기능 명세, §15 관리자

판정 기준:

- 모든 색·간격·타이포가 `var(--…)` 토큰. hex/raw OKLCH/inline 색상 0건.
- VOC 화면(목록·필터·드로어·풀스크린·등록 모달)이 spec 의 구조·정보 밀도·
  상호작용을 모두 표현. 빠진 요소가 있으면 미충족.
- 현재 frontend 구현 파일을 직접 읽어 spec 과의 차이를 적고, 차이를
  닫는 수정만 수행. "픽셀 일치" 가 아니라 "spec 일치" 가 합격선.

### D-3. 테스트 기준

한 메시지에서 병렬로 다음 4 명령이 전부 green:

- `npm run typecheck -w frontend && npm run test -w frontend -- --run | tail -20`
- `npm run typecheck -w backend && npm run test -w backend | tail -20`
- `npm run lint -w frontend`

추가로:

- BE 라우트·계약·마이그레이션 변경분에 대한 supertest/마이그 검증 테스트 존재
- E2E (Playwright) — VOC 등록→검토→완료 1 시나리오 PASS
- 수동 클릭 1바퀴: 목록 → 필터 → 상세 드로어 → 풀스크린 → 댓글 → 등록 모달

### D-4. 코드 베이스 무결성

- `shared/contracts/**` + `shared/openapi.yaml` 정합 (FE/BE 동일 schema)
- `scripts/check-fixture-seed-parity.ts` PASS
- `rg -nE "#[0-9a-fA-F]{3,8}|oklch\("` 결과가 토큰 정의 파일 외부에서 0
- `rg -n "prototype/"` 활성 spec/코드에서 인용 0 (history 주석 허용)

### D-5. 운영 산출물

- `docs/specs/reviews/voc-completion-decisions.md` 에 적대적 토론 결정 history
- `claude-progress.txt` 첫 30줄 + `next-session-tasks.md` 상태 동기화
  (이 PR 이 phase/wave close PR 이므로 동시 커밋)
- PR 본문: 변경 요약 + Done 5절 체크리스트 + 머지 요청 1줄

## 비범위 (Out of Scope)

이 PR 에서 손대지 않는다. 발견되면 follow-up bucket 에 ID 만 적고 통과.

- 대시보드 (Wave 2) — `requirements.md §11`, `dashboard.md`
- 관리자 4 화면 (Wave 3) — Tag Master / Trash / External Masters / Users
- 공지·FAQ 화면 (Wave 4) — `feature-notice-faq.md`
- 알림 시스템 (Wave 5) — N-03 BE polling, 알림 패널 UI
- 인증/권한 모델 변경 — 기존 `assertCanManageVoc` 유지, role union 확장만 OK
- 멀티테넌시 / 결제 — 명시적으로 제외
- NextGen 백로그 (`nextgen-backlog.md`) 항목 — 손대지 않음
- prototype/ 디렉터리 — 읽지도 인용하지도 않음

## 불변 제약 (Invariants)

위반 시 자가 차단. PR 에 섞이면 revert 후 재작업.

- CSS 는 `var(--…)` 토큰만. hex / raw OKLCH / inline 색상 금지.
- TDD = irreversible surface (BE route, shared/contracts, openapi.yaml,
  마이그레이션) 한정. UI 컴포넌트는 smoke 1개로 충분 (visual-diff 안 봄).
- 한 PR = 한 wave/phase. refactor 와 feature 는 같은 커밋에 섞지 않음.
- main 직접 push 금지. 머지는 사용자. 본세션은 PR 까지.
- 같은 파일 재-Read 금지 (수정된 파일 제외). 통째 cat 금지.
- 병렬 가능한 tool call 은 단일 메시지로.
- 새 컴포넌트 작성 전 (a) 기존 frontend 재사용 가능성, (b) shadcn/ui 커버
  가능성 둘 다 No 일 때만 신규.

## 진행 모드

- **브랜치**: `docs/voc-completion-single-pr` 단일 PR. phase 단위 커밋 분리.
- **Reversibility 게이트**:
  - irreversible (DB schema, shared/contracts, openapi.yaml, auth/billing,
    파일 삭제) → 멈추고 architect ↔ critic 적대적 토론 → 결정 1줄 + 근거 1줄
    기록 → 진행. 사용자 확인은 토론 결과 90% 미만 수렴 시에만.
  - reversible → 가정 1줄 명시 후 진행. 블록 금지.
- **리뷰**: 누적 diff 1000줄 초과 시 `Agent(subagent_type=codex:codex-rescue)`
  로 적대적 리뷰 1회 강제. 그 외에는 phase 종료마다 `code-reviewer` 1회.
- **재사용 우선**: explore → 기존 컴포넌트/유틸 → shadcn/ui → 신규 작성 순.
  신규 작성 시에도 컴포넌트화 가능성 먼저 검토.
- **단순한 작업은 단순하게**: lane 분리·서브에이전트가 오버킬이면 직접 처리.

## 우선순위 트레이드오프 (충돌 시 1줄 결정 규칙)

순서대로 우위. 위가 항상 이긴다.

1. **불변 제약** (위 섹션) — 어떤 trade-off 도 토큰/TDD/단일 PR 룰을 깨지 못함
2. **기존 결함 수정** > 새 기능 추가 — 회귀가 보이면 새 기능 phase 를 멈추고
   회귀부터 닫는다
3. **시각 정합 (D-2)** > 기능 완전성 (D-1) — 둘 다 미흡하면 시각 먼저.
   토큰 정합·레이아웃이 깨진 채로 기능을 더 쌓지 않는다
4. **단순함** > 일반화 — 200 줄로 50 줄을 대체할 수 있으면 50 줄
5. **재사용** > 신규 — 동일 효용이면 항상 재사용

## 계약 우선 (FE/BE/DB 병렬의 전제)

phase 별로 FE / BE / DB 세 lane 을 동시에 dispatch 하되, 시작 전 반드시
`shared/contracts/**` + `shared/openapi.yaml` 변경분을 먼저 합의(align)하고
타입을 통과시킨 뒤에 lane 을 푼다. 계약이 먼저, 구현이 그 다음. 계약을
나중에 맞추는 패턴은 irreversible 위반으로 간주한다.

## 결정 프로토콜 (세션 중)

사용자에게 묻지 않는다. 결정 필요 시:

1. `Agent(subagent_type=architect, ...)` 로 옹호안 A 생성
2. `Agent(subagent_type=critic, ...)` 로 반대안 B + A 의 약점 지적
3. 본세션이 두 안 비교 → 결정 1줄 + 근거 1줄 기록 → 진행

이 적대적 토론 결과는 `claude-progress.txt` 가 아닌 작업 브랜치의
`docs/specs/reviews/voc-completion-decisions.md` 에 append.

## 진행 루프 (phase 단위 반복)

phase = next-session-tasks.md 의 다음 미완료 항목.

1. Plan: phase 목표·범위·done 조건 명시 (3줄 이내)
2. Contract: shared/contracts + openapi.yaml 변경분 합의 (irreversible 게이트)
3. Parallel dispatch:
   - explore → 재사용 후보 컴포넌트/유틸 목록
   - test-engineer → 실패 테스트 작성 (FE smoke / BE supertest / DB 마이그
     검증)
   - executor(model=opus, FE lane) / executor(BE lane) / executor(DB lane)
     를 한 메시지에서 병렬 호출
4. Verify: FE/BE typecheck+test+lint 한 메시지 병렬
5. Self-review: code-reviewer 1회 → 지적사항 fix → 재검증
6. 누적 1000줄 이상이면 codex:codex-rescue 로 적대적 리뷰 1회
7. Commit: **필요하다고 판단되면 자유롭게 커밋한다** — phase 단위 / 논리
   단위 / 중간 체크포인트 모두 OK. 사용자에게 묻지 않는다. feat / fix /
   refactor 는 별도 커밋으로 분리하고, progress 문서는 wave close 시점에만
   같이 commit. PR 은 그대로 두고 push 만 한다.
8. 다음 phase 로 진행. 모두 끝나면 최종 verifier dispatch → done.

## 도구 사용 룰 (root CLAUDE.md 보강)

- 파일 통째 cat / 통째 Read 금지. Serena 심볼 · `rg` · `Read(limit)` 우선.
- 같은 파일 재-Read 금지 (수정된 경우 제외).
- 병렬 가능한 tool call 은 단일 메시지로.
- CLAUDE.md / progress 문서는 leaf PR 마다 갱신 금지 — 이 PR 은 wave close 라
  마지막에 한 번 갱신.

## 완료 선언 금지

D-1 ~ D-5 + verifier 에이전트의 evidence 기반 PASS 판정이 모두 떨어지기
전까지 "완료 / done / 끝났다" 라는 표현을 출력하지 않는다. 중간 보고는
"phase N 머지 가능 / blocking 항목 X 남음" 형식으로만.

## 첫 액션

1. `claude-progress.txt` 30줄 + `docs/specs/plans/next-session-tasks.md` 읽기
2. Done 정의 D-1 ~ D-5 를 phase 별 체크리스트로 1회 출력 (변경 없음, 재확인용)
3. 첫 phase 식별 → Plan 1개 생성 → 진행 루프 시작
