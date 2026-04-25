# Phase 7-11 컴포넌트 검증 방법 결정 + 티켓화

> 작성: 2026-04-25 | 기준: `prototype/prototype.html`, `prototype/dashboard/`

---

## 1. 검증 방법 결정

### Storybook vs 체크리스트 비교

| 항목            | Storybook                         | 체크리스트 (선택)     |
| --------------- | --------------------------------- | --------------------- |
| 설정 비용       | 높음 (CSF 파일, addon, 설정)      | 없음                  |
| Phase 7 적합성  | 낮음 (스켈레톤 단계에 과도)       | 높음                  |
| 프로토타입 비교 | 어려움 (prototype.html 참조 불편) | 직접 대조 가능        |
| 회귀 감지       | Chromatic 연동 필요 (Phase 8)     | 수동                  |
| 유지 보수       | 이야기 파일 별도 관리 필요        | 체크리스트 업데이트만 |

**결정: 체크리스트 방식 채택**

- Phase 7 목표는 로컬 dev 기능 동작이지 디자인 pixel-perfect 아님
- Storybook은 Phase 8 운영 실구현 단계에서 재검토 (8-7 Playwright E2E와 함께)
- 체크리스트 항목은 `prototype.html` 섹션 ID → React 컴포넌트 1:1 매핑

---

## 2. 컴포넌트 인벤토리 + 검증 체크리스트

### 2-1. Pages

| 컴포넌트            | Prototype 대응              | 핵심 검증 항목                                    | 상태 |
| ------------------- | --------------------------- | ------------------------------------------------- | ---- |
| `VocPage.tsx`       | `#voc-list` 섹션            | 목록 렌더링, 필터 적용, 페이지네이션, 드로어 열기 | -    |
| `DashboardPage.tsx` | `prototype/dashboard/` 전체 | KPI 카드, 필터 탭, 차트 렌더링                    | -    |
| `NoticePage.tsx`    | `#notice-section`           | 공지 목록, 팝업 모달, 레벨 배지                   | -    |
| `FaqPage.tsx`       | `#faq-section`              | 카테고리 탭, 아코디언, 검색                       | -    |
| `AdminPage.tsx`     | `#admin-section`            | 탭 전환, 사용자·시스템·태그규칙·결과리뷰 탭       | -    |
| `MockLoginPage.tsx` | N/A (dev only)              | 로그인 폼, 역할 선택                              | -    |

### 2-2. VOC 컴포넌트

| 컴포넌트                   | Prototype 대응        | 핵심 검증 항목                                    | 상태 |
| -------------------------- | --------------------- | ------------------------------------------------- | ---- |
| `VocTopbar.tsx`            | `#voc-header`         | 제목, 마스터 모드 배지, 필터 카운트               | -    |
| `VocFilterBar.tsx`         | `#filter-bar`         | 상태/우선순위/유형/담당자 필터, 검색              | -    |
| `VocList.tsx`              | `#voc-table`          | 컬럼 헤더, 정렬, 빈 상태                          | -    |
| `VocRow.tsx`               | `#voc-row`            | 상태 dot, 우선순위 배지, 이슈코드 D2Coding        | -    |
| `VocDrawer.tsx`            | `#voc-detail`         | 섹션 구조, 상태 전환, Sub-task 경고 모달          | -    |
| `VocCreateModal.tsx`       | `#create-modal`       | 필수 필드 검증, 시스템/메뉴 선택, Toast 에디터    | -    |
| `AttachmentList.tsx`       | `#attachment-section` | 파일 목록, 업로드 버튼, 다운로드 링크             | -    |
| `CommentList.tsx`          | `#comment-section`    | 댓글 목록, 작성 폼, 이미지 첨부                   | -    |
| `InternalNotesSection.tsx` | `#notes-section`      | 내부 메모 목록, 작성 폼, Manager/Admin만 표시     | -    |
| `PayloadSection.tsx`       | `#payload-section`    | 7개 필드, unverified 배지, draft/submit, 자동완성 | -    |
| `SubtaskSection.tsx`       | `#subtask-section`    | Sub-task 목록, 인라인 폼, 1레벨 제한 안내         | -    |
| `TagChip.tsx`              | `#tag-chip`           | 태그 색상, 클릭 필터                              | -    |
| `PriorityBadge.tsx`        | `#priority-badge`     | urgent/high/normal/low 색상                       | -    |
| `StatusDot.tsx`            | `#status-dot`         | 5개 상태 색상                                     | -    |

### 2-3. 대시보드 컴포넌트

| 컴포넌트                   | Prototype 대응        | 핵심 검증 항목                     | 상태 |
| -------------------------- | --------------------- | ---------------------------------- | ---- |
| `KpiCard.tsx`              | `.kpi-card`           | 수치, 변화율, alert border         | -    |
| `DistributionSection.tsx`  | `.distribution-donut` | 도넛 4탭 (상태/우선순위/유형/태그) | -    |
| `PriorityStatusMatrix.tsx` | `.matrix-table`       | 우선순위×상태 셀                   | -    |
| `DrilldownHeatmap.tsx`     | `.heatmap`            | X축 셀렉터 3종, 브레드크럼         | -    |
| `WeeklyTrendChart.tsx`     | `.trend-chart`        | 3선 (신규/진행중/완료)             | -    |
| `TagDistributionChart.tsx` | `.tag-bar`            | 바 차트, 태그별 카운트             | -    |
| `AgingVocList.tsx`         | `.aging-list`         | Top 10, 기한 초과 강조             | -    |
| `AssigneeTable.tsx`        | `.assignee-table`     | 담당자별 처리현황, 정렬            | -    |
| `SystemMenuCards.tsx`      | `.system-cards`       | 시스템/메뉴 현황 카드, 탭 연동     | -    |

### 2-4. 공통 컴포넌트

| 컴포넌트                | Prototype 대응  | 핵심 검증 항목                        | 상태 |
| ----------------------- | --------------- | ------------------------------------- | ---- |
| `NotificationBell.tsx`  | `#notif-bell`   | 미읽음 배지 (99+), urgent 빨간 느낌표 | -    |
| `NotificationPanel.tsx` | `#notif-panel`  | 목록, 타입 아이콘, 상대시간           | -    |
| `NoticePopup.tsx`       | `#notice-popup` | 팝업 모달, "오늘 하루 안보기"         | -    |
| `Pagination.tsx`        | `#pagination`   | 페이지 번호, 이전/다음, 경계 처리     | -    |

---

## 3. 검증 기준 (완료 판정)

각 컴포넌트가 다음을 만족하면 ✅:

1. **렌더링**: 오류 없이 마운트됨 (console.error 없음)
2. **토큰**: hex/raw OKLCH 없음 — CSS custom property만 사용
3. **기능**: 핵심 검증 항목 수동 테스트 통과
4. **접근성**: input에 label 또는 aria-label 존재
5. **프로토타입 일치**: 핵심 레이아웃 및 색상이 prototype.html과 대응

---

## 4. Phase 7-11 구현 범위

### 포함

- 체크리스트 문서 완성 (위 표)
- 미구현 컴포넌트 스켈레톤 확인 및 TODO 기록
- prototype.html 대비 누락 UI 요소 기록

### 제외

- pixel-perfect 일치 (Phase 7 기준 아님)
- 실제 컴포넌트 수정 (별도 티켓으로 분리)
- Storybook 설정 (Phase 8 재검토)

---

## 5. 구현 순서

```
1. 전 컴포넌트 dev server에서 수동 확인 (docker compose up)
2. 체크리스트 표 상태 업데이트
3. 미충족 항목 → TODO 주석 또는 별도 이슈 기록
4. 설계 문서 완성 + commit
```
