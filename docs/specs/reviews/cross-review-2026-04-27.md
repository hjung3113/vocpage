# Cross-Review 2026-04-27 — 통합 요약

> 4개 도메인 에이전트(A 요구사항, B DB+BE, C 공지/마스터, D FE+Design)의 5×3 체크리스트 리뷰 종합. 도메인별 상세 보고는 통합 후 폐기 — 결정·적용 항목은 `docs/specs/plans/next-session-tasks.md` "다음 세션 — 결정 + 적용" 섹션에서 추적.

## 1. 도메인별 종합 점수

| Agent    | 도메인                        | 합계              | 명세 평균 | 정합성 평균 | 누락 평균 |
| -------- | ----------------------------- | ----------------- | --------- | ----------- | --------- |
| A        | requirements + dashboard      | 46/75 (61%)       | 3.6       | 2.2         | 3.4       |
| B        | feature-voc + DB + BE         | 36/75 (48%)       | 3.3       | 0.7         | 3.3       |
| C        | notice/faq + external-masters | 33/75 (44%)       | 3.6       | 0.8         | 3.0       |
| D        | design + admin UI + FE        | 36/75 (48%)       | 3.8       | 1.4         | 2.8       |
| **종합** |                               | **151/300 (50%)** | **3.6**   | **1.3**     | **3.1**   |

**해석**: 명세 품질은 평균 3.6/5으로 양호. 누락 평가도 3.1/5 (admin-ui-coverage-review·schema-gap 리뷰들이 NextGen 분기까지 깔끔). **정합성 1.3/5는 Phase 7 진입 전 의도된 갭** — BE 라우트는 `auth.ts` 단일, FE 페이지는 `MockLoginPage.tsx` 단일.

## 2. 공통 Critical 이슈 (2개 이상 에이전트가 지적)

| #      | 이슈                                                                                                                                                                                                                                        | 지적 에이전트                 | Impact                                 | Effort                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------- | --------------------- |
| **X1** | **Dev role 미동기** — migration 012 draft 잔존 + BE `auth/types.ts:5`, `requireRole.ts:3` + FE `api/auth.ts:5`, `MockLoginPage.tsx:8/51-53` 모두 3-role enum                                                                                | B(C3), D(HIGH-1)              | High                                   | Low (4파일 + 1마이그) |
| **X2** | **D22 태그 마스터 / D23 휴지통의 DB·UI 진입점 부재** — feature-voc.md §9.4.6/9.4.7 본문은 있으나 ① 마이그 013/014(`tags.is_external`/머지 FK/`tag_rules.suspended_until`/`vocs.deleted_by`) 부재 ② requirements.md §15 본문에 진입점 미언급 | A(C2), B(C4·C5)               | Medium                                 | Medium                |
| **X3** | **명세-구현 100% 갭** — VOC/dashboard/notice/faq/admin/masters API 14+개 라우트, FE 페이지 23개 모두 미구현                                                                                                                                 | A(3-②, 4-②), B(C2), C, D      | Critical (Phase 7→8 전환 전 정의된 갭) | High                  |
| **X4** | **명세 본문 모순/미반영** — D10 date preset (dashboard.md:607,688,689) + Notice/FAQ 폐기 메뉴 prototype 잔존(`prototype.html:1169-1170,2329-2330,3102,3178`) + design.md §13 컴포넌트 React 미구현                                          | A(C1), C(CRITICAL), D(HIGH-3) | High                                   | Low~Medium            |
| **X5** | **누락 토큰·스키마 디테일** — `MockLoginPage.tsx:48,57` 미정의 토큰 사용 + `005_content.sql:67-73` `slug UNIQUE`/`is_archived` 명세 부재 + `notices.visible_from/to` timezone 누락                                                          | C(MAJOR-1·2), D(HIGH-2)       | Medium                                 | Low                   |

## 3. 도메인별 Top Critical 한 줄 요약

### A. Requirements/Dashboard

- C1 D10 date preset 3중 동기화 실패 (dashboard.md ↔ req §4 ↔ migration 011)
- C3 dashboard API 응답 shape 6종 미정의

### B. DB+BE

- C1 `assertCanManageVoc` 헬퍼 grep 0건 (§8.4-bis 무력화)
- C2 VOC route + 서비스 레이어 전무, `vocs.test.ts` `it.todo` 만
- C4/C5 D22/D23 미신설 마이그(013/014 후보)

### C. Notice/FAQ + Masters

- CRITICAL prototype 사이드바 "공지사항/FAQ 관리" 메뉴 + `renderAdminNotices/Faq()` 잔존 → D19 결정과 직접 모순
- MAJOR-3 external-masters atomic swap 정책(전체 vs source별) 미정, refresh 스케줄러/실패 처리 부재

### D. FE+Design+Admin UI

- HIGH-3 `?mode=admin` 토글 0 hit (ADR #4 시연 부재)
- HIGH-2 미정의 토큰 `var(--border)`, `var(--danger)` 사용
- HIGH-4 prototype L95/157 `#fff` 2건 + L399~435 raw `light-dark(oklch())` 잔존

## 4. 권장 후속 Phase 항목 (우선순위 순)

### 즉시 (Phase 7 prototype 작업과 병행, 코드 변경 없음)

- **R-5**: dashboard.md `7d/30d/90d` → `1m/3m/1y/all/custom` 일괄 치환 (3줄)
- **R-6**: dashboard.md API 응답 shape 6종 추가
- **R-7**: requirements.md §15 본문에 §15.3 태그 마스터 + §15.4 휴지통 진입점 추가
- **R-10** (新): prototype.html 사이드바 "공지/FAQ 관리" 메뉴 + `renderAdminNotices/Faq()` 함수 제거 (D19 정합)
- **R-11** (新): prototype.html L95/157 `#fff`, L399~435 raw oklch 토큰화 (audit T5 마무리)
- **R-12** (新): design.md §5/§13 에 empty/error/loading 상태 패턴 정식화

### Phase 7 prototype 작업 본 항목

- **P-7/P-8** (기 계획): D22 태그 마스터, D23 휴지통 prototype HTML
- **P-9** (新): `?mode=admin` 토글 prototype 시연 추가 (ADR #4 검증)

### Phase 8 (BE/FE 코드 구현 첫 PR 후보)

- **F1 + 마이그 012 실파일**: dev role 4파일 동기 + 마이그 012 draft → 실파일 (X1 해소, **가장 저비용·고효과**)
- **마이그 013** (新): `tags.is_external`, `tags.merged_into_id` FK, `tag_rules.suspended_until` (D22 운영 차단)
- **마이그 014** (新): `vocs.deleted_by`, `voc_restore_log` (D23 운영 차단)
- **F3 + §8.4-bis**: `assertCanManageVoc` 헬퍼 단일화 + 모든 VOC 운영 라우트 적용
- **C 영역 MAJOR-1**: `005_content.sql` `faq_categories.slug UNIQUE`/`is_archived` 명세 §10.4 보완
- **C 영역 MAJOR-2**: `notices.visible_from/to` → `timestamptz` + KST 자정 경계 명문화
- **C 영역 MAJOR-3**: external-masters atomic swap 정책 결정 + refresh 스케줄러 spec
- **D 영역 HIGH-2**: FE 미정의 토큰 사용 정리 (`--border` → `--border-standard`, `--danger` → `--status-red`)

### Phase 8 이후 (테스트·QA)

- **R-8**: dashboard.md 수용 기준 23개 → §13.1.1 Given/When/Then 포맷
- **R-9**: §13.4 성능 데이터셋 규모 통일 (1,000건 vs 10만 건)
- **F12**: §8.4-bis BE 회귀 테스트 5건

## 5. Open Questions (사용자 결정 필요)

1. R-5/R-7/R-10/R-11/R-12 중 어디까지를 docs/admin-ui-gaps 브랜치 후속 PR로 묶을 것인가 (현 브랜치는 D22/D23 명세까지 머지 완료)
2. dashboard 수용 기준 ↔ §13.1.1 AC 포맷 강제 범위 — 위젯 동작 AC도 일괄 통일 vs 위젯은 체크리스트 허용
3. external-masters atomic swap: 전체 트랜잭션 vs source별 독립 — 운영 인시던트 격리 vs DB 단순성 트레이드오프
4. 마이그 013/014를 Phase 8 첫 PR(=마이그 012 dev role)과 같이 묶을지, 별도 PR로 분리할지
5. embedding/embed_stale 컬럼(req §16.2) MVP 보존 vs 마이그 015에서 정리 — NextGen 시점 합의

## 6. 종합 코멘트

- **명세 품질은 production-ready 수준** (평균 3.6/5). §17 D1~D23 결정 이력 + admin-ui-coverage 23행 매핑 + schema-requirements-gap 분류 등 거버넌스 산출물이 잘 갖춰져 있음.
- **그러나 결정 → 본문 흡수 단계에서 누수가 있음** (D10 dashboard.md 미반영, D22/D23 §15 본문 미언급, D19 prototype 잔존). 다음 세션의 R-5/R-7/R-10이 가장 저비용·고효과.
- **Phase 8 코드 구현 첫 PR로는 "마이그 012 실파일 + dev role 4파일 동기 + assertCanManageVoc 헬퍼"** 묶음이 critical path. 이걸 먼저 닫지 않으면 후속 VOC 라우트가 권한 가드 없이 양산될 위험.
- **마이그 013(D22)·014(D23)는 prototype 명세 마무리 후 Phase 8 두 번째 PR로 분리 권장** — 운영 갭 해소가 목적이므로 첫 PR(권한 인프라)과는 책임 영역이 다름.
