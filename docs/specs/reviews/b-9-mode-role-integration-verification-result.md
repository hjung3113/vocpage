# B-9 mode+role-pill 통합 검증 결과 (Wave 2 #5)

> 실행일: 2026-05-01
> 실행 환경: prototype @ main (commit `c1a3409` 이후)
> 검증 도구: Playwright MCP (Chromium)
> URL: `http://localhost:8765/prototype.html`
> 선행 머지 완료: B-4a R2 (PR #80), B-5 (이전 머지), B-4b (PR #81), B-13 (#82), B-15 (#83), B-16 (#84), B-17 (#85)

## 결과 요약

| 시나리오 | 결과 | 비고                                                                |
| -------- | ---- | ------------------------------------------------------------------- |
| S1       | PASS | role admin → user 전환 후 `isAdminMode()` false                     |
| S2       | PASS | URL `?mode=admin` 유지하면서 role guard로 admin UI 미노출           |
| S3       | PASS | admin → manager 전환 시 `canEnterAdminMode()` true 유지             |
| S4       | PASS | popstate 4단계 모두 정상; 단계 4에서 URL admin이지만 role=user 차단 |
| S5       | PASS | `setMode(false)`가 `?mode=admin` 만 제거, `#section-faq` 보존       |
| S6       | PASS | 20회 rapid fire 후 최종 상태 일관, 콘솔 에러 0건                    |

**총평:** 6/6 PASS, 콘솔 에러 0건, 회귀 없음.

## 시나리오 상세

### S1. role 변경 + ?mode=admin 동시 활성

- 진입 상태: `role=admin`, URL `?mode=admin`
- 액션: `RoleState.setCurrentRole('user')`
- 관찰값:
  - `AdminMode.isAdminMode()` → **false**
  - `AdminMode.canEnterAdminMode()` → **false**
  - `am-mode-banner` DOM 미존재
  - URL `?mode=admin` 보존 (history 영향 없음)

### S2. ?mode=admin deep-link + role=user

- 진입 상태: S1 종료 직후 (role=user, URL `?mode=admin`)
- 관찰값:
  - `isAdminMode()` → false
  - banner / entry button / notice-admin slot / faq-admin slot DOM 미존재 (`anyAmEl: 0`)
  - URL 보존

### S3. role admin → manager (관리 모드 ON)

- 진입 상태: `role=admin`, `setMode(true)`
- 액션: `setCurrentRole('manager')`
- 관찰값:
  - `isAdminMode()` 여전히 **true**
  - `canEnterAdminMode()` 여전히 **true** (manager 허용)
  - URL `?mode=admin` 유지

### S4. popstate 인터랙션

| 단계 | 액션              | URL           | isAdminMode | role  |
| ---- | ----------------- | ------------- | ----------- | ----- |
| 1    | setMode(true)     | `?mode=admin` | true        | admin |
| 2    | history.back()    | (search 없음) | false       | admin |
| 3    | setRole('user')   | (search 없음) | false       | user  |
| 4    | history.forward() | `?mode=admin` | **false**   | user  |

단계 4 핵심: URL은 admin이지만 role=user → `isAdminMode false` → UI 미노출 확인.

### S5. URL hash + ?mode=admin 공존

- 진입 상태: `?mode=admin#section-faq`, role=admin, mode=true
- 액션: `setMode(false)`
- 관찰값:
  - URL `http://.../prototype.html#section-faq`
  - `location.search === ''`, `location.hash === '#section-faq'`

### S6. 두 토글의 동시 발화 race

- 액션: 20회 alternating `toggleMode()` ↔ `setCurrentRole(admin/manager)`
- 관찰값:
  - 콘솔 에러 0건
  - 최종 상태: `role=admin`, `isAdminMode=true`, `canEnter=true`, URL 일관

## 회귀 점검

- 콘솔 errors: **0**
- 콘솔 warnings: 1 (B-4a R2 검증 시점부터 존재하던 lucide 관련 비치명 경고 — 본 통합 변경과 무관)
- B-4b admin UI / B-13 드로어 / B-15 가드 토스트 모듈 모두 mode/role 변경 후 추가 에러 없음

## 출구 조건 충족

- [x] 6 시나리오 모두 PASS
- [x] 콘솔 에러 0건
- [x] verifier 결과 본 문서에 첨부
