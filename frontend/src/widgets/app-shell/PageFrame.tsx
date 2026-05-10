/**
 * PageFrame — AppShell ↔ 페이지 경계 계약 + 레이아웃 프리미티브.
 *
 * 책임:
 * - `<PageFrame>` 은 `<main>` 의 padding-box 를 정확히 채우는 단 하나의 방법
 *   (`absolute inset-0 flex flex-col`). 페이지는 스크롤/슬롯 책임을 main 에
 *   떠넘기지 않는다 → AppShell `<main>` 은 `overflow-hidden` 이 invariant.
 * - 자식 페이지는 프리미티브를 합성해 자기만의 슬롯 구조를 표현한다.
 *
 * 프리미티브:
 * - `PageFrame.Sticky` — `flex-none`. 변형 `variant="toolbar"` 는 toolbar
 *   gutter/gap 토큰을 적용. 헤더/필터 등 in-flow 고정 영역에 사용.
 * - `PageFrame.Scroll` — `flex flex-col flex-1 min-h-0 min-w-0 overflow-auto`.
 *   페이지에서 스크롤이 발생하는 유일한 viewport. `padded` (기본 true) +
 *   `noTopGap` (toolbar 가 위에 있는 경우) 로 토큰 패딩 제어.
 * - `PageFrame.SplitRow` — `flex flex-1 min-h-0 overflow-hidden`. side-panel
 *   같은 가로 분할이 필요한 페이지(VOC) 의 row container.
 * - `PageFrame.SidePanel` — `flex-none`. SplitRow 의 우측 컬럼.
 *
 * 합성 규칙:
 * - `PageFrame` 의 직계 자식은 Sticky/Scroll/SplitRow 중에서만 선택.
 * - Scroll 또는 SplitRow 는 페이지당 1개 (남는 높이 차지).
 * - Toolbar Sticky 직후의 Scroll 은 `noTopGap` 를 켜서 gap 중복을 막는다.
 *
 * 자주 쓰는 합성은 `StickyHeaderLayout` sugar 로 이미 노출되어 있다.
 */
import type { ReactNode } from 'react';

interface PageFrameProps {
  children: ReactNode;
}

interface StickyProps {
  children: ReactNode;
  variant?: 'toolbar';
}

interface ScrollProps {
  children: ReactNode;
  padded?: boolean;
  noTopGap?: boolean;
}

interface SplitRowProps {
  children: ReactNode;
}

interface SidePanelProps {
  children: ReactNode;
  className?: string;
}

function PageFrameRoot({ children }: PageFrameProps) {
  return <div className="absolute inset-0 flex flex-col">{children}</div>;
}

function Sticky({ children, variant }: StickyProps) {
  if (variant === 'toolbar') {
    return (
      <div
        className="flex-none"
        style={{
          paddingLeft: 'var(--page-gutter-x)',
          paddingRight: 'var(--page-gutter-x)',
          paddingTop: 'var(--page-header-gap-bottom)',
          paddingBottom: 'var(--page-toolbar-gap-bottom)',
        }}
      >
        {children}
      </div>
    );
  }
  return <div className="flex-none">{children}</div>;
}

function Scroll({ children, padded = true, noTopGap = false }: ScrollProps) {
  const style = padded
    ? {
        paddingLeft: 'var(--page-gutter-x)',
        paddingRight: 'var(--page-gutter-x)',
        paddingTop: noTopGap ? 0 : 'var(--page-header-gap-bottom)',
        paddingBottom: 'var(--page-header-gap-bottom)',
      }
    : undefined;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto" style={style}>
      {children}
    </div>
  );
}

function SplitRow({ children }: SplitRowProps) {
  return <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>;
}

function SidePanel({ children, className }: SidePanelProps) {
  return <div className={`flex-none ${className ?? ''}`.trim()}>{children}</div>;
}

export const PageFrame = Object.assign(PageFrameRoot, {
  Sticky,
  Scroll,
  SplitRow,
  SidePanel,
});
