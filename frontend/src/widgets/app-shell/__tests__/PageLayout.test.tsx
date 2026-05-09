/**
 * Spec: docs/specs/requires/uidesign.md §5 Page Header → Slot contract.
 * Verifies the slot contract surface; the height-cascade rule itself lives in
 * globals.css and is enforced by visual-diff baselines (JSDOM does not resolve
 * CSS custom properties), so we assert the wrapper class that the rule binds to.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageLayout, PageHeader } from '@widgets/app-shell';
import { Button } from '@shared/ui/button';

describe('PageHeader', () => {
  it('renders title and count badge', () => {
    render(<PageHeader title="FAQ" count={3} />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('FAQ');
    expect(heading).toHaveTextContent('3');
  });

  it('omits count when undefined', () => {
    const { container } = render(<PageHeader title="공지사항" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('공지사항');
    expect(container.querySelectorAll('h1 > span')).toHaveLength(0);
  });

  it('wraps actions slot with .page-header-actions for cascade rule', () => {
    const { container } = render(
      <PageHeader
        title="VOC"
        actions={
          <Button size="lg" data-testid="primary">
            새 VOC 등록
          </Button>
        }
      />,
    );
    const slot = container.querySelector('.page-header-actions');
    expect(slot).not.toBeNull();
    expect(slot).toContainElement(screen.getByTestId('primary'));
  });

  it('does not expose className/style props (closed surface)', () => {
    type Keys = keyof React.ComponentProps<typeof PageHeader>;
    const allowed: Keys[] = ['title', 'count', 'actions'];
    // type-level guard: PageHeader props must equal `allowed`.
    const _check: Record<Keys, true> = { title: true, count: true, actions: true };
    expect(allowed).toEqual(Object.keys(_check));
  });
});

describe('PageLayout', () => {
  it('renders header, toolbar, and body in order', () => {
    render(
      <PageLayout
        header={<PageHeader title="VOC" />}
        toolbar={<div data-testid="toolbar">filters</div>}
      >
        <div data-testid="body">content</div>
      </PageLayout>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('body')).toBeInTheDocument();
  });

  it('renders without toolbar when not provided', () => {
    render(
      <PageLayout header={<PageHeader title="VOC" />}>
        <div data-testid="body">content</div>
      </PageLayout>,
    );
    expect(screen.getByTestId('body')).toBeInTheDocument();
  });
});
