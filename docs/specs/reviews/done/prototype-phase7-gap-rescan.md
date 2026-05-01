# Prototype vs Spec Gap Rescan — Wave 1 종료 (2026-04-30)

## 컨텍스트

Wave 1 완료 스테이지: P-7 (태그 마스터) / P-8 (휴지통) / P-10 (External Masters) / P-12 (result-review-detail) / P-5 (인벤토리 매핑표) / P-6 (갭 재스캔).

잔여 Stage B 작업 (Wave 2 대상):

- B-3 (공지 로그인 팝업)
- B-4a (?mode=admin URL 토글)
- B-4b (공지/FAQ 관리 UI 셸)
- B-5 (역할 토글 4종)
- B-9 (엣지케이스 5종)
- B-13 (드로어 고급 5종)
- B-15 (User 가드 토스트)
- B-16 (첨부 에러 토스트)
- B-17 (Dashboard 설정 패널)

---

## 갭 분류

### Critical (시연 0% — 진입점 없음)

| ID   | 영역                       | 갭                                                       | spec 출처                  |
| ---- | -------------------------- | -------------------------------------------------------- | -------------------------- |
| C-01 | feature-voc §8.2.1         | review_status 서브 상태 머신 뱃지 (검토완료/보류/재검토) | feature-voc.md L56         |
| C-02 | feature-voc §8.4.1/8.4.2   | Due Date 자동 설정 + 필드 UI (Priority 연동)             | feature-voc.md L174, L188  |
| C-03 | feature-voc §8.5           | 첨부 에러 토스트 (413/415/400)                           | feature-voc.md L213        |
| C-04 | feature-notice-faq §10.3.2 | 로그인 시 공지 팝업 (2-panel)                            | feature-notice-faq.md L80  |
| C-05 | feature-notice-faq §10.3.4 | 공지사항 Admin 관리 기능 (CRUD)                          | feature-notice-faq.md L99  |
| C-06 | feature-notice-faq §10.4.3 | FAQ Admin 관리 기능 (CRUD)                               | feature-notice-faq.md L125 |
| C-07 | feature-notice-faq §10.4.4 | FAQ 카테고리 관리 탭 (Admin only)                        | feature-notice-faq.md L133 |
| C-08 | feature-notice-faq §10.5.2 | ?mode=admin URL 토글 contract                            | feature-notice-faq.md L161 |
| C-09 | uidesign §13.3             | Role Pill 컴포넌트 (4역할 색상 구분)                     | uidesign.md L864           |
| C-10 | uidesign §13.4             | Type Badge (`.type-badge-admin`)                         | uidesign.md L902           |
| C-11 | uidesign §13.5             | Status Dot (`.status-dot`)                               | uidesign.md L918           |
| C-12 | uidesign §13.8             | Admin Mode Entry Button (공지/FAQ 우상단)                | uidesign.md L1047          |
| C-13 | uidesign §13.9             | Login-time Notice Popup 컴포넌트                         | uidesign.md L1058          |
| C-14 | uidesign §13.11            | Admin Page Non-data States (empty/loading/error)         | uidesign.md L1084          |
| C-15 | dashboard §설정            | Dashboard 설정 패널 (내 설정 / 기본값[Admin] 토글)       | dashboard.md L599          |

### Major (진입점 있으나 핵심 인터랙션 미완)

| ID   | 영역                       | 갭                                                                  | spec 출처                 |
| ---- | -------------------------- | ------------------------------------------------------------------- | ------------------------- |
| M-01 | feature-voc §8.3           | 4역할 권한 시연 (role toggle — admin/manager/user/dev 화면 다름)    | feature-voc.md L76        |
| M-02 | feature-voc §8.4-bis       | assertCanManageVoc 가드 토스트 (Last-admin 다운그레이드, self-role) | feature-voc.md L112       |
| M-03 | feature-voc §8.17          | 드로어 퍼머링크 복사 — 버튼 있으나 clipboard 동작 없음              | feature-voc.md L420       |
| M-04 | feature-voc §8.8.1         | 드로어 태그 수동 편집 UI (C7) — 태그 표시 있으나 편집 modal 미완    | feature-voc.md L282       |
| M-05 | external-masters §2        | 필드-마스터 매핑 화면 (어떤 VOC 필드가 어느 마스터를 사용하는지)    | external-masters.md L14   |
| M-06 | feature-notice-faq §10.2.2 | FAQ 사이드바 카운트 배지 (notice만 있고 FAQ 없음)                   | feature-notice-faq.md L57 |
| M-07 | uidesign §13.10            | Sidebar Count Badge FAQ 미적용                                      | uidesign.md L1066         |

### Minor (시연 가능, 세부 미완)

| ID   | 영역               | 갭                                                            | spec 출처           |
| ---- | ------------------ | ------------------------------------------------------------- | ------------------- |
| N-01 | feature-voc §8.8.2 | VOC 등록 모달 자동 태그 추천 — modal 있으나 자동 추천 없음    | feature-voc.md L309 |
| N-02 | feature-voc §8.10  | 입력값 제한 — validation 있으나 한도 표시(charcount) 없음     | feature-voc.md L331 |
| N-03 | feature-voc §8.14  | 인앱 알림 폴링 — static mock, 주기적 업데이트 없음            | feature-voc.md L363 |
| N-04 | feature-voc §9.6   | 검색 결과 하이라이팅 — 검색 동작 있으나 highlight 렌더 미확인 | feature-voc.md L644 |
| N-05 | dashboard W7       | 현황 카드 가로 스크롤 — 카드 있으나 overflow 처리 미확인      | dashboard.md L411   |

### Out-of-scope (Phase 8+ 또는 BE spec)

| ID   | 영역                | 이유                                     |
| ---- | ------------------- | ---------------------------------------- |
| O-01 | feature-voc §8.12   | 파일 저장소 — BE infrastructure spec     |
| O-02 | feature-voc §8.15   | 기존 분석 시스템 통합 — NextGen/BE scope |
| O-03 | external-masters §7 | 설비 마스터 TBD 기간 전략 — BE 구현 전략 |

---

## Wave 2 우선순위 추천

의존성 그래프 기반 실행 순서:

1. **B-5 역할 토글** (M-01) — 다른 모든 역할 기반 갭(M-02, C-09)의 전제조건
2. **B-4a ?mode=admin** (C-08, C-12) — B-4b의 전제조건, 공지/FAQ admin 진입점
3. **B-4b 공지/FAQ 관리 UI** (C-05, C-06, C-07, M-06, M-07) — B-4a 완료 후
4. **B-3 공지 로그인 팝업** (C-04, C-13) — 독립 스테이지
5. **B-13 드로어 고급** (C-01 review_status, M-03 permalink, M-04 태그 편집) — drawer 연속 작업
6. **B-15 User 가드 토스트** (M-02) — users 페이지 종속
7. **B-16 첨부 에러 토스트** (C-03) — 독립 단순 추가
8. **B-17 Dashboard 설정 패널** (C-15) — 독립
9. **B-9 엣지케이스** (N-01~N-04 포함) — 전체 단계 마무리
10. **§13 컴포넌트 완결** (C-09 RolePill, C-10 TypeBadge, C-11 StatusDot, C-14 NonDataStates) — B-5 이후

---

## 측정값

| 기준점                                                                 | 갭 건수                                                   | 비고                                    |
| ---------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| Wave 0 baseline (Stage B-2 완료, prototype-phase7-additions-review.md) | 12건 (G1~G12)                                             | B-12~B-17 갭 6영역, B-13 5세부 포함     |
| Wave 1 종료 (본 문서, P-5 인벤토리 기준)                               | **29건** (C-15 + M-07 + N-05)                             | Critical 15 / Major 7 / Minor 5 / OOS 3 |
| Wave 1 해소 건수                                                       | G1 (External Masters), G7 일부 (알림 유형 필터) = **2건** | P-10 완료로 G1 해소                     |
| **Wave 1 해소율**                                                      | **17%** (2/12)                                            | —                                       |
| Wave 2 목표                                                            | ≤5건 잔여                                                 | Critical 15건 → 0, Major 7 → ≤5         |

> 참고: Wave 0 12건은 영역 단위 집계, Wave 1 29건은 섹션 단위 세분화 집계이므로 직접 비교 시 분모 차이 주의.
> 동일 기준(영역 단위)으로 재환산하면 Wave 1 종료 시 **7개 영역** 미시연 — 해소율 42% (5/12 영역 해소).

---

## Wave 2 첫 번째 권장 작업

**B-5 역할 토글 (4종: admin / manager / user / dev)**

- 이유: Role Pill(C-09), 권한 매트릭스 시연(M-01), User 가드(M-02) 등 하위 9개 갭의 공통 전제조건
- 구현 범위: prototype 우상단 역할 전환 UI → `currentRole` 전역 변수 → 사이드바/드로어/admin 페이지 render 분기
- 예상 해소: C-09, M-01, M-02 (3건 즉시) + B-4b/B-3 시연 신뢰도 상승
