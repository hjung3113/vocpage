# vocpage

VOC(Voice of Customer) 관리 시스템 — 사내 분석 시스템에 통합되는 이슈 트래킹 서브 시스템.

Linear의 간결한 UX + Jira의 관리 기능을 결합. Samsung Blue 디자인 시스템 (OS 테마 자동 연동, dark/light 양방향 지원).

---

## 프로토타입

`prototype.html` — 단일 파일 인터랙티브 프로토타입. 백엔드 없이 브라우저에서 바로 실행.

```bash
python3 -m http.server 8899
# → http://localhost:8899/prototype.html
```

---

## 유즈케이스

### 일반 사용자 (User)

**VOC 등록**
- 상단 "새 VOC" 버튼 → 모달 오픈
- 제목 + 카테고리 선택 + Toast UI 리치 텍스트 본문 작성
- 파일 첨부 (드래그 앤 드롭, 최대 5개)
- 제출 시 자동 태깅 적용 (키워드/정규식 규칙 매칭)

**VOC 목록 조회**
- 상태 필터 pill (전체 / 접수됨 / 검토중 / 처리중 / 완료 / 보류)
- 검색창 — 제목 하이라이팅
- 정렬 (등록일 오름/내림, 우선순위, 담당자)
- 필터 더보기 패널 — 담당자·우선순위·카테고리 복합 필터

**VOC 상세 조회**
- 목록 행 클릭 → 우측 사이드 드로어 슬라이드 인 (목록 컨텍스트 유지)
- 본문, 태그, 첨부파일, 변경 이력 확인
- 댓글 작성 (Ctrl+Enter 등록) / 수정 / 삭제

**공지사항 / FAQ 조회**
- 사이드바 "정보" 섹션 → 공지사항 또는 FAQ 클릭
- 공지사항: 중요도(긴급/중요/일반) 배지, 클릭 시 인라인 펼침
- FAQ: 카테고리 탭 + 키워드 검색, 클릭 시 인라인 펼침
- 로그인 시 팝업=ON 공지 자동 표시, "오늘 하루 보지 않기" 지원

### 관리자 (Manager / Admin)

**VOC 상태 및 담당자 관리**
- 드로어에서 상태 select 변경 (접수됨 → 검토중 → 처리중 → 완료 / 보류)
- 담당자 지정 및 우선순위 설정 (Urgent / High / Medium / Low)

**서브태스크 관리**
- 드로어 내 "하위 작업 추가" → 인라인 폼 (Enter 확정, Esc 취소)
- 목록에서 아코디언으로 서브태스크 노출 (최대 2단계)

**태그 규칙 관리** (사이드바 → 태그 규칙 관리)
- 키워드/정규식 규칙 목록 테이블
- 활성/비활성 토글
- 규칙 추가 (Enter로 키워드 토큰 입력) / 삭제

**시스템·메뉴·유형 관리** (사이드바 → 시스템/메뉴 관리 · 유형 관리)
- 시스템 및 하위 메뉴 목록 확인 / 아카이브
- VOC 유형 목록 확인 / 아카이브

**사용자 관리** (사이드바 → 사용자 관리)
- 역할 변경 (Viewer / Developer / Manager / Admin)
- 활성/비활성 전환, 초대, 삭제

**공지사항·FAQ 관리** (사이드바 → 공지사항 관리 · FAQ 관리)
- 공지사항 등록 (제목, 중요도, 팝업 여부, 노출 기간) / 노출 토글 / 삭제
- FAQ 등록 (질문, 답변, 카테고리) / 노출 토글 / 삭제

---

## 기술 스택 (계획)

| 레이어 | 기술 |
|---|---|
| Frontend | React + TypeScript, Vite, Toast UI Editor |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| Auth | AD/LDAP SSO (validateADSession 미들웨어) |
| Testing | Vitest (FE), Jest + Supertest (BE) |
| Infra | Docker + Docker Compose |

상세 설계: [`requirements.md`](requirements.md) · [`design.md`](design.md)
