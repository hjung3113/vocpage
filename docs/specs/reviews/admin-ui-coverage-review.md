# 관리자 페이지 UI 커버리지 리뷰

> 작성: 2026-04-27
> 질문: "관리자 페이지들만으로 DB 직접 접근 없이 모든 메뉴 관리가 가능한가?"
> 방법: 요구사항(§4 스키마 + §15 + feature-\*.md + dashboard.md) 항목별로 관리 UI 매핑

---

## 1. 매핑 결과 (요약)

| #   | 관리 대상                                | 관리 UI                             | 커버               |
| --- | ---------------------------------------- | ----------------------------------- | ------------------ |
| 1   | `users` role/active                      | 사용자 관리 (§9.4.4)                | ✅                 |
| 2   | 사용자 사전 초대                         | AD/SSO 자동 생성 (§15.2)            | ✅ 의도적          |
| 3   | `systems` CRUD/아카이브                  | 시스템 관리 (§9.4.2)                | ✅                 |
| 4   | `menus` CRUD/아카이브                    | 메뉴 관리 (§9.4.2)                  | ✅                 |
| 5   | `voc_types` CRUD/아카이브                | 유형 관리 (§9.4.3)                  | ✅                 |
| 6   | `tag_rules` CRUD                         | 태그 규칙 관리 (§9.4.1, §8.8.3)     | ✅                 |
| 7   | **`tags` 마스터 CRUD**                   | **부재**                            | ❌ **GAP-1 → D22** |
| 8   | `vocs.review_status`                     | Result Review (§9.4.5)              | ✅                 |
| 9   | VOC Soft Delete                          | VOC 상세 액션 (§8.9)                | ✅                 |
| 10  | **Soft-deleted VOC 복원/휴지통**         | **`?includeDeleted=true` 쿼리만**   | ❌ **GAP-2 → D23** |
| 11  | `notices` CRUD/노출/복원                 | 공지 페이지 `?mode=admin` (§10.3.4) | ✅                 |
| 12  | `faqs` CRUD/노출/복원                    | FAQ 페이지 `?mode=admin` (§10.4.3)  | ✅                 |
| 13  | `faq_categories` CRUD/순서               | FAQ 카테고리 관리 탭 (§10.4.4)      | ✅                 |
| 14  | `dashboard_settings` Admin 기본값        | 대시보드 설정 패널                  | ✅                 |
| 15  | 외부 마스터 Refresh                      | 전역 + 편집 화면 🔄 (§16.3)         | ✅                 |
| 16  | 외부 마스터 캐시 메타 인스펙트           | 배지만 노출                         | ⚠️ **GAP-3 → N-1** |
| 17  | 자동 태그 재부여 차단 이력 reset         | 부재                                | ⚠️ **GAP-4 → N-2** |
| 18  | Jira import (`source='import'`)          | 1회성 스크립트                      | ✅ 의도적          |
| 19  | `attachments` orphan 모니터링            | 부재                                | ⚠️ NextGen         |
| 20  | `voc_history`/`voc_payload_reviews` 통합 | Result Review 외 부재               | ⚠️ NextGen         |
| 21  | `notifications` broadcast/dedup 점검     | 부재                                | ✅ 의도적          |
| 22  | `embedding`/`embed_stale`                | MVP 미실행                          | ✅ 의도적          |
| 23  | issue_code/subtask_counter sequence      | 자동                                | ✅                 |

---

## 2. 결론

DB 직접 접근 없이 운영 가능 — **단, 4개 갭 해결 후**.

- 🔴 **차단**: GAP-1 (tags 마스터 CRUD 페이지), GAP-2 (휴지통/복원 화면)
- 🟡 **비차단**: GAP-3 (외부 마스터 캐시 인스펙트), GAP-4 (자동 태그 재부여 차단 reset)

---

## 3. 처리 결과 (2026-04-27)

| 갭    | 처리                                                                                       |
| ----- | ------------------------------------------------------------------------------------------ |
| GAP-1 | **D22 확정** → `feature-voc.md §9.4.6` 태그 마스터 관리 신설. requirements.md §17 D22 추가 |
| GAP-2 | **D23 확정** → `feature-voc.md §9.4.7` 휴지통 신설. requirements.md §17 D23 추가           |
| GAP-3 | **NextGen 이연** → `next-session-tasks.md` 미결 N-1                                        |
| GAP-4 | **NextGen 이연** → `next-session-tasks.md` 미결 N-2                                        |

이연 작업:

- Phase 7 P-7/P-8: 신규 2개 화면 prototype 반영
- Phase 8 8-6: 신규 2개 화면 코드 구현 + 회귀 테스트(태그 4건, 휴지통 3건)

---

## 4. 다음 세션 이어서 리뷰할 항목

1. D22 §9.4.6 / D23 §9.4.7 명세 자체에 대한 사용자 검토 (이름/슬러그 정책, 병합 UX, 휴지통 진입 동선 = 사이드바 vs VOC 목록 토글)
2. 다른 화면들에서 발견되는 추가 갭(Phase 7 prototype 작업 중 P-6 갭 재스캔과 함께)
3. NextGen N-1/N-2 활성화 트리거 조건 (운영 실측 후 결정 시점)
