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
