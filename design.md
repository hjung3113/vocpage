# VOCpage Design System — Samsung Blue Edition

> **업데이트 이력**: 초기 Linear 인스파이어드 인디고 팔레트 → Samsung Blue 계열 + 시스템 테마 자동 연동으로 전면 개편 (2025.06)

---

## 1. 핵심 철학

VOCpage의 디자인 언어는 **삼성 Galaxy / One UI**의 코퍼레이트 블루 팔레트에서 영감을 받았습니다. 기업 내부 도구로서 신뢰감과 정밀함을 전달하며, 사용자의 **시스템 테마 설정(light/dark)을 자동으로 따릅니다.**

**3 키워드**: 정밀한(Precise) · 신뢰할 수 있는(Trustworthy) · 체계적인(Structured)

- **단일 크로마틱 색상**: Samsung Blue만이 유일한 채도 있는 색상. 나머지는 모두 블루-틴티드 뉴트럴.
- **양방향 테마**: 다크 모드와 라이트 모드 모두 동등하게 아름답고 접근 가능.
- **OKLCH 팔레트**: 지각적으로 균일한 색상 계층을 보장.
- **정보 밀도 우선**: 기능이 먼저, 장식은 나중. 테이블 UI가 핵심 인터페이스.

---

## 2. 테마 시스템

### 자동 테마 전환

CSS `color-scheme: light dark`와 `light-dark()` 함수를 사용해 **브라우저/OS 설정을 자동으로 감지**합니다. 별도의 테마 토글 버튼 없이 시스템 설정을 존중합니다.

```css
:root {
  color-scheme: light dark;
  --bg-app: light-dark(light-value, dark-value);
}
```

### 다크 모드 (기본 배경)
딥 블루-블랙 캔버스에 Samsung Blue 악센트가 빛납니다. 사무실 야간 작업에 최적화.

### 라이트 모드
블루-틴티드 화이트 배경의 클린한 코퍼레이트 룩. Galaxy 앱 UI의 밝은 버전과 유사.

---

## 3. 색상 팔레트 (OKLCH)

> OKLCH를 사용하는 이유: 지각적으로 균일해 동일한 명도 차이가 시각적으로도 동일하게 느껴집니다. HSL에서 발생하는 채도-명도 간섭 없음.

### 배경 레이어

| 역할 | 라이트 | 다크 | 용도 |
|------|--------|------|------|
| **App Base** | `oklch(98% 0.007 252)` | `oklch(11% 0.016 264)` | 최하단 캔버스 |
| **Panel** | `oklch(96.5% 0.009 255)` | `oklch(14.5% 0.019 262)` | 사이드바, 패널 |
| **Surface** | `oklch(100% 0 0)` | `oklch(18.5% 0.021 260)` | 카드, 드로어 |
| **Elevated** | `oklch(95% 0.011 256)` | `oklch(23% 0.022 258)` | 호버, 팝업 |

> **원칙**: 모든 배경은 blue hue(250–268)로 미세하게 틴팅. 순수 흰색/검정 사용 금지.

### 텍스트 계층

| 역할 | 라이트 | 다크 | 용도 |
|------|--------|------|------|
| **Primary** | `oklch(18% 0.026 267)` | `oklch(95.5% 0.007 252)` | 헤딩, 강조 텍스트 |
| **Secondary** | `oklch(36% 0.022 264)` | `oklch(79% 0.014 255)` | 본문, 레이블 |
| **Tertiary** | `oklch(54% 0.016 260)` | `oklch(59% 0.012 258)` | 보조 정보 |
| **Quaternary** | `oklch(68% 0.010 258)` | `oklch(43% 0.010 260)` | 타임스탬프, 비활성 |

### Samsung Blue — 브랜드 색상

삼성의 시그니처 딥 블루(`#1428A0`)에서 영감을 받은 OKLCH 팔레트:

| 역할 | 라이트 | 다크 | 용도 |
|------|--------|------|------|
| **Brand** | `oklch(40% 0.22 265)` | `oklch(63% 0.19 258)` | 주요 CTA, 로고, 강조 |
| **Accent** | `oklch(47% 0.23 262)` | `oklch(70% 0.21 255)` | 링크, 활성 상태 |
| **Accent Hover** | `oklch(35% 0.22 268)` | `oklch(76% 0.18 252)` | 호버 상태 |
| **Brand BG** | `oklch(93% 0.025 258)` | `oklch(22% 0.035 262)` | 태그 배경, 선택 행 |
| **Brand Border** | `oklch(80% 0.045 260)` | `oklch(35% 0.060 260)` | 태그 테두리, 포커스 링 |

> **규칙**: Samsung Blue는 CTA, 활성 상태, 태그, 포커스 링에만 사용. 장식적 사용 금지.

### 경계선 (Border)

| 역할 | 라이트 | 다크 | 용도 |
|------|--------|------|------|
| **Subtle** | `oklch(88% 0.012 254)` | `oklch(20% 0.018 261 / 0.8)` | 행 구분선, 약한 경계 |
| **Standard** | `oklch(83% 0.016 256)` | `oklch(27% 0.020 259 / 0.85)` | 카드, 인풋, 드로어 |
| **Solid** | `oklch(83% 0.016 256)` | `oklch(25% 0.019 260)` | 버튼 테두리 |

### 상태 색상 (Status)

상태 색상은 테마와 무관하게 의미 전달 우선:

| 상태 | 색상 | OKLCH | 용도 |
|------|------|-------|------|
| 접수됨 | Quaternary | 텍스트 계층 사용 | 초기 접수 |
| 검토중 | Blue | `oklch(67% 0.17 240)` (dark) | 검토 진행 |
| 처리중 | Green | `oklch(55% 0.17 150)` | 처리 중 |
| 완료 | Emerald | `oklch(62% 0.19 158)` | 완료 |
| 보류 | Amber | `oklch(70% 0.16 72)` | 보류 |
| Urgent | Red | `oklch(58% 0.22 25)` | 긴급 우선순위 |

---

## 4. 타이포그래피

### 폰트 패밀리

**Pretendard Variable** — 한국어와 영문을 동시에 아름답게 처리하는 기하학적 산세리프. Samsung One UI의 서체 느낌과 유사하며, Apple의 San Francisco에서 영감을 받아 한국어 최적화.

```css
--font-ui: "Pretendard Variable", "Pretendard",
  -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif;
--font-mono: "D2Coding", "SF Mono", "Menlo", ui-monospace, monospace;
```

CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css`

> 이전 Inter Variable + Berkeley Mono에서 변경. Pretendard는 한국어 자소 처리가 최적화되어 있으며, VOCpage의 사내 사용 환경에 더 적합.

### 타입 스케일

| 역할 | 크기 | 굵기 | 용도 |
|------|------|------|------|
| Display | 32px | 700 | 거의 사용 안 함 |
| Heading | 20–24px | 700 | 섹션 제목 |
| Title | 15–16px | 700 | 카드/드로어 제목 |
| Body UI | 14px | 400 | 기본 본문 |
| Label | 13px | 400–600 | 테이블 셀, 레이블 |
| Caption | 11–12px | 400–600 | 메타데이터, 날짜 |
| Micro | 10–11px | 600 | 배지, 태그, uppercase 레이블 |

**핵심 원칙**:
- 앱 UI는 고정 rem 스케일 (fluid clamp는 마케팅 페이지용)
- 한국어 텍스트: `line-height: 1.65–1.75` (영문보다 0.1–0.15 높게)
- uppercase 레이블: `letter-spacing: 0.06–0.08em`으로 가독성 확보
- 모노스페이스: 이슈 코드, 코드 블록에만 D2Coding 적용

---

## 5. 컴포넌트 스펙

### 버튼

**Primary (Samsung Blue)**
```css
background: var(--brand);   /* oklch(40% 0.22 265) light / oklch(63% 0.19 258) dark */
color: #ffffff;
border-radius: 8px;
padding: 7px 14px;
font-weight: 600;
```

**Ghost**
```css
background: var(--bg-surface);
border: 1px solid var(--border-solid);
border-radius: 8px;
padding: 6px 11px;
```

**Icon Button**
```css
width: 32px; height: 32px;
border-radius: 8px;
border: 1px solid var(--border-subtle);
background: var(--bg-surface);
```

### 인풋 & 셀렉트
```css
background: var(--bg-elevated);
border: 1px solid var(--border-standard);
border-radius: 8px;
padding: 9px 12px;
/* 포커스 */
border-color: var(--brand);
box-shadow: 0 0 0 3px var(--brand-bg);
```

### 태그 Pill (Auto-tag)
```css
background: var(--brand-bg);
border: 1px solid var(--brand-border);
color: var(--accent);
border-radius: 9999px;
font-size: 11.5px; font-weight: 600;
```

### 상태 뱃지
- 컬러 닷(7px circle) + 텍스트 조합
- 배경색 사용 금지 — 색상은 텍스트와 닷에만

### 카드 & 컨테이너
```css
background: var(--bg-surface);
border: 1px solid var(--border-subtle);
border-radius: 8px;  /* 표준 */   /* 12px: 드로어, 모달 */
```

---

## 6. 그림자 (Elevation)

어두운 배경에선 그림자가 잘 보이지 않으므로, 라이트/다크 각각 최적화:

```css
--shadow-sm:     light-dark(oklch(70% 0.04 260 / 0.10) 0 1px 3px,  oklch(5% 0.01 265 / 0.40) 0 1px 3px);
--shadow-md:     light-dark(oklch(65% 0.05 260 / 0.12) 0 4px 16px, oklch(5% 0.01 265 / 0.55) 0 4px 16px);
--shadow-dialog: light-dark(oklch(60% 0.06 260 / 0.14) 0 12px 40px, oklch(5% 0.01 265 / 0.70) 0 12px 40px);
```

**다크 모드**: 블루-블랙 딥 섀도우로 깊이감 표현  
**라이트 모드**: 블루-틴티드 소프트 섀도우 (순수 회색 섀도우 금지)

---

## 7. 레이아웃

### 스페이싱 (4pt 스케일)
```
--sp-1: 4px   --sp-2: 8px   --sp-3: 12px
--sp-4: 16px  --sp-5: 24px  --sp-6: 32px
```

### 주요 치수
- **사이드바 너비**: 222px
- **드로어 너비**: 528px
- **최대 콘텐츠 너비**: ~1200px
- **테이블 행 높이**: 40px (메인), 34px (헤더)
- **탑바 높이**: 50px

### 테이블 컬럼 그리드
```css
grid-template-columns: 22px 144px 1fr 115px 108px 84px 96px;
/* 토글 | 이슈ID | 제목 | 상태 | 담당자 | 우선순위 | 날짜 */
```

---

## 8. Do's and Don'ts

### Do
- `color-scheme: light dark` + `light-dark()` 함수로 자동 테마 전환
- OKLCH로 팔레트 정의 — 지각적 균일성 보장
- 모든 배경에 blue hue(250–268) 미세 틴팅 (chroma 0.007–0.025)
- Samsung Blue를 CTA, 포커스, 활성 상태에만 집중 사용
- Pretendard Variable로 한국어/영문 동시 처리
- 포커스 링은 반드시 `box-shadow: 0 0 0 3px var(--brand-bg)` 사용

### Don't
- 순수 `#000000` / `#ffffff` 사용 금지 — 항상 블루-틴티드 값 사용
- Samsung Blue 장식적 사용 금지 (배경 패턴, 섹션 구분 등)
- 카드/리스트 아이템에 `border-left`로 컬러 스트라이프 금지
- 그라디언트 텍스트 금지 (`background-clip: text`)
- 같은 간격을 모든 곳에 적용하지 말 것 — 리듬 있는 스페이싱
- 라이트 모드를 단순히 다크 모드의 색반전으로 처리 금지 — 별도 설계

---

## 9. 접근성

- 모든 텍스트: WCAG AA 이상 (4.5:1 일반 텍스트, 3:1 대형 텍스트)
- 포커스 인디케이터: `box-shadow: 0 0 0 3px var(--brand-bg)` 필수
- 상태 표시: 색상만으로 전달 금지 — 항상 텍스트 또는 아이콘 병행
- `prefers-reduced-motion`: 트랜지션 비활성화 미디어 쿼리 적용 예정

---

## 10. CSS 구현 참조

```css
:root {
  color-scheme: light dark;

  /* 토큰 예시 */
  --bg-app:     light-dark(oklch(98% 0.007 252), oklch(11% 0.016 264));
  --brand:      light-dark(oklch(40% 0.22 265),  oklch(63% 0.19 258));
  --brand-bg:   light-dark(oklch(93% 0.025 258), oklch(22% 0.035 262));
  --text-primary: light-dark(oklch(18% 0.026 267), oklch(95.5% 0.007 252));

  --font-ui: "Pretendard Variable", "Pretendard",
    -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif;
}
```

OS/브라우저 다크모드 설정만으로 전체 테마가 자동 전환됩니다.
