# Phase 7-1 요구사항·프로토타입 충돌 결정 기록

> 작성일: 2026-04-25 (autopilot 실행 중 자동 판단)
> 브랜치: feat/phase7-voc-crud

---

## C-1: VocStatus 'draft' 제거

**충돌**

- `frontend/src/contexts/VOCFilterContext.tsx`: `VocStatus = 'draft' | '접수' | '검토중' | '처리중' | '완료' | '드랍'`
- `docs/specs/requires/feature-voc.md §8.2`: 상태 5단계 = `접수/검토중/처리중/완료/드랍` ('draft' 없음)
- `backend/migrations/003_vocs.sql`: `CHECK (status IN ('접수','검토중','처리중','완료','드랍'))` — DB 제약에 'draft' 없음

**판단**: 요구사항·DB 기준으로 통일. 'draft' 제거.

**이유**: 'draft'는 임시저장 개념인데, 요구사항에서는 `structured_payload_draft` 컬럼으로 분리 처리함. `vocs.status`에 draft 상태는 스펙상 존재하지 않음.

**조치**: `VOCFilterContext.tsx`에서 'draft' 타입 제거.

---

## C-2: VOCFilters에 priority 필터 추가

**충돌**

- `shared/openapi.yaml /vocs GET parameters`: `priority` 필터 파라미터 정의됨
- `VOCFilterContext.tsx`: priority 필드 없음

**판단**: openapi.yaml(API 계약) 기준으로 추가.

**이유**: openapi.yaml이 BE-FE 계약의 단일 소스. 필터 누락 시 BE 기능 활용 불가.

**조치**: `VOCFilters`에 `priority: string | null` 추가.

---

## C-3: AppShell/Sidebar 레이아웃 구조

**충돌 없음** — prototype.html의 `.app-shell` + `.sidebar` 구조가 requirements와 일치함.

Phase 7-1에서는 AppShell/Sidebar를 최소한으로 구현 (VocPage 렌더링 가능 수준). 풀 구현은 7-4(대시보드) 이후로 defer.
