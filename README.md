# vocpage

VOC(Voice of Customer) 관리 시스템 — 사내 분석 시스템에 통합되는 이슈 트래킹 서브 시스템.

Linear의 간결한 UX + Jira의 관리 기능을 결합. Samsung Blue 디자인 시스템 (OS 테마 자동 연동, dark/light 양방향 지원).

> **현재 상태**: Phase 8 Wave 1 종료 + Wave 1.5 보강 대기. `/voc` 리스트 + 검토 드로어 vertical slice 가 React + Express + PostgreSQL 로 동작 중이며, prototype 시각 깊이 보강 PR 진입 전입니다. Wave 0~5 정본 plan: [`docs/specs/plans/phase-8.md`](docs/specs/plans/phase-8.md).

---

## 프로토타입 실행

`prototype/prototype.html` — 백엔드 없이 브라우저에서 바로 실행되는 단일 페이지 인터랙티브 프로토타입. 모든 화면·역할·상태 변형을 mock 데이터로 재현합니다.

```bash
# 1) 정적 서버 실행
cd prototype && python3 -m http.server 8899
#   또는: npx http-server prototype -p 8080

# 2) 브라우저에서 열기
#   → http://localhost:8899/prototype.html
```

### URL 옵션

| 옵션                   | 효과                                             |
| ---------------------- | ------------------------------------------------ |
| `?mode=admin`          | 관리자 진입점/관리 액션 노출 (B-4a)              |
| 사이드바 사용자명 클릭 | role 토글 popover (admin / manager / dev / user) |

### 디렉토리 구조

```
prototype/
├── prototype.html        # 단일 진입 문서 (~929줄, 의도적으로 분할 안 함)
├── css/                  # admin/ · components/ · layout/ 분할 (각 ≤500줄)
├── js/                   # 16+ 모듈 (classic <script>, 빌드 도구 없음)
├── screenshots/          # 참조 스냅샷
└── scripts/              # Playwright smoke 검증 도구
```

상세: [`prototype/CLAUDE.md`](prototype/CLAUDE.md)

---

## 유즈케이스

### 일반 사용자 (User)

**VOC 등록**

- 상단 "새 VOC" 버튼 → 모달 오픈
- 제목 + 카테고리 선택 + Toast UI 리치 텍스트 본문 작성
- 파일 첨부 (드래그 앤 드롭, 최대 5개, PNG/JPG/GIF/WebP)
- 제출 시 자동 태깅 적용 (키워드 규칙 매칭 — MVP는 키워드 단일 모드)

**VOC 목록 조회**

- 상태 필터 pill (전체 / 접수됨 / 검토중 / 처리중 / 완료 / 보류)
- 검색창 — 제목 하이라이팅
- 정렬 (등록일 오름/내림, 우선순위, 담당자)
- 필터 더보기 패널 — 담당자·우선순위·카테고리 복합 필터
- 사이드바 시스템/메뉴 선택 시 상단 타이틀이 `VOC / 시스템명` · `VOC / 시스템명 / 메뉴명` 형태로 현재 컨텍스트를 표시

**VOC 상세 조회**

- 목록 행 클릭 → 우측 사이드 드로어 슬라이드 인 (목록 컨텍스트 유지)
- 본문, 태그, 첨부파일, 변경 이력 확인
- 댓글 작성 (Ctrl+Enter 등록) / 수정 / 삭제 (5초 undo)
- 퍼머링크 복사, 전체화면 (Esc 종료)

**공지사항 / FAQ 조회**

- 사이드바 "정보" 섹션 → 공지사항 또는 FAQ 클릭
- 공지사항: 중요도(긴급/중요/일반) 배지, 클릭 시 인라인 펼침
- FAQ: 카테고리 탭 + 키워드 검색, 클릭 시 인라인 펼침
- 로그인 시 팝업=ON 공지 자동 표시, "오늘 하루 보지 않기" 지원

### 관리자 (Manager / Admin)

**VOC 상태 및 담당자 관리**

- 드로어에서 상태 select 변경 (접수됨 → 검토중 → 처리중 → 완료 / 보류)
- 담당자 지정 및 우선순위 설정 (Urgent / High / Medium / Low)
- Internal Notes 드로어 (관리자 전용 메모)

**서브태스크 관리**

- 드로어 내 "하위 작업 추가" → 인라인 폼 (Enter 확정, Esc 취소)
- 목록에서 아코디언으로 서브태스크 노출 (최대 2단계)

**결과 검토 (Result Review)**

- 사이드바 "관리자" → 결과 검토 페이지
- 검토 큐 (제출 검토, 삭제 신청) — 승인/반려 토스트

**태그 규칙 / 태그 마스터 / 휴지통 관리**

- 태그 규칙: 키워드 토큰 입력, 활성/비활성 토글
- 태그 마스터 (D22): kind별 분리, 병합/일시중단
- 휴지통 (D23): 복원 / 영구삭제 (MVP는 영구삭제 disabled)

**시스템·메뉴·유형 / External Masters 관리**

- 시스템·메뉴·VOC 유형 목록 / 아카이브
- External Masters: snapshot 운영, source별 독립 swap, 5분 쿨다운

**사용자 관리**

- 역할 변경 (Viewer / Developer / Manager / Admin)
- 활성/비활성 전환 + 가드 토스트 (last-admin / self-role / self-deactivate)

**공지사항·FAQ 관리** (`?mode=admin`)

- 공지사항: 등록(제목·중요도·팝업·노출 기간) / 노출 토글 / 삭제
- FAQ: 등록(질문·답변·카테고리) / 카테고리 관리 (↑↓ 정렬) / 노출 토글 / 삭제

**Dashboard 설정 패널**

- 8 widget 토글 + ↑↓ 순서 변경
- 모드 탭 (내 설정 / 기본값[Admin])

---

## 기술 스택 (계획)

| 레이어   | 기술                                      |
| -------- | ----------------------------------------- |
| Frontend | React + TypeScript, Vite, Toast UI Editor |
| Backend  | Node.js + Express + TypeScript            |
| Database | PostgreSQL                                |
| Auth     | AD/LDAP SSO (validateADSession 미들웨어)  |
| Testing  | Vitest (FE), Jest + Supertest (BE)        |
| Infra    | Docker + Docker Compose                   |

---

## 문서

| 문서                                                                                     | 내용                                                  |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`docs/specs/requires/requirements.md`](docs/specs/requires/requirements.md)             | 기능 요구사항 (한국어)                                |
| [`docs/specs/requires/uidesign.md`](docs/specs/requires/uidesign.md)                     | 디자인 시스템 — 토큰·컴포넌트·레이아웃 (English only) |
| [`docs/specs/requires/feature-voc.md`](docs/specs/requires/feature-voc.md)               | VOC 기능 상세                                         |
| [`docs/specs/requires/dashboard.md`](docs/specs/requires/dashboard.md)                   | 대시보드 위젯 spec                                    |
| [`docs/specs/requires/feature-notice-faq.md`](docs/specs/requires/feature-notice-faq.md) | 공지/FAQ 기능 상세                                    |
| [`docs/specs/requires/external-masters.md`](docs/specs/requires/external-masters.md)     | 외부 마스터 캐시·스왑 spec                            |
| [`docs/specs/plans/next-session-tasks.md`](docs/specs/plans/next-session-tasks.md)       | 진행 중 Phase 계획                                    |
| [`docs/specs/plans/nextgen-backlog.md`](docs/specs/plans/nextgen-backlog.md)             | NextGen(MVP 이후) 백로그                              |

---

## NextGen (MVP 이후 차세대 기능)

이메일 알림 / AI 자동 분류 / FTS / SLA 에스컬레이션 등은 본 MVP 범위 밖입니다. 전체 백로그: [`docs/specs/plans/nextgen-backlog.md`](docs/specs/plans/nextgen-backlog.md).
