import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PageFrame } from '../PageFrame';

describe('PageFrame primitives', () => {
  it('root fills parent absolutely with flex column', () => {
    const { container } = render(
      <PageFrame>
        <div data-testid="child" />
      </PageFrame>,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('absolute');
    expect(root.className).toContain('inset-0');
    expect(root.className).toContain('flex-col');
  });

  it('Sticky default has flex-none, no padding', () => {
    const { getByText } = render(
      <PageFrame>
        <PageFrame.Sticky>HEADER</PageFrame.Sticky>
      </PageFrame>,
    );
    const el = getByText('HEADER') as HTMLElement;
    expect(el.className).toContain('flex-none');
    expect(el.style.paddingLeft).toBe('');
  });

  it('Sticky variant=toolbar applies toolbar gutter/gap tokens', () => {
    const { getByText } = render(
      <PageFrame>
        <PageFrame.Sticky variant="toolbar">TOOLBAR</PageFrame.Sticky>
      </PageFrame>,
    );
    const el = getByText('TOOLBAR') as HTMLElement;
    expect(el.className).toContain('flex-none');
    expect(el.style.paddingLeft).toBe('var(--page-gutter-x)');
    expect(el.style.paddingTop).toBe('var(--page-header-gap-bottom)');
    expect(el.style.paddingBottom).toBe('var(--page-toolbar-gap-bottom)');
  });

  it('Scroll is the only viewport: flex-1, min-h-0, overflow-auto, plain block (no flex)', () => {
    const { getByText } = render(
      <PageFrame>
        <PageFrame.Scroll>BODY</PageFrame.Scroll>
      </PageFrame>,
    );
    const el = getByText('BODY') as HTMLElement;
    expect(el.className).toContain('flex-1');
    expect(el.className).toContain('min-h-0');
    expect(el.className).toContain('min-w-0');
    expect(el.className).toContain('overflow-auto');
    // Scroll must be plain block — flex children would shrink and prevent overflow.
    expect(el.className).not.toMatch(/(?:^|\s)flex(?:\s|$)/);
    expect(el.className).not.toContain('flex-col');
  });

  it('Scroll padded=true (default) applies body padding tokens', () => {
    const { getByText } = render(
      <PageFrame>
        <PageFrame.Scroll>BODY</PageFrame.Scroll>
      </PageFrame>,
    );
    const el = getByText('BODY') as HTMLElement;
    expect(el.style.paddingTop).toBe('var(--page-header-gap-bottom)');
    expect(el.style.paddingBottom).toBe('var(--page-header-gap-bottom)');
  });

  it('Scroll noTopGap removes top padding (toolbar above provides gap)', () => {
    const { getByText } = render(
      <PageFrame>
        <PageFrame.Scroll noTopGap>BODY</PageFrame.Scroll>
      </PageFrame>,
    );
    const el = getByText('BODY') as HTMLElement;
    expect(el.style.paddingTop).toBe('0px');
  });

  it('Scroll padded=false renders with no inline padding', () => {
    const { getByText } = render(
      <PageFrame>
        <PageFrame.Scroll padded={false}>BODY</PageFrame.Scroll>
      </PageFrame>,
    );
    const el = getByText('BODY') as HTMLElement;
    expect(el.style.paddingLeft).toBe('');
    expect(el.style.paddingTop).toBe('');
  });

  it('SplitRow is row flex container with overflow-hidden', () => {
    const { getByText } = render(
      <PageFrame>
        <PageFrame.SplitRow>ROW</PageFrame.SplitRow>
      </PageFrame>,
    );
    const el = getByText('ROW') as HTMLElement;
    expect(el.className).toContain('flex-1');
    expect(el.className).toContain('overflow-hidden');
    expect(el.className).not.toContain('flex-col');
  });

  it('SidePanel is flex-none', () => {
    const { getByText } = render(
      <PageFrame>
        <PageFrame.SplitRow>
          <PageFrame.SidePanel>PANEL</PageFrame.SidePanel>
        </PageFrame.SplitRow>
      </PageFrame>,
    );
    const el = getByText('PANEL') as HTMLElement;
    expect(el.className).toContain('flex-none');
  });
});
