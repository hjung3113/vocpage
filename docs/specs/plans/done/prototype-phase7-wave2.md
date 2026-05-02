# Phase 7 Wave 2 — prototype 고도화 후속

> 작성일: 2026-04-30 (Wave 1 종료 직후)
> 선행: Wave 1 ✅ (P-5/P-6/P-7/P-8/P-10/P-12, 커버리지 74%, 잔여 갭 29건)
> 산출물: `prototype/prototype.html` + 모듈화된 CSS/JS 추가 파일

## 목표

Wave 1에서 P-6 갭 재스캔으로 식별된 잔여 영역 중 **역할·관리자 진입점 + 드로어 고급 + 가드/오류/설정 패널** 9건을 prototype에 1:1 재현. 코드 구현(Phase 8) 진입 전 시각·동작 정답 확정.

## 작업 순서 + 매핑

> Wave 2 ID는 plan 정본(`.omc/plans/prototype-phase7.md`, gitignored)의 B-x 식별자, P-x는 `next-session-tasks.md` Phase 7 표 매핑.

| 순서 | Wave 2 ID | P-x  | 항목                                                                                              | 주 spec                             |
| ---- | --------- | ---- | ------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 1    | **B-5**   | P-2  | 역할 토글 데모 (admin/manager/user/dev) + role-pill 4종 + 권한 가드 시연                          | requirements.md §15.1, uidesign §14 |
| 2    | B-3       | P-3  | uidesign §13 Admin·Notice·FAQ 컴포넌트 12건 prototype 반영                                        | uidesign.md §13                     |
| 3    | B-4a      | P-3↑ | `?mode=admin` URL 토글 prototype 시연                                                             | requirements.md §15.5 (D19), ADR #4 |
| 4    | B-4b      | P-3↑ | 공지·FAQ 관리 UI (Notice/FAQ 페이지 우상단 진입점 + admin-only 컴포넌트)                          | feature-notice-faq.md               |
| 5    | B-9       | P-9  | `?mode=admin` 토글 + role-pill 통합 검증 (B-4a/B-5 합류)                                          | (B-4a/B-5 후속 검증)                |
| 6    | B-13      | P-11 | 드로어 고급: 상태 disabled, 미완 sub-task 경고, 퍼머링크, 전체화면, 댓글 편집/삭제, review_status | feature-voc.md §8.x, §9.2.2         |
| 7    | B-15      | P-13 | User 관리 가드 토스트 (마지막 Admin·self-role·is_active)                                          | requirements.md §15 D14~D17         |
| 8    | B-16      | P-14 | 첨부 업로드 에러 토스트 (413/415/400)                                                             | feature-voc.md §8 첨부              |
| 9    | B-17      | P-15 | Dashboard 설정 패널 슬라이드인 (내 설정 / 기본값[Admin] 토글)                                     | dashboard.md                        |

> P-4 (상태/엣지케이스 패널 — empty/error/loading/권한차단/길이초과) 는 Wave 2 명단에 미포함. uidesign §5 + §14.11에 spec은 반영됐으니 컴포넌트별로 흡수하거나 Wave 3로 이연 (Wave 2 종료 시 재판정).

## 컨벤션 (Wave 1 계승)

- **섹션 분리 + append-only**: 기존 prototype.html / admin.css 영역 보존, 신규는 새 파일 추출 또는 명시적 append
- **모듈 ≤300줄**: JS/CSS 파일 한 개당 300줄 한도
- **토큰 100%**: hex/oklch literal 0건, `var(--*)` 만 사용
- **자가 리뷰 금지**: 코드 작성 후 `code-reviewer` / `critic` / `verifier` 등 별도 lane이 평가
- **빌드 툴 추가 금지**: classic `<script src>` 유지
- **PR 단위**: B-x 1건당 별도 브랜치 + PR (Wave 1 PR #66·#67·#69·#70 패턴)

## 출구 조건

- 9건 모두 prototype 반영 + R2 평균 ≥ 90 또는 critic gating 통과
- P-6 후속 갭 재스캔 → Wave 3 또는 Phase 8 직행 판정
- `claude-progress.txt` 누적 + `next-session-tasks.md` Phase 7 표 ✅ 갱신
