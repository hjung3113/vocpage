# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-04-26 (대시보드 구현 계획 완료)
> 목표: **대시보드 처음부터 구현 → Phase 9 운영 실구현 + 배포**

## 현재 상태

| 항목                            | 상태                                                  |
| ------------------------------- | ----------------------------------------------------- |
| Phase 0~7 구현                  | ✅ 완료                                               |
| Phase 8 디자인                  | ✅ 완료 + 머지                                        |
| 프로토타입 벤치마크             | ✅ 완료 (`benchmark/` 폴더, 24장 + INDEX.md)          |
| 네비바/상태배지 버그픽스        | ✅ 완료 + 머지 (PR #41)                               |
| VOC 리스트 UI/UX benchmark 정렬 | ✅ 완료 + 머지 (PR #43)                               |
| VOC 목록 세밀 UI 갭 분석        | ✅ 완료 (`docs/specs/reviews/voc-list-ui-ux-gaps.md`) |
| VOC 목록 세밀 UI 갭 수정        | ✅ 완료 (feat/align-seed-to-prototype, main에 머지)   |
| 대시보드 구현 계획              | ✅ 완료 (`docs/specs/plans/dashboard-impl.md` v2)     |
| 대시보드 구현                   | 🔄 다음 세션 시작                                     |
| Phase 9                         | ⏳ 대기                                               |

---

## 다음 세션: 대시보드 구현

> 구현 계획 전문: `docs/specs/plans/dashboard-impl.md`  
> 벤치마크: `benchmark/12-dashboard.png`, `benchmark/14-dashboard-layout-edit.png`  
> 스펙: `docs/specs/requires/dashboard.md`, `docs/specs/requires/design.md §11`  
> 브랜치: `feat/dashboard` 새로 생성 후 작업

### Step 1 — 공통 토대

- [ ] `frontend/src/api/dashboard.ts` — 15개 API 함수
- [ ] `frontend/src/hooks/useDashboardFilter.ts` — 글로벌 필터 상태 + `buildQueryParams()`
- [ ] `frontend/src/components/dashboard/DimSelector.tsx` — 공통 dim 셀렉터
- [ ] `frontend/src/router.tsx` — `/dashboard` 라우트 + Manager/Admin Guard 추가
- [ ] `frontend/src/pages/DashboardPage.tsx` — 레이아웃 뼈대 + `editMode` / `widgetVisibility` state

### Step 2 — 헤더·탭·배너

- [ ] `DashboardHeader.tsx` — sticky 헤더, 담당자·날짜·편집 버튼
- [ ] `GlobalTabs.tsx` — 탭 전환 → filter.globalTab 업데이트
- [ ] `FilterContextBanner.tsx` — 조건부 표시

### Step 3 — KPI

- [ ] `KpiSection.tsx` — VOLUME / QUALITY 2행, 8카드, 클릭→VOC 목록 이동

### Step 4 — 분포 + 매트릭스 (2-col)

- [ ] `DistributionWidget.tsx` — conic-gradient 도넛 + 4탭 + dim셀렉터 + 레전드 클릭
- [ ] `PriorityStatusMatrix.tsx` — 4×5 테이블, 셀 색상 lerp, 셀 클릭→이동

### Step 5 — 히트맵

- [ ] `DrilldownHeatmap.tsx` — breadcrumb + X축 3종 + table-layout:fixed + 셀 클릭

### Step 6 — 차트 위젯 (2-col)

- [ ] `WeeklyTrendChart.tsx` — recharts LineChart, 3선, 포인트 클릭→이동
- [ ] `TagDistributionChart.tsx` — recharts BarChart layout="vertical", 바 클릭→이동

### Step 7 — 하단 위젯

- [ ] `ProcessingSpeedWidget.tsx` — SLA 테이블
- [ ] `AgingWidget.tsx` — recharts BarChart stacked, 세그먼트 클릭→이동
- [ ] `AssigneeTable.tsx` — X축 3종, 셀 클릭→이동, 담당자 필터 하이라이트
- [ ] `AgingVocList.tsx` — 장기 미처리 Top10, 행 클릭→Drawer

### Step 8 — 레이아웃 편집 + 백엔드

- [ ] `LayoutEditPanel.tsx` — 슬라이드인 패널, 위젯 눈버튼, 저장 대상 토글, 설정 저장
- [ ] `backend/src/routes/dashboard.ts` — 15개 엔드포인트 전체
- [ ] `backend/src/index.ts` — dashboard 라우터 마운트

### Step 9 — 검증

- [ ] `npx tsc --noEmit -p frontend/tsconfig.json` 통과
- [ ] `frontend vitest` 기존 25/25 통과
- [ ] `backend jest --testPathPattern=vocs` 기존 33/33 통과
- [ ] Playwright 스크린샷 vs `benchmark/12-dashboard.png` 육안 비교

---

## Phase 8: 디자인 수정

> ✅ 완료. 사용자 피드백 기반 UI/UX 재작업 완료.

### VOC 리스트 UI/UX benchmark 정렬

> ✅ 완료. `benchmark/01-voc-all-list.png`, `benchmark/11-voc-subvoc-expanded.png` 기준.

- 리스트 컬럼 폭과 제목/태그 스캔성 조정
- 상태 배지 밀도 축소
- VOC 행 좌측 chevron affordance 추가
- `subtask_count` 기반 lazy load + inline child row 표시
- `parent_id` 컬럼이 없는 기존 로컬 Docker DB에서도 `/api/vocs`가 깨지지 않도록 backend 방어 처리
- 검증: frontend typecheck, frontend Vitest 25/25, backend VOC/subtask Jest 33/33

---

## Phase 9: 운영 실구현 + 배포

> **목표**: production 준비 완료 + 실 환경 배포.

| 단계 | 내용                                                            | 비고               |
| ---- | --------------------------------------------------------------- | ------------------ |
| 9-1  | `connect-pg-simple` 세션 스토어 — `NODE_ENV=production` 시 적용 | F-4 defer에서 이관 |
| 9-2  | OIDC 인증 실구현 (`oidcAuthMiddleware`)                         |                    |
| 9-3  | Production Dockerfile + 빌드 파이프라인                         | 기술부채           |
| 9-4  | 구조화 로깅 (`pino`)                                            | 기술부채           |
| 9-5  | 실 MSSQL 연동 (설비 마스터 — 담당자 자료 수집 후)               | 외부 의존 (G-1)    |
| 9-6  | 배포 + smoke test                                               |                    |
| 9-7  | Playwright E2E 설정 + 핵심 3플로우 테스트 (requirements §13.3)  |                    |
| 9-8  | Jira 마이그레이션 스크립트 작성 + 실행 (오픈 전 필수)           |                    |

### Phase 9 착수 전 확인 사항

- [ ] G-1 설비 마스터 MSSQL 스키마 — 담당자 자료 수집 후 `external-masters.md §3` 업데이트 (외부 의존)

---

## 전체 완료 조건

- [x] prototype → 실구현 컴포넌트 완비
- [x] `requirements.md` + `design.md` — 단일 출처로 완비, 인덱스 포함
- [x] CLAUDE.md frontend / backend / prototype / project 단위로 분리
- [x] AGENTS.md frontend / backend / prototype / project 단위로 추가
- [x] 인증 mock 전략 + DB 마이그레이션 방식 결정 및 문서화
- [x] 상태 관리 방식 결정 → requirements.md 반영
- [x] API 계약 방식 결정 + Mock API 전략 확정
- [ ] Production 배포 완료 (Phase 9)
- [ ] Jira 마이그레이션 완료 (Phase 9)
