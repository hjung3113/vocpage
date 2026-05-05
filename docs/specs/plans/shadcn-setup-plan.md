# shadcn/ui 도입 검토 및 셋업 계획

> 작성: 2026-05-06 | 다음 세션 실행 예정

---

## 1. 검토 배경

컴포넌트를 계속 직접 조립하는 부담 → UI 라이브러리 도입 가능성 검토.
후보: shadcn/ui, Mantine, Tremor, 21st.dev, registry.directory, shadcnblocks.

---

## 2. 라이브러리별 검토 결과

### shadcn/ui — **채택**

- 모든 dep 이미 설치됨: `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`
- copy-paste 모델 → 소스가 내 코드로 들어옴, 자유롭게 수정 가능
- Tailwind v4 지원 (2025년 초 stable)
- **유일한 작업**: CSS 변수 alias 1회 (`--primary` → `var(--brand)` 등)

### Mantine — **비채택**

- 자체 스타일 시스템(`--mantine-*`), Tailwind와 레이어 충돌
- 커스텀 OKLCH 토큰(`light-dark()`) 연동 불가
- 일부 특화 패키지(`@mantine/charts`)만 Wave 2 Dashboard 시 격리 검토 가능

### Tremor — **보류 (Wave 2 시 재검토)**

- 대시보드/데이터 시각화 특화 → 현재 Wave 1.6 VOC UI에 미해당

### 21st.dev — **비채택**

- 마케팅/랜딩페이지 특화 (Hero, CTA 등) — enterprise 앱 UI 비해당

### registry.directory — **탐색 도구로만 활용**

- 50개+ shadcn 호환 레지스트리 메타 인덱스
- 컴포넌트 직접 제공 안 함; 특화 레지스트리 발견용으로 사용

### shadcnblocks.com — **Wave 2 시 재검토 (유료)**

- 1,500개+ 블록, Data Table/Dashboard/Forms 보유
- 유료 ($149~$399 평생), 토큰 alias 필요
- Activity Feed 없음 → 핵심 컴포넌트는 여전히 직접 구현 필요

---

## 3. 다음 세션 실행 계획: shadcn CLI 셋업 + 토큰 alias

### Step 1 — shadcn 초기화

```bash
npx shadcn@latest init
```

- `components.json` 생성됨 (경로·alias 설정)
- Tailwind v4 모드 선택

### Step 2 — CSS 토큰 alias 작성

`frontend/src/index.css` (또는 글로벌 CSS)에 shadcn 변수 → 프로젝트 토큰 매핑:

```css
/* shadcn compatibility layer */
:root {
  --background: var(--bg-app);
  --foreground: var(--text-primary);
  --primary: var(--brand);
  --primary-foreground: var(--bg-app);
  --secondary: var(--bg-panel);
  --secondary-foreground: var(--text-secondary);
  --muted: var(--bg-elevated);
  --muted-foreground: var(--text-tertiary);
  --border: var(--border-default);
  --ring: var(--brand);
  --radius: 6px;
}
```

> 정확한 매핑은 `uidesign.md` §10 CSS Reference 기준으로 세션 시작 시 확인 후 확정.

### Step 3 — 첫 컴포넌트 추가 테스트

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
```

빌드 + 타입체크 통과 확인 후 기존 스타일과 비교.

### Step 4 — 기존 컴포넌트 정책 결정

- 기존 직접 만든 컴포넌트 → 건드리지 않음 (혼재 허용)
- 새로 필요한 primitive부터 shadcn으로 대체
- 점진적 교체, 대규모 일괄 리팩 금지

---

## 4. 해결되지 않는 Pain Point (직접 구현 계속 필요)

| 컴포넌트                        | 이유                              |
| ------------------------------- | --------------------------------- |
| Activity Feed / Comment Section | 어떤 라이브러리에도 없음          |
| VOC 특화 필터 패널              | 도메인 로직 포함, 직접 구현       |
| 상태 Kanban                     | shadcnblocks에 언급 있으나 미확인 |

---

## 5. 실행 전제 조건

- Wave 1.6 η-batch 진행과 병렬 가능 (별도 브랜치 `feat/shadcn-setup`)
- `uidesign.md` §10 토큰 목록 세션 시작 시 재확인 필수
- 기존 컴포넌트 스타일 회귀 없는지 빌드 후 브라우저 확인
