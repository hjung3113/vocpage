# B-15 User 관리 가드 토스트 (Wave 2 #7) — 설계 노트

> 작성일: 2026-05-01
> 브랜치: `feat/b-15-user-guard-toasts`

## 목적

사용자 관리 페이지(`page-users`)에 3종 가드 시연: D14 마지막 Admin / D15 self-role / D16 is_active. requirements §15 D14~D17 mock 데모.

## spec 출처

- `requirements.md §15.2 D14`: 마지막 Admin role 강등 차단
- `requirements.md §15.2 D15`: 본인의 role 변경 차단
- `requirements.md §15.2 D16`: is_active=false → 로그인 차단
- `feature-voc.md §8.4-bis`: assertCanManageVoc 헬퍼 (서버 사이드)

## 결정

1. **신규 파일**: `prototype/js/admin-users-guards.js` (~150줄). 기존 `admin-users.js`가 있다면 재사용, 없으면 NEW.
2. **시연 트리거**:
   - role 변경 dropdown → 본인 row → `setTimeout(0)` 토스트 "본인의 권한은 변경할 수 없습니다."
   - role 변경 → 마지막 admin → 토스트 "마지막 Admin은 다른 역할로 변경할 수 없습니다."
   - is_active 토글 OFF → 본인 row → 토스트 "본인 계정은 비활성화할 수 없습니다."
3. **토스트 컴포넌트**: 기존 `.role-toast` (B-5에서 도입) 또는 `.guard-toast` (warn 아이콘 + 빨강 border). 4초 후 fade-out.
4. **Mock 사용자 데이터**: 5건 (admin 2 / manager 1 / user 1 / dev 1, currentUser는 admin 1번).

## 영향 파일

| 파일                                       | 변경                                  |
| ------------------------------------------ | ------------------------------------- |
| `prototype/js/admin-users-guards.js`       | NEW — ~150줄                          |
| `prototype/css/admin/admin-users.css`      | append .guard-toast (~30줄)           |
| `prototype/prototype.html`                 | `<script>` 추가                        |

## R1 검증

| #   | 시나리오                                          |
| --- | ------------------------------------------------- |
| 1   | 본인 role dropdown 변경 → guard 토스트 + 원복     |
| 2   | 마지막 admin (다른 admin 0명) role 변경 → 토스트  |
| 3   | 본인 is_active toggle off → 토스트 + 원복         |
| 4   | 다른 사용자 role/is_active 변경은 정상 반영       |

## 컨벤션

토큰 100% / escHtml / ≤300줄 / append-only.
