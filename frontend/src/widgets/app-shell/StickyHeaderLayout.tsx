/**
 * StickyHeaderLayout — "헤더(+optional toolbar) 고정 + body 단일 스크롤"
 * 페이지 90% 에 적용되는 sugar. 내부적으로 PageFrame 프리미티브 합성.
 *
 * VOC 처럼 슬롯 모델이 다른 페이지는 이 sugar 를 쓰지 말고 PageFrame
 * 프리미티브를 직접 합성한다.
 */
import type { ReactNode } from 'react';
import { PageFrame } from './PageFrame';

interface StickyHeaderLayoutProps {
  header: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}

export function StickyHeaderLayout({ header, toolbar, children }: StickyHeaderLayoutProps) {
  return (
    <PageFrame>
      <PageFrame.Sticky>{header}</PageFrame.Sticky>
      {toolbar ? <PageFrame.Sticky variant="toolbar">{toolbar}</PageFrame.Sticky> : null}
      <PageFrame.Scroll noTopGap={!!toolbar}>{children}</PageFrame.Scroll>
    </PageFrame>
  );
}
