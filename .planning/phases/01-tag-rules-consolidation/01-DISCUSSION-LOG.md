# Phase 1: Tag Rules Consolidation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 1-tag-rules-consolidation
**Areas discussed:** Edit surface, "전체 규칙 보기" toggle, Form fields & validation, API rename + badge update

---

## Edit Surface

| Option | Description | Selected |
|--------|-------------|----------|
| Modal Dialog (TagMaster*Modal 패턴 재사용) | 기존 modal 패턴 재사용, 일관성·포커스 트랩 해결 | ✓ |
| Side Drawer (우측 오버레이) | Result Review drawer 패턴, 더 넓은 width | |
| 인라인 확장 row (아코디언) | spec §9.4.1 인라인 폼 원안에 가장 근접 | |

**User's choice:** "니 추천대로" → Claude recommended Modal Dialog.
**Notes:** admin 패턴이 modal 일색이라 일관성 우선. spec §9.4.1 의 "인라인 폼"은 modal 내부 인라인으로 해석.

---

## "전체 규칙 보기" 토글

| Option | Description | Selected |
|--------|-------------|----------|
| 상단 탭 전환 (`태그` / `전체 규칙`) | 동일 페이지 내 view-mode 토글, flat tag_rules 테이블 | ✓ |
| Modal로 전체 규칙 명단 열기 | 컨텍스트 유지 + 검색 input + Modal 안 대형 테이블 | |
| URL 쿼리 파라미터 (`?view=rules&q=`) | view=rules 시 동일 페이지가 rule 모드로 전환, share 가능 | |

**User's choice:** 상단 탭 전환.
**Notes:** URL query 영속화는 추가로 채택 (`?view=tags|rules`, `?q=...`) — 새로고침/공유 가능.

---

## Form Fields & Validation

| Option | Description | Selected |
|--------|-------------|----------|
| 콤마 구분 string + match_mode 고정 | spec §9.4.1 문구 그대로, 가장 단순 | |
| Chip array + match_mode 고정 | chip token UX, match_mode UI 숨김 | |
| Chip array + match_mode select 노출 | chip + select 슬롯, future-proof | ✓ |

**User's choice:** Chip array + match_mode select (확장 슬롯 노출).
**Notes:** v2 regex/exact 옵션 대비. 현재 옵션은 `keyword` 단일.

---

## API Rename Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Tag-nested resource 완전 이행 | `/api/admin/tags/:tagId/rules[/:ruleId][/suspend]` 전면 이전 | ✓ |
| Flat 상위 리소스 재명명 | path 유지 + success criterion #3 정의 조정 | |
| 경계만 명문화, rename 은 deferred | rg 기준을 'FE route 파일 + 사이드바 entry'로 재정의 | |

**User's choice:** Tag-nested resource 완전 이행.
**Notes:** REST 의미론적으로 tag-rules 는 더 이상 독립 리소스가 아님. 단일 PR breaking rename 수용.

---

## Live Badge Update

| Option | Description | Selected |
|--------|-------------|----------|
| Optimistic update | onMutate ±1 + onError rollback + onSettled invalidate | ✓ |
| invalidateQueries 전용 | onSuccess 시 list 전체 invalidate, 단일 진실 출처 | |

**User's choice:** "추천대로" → Optimistic.
**Notes:** Success criterion #2 의 "즉시 N+1 갱신" 체감 충족.

---

## Claude's Discretion

- Modal 폭 / sub-table 페이지네이션 임계치 (uidesign.md 토큰 + 기존 TagMaster Modal 폭 기준).
- Optimistic update rollback context shape (TanStack Query 표준).
- 서버 검색 `q` 매칭 컬럼 (researcher 가 BE 코드 확인).
- Migration 024 `created_by` backfill 정책 (NULL / "system" sentinel / 기존 admin backfill — plan-phase 결정).

## Deferred Ideas

- 다중 태그 일괄 import (NextGen).
- match_mode regex / exact 실제 구현 (slot 만 본 phase, 옵션 확장은 별도 phase).
- `tag_rules.updated_by` / `last_modified_by` audit (NextGen).
- `tag_rules` 일시중지 만료 알림 / 자동 재개 cron.
