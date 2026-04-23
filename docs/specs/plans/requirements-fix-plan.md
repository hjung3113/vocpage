# 요구사항 수정 계획 (리뷰 후속 조치)

> 기반 리뷰: `docs/specs/reviews/requirements-expert-review-2026-04-23.md`  
> 작성일: 2026-04-23  
> 목표: requirements.md 준비도 61점 → 85점 이상 (구현 시작 기준)

---

## 진행 방법

1. **인터뷰가 필요한 항목** (§1) — 외부 확인 없이 결정 불가. 먼저 인터뷰/확인 후 문서 반영.
2. **문서만 수정하면 되는 항목** (§2) — 인터뷰 불필요. 즉시 requirements.md 수정 가능.
3. 각 항목 완료 후 `[ ]`를 `[x]`로 변경.

---

## §1. 인터뷰 / 외부 확인이 필요한 항목

> 이 항목들은 기술적 결정이 아니라 **조직·인프라·비즈니스 결정**이므로  
> 담당자와 대화 없이 임의로 스펙을 채우면 안 됩니다.

### 인터뷰 A — 인프라/IT팀 (AD 인증 방식)

**목적**: `validateADSession` 미들웨어 구현 방식 결정

질문 목록:
- [x] 사내 AD 연동 방식은? (LDAP bind / Kerberos / OAuth2 OIDC / 사내 JWT 발급 API)
- [x] 세션 토큰 형식은? (JWT? 세션 쿠키? 만료 시간은?)
- [x] VOC 시스템이 AD에 직접 붙는가, 아니면 기존 분석 시스템의 인증 세션을 재사용하는가?
- [x] 개발 환경에서 실 AD 없이 테스트 가능한 mock 계정 제공 가능한가?

반영 위치: `requirements.md §6.1`, `§8.15`, `§2.1`

---

### 인터뷰 B — 운영팀/서비스 오너 (역할 부여 방식)

**목적**: Manager/Admin 역할이 실제 조직과 어떻게 매핑되는지 결정

질문 목록:
- [x] Manager 역할은 누가 부여하는가? (Admin이 수동 지정 vs AD 그룹 자동 매핑)
- [x] Admin은 최초 배포 시 어떻게 생성하는가? (DB seed? 환경변수 `INIT_ADMIN_EMAIL`?)
- [x] 퇴직/부서이동 시 역할 회수 프로세스가 있는가? (`is_active` 자동 비활성화 연동?)

반영 위치: `requirements.md §8.3`, `§4 users 테이블`, `§6.1`

---

### 인터뷰 C — 운영팀 (MVP 범위 충분성)

**목적**: SLA 없이, 이메일 알림 없이, 벌크 액션 없이 실제 운영이 가능한지 확인

질문 목록:
- [x] 하루 VOC 유입량 예상치는? (폴링 30초 주기 부하 계산에 필요)
- [x] 긴급 VOC 누락 방지를 인앱 알림만으로 충분하다고 보는가?
- [x] 마감일(Due Date) 없이 우선순위(Priority)만으로 SLA 추적이 가능한가?

반영 위치: `requirements.md §7`, `§8.6`, `§9.10`

---

## §2. 문서만 수정하면 되는 항목

> 아래 순서대로 `requirements.md`를 직접 수정합니다.  
> 세션 시작 시 Claude에게 "requirements-fix-plan.md의 §2 수정 항목 순서대로 진행해줘"라고 하면 됩니다.

### P0 — 즉시 (구현 시작 전 필수)

- [x] **FIX-01** `§2.3` Sub-task "최대 2단계" → "최대 1레벨 (root → sub 단일 계층)"으로 표현 수정
- [x] **FIX-02** `§8.3` 권한 테이블에 행 추가: `태그 수동 편집 | ❌ | ✅ | ✅`
- [x] **FIX-03** `§4` `notices` 테이블 스키마 추가
  - 컬럼: `id(uuid)`, `title`, `body(HTML)`, `level(enum: normal/important/urgent)`, `is_popup(boolean)`, `is_visible(boolean)`, `visible_from(date)`, `visible_to(date)`, `author_id(FK→users)`, `deleted_at`, `created_at`, `updated_at`
- [x] **FIX-04** `§4` `faqs` 테이블 스키마 추가
  - 컬럼: `id(uuid)`, `question`, `answer(HTML)`, `category_id(FK→faq_categories)`, `is_visible(boolean)`, `sort_order`, `author_id`, `deleted_at`, `created_at`, `updated_at`
- [x] **FIX-05** `§4` `faq_categories` 테이블 스키마 추가 (FAQ 카테고리 동적 관리용)
  - 컬럼: `id`, `name`, `slug`, `sort_order`, `is_archived`
- [x] **FIX-06** `§10.4.1` 카테고리 타입을 `enum` → `faq_categories 테이블 FK`로 수정
- [x] **FIX-07** `§8.5` 파일 업로드 보안 보강
  - SVG 명시적 차단 추가
  - `Content-Disposition: attachment` 강제 제공 명시
  - GIF 크기 검증 기준 = "원본 파일 바이트 기준 (디코딩 전)"으로 명시
- [x] **FIX-08** `§8.11` 또는 `§6.1` 계층형 목록 쿼리 Sub-task 포함 규칙 추가
  - 규칙: 부모 VOC가 필터 조건에 일치하면 해당 Sub-task도 들여쓰기 형태로 함께 표시. Sub-task 단독으로는 상위 목록에 미노출.
  - 페이지네이션 단위: 부모 VOC 기준 (Sub-task는 1건으로 미계산)
- [x] **FIX-09** `§11` 대시보드 API 기본 구조 추가 (신규 §11.7)
  - 위젯별 API 엔드포인트 목록 + 요청 파라미터 + 응답 필드 스켈레톤 정의

### P1 — 해당 기능 구현 전

- [x] **FIX-10** `§8.7` Sub-task 순번 N 규칙 추가
  - 패딩: 없음(1, 2, 3... 자연수)
  - 최대값: 없음 (999 초과 시 그대로 4자리)
  - 삭제 후 재사용: 금지 (parent VOC 순번과 동일 원칙)
- [x] **FIX-11** `§8.12` 댓글 이미지 저장 경로 추가
  - 경로: `/uploads/comments/{comment_id}/`
  - 별도 `attachments` 행 생성 없음 (Toast UI Editor base64 또는 별도 upload endpoint)
  - 파일당 5MB, 최대 5개/댓글 — §8.10과 동일 적용
- [x] **FIX-12** `§8.9` 삭제된 VOC 첨부파일 접근 정책 추가
  - Soft Delete된 VOC의 파일: Admin만 `?includeDeleted=true`로 접근 가능
  - 일반 User/Manager: 404 반환
- [x] **FIX-13** `§8.6` 알림 보관 정책 명확화
  - "최근 50건 표시 + 51번째부터 오래된 순 삭제. 단, 30일 이후 알림은 읽음 처리 후 자동 삭제. 두 기준 중 먼저 도달한 쪽 적용"
- [x] **FIX-14** `§8.13` 댓글 Hard Delete 의도 명시
  - "댓글은 의도적 Hard Delete — 이유: 댓글은 감사 로그 대상이 아니며 VOC 본문·상태·담당자 변경만 `voc_history`로 추적"
- [x] **FIX-15** `§10.3.4` 공지 복원 권한 명시
  - "복원 권한: Admin 전용 (Manager가 삭제한 공지도 Admin만 복원 가능)"
- [x] **FIX-16** `§4` slug 컬럼 UNIQUE 제약 명시
  - `systems.slug`: 전역 UNIQUE
  - `menus.slug`: `(system_id, slug)` 복합 UNIQUE
  - `voc_types.slug`: 전역 UNIQUE
- [x] **FIX-17** `§4 dashboard_settings` JSONB 컬럼 예시 구조 추가
  ```json
  widget_visibility: { "kpi": true, "heatmap": true, "trend": false, ... }
  widget_order: ["kpi", "distribution", "heatmap", "trend", ...]
  widget_sizes: { "kpi": "full", "trend": "half", ... }
  locked_fields: { "kpi_position": true, "widget_visibility.trend": true }
  ```
- [x] **FIX-18** `§8.3` 또는 `§9.4.4` 마지막 Admin 판정 기준 명시
  - "is_active = true AND role = 'admin' 인 계정 수 ≥ 2일 때만 강등 가능"
  - 권한 변경 API에서 트랜잭션 내 사후 Admin 수 검증 명시
- [x] **FIX-19** `§8.1` DB sequence 이름 규칙 추가
  - 이름 규칙: `seq_{system_slug}_{yyyy}` (예: `seq_analysis_2025`)
  - 연도 전환: 매년 1월 1일 신규 sequence 자동 생성 (DB 트리거 또는 초기화 스크립트)

### P2 — QA 전

- [x] **FIX-20** `§9.6` 검색 하이라이팅 대상 명확화
  - 하이라이팅 대상: 제목(title) 전체 + 태그명(정확 일치). 본문은 목록 미노출이므로 하이라이팅 없음.
  - 방식: 클라이언트 사이드 문자열 replace (React `<mark>` 래핑)
- [x] **FIX-21** `§9.9` 전체화면 전환 방식 결정
  - "CSS transform/position 기반 전환 (DOM 유지) — Toast UI Editor 인스턴스 보존을 위해 React Portal 또는 hidden 레이어 방식 사용"
- [x] **FIX-22** `§10.3.2` 단일 팝업 시 모달 형태 명시
  - "팝업 공지가 1건: 단일 다이얼로그 모달. 2건 이상: 좌(목록)+우(상세) 2-panel 모달"
  - "오늘 하루 보지 않기": 단일 공지 → 해당 공지 ID 기준 localStorage. 복수 → 전체 목록 일괄 localStorage.
- [x] **FIX-23** `§5` 또는 `§8.11` 빈 메뉴 드롭다운 안내 추가
  - "선택한 시스템에 활성 메뉴가 없으면 드롭다운 비활성화 + '이 시스템에 등록된 메뉴가 없습니다' 안내 문구 표시"
- [x] **FIX-24** `§10.2.2` 사이드바 배지 — User 뷰 "전체 VOC" 탭 처리 명시
  - "User 역할에게는 '전체 VOC' 탭 자체를 숨김 처리 (카운트 배지 포함 미표시)"
- [x] **FIX-25** `§11.5` Manager의 잠금 아이콘 UI 명시
  - "Manager는 편집 모드에서 잠금 아이콘을 비활성(disabled) 상태로 표시 — 클릭 불가, 툴팁: '잠금 설정은 Admin만 가능'"
- [x] **FIX-26** `§8.14` 알림 폴링 에러 처리 추가
  - "네트워크 오류 / 5xx: 최대 3회 재시도 (exponential backoff 1s → 2s → 4s). 401: 세션 만료 처리 (로그인 페이지 리다이렉트). 탭 비활성 시 폴링 중단은 기존 명세 유지"

### P3 — 구현 후 최적화

- [x] **FIX-27** `§7` 확장성 로드맵 우선순위 명시
  - "1순위: 이메일/슬랙 알림. 2순위: AI 자동 분류. 3순위: FTS 검색. 4순위: SLA 에스컬레이션"
- [x] **FIX-28** `§6.2` 상태 관리 방식 결정 및 반영
  - React Context (MVP 규모 충분) vs Redux (확장성 필요 시)
  - 결정 후 requirements.md §6.2에 반영
- [x] **FIX-29** `§4` AI 전환 대비 `tag_rules` 확장 여지 주석
  - "NextGen AI 태깅 전환 시 `confidence_threshold(float)`, `model_version` 컬럼 추가 예정"

---

## §3. 수정 완료 후 재리뷰 체크

수정 후 아래를 확인하고 준비도 점수를 재계산합니다.

- [x] P0 10건 모두 `[x]` 처리
- [x] 인터뷰 A/B 결과 반영 완료
- [x] `requirements.md` §4 스키마 섹션이 §10 기능과 일치
- [x] 권한 테이블(§8.3)이 전체 기능 목록을 커버
- [x] Claude에게 "requirements.md를 리뷰 체크리스트 기준으로 재검토해줘"로 재리뷰 요청

---

## §4. 다음 세션 진입 가이드

```
세션 시작 시:
1. requirements-fix-plan.md §2 읽기 (체크되지 않은 첫 번째 항목 확인)
2. 인터뷰 A/B/C 결과가 있으면 먼저 반영
3. FIX-01부터 순서대로 requirements.md 수정
4. 각 수정 완료 시 이 파일의 [ ] → [x] 업데이트
5. P0 완료 후 재리뷰: "requirements-expert-review-2026-04-23.md 기준으로 재검토"
```

---

*작성: Claude Sonnet 4.6 | 기반: requirements-expert-review-2026-04-23.md*
