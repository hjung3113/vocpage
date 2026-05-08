# VOC 완성 단일 PR — 결정 history

> Driver: `docs/specs/plans/voc-completion-driver.md`. 본 PR(`docs/voc-completion-single-pr`)
> 진행 중 적대적 토론으로 결정된 항목을 append-only 로 기록한다.
> 형식: `[YYYY-MM-DD] 결정 1줄 / 근거 1줄 / 영향 범위 1줄`.

## 2026-05-09

- **Phase 순서 = ① 기존 결함 → ② 시각 정합 → ③ 등록 모달 → ④ 검증**.
  근거: 우선순위 트레이드오프 #2(기존 결함>새 기능)·#3(시각>기능). 영향: phase
  배치 only.
- **첫 phase = Wave 1.7 Phase B (BE)**.
  근거: driver §"계약 우선" — 계약(`shared/contracts/master/io.ts` + openapi)
  이 lock 되어야 후속 FE 모달 rebuild 가 안전. invariant > 시각 우선순위.
  영향: BE master endpoints + VOC create 강제룰 한정.
- **`/api/masters/menus` 는 admin 단독, `/api/masters/systems` 는 인증된 모든 역할**.
  근거: `shared/contracts/master/io.ts:50` "Admin 단독 endpoint
  `GET /api/masters/menus?includeArchived=true`" + cascade 응답은 전 역할
  열람 가능. 영향: routes/masters.ts 라우트 게이팅.
- **`due_date` 자동 계산은 service 계층, JS Date 기반 UTC 일자**.
  근거: feature-voc.md §8.4.1 표 "due_date = created_at + 30일". now() 시각
  편차는 동일 트랜잭션 내라 무시 가능. 영향: services/voc.ts +
  repository/voc.ts CreateVocInput.due_date.
- **`VocCreate` zod 의 `priority` 필드 유지**.
  근거: 클라이언트가 보내는 값은 BE 가 무시(§8.4)하지만 contract 호환성을
  위해 schema 에는 유지. 영향: shared/contracts/voc/io.ts 변경 없음.

- **Phase C scope 축소 결정 — minimal spec lock 만 본 PR 에서 처리**.
  근거: 2×2 grid 재배치, body skeleton(H2 sections), body↔첨부 동기화,
  자동 태그 row, send-icon footer 는 designer agent dispatch + 시각 회귀
  필요. 본 PR 에서는 BE 강제룰을 FE 가 깨지 않도록 (1) 제목 200자 카운터,
  (2) 우선순위 read-only 락 두 변경만 반영. 나머지는 follow-up wave.
  영향: VocCreateTitleInput · VocCreateDetails 두 파일 한정.

- **POST /api/vocs/:id/payload-review wire decision = `approve|reject`**.
  근거: §9.4.5 도입. Wire 토큰은 action 형(`approve/reject`), DB enum 은
  과거형(`approved/rejected`) — service 레이어에서 매핑한다. reject 시
  comment 필수(zod superRefine). manager/admin gate 는 service 에서.
  영향: contracts/voc/io.ts + backend/{routes,controllers,services,repository}/voc.ts.

- **Follow-up M-3 — wire decision enum changelog 명시화 (2026-05-09)**.
  근거: `shared/contracts/voc/io.ts` `PayloadReviewSubmit.decision`
  (`approve`/`reject`)와 `PayloadReviewRecord.decision` (`approved`/`rejected`)
  은 의도적으로 다른 enum. wire ≠ persisted 매핑은 service 단일 변환 지점에
  국한. 본 PR 에서 신설/변경된 enum 은 없으며, 본 항목은 D4 결정의 사후
  changelog row 로만 기록. 영향: 코드 변경 없음 (문서화 only).

- **Follow-up M-1 — `computeInitialDueDate(now?)` injectable 파라미터 (2026-05-09)**.
  근거: `backend/src/services/voc.ts:150` 시그니처 `computeInitialDueDate(now: Date = new Date())`.
  테스트가 wall-clock 에 의존하지 않도록 회귀 jest 5 케이스 추가
  (`backend/src/__tests__/voc-due-date.test.ts`). 영향: 코드 1줄도 변경 없음 (test only).

- **Follow-up M-2 — `PayloadReviewActions` mutation onError 사용자 피드백 (2026-05-09)**.
  근거: 이전엔 mutation 실패가 silent. sonner `toast.error` 로 메시지 노출,
  `Error.message` 가 있으면 그대로, 없으면 한국어 fallback ("검토 결정 저장에
  실패했습니다"). 영향: PayloadReviewActions.tsx onError 핸들러 추가.

- **Follow-up L-1 — `VocErrorSimSelector` 멀티탭 동기화 (2026-05-09)**.
  근거: dev 도구의 in-memory `window.__vocErrorSimMode` 만으로는 다탭 격리.
  `localStorage` 영속화 + cross-tab `storage` event + same-tab `voc-error-sim-change`
  custom event 동시 채택 (storage event 가 동일 탭에서 발화하지 않는 spec 우회).
  Production 영향 없음 (errorSim 자체가 dev/admin 전용). 영향: shared/dev/errorSim.ts +
  VocErrorSimSelector.tsx + 회귀 테스트 2건.

- **Follow-up L-2 — `VocActivityTimeline` 정렬 secondary key (2026-05-09)**.
  근거: 기존 sort 가 `at` 만 비교 → 동일 timestamp 항목 순서가 비결정적.
  primary `at` desc + secondary `id` desc 로 stable. 영향: VocActivityTimeline
  buildTimeline 한 함수.
