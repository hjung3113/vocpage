# VOC 목록 응답의 has_children / notes_count는 SQL 집계로 계산한다

`VocListItem.has_children`과 `VocListItem.notes_count`는 wire 계약(`shared/contracts/voc/entity.ts`)에 선언된 실제 필드다. `services/voc.ts`의 `toListItem`에서 하드코딩(`false` / `0`)하지 않는다.

## Context

현재 `toListItem` 구현이 두 필드를 항상 `false`/`0`으로 반환한다. `shared/contracts`에 필드가 선언되어 있고 FE 컴포넌트(`VocRow`, `VocTable`)가 실제로 소비하므로 이는 프로토콜 거짓말이다. MSW mock handler는 이미 `notes_count`를 실제 계산하고 있어 FE 테스트는 정확한 값을 가정한다.

## Decision

`repository/voc.ts`의 `listVocs` 쿼리에서 SQL 집계로 두 값을 계산한다.

- `has_children`: `EXISTS (SELECT 1 FROM vocs c WHERE c.parent_id = v.id AND c.deleted_at IS NULL)`
- `notes_count`: `(SELECT COUNT(*) FROM voc_internal_notes n WHERE n.voc_id = v.id)`

하드코딩 임시값은 허용하지 않는다 — 값이 아직 준비되지 않았다면 계약에서 필드를 제거하는 쪽이 맞다.

## Consequences

- list 쿼리 비용이 소폭 증가 (서브쿼리 2개). VOC 수가 수천 이하인 MVP 규모에서는 무시 가능.
- FE 테스트의 `notes_count` mock 값이 실제 BE 응답과 일치하게 된다.
