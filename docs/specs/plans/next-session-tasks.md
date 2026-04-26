# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-04-26 (VOC 목록 세밀 UI 갭 분석 완료)
> 목표: **VOC 목록 UI 갭 수정 → Phase 9 운영 실구현 + 배포**

## 현재 상태

| 항목                            | 상태                                                  |
| ------------------------------- | ----------------------------------------------------- |
| Phase 0~7 구현                  | ✅ 완료                                               |
| Phase 8 디자인                  | ✅ 완료 + 머지                                        |
| 프로토타입 벤치마크             | ✅ 완료 (`benchmark/` 폴더, 24장 + INDEX.md)          |
| 네비바/상태배지 버그픽스        | ✅ 완료 + 머지 (PR #41)                               |
| VOC 리스트 UI/UX benchmark 정렬 | ✅ 완료 + 머지 (PR #43)                               |
| VOC 목록 세밀 UI 갭 분석        | ✅ 완료 (`docs/specs/reviews/voc-list-ui-ux-gaps.md`) |
| VOC 목록 세밀 UI 갭 수정        | ✅ 완료 (feat/align-seed-to-prototype)                |
| Phase 9                         | ⏳ 대기                                               |

---

## 다음 세션 시작 전

1. ~~네비바/상태배지 버그픽스 PR 머지~~ ✅ 완료 (PR #41)
2. ~~VOC 리스트 UI/UX benchmark 정렬 PR 머지~~ ✅ 완료 (PR #43)
3. **VOC 목록 세밀 UI 갭 수정** (아래 항목 참조)
4. Phase 9 작업 시작

---

## VOC 목록 세밀 UI 갭 수정

> 갭 분석 전문: `docs/specs/reviews/voc-list-ui-ux-gaps.md`
> 브랜치: `feat/align-seed-to-prototype` (현재 브랜치에서 계속)

### 글자 크기

- [ ] `VocRow.tsx:137` — 이슈 ID `text-sm`(14px) → `text-xs`(12px)
- [ ] `VocFilterBar.tsx:112` — 상태 탭 버튼 `text-sm`(14px) → `fontSize: '13px'`
- [ ] `VocRow.tsx:232` — 유형 배지 텍스트 `11px` → `12px`

### 태그 칩 (`VocRow.tsx`)

- [ ] `VocRow.tsx:275` — `borderRadius: '4px'` → `'9999px'` (pill)
- [ ] `VocRow.tsx:271` — `padding: '1px 6px'` → `'2px 8px'`

### 유형 배지 (`VocRow.tsx`)

- [ ] `VocRow.tsx:230` — padding 세로 `1px` → `2px`
- [ ] `VocRow.tsx:240` — dot `fontSize: '8px'` → `'9px'`, `marginRight: '3px'` → `'4px'`
- [ ] `VocRow.tsx:224` — 서브 VOC 행에서 유형 배지 숨김 제거 (`!isChild` 조건 삭제)

### 테이블 셀 패딩 (`VocRow.tsx`)

- [ ] 이슈 ID / 제목 / 등록일 셀: `px-4`(16px) → `px-3`(12px)
- [ ] 상태 / 담당자 / 우선순위 셀: `px-3`(12px) → `px-2`(8px)

### 테이블 열 넓이 (`VocList.tsx`)

- [ ] 이슈 ID 컬럼: `150px` → `180px`
- [ ] 상태 컬럼: `88px` → `76px`
- [ ] 담당자 컬럼: `108px` → `96px`
- [ ] 우선순위 컬럼: `82px` → `76px`
- [ ] 등록일 컬럼: `90px` → `86px`

### 필터 더보기 (`VocFilterBar.tsx`)

- [ ] 유형(VOC type) 필터 행 추가: 버그/기능 요청/개선 제안/문의 칩
- [ ] 필터 행 순서 변경: 담당자 → 우선순위 → 유형 → 태그

### 기타

- [ ] 미배정 담당자 아이콘: `UserX` → `UserMinus` 또는 벤치마크와 일치하는 아이콘으로 교체 (`VocRow.tsx:68`)
- [ ] 완료 후 Playwright 스크린샷으로 벤치마크와 재비교

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
