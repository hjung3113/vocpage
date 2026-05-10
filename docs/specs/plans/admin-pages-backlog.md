# Admin 페이지 백로그 (2026-05-10)

> 현 시점 admin 영역 미구현 페이지 + 통합 제안 메모. 별 wave plan 으로 격상하기 전 단일 문서.
> Trigger: 2026-05-10 사용자 사이드바 점검 — admin 4개만 존재 확인.

## 1. 현 상태 — 구현됨 (4)

| 라우트 | 페이지 | spec |
| --- | --- | --- |
| `/admin/tags` | 태그 마스터 | `feature-voc.md §9.4.6` |
| `/admin/masters` | 외부 마스터 (read-only) | `requirements.md §16.3`, `external-masters.md` |
| `/admin/users` | 사용자 관리 | `feature-voc.md §9.4.4` |
| `/admin/vocs/trash` | 휴지통 | `feature-voc.md §9.4.7` |

## 2. 미구현 (4) — spec 만 존재

| spec 라우트 | 페이지 | spec | 의존 | 비고 |
| --- | --- | --- | --- | --- |
| `/admin/systems` | 시스템/메뉴 관리 | `feature-voc.md §9.4.2` | `systems` / `menus` 테이블 (존재) | "기타" 메뉴 자동 생성 / archive 처리 / VOC 수 cascade. menu 단독 CRUD 는 `GET /api/masters/menus?system_id=` cascade 응답 재사용. |
| `/admin/voc-types` (가칭) | 유형 관리 | `feature-voc.md §9.4.3` | `voc_types` 테이블 (존재) | 색상 swatch 포함. archive 시 신규 등록 차단·기존 데이터 유지. |
| `/admin/result-review` | 결과 검토 | `feature-voc.md §9.4.5` | `structured_payload` 검증 게이트 + 임베딩/유사도 파이프라인 | 가장 무거움 — 매니저 동시 승인 동시성 제어 (`SELECT FOR UPDATE` + Idempotency-Key) 필요. NextGen 후보. |
| `/admin/tag-rules` | 태그 규칙 관리 | `feature-voc.md §9.4.1` | `tag_rules` 테이블 (mig 014 존재) | FU-016 (P2) — PR #262 hotfix 에 일시중지 disabled placeholder. **§3 통합 제안 참조.** |

부수 drift:
- `routing-conventions.md` 의 `/admin/external-masters` ↔ 구현 `/admin/masters` 명칭 불일치.
- `routing-conventions.md` 의 `/admin/notices` / `/admin/faqs` 는 spec 상 페이지 자체에 inline admin (`?mode=admin`) 으로 흡수됨 — 별 페이지 필요 없음.

## 3. 제안 — 태그 규칙을 태그 마스터에 통합

**현 spec**: `/admin/tags` (마스터) + `/admin/tag-rules` (규칙) 별 페이지.

**제안 형태**:
- 태그 마스터 행에 `규칙 N건` 컬럼/뱃지 추가.
- 행 액션 메뉴에 `규칙 관리` 버튼 → Dialog (또는 Sheet) 으로 *그 태그 한정* 규칙 CRUD: 키워드 추가/편집/삭제 + `suspended_until` 일시중지 토글.
- 신규 규칙 추가 시 `tag_id` 자동 결정 (현재 행) → 입력 단순화.
- 마스터 페이지 상단에 `전체 규칙 보기` 토글 (모든 태그의 규칙 펼침 모드) — 크로스-태그 검색 보완.

**근거**:
- `tag_rules.tag_id` FK 가 마스터를 참조 → 의존 방향이 단방향이라 자연스러움.
- 페이지 1 개 줄어듦 (`/admin/tag-rules` 미구현 → 그대로 폐기).
- 태그 ↔ 규칙 인과관계가 한 화면에 묶여 운영 mental model 단순화.
- FU-016 (Tag rule 일시중지 UI) 이 하위 액션으로 흡수 → close.

**Trade-off / 풀어야 할 OQ**:
- OQ-1: 한 키워드가 여러 태그 규칙에 매핑됐을 때의 글로벌 검색 UX — `전체 규칙 보기` 토글 + 키워드 검색 박스로 충분한지.
- OQ-2: spec drift 처리 순서 — 결정 확정 후 `routing-conventions.md` (`/admin/tag-rules` 라우트 행 제거) + `feature-voc.md §9.4.1` (페이지 분리 → 마스터 통합으로 재기술) 갱신을 **코드 PR 동일 또는 직전 PR** 에 묶을 것.

## 4. 우선순위 / 권장 순서

(시점 미정, 사용자 결정 시 plan 격상)

1. **태그 규칙 통합** (P2) — 가장 작음, FU-016 close 동반. spec 1 곳 + FE 1 페이지 + tag_rules CRUD hooks. BE 라우트 일부 존재.
2. **시스템/메뉴 관리** (P2) — `/admin/masters` 와 인접한 master 도메인. 테이블 2개 (시스템 + 메뉴) + cascade UX.
3. **유형 관리** (P2) — `voc_types` 단일 테이블 + 색상 picker.
4. **결과 검토** (P3 / NextGen) — 가장 무거움. `structured_payload` 검증 게이트 + 동시성 제어 + 임베딩 파이프라인 의존. 별 wave 또는 phase 필요.

## 5. Cross-ref

- 라우팅 정본: `routing-conventions.md`
- 도메인 spec: `feature-voc.md §9.4.1 ~ §9.4.7`
- 기존 followup: FU-016 (태그 규칙 일시중지 UI)
- ADR: 0004 (admin permission), 0005 (trash/restore)
