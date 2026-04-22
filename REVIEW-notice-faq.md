# 공지사항 & FAQ 구현 리뷰 가이드

> prototype.html 변경사항 요약 — 2026-04-21

---

## 태스크 체크리스트

- [x] **Task 1** — 사이드바 하단 공지사항/FAQ 메뉴 추가
- [x] **Task 2** — 공지사항 페이지 구현
- [x] **Task 3** — 로그인 팝업 시뮬레이션
- [x] **Task 4** — FAQ 페이지 구현
- [x] **Task 5** — Admin 공지사항/FAQ 관리 탭 추가

---

## Task 1 — 사이드바 메뉴

**위치:** `<aside class="sidebar">` 내, Admin 섹션(태그 규칙 관리 위) 위에 구분선 + 섹션 추가

**추가 HTML:**
```html
<div class="sidebar-divider"></div>
<div class="sidebar-section">
  <div class="sidebar-section-title">정보</div>
  <div class="nav-item" onclick="setNav(this)" data-view="notices">
    <i data-lucide="bell"></i> 공지사항
    <span class="nav-badge" id="noticeBadge"></span>  <!-- 미읽 공지 수 -->
  </div>
  <div class="nav-item" onclick="setNav(this)" data-view="faq">
    <i data-lucide="help-circle"></i> FAQ
  </div>
</div>
```

**확인 포인트:**
- [ ] 아이콘 렌더링 (lucide)
- [ ] 클릭 시 active 클래스 이동
- [ ] Admin 섹션과 시각적 구분 확인

---

## Task 2 — 공지사항 페이지

**위치:** `#page-notices` div (신규 추가)

**데이터 구조 (JS):**
```js
const NOTICES = [
  { id: 1, title: '시스템 점검 안내', content: '...', level: 'urgent', popup: true,
    from: '2026-04-01', to: '2026-04-30', visible: true },
  { id: 2, title: '신규 기능 업데이트', content: '...', level: 'important', popup: false,
    from: '2026-04-15', to: '2026-05-15', visible: true },
  { id: 3, title: '사용 가이드 공유', content: '...', level: 'normal', popup: false,
    from: '2026-04-01', to: '2026-06-30', visible: true },
];
```

**중요도 배지 색상:**
| level | 라벨 | 색상 |
|---|---|---|
| `urgent` | 긴급 | 빨강 `#e5484d` |
| `important` | 중요 | 노랑 `#f5a623` |
| `normal` | 일반 | 회색 `var(--text-tertiary)` |

**확인 포인트:**
- [ ] 배지 색상 3종 구분
- [ ] 제목 클릭 → 내용 인라인 펼침/접힘
- [ ] 노출 기간 외 항목 미표시

---

## Task 3 — 로그인 팝업

**트리거:** 페이지 로드 시 (`DOMContentLoaded`)

**조건:** `NOTICES` 중 `popup: true && visible: true && 기간 내` 항목

**동작:**
1. 해당 공지를 중요도 내림차순으로 표시
2. 팝업 하단 "오늘 하루 보지 않기" 체크박스
3. 체크 후 닫으면 `localStorage.setItem('notice_hide_{id}', today)` 저장
4. 재방문 시 오늘 날짜와 비교 → 동일하면 미표시

**확인 포인트:**
- [ ] 팝업 모달 디자인 (기존 모달 스타일 재사용)
- [ ] "오늘 하루 보지 않기" 동작 (새로고침 후 미표시)
- [ ] 닫기 버튼 동작

---

## Task 4 — FAQ 페이지

**위치:** `#page-faq` div (신규 추가)

**데이터 구조 (JS):**
```js
const FAQS = [
  { id: 1, category: '사용법', q: 'VOC는 어떻게 등록하나요?', a: '...', visible: true },
  { id: 2, category: '오류', q: '파일 첨부가 안 됩니다', a: '...', visible: true },
  { id: 3, category: '정책', q: '담당자는 누가 지정하나요?', a: '...', visible: true },
  { id: 4, category: '기타', q: '비밀번호를 잊어버렸어요', a: '...', visible: true },
];
```

**UI 구조:**
```
[검색 입력창]
[카테고리 탭: 전체 | 사용법 | 오류 | 정책 | 기타]
─────────────────────────────────
▶ Q: VOC는 어떻게 등록하나요?     [사용법]
  ▼ (클릭 시 펼침)
  A: Toast UI Editor 본문...
─────────────────────────────────
```

**확인 포인트:**
- [ ] 검색어 입력 시 Q/A 실시간 필터
- [ ] 매칭 텍스트 `<mark>` 하이라이팅
- [ ] 카테고리 탭 필터 동작
- [ ] 아코디언 펼침/접힘 애니메이션

---

## Task 5 — Admin 공지사항/FAQ 관리 탭

**위치:** Admin 페이지 탭 영역에 2개 탭 추가

**공지사항 관리 탭 테이블 컬럼:**
| 제목 | 중요도 | 팝업 | 노출 기간 | 노출 여부 | 작업 |
|---|---|---|---|---|---|
| 시스템 점검 | 긴급 | ON | 04/01~04/30 | 토글 | 수정/삭제 |

**FAQ 관리 탭 테이블 컬럼:**
| 질문 | 카테고리 | 노출 여부 | 작업 |
|---|---|---|---|
| VOC는 어떻게? | 사용법 | 토글 | 수정/삭제 |

**확인 포인트:**
- [ ] 탭 전환 동작
- [ ] "공지 추가" / "FAQ 추가" 인라인 폼 노출
- [ ] 노출 여부 토글 즉시 반영 (목록/팝업에도 반영)
- [ ] 삭제 버튼 동작

---

## 전체 확인 포인트

- [ ] 디자인 토큰 일관성 (색상, 간격 design.md 기준)
- [ ] 루시드 아이콘 전체 초기화 (`lucide.createIcons()`)
- [ ] 사이드바 `setNav()` 함수가 새 data-view 처리
- [ ] Admin이 아닌 일반 뷰에서 관리 기능 미노출
