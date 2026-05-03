# Wave 1.7 — VOC Create Modal Parity Plan

> 목적: `VocCreateModal`을 prototype `#modalBg` 시각·동작 사양 + spec 룰(§8.4 medium 강제, §8.4.1 SLA, §8.5 첨부 cap, §8.8 cascade)에 정합시킨다.
> 정본 사양: `docs/specs/requires/feature-voc.md §9.11` (2026-05-03 추가).

## 1. 배경

- Wave 1.5/1.6은 /voc 목록·드로어·셸을 prototype 기준으로 정렬. **등록 모달은 미정비**.
- 현 모달(`frontend/src/features/voc/components/VocCreateModal.tsx`)은 prototype 대비 다음이 어긋남:
  1. 필수(`*`) 마커 없음
  2. 드롭다운 1행 3열 (prototype: 2×2) + 시스템→메뉴 cascade 미구현
  3. 우선순위 활성화 (spec §8.4: medium 강제, 항상 disabled여야 함)
  4. 본문 가이드 skeleton 없음 (정규화 파이프라인 친화 H2 구조)
  5. 본문↔첨부 동기화 없음
  6. 자동 태그 추천 row 미연결
  7. 푸터 안내 문구·send 아이콘 없음
- master 데이터: `SystemListItem`/`MenuListItem` contract 부재. BE endpoint 부재.

## 2. 원칙

1. prototype DOM 직접 이식 금지 — 시각·인터랙션 사양만 차용.
2. spec(`feature-voc.md §9.11`) 우선 — prototype과 spec이 충돌하면 spec 채택 (예: 우선순위 라벨 `(자동: Medium · 생성 후 조정)`은 spec 표현).
3. TDD — 테스트 작성·실패 확인 → 구현 → 통과 → 리팩터.
4. 토큰만 사용 (hex/raw OKLCH 금지).
5. refactor와 feature 변경은 같은 PR에 섞지 않는다.

## 3. 결정 (잠금)

| ID  | 항목               | 결정                                                                                                                                      |
| --- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | 제목 maxLength     | 200 (`requirements.md §8.10` 일치)                                                                                                        |
| D2  | 본문 skeleton      | **실제 초기값으로 삽입** (placeholder 흐림 X). H2 섹션 구조 (`feature-voc.md §9.11.1`)                                                    |
| D3  | Due Date row       | **모달 미노출**. BE는 priority=medium 룰로 created_at+30일 자동 계산.                                                                     |
| D4  | 본문↔첨부 동기화   | 단방향 (본문→첨부 추가/제거), 첨부→본문 자동삽입 안 함. Dedup name+size+lastModified.                                                     |
| D5  | 5개·10MB cap       | 본문+첨부 **합산** (§8.5:217 "본문 기준" 재해석)                                                                                          |
| D6  | 우선순위 UI        | 항상 disabled, 라벨 `우선순위 (자동: Medium · 생성 후 조정)`, value 고정 `medium`                                                         |
| D7  | master 응답 형태   | `GET /api/master/systems` nested(`menus[]` 포함) + `GET /api/master/menus?system_id=` 별도 endpoint 둘 다 제공. 모달은 nested 사용.       |
| D8  | 메뉴 활성 0건 표시 | 메뉴 select disabled + 안내 `"이 시스템에 등록된 메뉴가 없습니다"` (§8.8:261)                                                             |
| D9  | PR 단위            | Phase A 1 PR (spec/contract) / Phase B 1 PR (BE master endpoints) / Phase C 1 PR (FE 모달 rebuild) / Phase D 1 PR (visual diff + cleanup) |
| D10 | 게이트             | 각 Phase 종료 시 사용자 승인 없으면 다음 Phase 시작 금지                                                                                  |

## 4. Phase 흐름

```
Phase A — Spec & Contract  (코드 0줄, 이번 작업으로 진입)
  ├─ feature-voc.md §9.11 신설 ✅
  ├─ requirements.md §6.1 master endpoints 추가 ✅
  ├─ shared/contracts/master/io.ts: SystemListItem/MenuListItem ✅
  └─ 사용자 승인 게이트

Phase B — BE Master Endpoints (TDD)
  ├─ 실패 테스트: GET /api/master/systems (nested menus), GET /api/master/menus?system_id=
  ├─ Express route + zod validation + DB 쿼리 (systems LEFT JOIN menus, is_archived 필터)
  ├─ MSW v2 handler 동기화 (`frontend/src/mocks/handlers/master.ts`)
  └─ 통합 테스트 + 사용자 승인 게이트

Phase C — FE Modal Rebuild (TDD)
  ├─ 실패 테스트: VocCreateModal.test.tsx
  │   - 제목 maxLength=200 + 카운터 표시
  │   - 2×2 그리드 레이아웃
  │   - 시스템 미선택 시 메뉴 disabled
  │   - 시스템 변경 시 메뉴 reset
  │   - 우선순위 항상 disabled
  │   - 본문 skeleton 초기값 검증
  │   - 본문 이미지 삽입 → 첨부 추가 (mock blob hook)
  │   - 본문 이미지 제거 → 첨부 제거
  │   - 합산 5개 cap 검증
  │   - 자동 태그 추천 row 노출
  │   - 푸터 안내 문구 + send 아이콘
  ├─ 구현: master 응답 useQuery → cascade 처리, AttachmentZone 통합, ToastBodyEditor blob hook 노출
  └─ 사용자 승인 게이트

Phase D — Visual Diff & Cleanup
  ├─ benchmark/<wave-1-7>/voc-create-modal.png 추가
  ├─ scripts/visual-diff.ts 통과
  ├─ 구버전 priority select·잘못된 그리드 코드 제거
  ├─ claude-progress.txt + next-session-tasks.md 업데이트
  └─ PR 머지 (`gh pr merge --merge --delete-branch`)
```

## 5. 의존·전제

- BE: `systems` / `menus` 테이블이 `migrations/002_core_tables.sql` 기준 이미 존재. 시드 데이터 fixture 보강 필요 시 `shared/fixtures/`에 추가.
- FE: `useAutoTag` 훅이 이미 존재 (frontend/CLAUDE.md). 모달에 연결만.
- Toast UI Editor의 `addImageBlobHook` 콜백을 부모로 노출하려면 `ToastBodyEditor` 시그니처 확장 필요 (Phase C 범위).

## 6. 비범위

- 우선순위 변경 UI (생성 후 드로어에서, §8.4.2 별도 wave 범위)
- Result Review 게이트 (§9.4.5 별도 wave)
- 댓글 첨부 (§8.13 별도)
- 자동 정규화 파이프라인 자체 (skeleton은 단지 향후 파싱 친화 구조 — 추출 로직은 NextGen)

## 7. 완료 기준

- spec/contract 머지 + BE master endpoint 통과 + FE 모달 테스트 전부 그린 + visual diff 통과 + prototype 시각 격차 없음 (사용자 검수).
