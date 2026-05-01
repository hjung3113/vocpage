# phase-8-contract-voc — Wave 1 contract memo

> 산출 PR: feat/phase-8-wave1 (Wave 1 vertical slice).
> 정본 plan: `docs/specs/plans/phase-8-wave1-plan.md`.
> 본 문서: 계약 영역(C1) 의 의도/매핑/후속 영향만 기록한다.

## 1. 의도

VOC 도메인 Zod schema 를 `shared/contracts/voc/{entity,io,note}.ts` 3-분할 구조로 신설한다 (Wave 1 plan §0 Q1=B). FE/BE 가 동일 schema 를 import 하여 RHF resolver / validate middleware 에 그대로 사용한다.

## 2. 파일 인벤토리

| 파일                              | 책임                                                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `shared/contracts/voc/entity.ts`  | `Voc`, `VocListItem`, status/priority/source/review enum                                             |
| `shared/contracts/voc/io.ts`      | `VocFilter`, `VocListQuery`, `VocListResponse`, `VocCreate`, `VocUpdate`, `VocSortColumn`, `SortDir` |
| `shared/contracts/voc/note.ts`    | `InternalNote`, `InternalNoteCreate`, `VocHistoryEntry`                                              |
| `shared/contracts/voc/index.ts`   | barrel — 외부 import 진입점                                                                          |
| `shared/fixtures/voc.fixtures.ts` | 50 row fixture (3 시스템 × 5 상태 × 3 priority + edge 5건)                                           |

## 3. openapi.yaml 정합

본 PR 은 `shared/openapi.yaml` 의 voc 섹션을 **수정하지 않는다** (Wave 1 §U4=B). zod 가 Wave 1 부터 implementation SoT, openapi.yaml 은 read-only legacy SoT 로 유지. drift 는 `backend/src/__tests__/voc-contract.test.ts` 의 양방향 mirror 가드(U2)가 검출한다 — `required[]` + enum + nullable 모두 비교.

## 4. 표기 정정

- plan §6-3 B-T2 의 `code: 'VALIDATION_FAILED'` 는 표기 오류. 실제 구현은 `backend/src/middleware/validate.ts:25` 가 `VALIDATION_ERROR` 발행. 후속 commit 의 BE 테스트는 **`VALIDATION_ERROR`** 를 기대한다. `phase-8-wave1-plan.md` §6-3 의 표기는 별도 doc-fix commit 에서 정정한다.

## 5. URL 규약

- 라우트 prefix 는 `/api/vocs` (복수형). plan §1 Scope 의 단수형 표기는 오타로 확정 (Wave 1 §U1=B). 기존 `permission.test.ts:21`, openapi.yaml `/vocs` 와 일관.

## 6. 후속 영향

- C2/C3 BE 테스트·구현은 본 schema 를 그대로 import.
- C4 FE `vocApi` 는 `vocApi.list/get/create/update/addNote` 5개 fetcher 가 zod parse 1회씩 통과.
- Wave 2 dashboard 도 동일 3분할 패턴(`shared/contracts/dashboard/{entity,io,...}`) 채택을 강제. `phase-8-pattern.md` 회고에 한 줄 기록.
