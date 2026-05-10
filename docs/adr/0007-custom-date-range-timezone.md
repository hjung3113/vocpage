# 0007 — Dashboard `custom` 날짜 범위의 timezone 해석 시맨틱

## Status

Proposed (2026-05-10, ADR 0006 OQ-4 분기). 구현 차단 (해석 정책 잠금 후 별 PR).

## Context

ADR 0006 §1 은 `dashboard_settings.custom_start_date / custom_end_date` 를 PostgreSQL `DATE` 타입으로 잠갔다. `DATE` 는 timezone 정보를 보존하지 않는 *calendar day* 표현이므로, 동일 저장값이 클라이언트 / cron / Admin 리포트 컨텍스트에 따라 다른 wall-clock 구간으로 해석될 수 있다.

ADR 0006 운영 환경 가정은 "단일 timezone 운영자". 다중 timezone 시나리오는 본 ADR 에서 잠근다.

### 충돌 시나리오

- KST 사용자가 `custom_start_date='2026-05-01'` 저장 → UTC-8 출장 중 접속 시 같은 row 가 *다른 day window* 로 해석되어 데이터 경계 차이 발생.
- Admin 기본값 행 (ADR 0006 §7 차단으로 현재 발생 X — 향후 NextGen offset 컬럼 도입 시 부활) 의 절대 날짜가 cron 리포트 (UTC) 와 사용자 화면 (로컬) 사이에서 어긋남.
- 일/주/월 집계 cron 이 어떤 timezone 의 day boundary 로 GROUP BY 할지.

## Decision (Proposed)

### Open Questions

- **TZ-OQ-1**: 해석 기준 timezone — (A) 클라이언트 로컬, (B) 계정/사용자 timezone 컬럼 신설, (C) 조직 timezone 단일값, (D) 항상 UTC.
- **TZ-OQ-2**: cron / 백엔드 집계의 day boundary — 사용자 timezone 별 분기 vs 조직 단일 vs UTC.
- **TZ-OQ-3**: 사용자 timezone 컬럼 (option B) 채택 시 — `users.timezone` (IANA tz) 컬럼 위치 / 기본값 / 변경 시 기존 저장 row 재해석 정책.
- **TZ-OQ-4**: DST 전환 day 의 경계 처리.

## Consequences

- **+** ADR 0006 의 timezone-agnostic 가정 명문화로 마이그 023 / zod / UI 3-PR sequence 가 timezone 결정 지연 없이 진입 가능.
- **−** 다중 timezone 운영 진입 전 본 ADR 잠금 필수.

## Cross-References

- `docs/adr/0006-custom-date-range-default.md` — 트리거 ADR.
- `docs/specs/requires/dashboard.md §4, §13.5` — 날짜 필터 정본.
