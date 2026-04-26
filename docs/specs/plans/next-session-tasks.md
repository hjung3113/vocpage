# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-04-26 (30차 — Phase 8 UI/UX 정렬 완료, Phase 9 운영 실구현 착수 대기)
> 목표: **Phase 9 운영 실구현 + 배포**

## 현재 상태

| 항목                               | 상태                                   |
| ---------------------------------- | -------------------------------------- |
| Phase 0~7 구현                     | ✅ 완료                                |
| Phase 8 UI/UX 정렬 (autopilot)     | ✅ 완료 (2026-04-26, commit: 42cc1c9)  |
| Playwright E2E B-1~B-7 버그 수정   | ✅ 완료 (2026-04-26)                   |
| feat/voc-seeds-toastui-fix PR #38  | ✅ 머지 완료                           |
| fix/phase8-design-theme-fix 브랜치 | ✅ 커밋 완료 (PR 머지 후 Phase 9 착수) |

---

## 🔴 Phase 8: 디자인 · 기능 버그 수정

> **목표**: prototype과 구현체를 나란히 비교하며 발견된 디자인 불일치 + 기능 버그를 전부 수정. 운영 단계 진입 전 품질 기준선 확보.

### 8-1/8-2 완료된 항목 (fix/phase8-design-theme-fix 브랜치)

- [x] `index.css` — `color-scheme: light dark` + `light-dark()` 토큰 전체 교체 (라이트모드 복원)
- [x] `ThemeContext` 생성 — system/light/dark 3단 토글, `localStorage` 저장
- [x] `AppProviders` — ThemeProvider 최상위 추가
- [x] `Sidebar` — VOCpage BETA 로고+브랜드마크, `var(--brand-bg)` active 스타일, 관리자 서브메뉴 6개, 하단 테마 토글 버튼
- [x] `VocTopbar` — "전체 VOC" 제목, 검색 아이콘 내장, `+ 새 VOC 등록` 버튼 스타일
- [x] `VocFilterBar` — 라디오 스타일 탭 + "필터 더보기" 토글 패널

### 8-2 잔여 항목 (다음 세션)

| 항목                  | 설명                                                                                                  | 파일                           |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------ |
| 테이블 컬럼 순서      | 프로토타입: 이슈ID→제목→상태→담당자→우선순위→등록일 / 구현체: 상태→이슈코드→제목→우선순위→등록일→기한 | `VocList.tsx`, `VocRow.tsx`    |
| 행 타입 배지          | 각 행에 버그/기능요청/계산제안 pill 표시 — `voc_type_id` 기반으로 이름 조회 필요                      | `VocRow.tsx`, API              |
| 담당자 컬럼           | 아바타 + 이름 — `assignee_id` 있으나 이름 없음, MasterCache 또는 별도 API 필요                        | `VocRow.tsx`, `VocList.tsx`    |
| 사이드바 카운트 배지  | 내 VOC / 담당 VOC / 시스템별 미결 건수                                                                | `Sidebar.tsx`                  |
| 필터 탭 상태별 아이콘 | 접수/검토중/처리중/드랍/완료 아이콘                                                                   | `VocFilterBar.tsx`             |
| `/api/users` 404      | 백엔드 users 라우트 미등록 — 담당자 필터 드롭다운 작동 안 함                                          | `backend/src/routes/`          |
| 관리자 사이드바 링크  | 현재 전부 `/admin`으로 연결 — 탭 파라미터(`?tab=tags` 등)로 세분화 필요                               | `Sidebar.tsx`, `AdminPage.tsx` |

### 8-3 기능 버그 수정 (다음 세션 피드백 후)

| 항목                               | 상태 |
| ---------------------------------- | ---- |
| 각 페이지 상세 디자인 피드백 수집  | 미완 |
| VOC 드로어 / 생성 모달 디자인 검토 | 미완 |
| 대시보드 페이지 디자인 검토        | 미완 |

### 8-4 전체 E2E 재검증 (Playwright)

| 항목                            | 상태 |
| ------------------------------- | ---- |
| 라이트/다크 모드 토글 동작 확인 | 미완 |
| VOC 전체 플로우 재검증          | 미완 |

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
- [x] 인증 mock 전략 + DB 마이그레이션 방식 결정 및 문서화
- [x] 상태 관리 방식 결정 → requirements.md 반영
- [x] API 계약 방식 결정 + Mock API 전략 확정
- [ ] Production 배포 완료 (Phase 8)
- [ ] Jira 마이그레이션 완료 (Phase 8)
