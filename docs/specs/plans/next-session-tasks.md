# vocpage — 다음 세션 태스크 계획

> 최종 업데이트: 2026-05-10 (구조/네이밍 정리 1차 머지 완료 — PR #314)
> 진행 포인터: `claude-progress.txt` 첫 30줄 → 본 문서 → `admin-pages-backlog.md` (admin 미구현 페이지 메모)
> **2026-05-09 정책**: 구현 정본 = `requirements.md` + `uidesign.md` 만. prototype 참조 종료.

---

## 활성 작업 / 다음 진입 후보

| 항목 | 출처 | 비고 |
| --- | --- | --- |
| **구조/네이밍 정리 2차 (Cand 1)** | 본 문서 §구조/네이밍 정리 | entity `api/` 슬라이스 네이밍 통일. voc 부터 단계적 PR. |
| **마이그 023 운영 적용** | PR #312 머지 (2026-05-10) | rogue row 진단 SQL 선행. 적용 후 Dashboard Dialog 'custom' round-trip 통합 검증. |
| **Admin 미구현 페이지** | [`admin-pages-backlog.md`](./admin-pages-backlog.md) | 시스템/메뉴 / 유형 / 결과 검토 / 태그 규칙. 권장 순서: 태그 규칙(태그 마스터 통합) → 시스템/메뉴 → 유형 → 결과 검토(NextGen). |
| **ADR 0007 timezone 잠금** | `docs/adr/0007-custom-date-range-timezone.md` (Proposed) | 다중 timezone 운영 진입 전 별 세션. 잠금 전 다중 TZ 진입 금지. |
| **Flowline Wave C — issue-id + status-glyph 도입** | `uidesign.md §16` · ADR-0008 · `flowline-alignment-cues.md` | 가장 가벼운 Wave. `shared/ui/issue-id` + `shared/ui/status-glyph` 신설 → VOC 리스트 1차 적용 → §16.1 표 상태 갱신. visual-diff 베이스라인 변경 페이지만 재촬영. |
| **운영/배포 phase** | 본 문서 §운영/배포 | session store · OIDC · Production build · 실 MSSQL · E2E. |

### Hard-blocks

- 없음.

---

## 구조/네이밍 정리 (deepening candidates · 2026-05-10 audit)

`improve-codebase-architecture` 스킬로 6 candidate 도출 → codex 적대적 리뷰 거쳐 verdict 확정.

| ID | 항목 | Verdict | 상태 |
| --- | --- | --- | --- |
| 2 | `useVocFilter`/`useVocFilters` → `useVocFilterContext`/`useVocFilterUrlState` | PROCEED | ✅ PR #314 |
| 4 | `features/admin/tag-master/` 평면 → `api/+ui/` | PROCEED | ✅ PR #314 |
| 1 | entity `api/` 슬라이스 네이밍 통일 (`subject.api.ts`/`subject.query-keys.ts`) | PROCEED, 단계적 | 🔜 차기 |
| 3 | `features/dashboard/widgets/` ↔ top-level `widgets/` shadow | DEFER | 보류 |
| 5 | backend `*.repo.ts`/`*.service.ts` suffix 혼재 통일 | DEFER | BE 작업 묶기 |
| 6 | backend `controllers/` + `validators/` orphan 의혹 | REJECT | `backend/src/CLAUDE.md` 5-layer + ADR-0003 |

**Cand 1 진입 가이드 (차기)**:
- 대상 9 파일: `entities/{master,user,notification,voc}/api/*Api.ts` + `*QueryKeys.ts` (camelCase) · `entities/{faq,notice}/api/{keys,queries}.ts` (평면) · `features/auth/api/authApi.ts`.
- 슬라이스 단위 PR (voc → master → user → notification → faq → notice → auth) — 한 슬라이스 당 2 파일 rename + import 갱신.
- naming-conventions §5.2 준수: `subject.api.ts` / `subject.query-keys.ts`.
- entity barrel(`@entities/<name>`)로 caller 변경 최소화 가능하면 그 방향.

---

## 닫힌 Wave

Wave 0 / 1 / 1.5 / 1.6 / 1.7 / 2 / 3 / 4 / 5 모두 머지 완료. 상세는 `git log --merges` + 각 PR description 참조 (별도 plan/archive 문서 없음 — 2026-05-10 정리).

머지 완료 ADR: 0001~0006 Accepted. 0007 Proposed.

---

## 운영/배포 phase 후보

- `connect-pg-simple` 세션 스토어 (`NODE_ENV=production`)
- OIDC 인증 실구현 (`oidcAuthMiddleware`)
- Production Dockerfile + 빌드 파이프라인
- 실 MSSQL 연동 (G-1 외부 의존)
- 배포 + smoke test
- Playwright E2E 핵심 3 플로우
- Jira 마이그레이션 스크립트
- §13.4 성능 측정 환경/툴 정의

---

## 외부 의존 / NextGen

- G-1 (실 MSSQL)
- N-1 / N-2 (NextGen 알림 / AI)
- 결과 검토 페이지 (`feature-voc.md §9.4.5` — 임베딩/유사도 파이프라인 의존, NextGen 후보)

---

## 구현 진입 상시 룰

- 구현 정본 = `requirements.md` (+ `feature-*.md`, `dashboard.md`) + `uidesign.md` 만. `prototype/` 비교·픽셀 측정·DOM 인용 금지.
- spec 내부 불일치 발견 시 임의 결정 금지 — 사용자에게 라인/섹션 명시하여 질문. 답변 확정 후 정답 쪽을 정본으로 두고 동기화 커밋. 동기화 없이 구현 진행 금지.
- 닫힌 wave 의 follow-up 추적용 별도 등록부 없음 (2026-05-10 정리). 발견 시 ad-hoc 처리하거나 `admin-pages-backlog.md` 같은 주제별 문서로 묶음.
