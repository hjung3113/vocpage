# Phase 6: PR #22 (Sync Phase 6-4/6-6 Impl to Requirements) - 적대적 리뷰 (Adversarial Review)

> Date: 2026-04-24
> Scope: PR branch `docs/sync-phase6-impl-to-requirements` (PR #22)
> Reviewer: Antigravity

## 총평 (Summary)

**[Merge 반려 권고 - Blocked]**

본 PR은 구현 과정에서 파생된 설계 결정들을 요구사항 문서(`requirements.md` 등)에 동기화하는 것을 목적으로 하나, **치명적인 시스템 일관성 파괴, 보안/인증 설정의 취약한 타협, 그리고 명세 누락**을 포함하고 있습니다. 명세가 코드를 주도해야 하는데, 현재 문서 업데이트는 코드의 결함이나 미완성 상태를 정당화하기 위해 명세를 훼손하는 방향으로 이루어졌습니다.

아래 P1(크리티컬) 및 P2(메이저) 이슈를 해결하기 전에는 병합(Merge)을 승인할 수 없습니다.

---

## 🛑 P1 - 크리티컬 (Critical Issues)

### 1. 보안 및 인증 설계 타협 (VITE_AUTH_MODE vs AUTH_MODE)

- **문제 위치**: `docs/specs/plans/phase6-6-auth-mock-design.md` §5 및 `requirements.md` §14.1
- **문제 내용**:
  - 문서에서는 `VITE_AUTH_MODE`와 `AUTH_MODE`를 각각 설정해야 하며, **"불일치 시 조용히 로그인 실패함 (Mismatch will cause login to fail silently)"**이라고 기재되어 있습니다.
  - 또한 `createAuthMiddleware()`가 잘못된 값이면 즉시 throw한다고 명시했으나, 실제 PR 21의 구현 코드는 OIDC 모드에서 예외를 던지지 않고 무시한 채 서버를 기동시킵니다.
- **적대적 비판 (Adversarial Critique)**:
  - **왜 시스템의 치명적 결함을 문서에 '스펙'인 것처럼 기록합니까?** 인증 모드의 불일치는 조용히 실패(Silent failure)해서는 안 되며, 애플리케이션 기동 자체를 막아야(Fail-fast) 합니다. 개발자가 두 개의 환경 변수를 실수로 다르게 설정했다고 해서 원인 모를 인증 실패 디버깅에 시간을 낭비하게 만드는 것은 최악의 DX입니다. 백엔드에서 설정된 모드를 FE가 초기 부팅 시 동적으로 가져가거나, 빌드 타임에 검증하는 로직을 추가해야 합니다.

### 2. '좀비 서브태스크(Zombie Sub-task)' 허용으로 인한 상태 불일치

- **문제 위치**: `requirements.md` §8.2 상태 전환 및 규칙
- **문제 내용**: "미완료 Sub-task가 있는 부모 VOC를 '완료'로 전환 시 경고 메시지 후 강제 진행 가능. Sub-task 상태는 변경되지 않으며 담당자가 개별 처리."
- **적대적 비판 (Adversarial Critique)**:
  - 부모 VOC가 '완료' 되었는데 자식 VOC가 '처리중'인 상태는 **계층형 데이터 모델의 논리적 모순**입니다.
  - SLA 계산 시 치명적 오류를 발생시킵니다. 시스템은 이 VOC가 완료되었다고 보고할 텐데, 서브태스크 담당자의 KPI 에이징은 계속 카운트됩니까?
  - 부모를 강제로 닫으려면 자식도 `Cascade Close` 처리를 하거나, 자식이 모두 완료될 때까지 부모의 완료 처리를 강력히 차단해야 합니다. 편리함을 위해 데이터 무결성을 희생하는 스펙은 수용 불가합니다.

### 3. 로컬 Dev 환경 포트 맵핑 오류 (네트워크 단절)

- **문제 위치**: `requirements.md` §14.2 및 `.env.example`
- **문제 내용**:
  - `requirements.md`에는 `backend: ... host 3001 → container 3000`으로 맵핑한다고 정의했습니다.
  - 그러나 동일 PR의 `.env.example`에는 `VITE_API_BASE_URL=http://localhost:3000`이 여전히 기재되어 있습니다.
- **적대적 비판 (Adversarial Critique)**:
  - 호스트 머신에서 FE가(5173 포트) 실행될 때 `localhost:3000`으로 API 요청을 보내면 백엔드 컨테이너(3001 포트로 포워딩 됨)에 도달하지 못하고 연결이 거부됩니다(Connection Refused). 이 PR을 머지하고 클론받는 모든 프론트엔드 개발자의 로컬 환경이 즉시 고장납니다. 두 설정 중 하나를 맞춰야 합니다.

---

## ⚠️ P2 - 메이저 (Major Issues)

### 4. 애매모호한 검증 스펙 (보안 취약점 야기)

- **문제 위치**: `requirements.md` §8.10
- **문제 내용**: 시스템명/메뉴명 입력 시 "주요특수문자 허용"이라고 두루뭉술하게 명시.
- **적대적 비판 (Adversarial Critique)**:
  - "주요특수문자"라는 용어는 공학적으로 존재하지 않습니다. 따옴표(`'`), 꺾쇠(`<`, `>`)도 주요특수문자로 보고 허용하여 XSS나 SQL Injection 벡터를 열어둘 것입니까?
  - 정규표현식(`^[a-zA-Z0-9가-힣\s\-_]+$`) 형태로 허용 가능한 문자열 셋을 정확히 정의해야 합니다.

### 5. 유령 테스트 시나리오 (Phantom E2E Scenarios)

- **문제 위치**: `requirements.md` §13.1 테스트 레이어 구분
- **문제 내용**: E2E 대상 항목에 **"핵심 플로우 (아래 목록)"**이라고 적어두었으나, 문서 아래에 해당 목록이 존재하지 않습니다.
- **적대적 비판 (Adversarial Critique)**:
  - 검증할 핵심 플로우 목록조차 작성하지 않고 "동기화 완료"를 선언하는 것은 태만입니다. 어떤 시나리오가 E2E 대상인지 정확히 명시하십시오.

### 6. Phase 6-7의 범위 변질 (Scope Creep)

- **문제 위치**: `requirements.md` §6.1 Backend
- **문제 내용**: "OIDC 실 연결은 Phase 6-7"이라고 명시함.
- **적대적 비판 (Adversarial Critique)**:
  - `next-session-tasks.md` 및 `claude-progress.txt`에 명시된 Phase 6-7의 목표는 **"DB 마이그레이션 & 시드"**입니다. DB 스키마 작업을 하는 Phase에 OIDC 연동 구현을 끼워넣는 것은 명백한 스코프 크립(Scope Creep)입니다. OIDC 실 연동은 별도의 인프라/인증 티켓(예: Phase 6-8)으로 분리해야 합니다.

---

## 💡 액션 아이템 (Required Actions)

본 PR 머지 전 아래 수정 사항을 반영하십시오:

1. **포트 충돌 해결**: `VITE_API_BASE_URL` 값을 `3001`로 수정하거나, Docker compose 포트 포워딩을 `3000:3000`으로 통일.
2. **좀비 서브태스크 방어**: 부모 VOC 완료 시 자식 상태에 대한 정합성 유지 스펙 재정의 (Cascade Close 또는 완전 차단).
3. **특수문자 화이트리스트화**: 허용할 특수문자를 정규식이나 리스트(`-`, `_` 등) 형태로 구체적 명시.
4. **E2E 테스트 목록 작성**: "(아래 목록)"이라 적어놓고 빠진 실제 핵심 플로우 목록 보충.
5. **Fail-fast 강제화 명세**: 두 개의 `AUTH_MODE` 변수 불일치 시 Silent failure를 허용한다는 타협안을 삭제하고, 불일치 검증 로직 구현을 강제하는 명세로 롤백.
