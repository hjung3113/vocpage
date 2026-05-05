# field→action 매핑은 service 레이어 소유

`inferActions(patch: VocUpdate): VocAction[]`은 `services/voc.ts`에 유지한다. permissions 모듈(`services/permissions/assertCanManageVoc.ts`)로 이동하지 않는다.

## Considered Options

**이동 안함 (채택):** permissions 모듈의 인터페이스는 `(user, voc, action)` — action을 받아 판단만 한다. `VocUpdate` 필드 이름을 아는 것은 도메인 지식이며, permissions 모듈에 domain type(`VocUpdate`)을 끌어들이면 permissions 인터페이스가 넓어진다.

**permissions 모듈로 이동:** `VocAction` 타입을 정의하는 모듈이 그 action의 발동 조건도 알아야 한다는 논리. 그러나 이렇게 하면 permissions 모듈이 `VocUpdate`(도메인 엔티티 타입)를 임포트해야 하고, 두 관심사의 분리가 깨진다.

## Consequences

- service: "patch 필드 → 필요한 action 목록" 변환 담당
- permissions: action을 받아 "이 user가 이 voc에 이 action을 할 수 있나" 판단만 담당
- 권한 매트릭스 변경 → permissions 모듈만 수정
- patch 필드 추가/제거 → service의 `inferActions`만 수정
