# B-9 mode+role-pill 통합 검증 (Wave 2 #5) — 검증 체크리스트

> 작성일: 2026-05-01
> 선행: B-4a `?mode=admin` URL 토글 ✅ + B-5 role-pill 사이드바 토글 ✅
> 검증 시점: B-4a R2 + B-5 양쪽 main 머지 완료 후

## 목적

B-4a (URL admin mode toggle) + B-5 (role popover toggle) 의 통합 동작 검증. 두 토글이 서로 어떻게 영향을 주고받는지 확인하여 회귀 차단.

## 통합 시나리오 (검증 항목)

### S1. role 변경 + ?mode=admin 동시 활성

**Given**: role = admin, ?mode=admin URL.
**When**: 사이드바 role popover에서 "User" 선택.
**Then**:
- isAdminMode() → false (R2 fix: AND canEnterAdminMode)
- 공지/FAQ 페이지 admin slot tree-excluded (DOM 미생성)
- am-mode-banner 자동 제거 (renderModeBanner role guard)
- 'role:change' CustomEvent 수신 모듈 (notice-admin/faq-admin) admin UI 깨끗이 제거

### S2. ?mode=admin deep-link 진입 + role=user

**Given**: role=user 로 `?mode=admin` URL 직접 입력.
**When**: 페이지 로드.
**Then**:
- URL은 `?mode=admin` 유지 (history 보존)
- isAdminMode() → false (role guard AND)
- entry button slot 미생성 (tree-exclude)
- banner 미노출
- B-4b admin UI 미노출

### S3. role admin → manager 전환 (관리 모드 ON 상태)

**Given**: role=admin, ?mode=admin ON, B-4b 인라인 액션 노출 중.
**When**: role popover에서 "Manager" 선택.
**Then**:
- isAdminMode() 여전히 true (manager는 canEnterAdminMode true)
- 진입 버튼 / banner 유지
- B-4b 카테고리 관리 탭 → admin-only 액션 (편집/삭제) 컬럼 숨김 (R2 read-only)
- 카테고리 표시 토글 라벨로 변경 (관리 불가)

### S4. role popover 클릭 vs popstate 인터랙션

**Given**: ?mode=admin OFF, role=admin.
**When**:
1. 진입 버튼 클릭 → URL `?mode=admin` 추가
2. 브라우저 뒤로가기 → URL 제거
3. role popover 열기 → User 선택
4. 브라우저 앞으로가기 → URL `?mode=admin` 복원
**Then**:
- 매 단계 admin-mode:change + role:change 이벤트 정상 발화
- 4단계: URL은 admin이지만 role=user → isAdminMode false → UI 미노출

### S5. URL hash + ?mode=admin 공존

**Given**: `?mode=admin#section-faq` URL.
**When**: setMode(false).
**Then**: URL = `#section-faq` (mode만 제거, hash 보존)

### S6. 두 토글의 동시 발화 race

**Given**: role 변경 popover와 mode 토글 버튼을 빠르게 연속 클릭.
**Then**:
- 두 이벤트 모두 처리, 최종 상태가 일관
- 중간 flash 없음
- 콘솔 에러 0건

## 검증 방법

1. **수동**: prototype 브라우저에서 각 시나리오 단계별 실행 + 스크린샷
2. **자동 (Playwright)**: B-4a/B-5 commit hash 기반 시나리오 스크립트 (선택)
3. **회귀**: B-4b admin UI / B-13 드로어 고급 / B-15 User 가드가 mode/role 변경에 정상 반응

## 출구 조건

- 6 시나리오 모두 PASS (수동 또는 자동)
- 회귀 콘솔 에러 0건
- 진행 결과는 별도 verifier agent 출력으로 첨부

## 다음 단계

B-4a R2 PR + B-5 PR 모두 main 머지 후 verifier 에이전트에 본 체크리스트 위임.

## 알려진 제약

- B-15 가드 토스트는 role 변경과 직접 결합되지 않음 (사용자 관리 페이지에서만 동작) — S3 시나리오 무관
- B-13 드로어는 role과 직접 결합 — 향후 role change 시 drawer state 회귀 별도 검증 필요 (out of scope)
