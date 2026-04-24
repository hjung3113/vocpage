# Phase 6 CLAUDE.md

Phase 6 구현 준비 전용 지침. **Phase 6 완료 후 이 파일은 삭제한다.**

## 세션 시작 시 체크

고위험 미결 항목이 남아있으면 구현(6-4 스캐폴딩)에 진입하지 않는다.
반드시 아래 표를 먼저 확인하고, 미결이 있으면 brainstorming부터 시작한다:

> "고위험 미결 N건 차례차례 진행하자" → `/superpowers:brainstorming` 스킬 실행

## 고위험 미결 결정 현황 (2026-04-24 기준)

| 항목 | 결정 | 상태 |
|---|---|---|
| DB 마이그레이션 도구 | **node-pg-migrate** | ✅ 2026-04-24 확정 |
| Mock API 전략 | **MSW (Mock Service Worker)** | ✅ 2026-04-24 확정 |
| FE-BE 타입 공유 방식 | **OpenAPI codegen (`openapi-typescript`)** — `openapi.yaml` 단일 소스 → `shared/types/api.ts` 자동 생성, Swagger UI (`swagger-ui-express`) BE dev 마운트 | ✅ 2026-04-24 확정 |
| 파일 업로드 미들웨어 | **multer + DiskStorage** — `uploads/` 로컬, Docker named volume(`uploads_data`) 마운트. `voc_attachments`는 메타데이터만 저장. MVP 이후 S3 교체 시 DB 스키마 변경 없음 | ✅ 2026-04-24 확정 |
| MSSQL 연결 드라이버 | **mssql npm 패키지** — 읽기 전용, BE 부팅 시 connection pool 1회 생성 (7A 외부 마스터 캐시 전략 기반) | ✅ 2026-04-24 확정 |

## 결정 완료 시 처리 순서

1. 위 표 업데이트 (이 파일)
2. `next-session-tasks.md` 표 동기화
3. 전체 미결 해소 → 6-4 스캐폴딩 진입 가능

## 참고: Phase 6 권고 실행 순서

```
6-4 스캐폴딩 & 개발환경   ← 고위험 5건 전부 결정 후 진입
6-6 인증 Mock 전략
6-7 DB 마이그레이션 & 시드
6-5 FE-BE API 계약
6-3 BE 테스트 전략
6-8 상태 관리 (문서화만)
6-9 Prototype → 컴포넌트
```
