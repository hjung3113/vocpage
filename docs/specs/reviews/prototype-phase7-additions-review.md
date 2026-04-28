# Prototype Phase 7 — Stage B 추가 항목 리뷰 (2026-04-28)

> 출처: 사용자 요청 — "요구사항 문서 리뷰해서 prototype 고도화에 부족한 항목 추가하자. 목표는 prototype만 봐도 어떤 기능이 있는지 다 알 수 있게."
> 산출물: `.omc/plans/prototype-phase7.md` Stage B 표 갱신 (B-4 → B-4a/B-4b 분할 + B-12~B-17 신설)
> 관련 plan: `docs/specs/plans/next-session-tasks.md` Phase 7 표 P-10~P-15 추가

---

## Goal (수용 기준)

prototype을 단독으로 열었을 때 비개발자가 모든 spec 기능의 존재와 동작 흐름을 시각적으로 이해할 수 있다.

1. 모든 spec 기능의 진입점이 prototype에 1개 이상 존재
2. 각 기능에 mock 데이터 + 1~2 인터랙션 (실제 저장 없이 토스트로 시연)
3. 모든 역할(admin/manager/user/dev)에서 보이는 화면이 다름을 시연 가능
4. spec ↔ prototype 매핑표(prototype-inventory.md)에서 spec 섹션의 ≥90% 커버
5. 4-domain 리뷰(feature-voc / feature-notice-faq / dashboard / external-masters) 각각 "미시연" 항목 0건

---

## 인벤토리 추출

4개 도메인 spec + requirements §15 + uidesign §13 통합 인벤토리:

- **feature-voc.md** — ~70 features (status matrix, review_status sub-state, 권한 행렬, 우선순위·기한, 첨부, 알림, sub-task, 분류, 태그, 소프트 삭제, 입력 한도, 필터, 댓글, Internal Notes, 드로어, 파일 저장)
- **feature-notice-faq.md** — ~20 features (사이드바, 공지 필드/팝업, FAQ 필드/리스트/관리, 카테고리 관리, 관리 진입점)
- **dashboard.md** — ~15 위젯 + 설정 (KPI 8, 분포 4탭, 매트릭스, 드릴다운 히트맵, 주별 추이, 태그 Top10, 시스템/메뉴 카드, 담당자별, 장기미해결 Top10, SLA, 에이징, 설정 패널)
- **external-masters.md** — ~5 features (Equipment/DB/Program 마스터, 캐시·검증, refresh atomic swap, 콜드스타트, 스냅샷 모드)
- **requirements.md §15** — Result Review, User 관리, Tag Master(D22), 휴지통(D23)
- **uidesign.md §13** — 12 components (AdminTopbar, RolePill×4, NoticeBadge×3, DevBadge, AssignedVocBadge, EmptyState, ErrorState, LoadingState, AdminButton, AdminTable, TypeBadge, StatusDot)

총 ~125 distinct features.

---

## 갭 분석

기존 Stage B (B-1~B-11)와 베이스라인 prototype을 매핑한 결과 **6개 영역**이 미시연.

| ID  | 갭                                                 | spec 출처                      | 신규 stage |
| --- | -------------------------------------------------- | ------------------------------ | ---------- |
| G1  | External Masters 관리 페이지 전체                  | external-masters.md §1~§8      | B-12       |
| G2  | VOC 드로어 고급: 상태 전이 disabled UI             | feature-voc.md §8.2            | B-13(a)    |
| G3  | VOC 드로어 고급: 완료 시 미완 sub-task 경고 modal  | feature-voc.md §8.2            | B-13(b)    |
| G4  | VOC 드로어 고급: 퍼머링크 복사 🔗 + 전체화면 ↗     | feature-voc.md §8.17 D15, §9.9 | B-13(c)    |
| G5  | VOC 드로어 고급: comment 편집/삭제 + "(수정됨)"    | feature-voc.md §8.13 / §9.7    | B-13(d)    |
| G6  | VOC 드로어 고급: `review_status` 뱃지              | feature-voc.md §8.2.1          | B-13(e)    |
| G7  | 알림 유형별 (댓글/상태/담당) + Urgent 빨강 느낌표  | feature-voc.md §8.6            | B-14       |
| G8  | User 관리 — 마지막 Admin 다운그레이드 가드 토스트  | feature-voc.md §8.3            | B-15(a)    |
| G9  | User 관리 — self-role-change 차단 토스트           | feature-voc.md §8.3            | B-15(b)    |
| G10 | User 관리 — `is_active` 비활성화 토글              | requirements.md §15.2          | B-15(c)    |
| G11 | 첨부 업로드 에러 토스트 (413/415/400)              | feature-voc.md §8.5            | B-16       |
| G12 | Dashboard 설정 패널 (내 설정 / 기본값[Admin] 토글) | dashboard.md §커스터마이징     | B-17       |

추가 분리 항목:

| ID  | 분리 사유                                                                           | 결과                                     |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------------- |
| S1  | B-4 한 단계에 `?mode=admin` 토글 + 공지/FAQ admin UI 양쪽이 묶여 있어 스코프 불명확 | B-4a (URL 토글) + B-4b (관리 UI 셸) 분할 |

---

## 갱신 후 Stage B 실행 순서

우선순위 정책(P-1→P-9→P-2→P-7→P-8→P-3→P-4 → P-10~15 → P-5/P-6) 기준:

```
B-3 (공지 팝업 2-panel)
B-4a (?mode=admin URL 토글)
B-4b (공지/FAQ 관리 UI 셸)
B-5 (역할 토글 4종)
B-6 (D22 태그 마스터)
B-7 (D23 휴지통)
B-8 (§13 컴포넌트 12건)
B-9 (엣지케이스 5종)
B-12 (External Masters)
B-13 (드로어 고급 a~e)
B-14 (알림 유형 + Urgent 뱃지)
B-15 (User 관리 가드 토스트)
B-16 (첨부 에러 토스트)
B-17 (Dashboard 설정 패널)
B-10 (인벤토리 매핑표)
B-11 (갭 재스캔)
```

총 16 stage. B-1·B-2 완료 제외 14개 남음.

---

## Goal 도달 자체 검증

| 기준                          | 상태           | 비고                                   |
| ----------------------------- | -------------- | -------------------------------------- |
| 1. 모든 spec 기능 진입점 존재 | ✅ (plan 단계) | B-12 추가로 External Masters 진입 확보 |
| 2. mock + 1~2 인터랙션        | ✅             | 전 stage "토스트 데모" 원칙 명시       |
| 3. 4역할 시연 가능            | ✅             | B-5                                    |
| 4. spec ↔ prototype ≥90% 매핑 | ⏳ 측정        | B-10 산출물에서 정량 확인              |
| 5. 4-domain 미시연 0건        | ⏳ 측정        | B-11 갭 재스캔에서 확정                |

→ Plan 단계에서 1~3 충족, 4·5는 실행 단계 산출물이라 plan 갱신만으로 보장 불가. 측정 시점은 Stage B 완료 직전 B-10/B-11.

---

## 비고

- `.omc/plans/prototype-phase7.md`는 작업 plan 정본(scratch-but-canonical for Phase 7), 이 review 문서는 의사결정 근거 기록
- 새 토큰 추가 금지(uidesign.md §13 기존만), HTML markup 단일 유지(빌드 툴 금지) 원칙은 그대로 적용
- 코드 변경 0건 (이번 PR은 plan/review 문서만)
