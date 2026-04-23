# Design Enforcement — Brainstorming

LLM이 design.md를 읽는 것 이상으로 디자인을 **코드 레벨에서 강제**하는 방법들.

## 1. 디자인 토큰 단일 소스 (TypeScript)

`tokens.ts` 하나에 모든 색상/간격/타이포 값을 정의하고, 하드코딩을 ESLint로 차단.

```ts
export const colors = {
  bg: { app: '#08090a', panel: '#0f1011', elevated: '#191a1b' },
  brand: { default: '#5e6ad2', interactive: '#7170ff', hover: '#828fff' },
  text: { primary: '#f7f8f8', secondary: '#d0d6e0', tertiary: '#8a8f98' },
} as const;
```

- 장점: 타입 자동완성, 오탈자 방지, 토큰 변경 시 전체 일괄 반영
- 단점: 초기 셋업 필요

## 2. ESLint 커스텀 규칙

`no-restricted-syntax` 또는 커스텀 플러그인으로 인라인 색상값 사용 금지.

```json
// .eslintrc
"no-restricted-syntax": [
  "error",
  { "selector": "Literal[value=/#[0-9a-fA-F]{3,6}/]", "message": "Use design tokens instead of hardcoded colors." }
]
```

- 장점: 빌드/lint 단계에서 강제 차단
- 단점: 규칙 작성 복잡도, 완벽한 커버리지는 어려움

## 3. Tailwind Config 제약

`tailwind.config.ts`에서 팔레트를 토큰으로만 덮어쓰기 (extend 대신 override).

```ts
theme: {
  colors: designTokens.colors, // 이 외 색상 클래스 없음
}
```

- 장점: 토큰 밖 색상은 클래스 자체가 존재하지 않음 → 컴파일 시 제거
- 단점: Tailwind를 쓸 경우에만 해당

## 4. Storybook + Chromatic

컴포넌트를 Storybook으로 관리하고 Chromatic으로 시각적 회귀 테스트.

- 장점: PR에서 UI 변경 자동 감지, 디자인 리뷰 강제화
- 단점: 셋업/유지 비용 높음, 소규모 팀에는 과할 수 있음

## 추천 조합

| 규모 | 추천 |
|------|------|
| 소규모 / 초기 | 토큰 파일 + Tailwind 제약 |
| 중규모 | 토큰 파일 + ESLint 규칙 + Tailwind 제약 |
| 대규모 / 팀 | 위 전부 + Storybook + Chromatic |

세 가지(토큰 + ESLint + Tailwind) 조합 시 토큰 밖의 값은 **빌드 자체가 불가**.
