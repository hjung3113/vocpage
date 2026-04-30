# B-5 역할 토글 (Wave 2 #1) — 설계 노트

> 작성일: 2026-04-30 (Wave 2 진입)
> 브랜치: `feat/b-5-role-toggle`
> 선행: Wave 1 종료 (P-5/P-6/P-7/P-8/P-10/P-12 ✅)

## 목적

prototype 우상단/사이드바에 4역할 (admin/manager/dev/user) 토글 데모를 추가해 Wave 2 잔여 8개 갭(B-3, B-4a, B-4b, B-9, B-13, B-15, B-16, B-17)이 의존하는 시각·권한 분기 기반을 확보한다.

## spec 출처

- `feature-voc.md §8.3` — 4역할 권한 매트릭스 (L80~110)
- `feature-voc.md §8.4-bis` — `assertCanManageVoc` 헬퍼 (L112~)
- `uidesign.md §13.3` — Role Pill 컴포넌트 (4 variants, 순서: Admin → Manager → Dev → User)
- `uidesign.md §10` — `--role-dev-{bg,fg,border}` 토큰 (L636~641, 사전 정의됨)
- `requirements.md §15.1` — Dev role D18 결정사항

## 결정

1. **state**: 기존 `window.currentUser` (init.js:7)를 단일 진입점으로 유지. 토글 시 `Object.assign`으로 mock fixture 교체.
2. **mock users (4종)**:
   - admin: `이분석` / `u-admin` (init.js 기본값과 호환)
   - manager: `박매니저` / `u-manager`
   - dev: `김개발` / `u-dev`
   - user: `홍길동` / `u-user`
3. **트리거 위치**: 사이드바 좌하단 `.sidebar-user` 영역 — 기존 chevron(`chevrons-up-down`) 아이콘이 인터랙션 의도 표시. `role`/`tabindex`/`aria-haspopup="menu"` 추가.
4. **토글 UI**: fixed-position popover (`#rolePopover`), 4 항목 spec 순서. 각 항목은 RolePill + 사용자명 + check 아이콘. 외부 클릭/Escape로 닫힘.
5. **권한 분기 메커니즘**: `data-role-allow="<space-separated roles>"` 속성을 nav-item에 부착. `applyRoleVisibility()` 가 토글 시 `data-role-hide="true|false"`로 표기, CSS `[data-role-hide='true'] { display:none !important }` 로 숨김.
6. **section 자동 collapse**: 관리자 nav 7개 모두 hide면 `[data-role-section="admin"]` + 직전 `.sidebar-divider` 도 hide.
7. **Dev role 색상**: spec 사전 정의 그대로 적용 (`hue 215`, cyan-leaning) — admin(brand blue)·manager(amber)·user(gray)와 시각적 구분 OK.

## 권한 매트릭스 → nav 분기

| Nav 항목       | data-role-allow    | 근거 (§8.3 행)                     |
| -------------- | ------------------ | ---------------------------------- |
| 담당 VOC       | admin manager dev  | "전체 VOC 조회" + Dev `🟡 own`     |
| 대시보드       | admin manager dev  | "Dashboard 접근" Dev=✅ User=❌    |
| 태그 규칙 관리 | admin manager      | "태그 규칙 관리(생성/수정/삭제)"   |
| 시스템/메뉴    | admin              | "시스템/메뉴/유형 관리" Admin only |
| 유형 관리      | admin              | 동상                               |
| 사용자 관리    | admin              | "사용자 role 관리" Admin only      |
| 결과 검토      | admin manager      | review_status 변경 = Manager+Admin |
| 태그 마스터    | admin manager      | "신규 태그 생성"                   |
| 휴지통         | admin              | "VOC Soft Delete / 복원" Admin     |
| 외부 마스터    | admin manager      | system config (Admin+Manager)      |
| 공지/FAQ       | (gate 없음 — 모두) | "본인 VOC 조회" 라인과 별도, 읽기  |
| 새 VOC 등록    | (gate 없음 — 모두) | "VOC 작성" 4역할 모두 ✅           |

## 영향 파일

| 파일                          | 변경                                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| `prototype/css/tokens.css`    | `--role-dev-{bg,fg,border}` 3 토큰 (spec 미러링)                       |
| `prototype/css/admin.css`     | `.role-dev`, role popover, sidebar-user clickable, role toast (`+108`) |
| `prototype/js/role-state.js`  | NEW — 187줄 (≤300 룰 준수)                                             |
| `prototype/js/admin-users.js` | `ROLE_MAP`/`ROLE_CLS` 에 `dev` 추가                                    |
| `prototype/js/init.js`        | `RoleState.init()` 호출 추가 (5 lines)                                 |
| `prototype/prototype.html`    | `data-role-allow` × 9, `data-role-section`, script tag                 |

## 검증 (smoke)

```text
admin   → 10 nav visible (전체 admin 메뉴 + 대시보드)
manager → 6 nav visible (admin-only 4건 차단: system-menu, voc-type, users, trash)
dev     → 2 nav visible (담당 VOC + 대시보드, admin section 전체 collapse)
user    → 0 nav visible (대시보드 차단, admin section 전체 collapse)
```

콘솔 에러: 0건 (favicon 404만, B-5 무관). Popover 4역할 spec 순서 OK, current 항목 `aria-checked="true"`.

## 컨벤션 준수

- 토큰 100% (hex/oklch literal 0건 — spec 미러링만)
- escHtml 적용 (popover content)
- 모듈 ≤300줄 (role-state.js 187)
- append-only (기존 admin nav 마크업 보존, attribute 추가만)
- 자가 리뷰 금지 — 5 전문가 lane 별도 dispatch

## 알려진 한계 (Out of Scope)

- 드로어 내부의 권한 분기(internal-notes.js, drawer.js)는 `window.currentUser` 를 즉시 읽으므로 toggle 후 새로 open 하면 자동 반영. 이미 열려있는 drawer 동기 갱신은 B-13 드로어 고급에서 처리.
- "마지막 Admin 강등 불가" 가드 토스트는 B-15 (User 페이지 가드 토스트) 범위.
- assertCanManageVoc helper 자체는 BE Phase 8 (8-PR1).
