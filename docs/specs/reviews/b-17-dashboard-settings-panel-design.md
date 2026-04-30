# B-17 Dashboard 설정 패널 슬라이드인 (Wave 2 #9) — 설계 노트

> 작성일: 2026-05-01
> 브랜치: `feat/b-17-dashboard-settings-panel`

## 목적

dashboard.md 명세대로 우측 슬라이드인 설정 패널을 prototype에 시연. **두 모드**:
- "내 설정" (모든 사용자): 위젯 가시성/순서 개인화
- "기본값" (Admin only): 시스템 기본 위젯 + 정렬

## spec 출처

- `dashboard.md` (전체) — 위젯 ID, 권한, 기본값 vs 사용자 설정
- `uidesign.md §13.x` 슬라이드인 패널

## 결정

1. **신규 파일**: `prototype/js/dashboard-settings-panel.js` (~250줄).
2. **트리거**: 대시보드 우상단 ⚙️ 아이콘 → 패널 슬라이드인 (right). esc / 외부 클릭 / X 버튼 → 닫기.
3. **모드 탭**: "내 설정" | "기본값[Admin]". role !== admin 시 두 번째 탭 미노출.
4. **위젯 리스트**: 체크박스 (가시성) + ↑↓ 버튼 (순서). 저장 시 mock state mutate + 토스트.
5. **로컬 키**: `dashboard_settings_<userId>` (사용자별), `dashboard_defaults` (admin 전체 기본값).

## 영향 파일

| 파일                                              | 변경                  |
| ------------------------------------------------- | --------------------- |
| `prototype/js/dashboard-settings-panel.js`        | NEW — ~250줄          |
| `prototype/css/admin/dashboard-settings-panel.css`| NEW — ~200줄          |
| `prototype/prototype.html`                        | `<script>` + `<link>` |

## R1 검증

| #   | 시나리오                                                |
| --- | ------------------------------------------------------- |
| 1   | admin role: 두 탭 노출 + 둘 다 저장 가능               |
| 2   | manager/user role: "내 설정"만 노출                    |
| 3   | 체크 off → 저장 → 위젯 그리드에서 사라짐                |
| 4   | ↑/↓ 순서 변경 → 저장 → 그리드 순서 반영                 |
| 5   | esc 키 → 패널 닫힘                                      |
| 6   | 외부 클릭 → 패널 닫힘                                   |

## 컨벤션

토큰 100% / escHtml / ≤300줄 / append-only.
