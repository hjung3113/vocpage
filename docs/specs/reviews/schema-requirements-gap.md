# 요구문서 ↔ DB 스키마 간극 리뷰 — 잔여 항목 (2026-04-26)

> **원본 리뷰일**: 2026-04-26
> **최종 갱신**: 2026-04-26 (P1 4건 + P2 5건 + DB Major 2건 + Mock User FK + GAP-1 완료 반영)

---

## 완료 처리

| ID     | 결정 / 처리                                                                         | 반영 위치                                       |
| ------ | ----------------------------------------------------------------------------------- | ----------------------------------------------- |
| GAP-1  | `vocs.issue_code NOT NULL`                                                          | `migrations/011`                                |
| GAP-3  | `vocs.status_changed_at` 컬럼 + 트리거 + partial index (D9)                         | `migrations/011`, requirements §4 vocs          |
| GAP-4  | dashboard preset → `1m/3m/1y/all/custom` (D10) + 기존 데이터 매핑 + 요구문서 동기화 | `migrations/011`, requirements §4, dashboard.md |
| GAP-5  | Mock User seed 추가 (D11)                                                           | `seeds/mock-users.sql`, requirements §14.5      |
| GAP-6  | tag_rules MVP 키워드 only (D12)                                                     | requirements §4 tag_rules, feature-voc.md §8.8  |
| GAP-7  | `vocs(review_status)` partial index                                                 | `migrations/011`                                |
| GAP-8  | `vocs(due_date)` partial index                                                      | `migrations/011`                                |
| GAP-9  | title/body/comment/internal_note 길이 CHECK (D17)                                   | `migrations/011`                                |
| GAP-10 | `voc_types.color` hex CHECK + default `#8a8f98` + named→hex 매핑                    | `migrations/011`, `seeds/dev_seed.sql`          |
| GAP-11 | 알림 디바운스: DB 조회 기반 (D8 갱신) + (user_id, type, voc_id, created_at) 인덱스  | `migrations/011`                                |
| DB-M1  | `vocs.parent_id` FK ON DELETE SET NULL (D13)                                        | `migrations/011`                                |
| DB-M2  | `tag_rules` pattern_type → MVP 키워드 단일 모드로 결정 (스키마 변경 없음)           | requirements §4 tag_rules                       |

---

## 잔여 (P3 — Phase 8 운영 시점 검토)

| ID     | 작업                                                                  | 영향 범위            |
| ------ | --------------------------------------------------------------------- | -------------------- |
| GAP-12 | `notices` 노출 기간 partial index (`visible_from`, `visible_to`)      | 운영 데이터 누적 후  |
| GAP-13 | `faqs (category_id, is_visible)` 복합 인덱스                          | 운영 데이터 누적 후  |
| GAP-14 | `users (role, is_active)` 부분 인덱스                                 | 명시성               |
| GAP-15 | `systems / menus.sort_order` 결정 + 스키마 반영 (현재 정렬 기준 미정) | 사이드바 정렬 정합성 |

---

## 결론

Phase 7 진입 전 차단 항목은 모두 해소. P3 4건은 운영 데이터 누적 후 Phase 8 시점에 인덱스/제약 보강 마이그레이션 012로 묶어 처리. GAP-15(sort_order)는 사이드바 트리 구현 시 명세 결정 필요.
