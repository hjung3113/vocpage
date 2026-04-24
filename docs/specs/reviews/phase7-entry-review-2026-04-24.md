# Phase 7 진입 전 요구문서·환경 종합 리뷰

> 날짜: 2026-04-24
> 방법: 3-레인 병렬 트레이스 (스펙 완전성 / 기술환경 정합성 / Phase 7 진입 위험)
> 결론: 전반적 준비도 85~90%. 블로커 5건 + 중위험 10건 식별.

---

## 최상위 판단

스펙과 환경 준비도는 전반적으로 양호하지만, **Phase 7 착수 전 반드시 확정해야 할 블로커 5건**과
**구현 중 발견하면 리팩이 발생할 중위험 10건**이 존재한다.

---

## 🔴 고위험 (Phase 7 착수 전 필수 확정)

### G-1. 설비 마스터 MSSQL 스키마 TBD

- **위치**: `external-masters.md §3` / `requirements.md §16.3`
- **현상**: "TBD, 담당자 자료 수집 후 확정". stub JSON으로 unblock 중.
- **위험**: `equipment/maker/model/process` 4개 필드 검증 로직 설계 불가. `masterService.ts` 로더 함수 작성 착수 불가.
- **필요 액션**: 담당자에게 MSSQL 테이블 구조 수집 → `external-masters.md §3` 업데이트.

### G-2. CORS 정책 미결

- **위치**: `.env.example` 주석 / `next-session-tasks.md §6 중위험`
- **현상**: "Vite proxy vs BE cors() 미들웨어 미결". `vite.config.ts` proxy 미설정.
- **위험**: FE 개발서버(5173) ↔ BE(3000) 통신 차단. FE 개발 착수 첫날 블로킹.
- **선택지**:
  - A안 (Vite proxy): `vite.config.ts`에 `/api` proxy 설정, BE CORS 미들웨어 없음.
  - **B안 (BE cors()) 권장**: `cors({ origin: CORS_ORIGIN })` + `.env`에 `CORS_ORIGIN=http://localhost:5173`. 스테이징/운영까지 동일 코드 커버.
- **필요 액션**: 방식 확정 → `.env.example` + `backend/src/index.ts` 반영.

### G-3. issue_code prefix 생성 규칙 불명확

- **위치**: `feature-voc.md §8.1`
- **현상**: "시스템 슬러그 대문자 사용 예: `ANALYSIS-2025-0001`"만 있고, 고정 prefix인지 시스템별 동적 slug인지 미명시.
- **위험**: `003_vocs.sql` sequence 트리거 로직 설계가 달라짐.
- **필요 액션**: `feature-voc.md §8.1`에 명시. 권장: "시스템 slug를 대문자로 사용" (`PIPELINE-`, `CRM-` 등 시스템별 동적).

### G-4. 폐쇄 메뉴(Closed Menu) 정의 없음

- **위치**: `requirements.md §8.2.1`, `feature-voc.md §8.2` 등 6군데 언급
- **현상**: "폐쇄 메뉴 케이스 수용" 반복 언급. 그러나 "폐쇄 메뉴"가 무엇인지 정의 없음.
- **위험**: `voc_payload_reviews.is_self_review=true` 판단 조건 구현 불가.
- **선택지**:
  - A: `systems.is_closed boolean` 컬럼 추가
  - B: `menus.is_closed boolean` 컬럼 추가
  - C: "해당 VOC 담당자가 유일 담당자이면 self-review 허용"으로 런타임 판단
- **필요 액션**: 방식 확정 → `requirements.md §4` 스키마 + `feature-voc.md §8.2.1` 반영.

### G-5. 외부 마스터 Cold Start 시나리오 미정의

- **위치**: `requirements.md §16.3` / `external-masters.md §7`
- **현상**: "부팅 시 로드 실패 → 디스크 스냅샷 fallback" 결정됨. 그런데 **스냅샷도 없는 cold start**(최초 배포, 스냅샷 파일 미존재) 동작 미정의.
- **위험**: 최초 배포 시 BE 기동 실패 또는 silent fail.
- **선택지**:
  - A: cold start 시 전 필드 unverified 모드로 계속 기동 (권장)
  - B: cold start 시 기동 실패 + 명시적 에러
- **필요 액션**: `requirements.md §16.3` + `external-masters.md §7`에 시나리오 추가.

---

## 🟠 중위험 (해당 기능 착수 전 결정)

| #    | 이슈                                    | 위치                                  | 필요 액션                                                                                                         |
| ---- | --------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| M-1  | **unverified_fields 검증 세부 규칙**    | `requirements.md §4`                  | 대소문자·공백 정규화 정책, 완전 일치 vs 부분 매칭 명시                                                            |
| M-2  | **자유 입력 시 저장 허용 여부**         | `requirements.md §4` §112             | unverified 필드도 저장 가능(저장 후 리뷰 게이트)인지 명시 — 현재 "저장 허용 + unverified 표기"로 읽히나 확인 필요 |
| M-3  | **React Query staleTime 나머지 페이지** | `next-session-tasks.md §6`            | VOC 목록·상세·댓글·알림·관리자 페이지별 기본값 일괄 결정                                                          |
| M-4  | **세션 스토어 환경변수명**              | `requirements.md §14.1`               | connect-pg-simple 확정됐으나 `.env.example`에 `SESSION_STORE_URL` 변수명 미정                                     |
| M-5  | **태그 규칙 삭제 권한**                 | `feature-voc.md §8.3`                 | 권한 매트릭스에 `tag_rules` 삭제 행 없음. Admin 전용인가 Manager도 가능한가?                                      |
| M-6  | **신규 태그 생성 주체**                 | `feature-voc.md §8.8`                 | 개별 VOC 태그 수동 편집은 Manager/Admin 가능. 신규 태그 자체를 Admin만 생성 가능한가?                             |
| M-7  | **댓글 이미지 형식 제한**               | `feature-voc.md §8.12`                | VOC 본문 첨부(PNG/JPG/GIF/WebP)와 댓글 이미지 허용 형식 동일 여부 미명시                                          |
| M-8  | **Sub-task 태그 규칙 cascade**          | `requirements.md §4` `tag_rules` 불릿 | 부모 VOC 편집 시 Sub-task에도 auto-tagging 재실행 여부                                                            |
| M-9  | **삭제 복원 VOC 태그 재실행**           | `requirements.md §4` `tag_rules` 불릿 | `deleted_at=NULL` 복원 시 자동 태깅 엔진 재실행 대상 여부                                                         |
| M-10 | **대시보드 복합 필터 우선순위**         | `dashboard.md §A`                     | "담당자: 김지훈 + 시스템: Analysis" 동시 활성 시 AND/OR 미명시                                                    |

---

## 🟢 기술환경 정합성 요약 (Lane 2)

전체 정합성 **95%** — 대부분 스펙과 일치.

| 상태 | 항목                                                                                                             |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| ✅   | 마이그레이션 6개 파일 스펙 컬럼 일치 (`source`, `embed_stale`, `review_status`, `structured_payload_draft` 포함) |
| ✅   | openapi.yaml 대시보드 14개 + Internal Notes 4개 엔드포인트 정의                                                  |
| ✅   | FE 5개 Context (Auth/VOCFilter/VOCDrawer/Notification/MasterCache) 구현                                          |
| ✅   | Docker Compose 3-tier 정상 구성                                                                                  |
| ⚠️   | `.env.example`에 `LOG_LEVEL` 누락 (`requirements.md §14.1` 요구)                                                 |
| ⚠️   | `docker-compose.yml` frontend에 `VITE_AUTH_MODE` 미주입                                                          |

---

## 권장 처리 순서

Phase 7 실구현 착수 전:

1. **G-2 CORS 정책** — B안으로 즉시 확정. `.env.example` + `backend/src/index.ts` 수정만으로 완료.
2. **G-3 issue_code prefix** — `feature-voc.md §8.1` 한 줄 추가로 완료.
3. **G-4 폐쇄 메뉴 정의** — 방식 선택 후 스키마·spec 반영.
4. **G-5 Cold Start 시나리오** — A안(계속 기동) 명시로 완료.
5. **G-1 설비 마스터 스키마** — 외부 의존(담당자 자료). 수집 후 `external-masters.md §3` 업데이트.
6. **env 파일 수정** — `LOG_LEVEL`, `VITE_AUTH_MODE` docker-compose 주입.
7. **M-1~M-10** — 각 기능 착수 시점에 해당 섹션만 결정.
