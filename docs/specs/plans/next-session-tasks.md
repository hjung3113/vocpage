# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-04-26 (benchmark 스크린샷 리뷰 완료 → C10~C12 추가)
> 현재 위치: Phase 7 착수 전 문서 수정 → Phase 7 실구현 대기

---

## Phase 7 착수 전 문서 수정 필수

| ID  | 항목                                                                                    | 상태 |
| --- | --------------------------------------------------------------------------------------- | ---- |
| R-1 | `dashboard.md` — `보류→드랍`, `접수됨→접수` 일괄 치환 (openapi/migration과 정합)        | -    |
| R-2 | `dashboard_settings` — `globaltabs_order` migration 추가 여부 결정 + dashboard.md 정합  | -    |
| R-3 | `requirements.md §14.1` 세션 스토어 — "Phase 8-1 구현 예정, 현재 MemoryStore" 주석 추가 | -    |
| R-4 | `ts-node-dev → tsx watch` 교체 (backend/package.json `dev` 스크립트)                    | -    |

---

## Phase C — 프로토타입 간극 해소 (설계 명세 보완)

> 구현 전 문서 확정 필수. 각 항목은 spec 수정 → prototype 수정 → 커밋 순서.

| ID  | 항목                                                                 | 상태 |
| --- | -------------------------------------------------------------------- | ---- |
| C1  | Result Review 관리자 페이지 + 사이드바 진입점 추가                   | -    |
| C2  | Internal Notes 섹션 드로어 추가                                      | -    |
| C3  | 공지 팝업 2-panel 레이아웃 구현                                      | -    |
| C4  | 공지 "오늘 하루 보지 않기" 일괄 체크박스로 수정                      | -    |
| C5  | 상태 전환 매트릭스 드롭다운 비허용 옵션 disabled                     | -    |
| C6  | Due Date 필드 드로어 추가                                            | -    |
| C7  | 태그 수동 편집 UI 추가                                               | -    |
| C8  | `prototype.html:1651` Linear indigo 제거                             | -    |
| C9  | `prototype.html:2477` "최대 2단계" → "최대 1레벨" 수정               | -    |
| C10 | 드로어 퍼머링크 복사 버튼 — `feature-voc.md` 명세 추가               | -    |
| C11 | 사용자 초대 플로우 — `requirements.md §15` 명세 추가                 | -    |
| C12 | VOC 목록 서브태스크 행 인라인 펼침 — `feature-voc.md §9.2` 명세 추가 | -    |

---

## Phase 6-9. Prototype → 실구현 동일 재현 플로우

- [ ] prototype.html을 컴포넌트 단위로 분해 (섹션별 인벤토리)
- [ ] 각 컴포넌트의 HTML 구조 + CSS 클래스 → React 컴포넌트 매핑 규칙 문서화
- [ ] Storybook 또는 컴포넌트 체크리스트로 prototype vs 구현 비교 방법 결정
- [ ] 구현 순서: prototype 섹션별로 1:1 대응되도록 티켓화

---

## Phase 7: 개발 스켈레톤

> **목표**: 로컬 dev 환경에서 전체 기능 동작 확인. production 고려 없음.
> **선행 조건**: R-1~R-4 완료 + 6-9 완료

### 상시 규칙 ⚠️ 구현 중 항상 적용

- [ ] 구현 중 `requirements.md` (및 `feature-*.md`, `dashboard.md`) 와 `prototype/prototype.html` 사이에 **불일치를 발견하면 임의로 결정하지 말고 사용자에게 먼저 질문**한다
- [ ] 질문 형식: "요구사항 §X: A / 프로토타입: B — 어느 쪽 기준으로 구현할까요?" (양쪽 근거 라인/섹션 명시)
- [ ] 사용자 답변 확정 후 → 정답 쪽을 정본으로 두고 나머지 문서/프로토타입을 동기화 커밋
- [ ] 동기화 없이 구현만 먼저 진행하지 않는다 (doc drift 금지)

### 기능 단계

| 단계 | 내용                                                                                   | 상태 |
| ---- | -------------------------------------------------------------------------------------- | ---- |
| 7-1  | VOC 핵심 플로우 — CRUD, 상태 전환 (접수→검토→처리→완료/드랍)                           | -    |
| 7-2  | 댓글 + 첨부파일                                                                        | -    |
| 7-2a | Internal Notes (`voc_internal_notes`) — 보안 필수 3건 포함 (User→404 등)               | -    |
| 7-3  | 태그 + 태그 규칙 자동화 (갭 #6)                                                        | -    |
| 7-4  | 대시보드 (위젯 데이터 API + 프론트) — `dashboard.md` + `prototype/prototype.html` 참조 | -    |
| 7-5  | 공지사항 / FAQ                                                                         | -    |
| 7-6  | 관리자 페이지 (사용자·카테고리·태그규칙·설정)                                          | -    |
| 7-7  | 알림                                                                                   | -    |
| 7-8  | Result Review 플로우 (review_status, voc_payload_reviews)                              | -    |
| 7-9  | Sub-task                                                                               | -    |
| 7-10 | 외부 마스터 연동 (stub JSON 기반, 실 MSSQL 아님)                                       | -    |
| 7-11 | Storybook or 체크리스트 비교 방법 결정 + 전 컴포넌트 티켓화                            | -    |

---

## Phase 8: 운영 실구현 + 배포

> **목표**: production 준비 완료 + 실 환경 배포.
> **선행 조건**: Phase 7 전 항목 완료

| 단계 | 내용                                                            | 비고          |
| ---- | --------------------------------------------------------------- | ------------- |
| 8-1  | `connect-pg-simple` 세션 스토어 — `NODE_ENV=production` 시 적용 | F-4 defer     |
| 8-2  | OIDC 인증 실구현 (`oidcAuthMiddleware`)                         |               |
| 8-3  | Production Dockerfile + 빌드 파이프라인                         |               |
| 8-5  | 실 MSSQL 연동 (설비 마스터 — 담당자 자료 수집 후)               | G-1 외부 의존 |
| 8-6  | 배포 + smoke test                                               |               |
| 8-7  | Playwright E2E 설정 + 핵심 3플로우 테스트 (requirements §13.3)  |               |
| 8-8  | Jira 마이그레이션 스크립트 작성 + 실행 (오픈 전 필수)           |               |

---

## 미결 사항

| #   | 항목                     | 비고                                            |
| --- | ------------------------ | ----------------------------------------------- |
| G-1 | 설비 마스터 MSSQL 스키마 | 담당자 자료 수집 후 external-masters.md §3 보완 |
