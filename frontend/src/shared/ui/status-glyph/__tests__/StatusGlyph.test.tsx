import { render, screen } from '@testing-library/react';
import { StatusGlyph, type StatusGlyphVariant } from '../StatusGlyph';

const VARIANTS: StatusGlyphVariant[] = [
  'backlog',
  'todo',
  'progress',
  'review',
  'done',
  'canceled',
];

describe('StatusGlyph — uidesign.md §16.3', () => {
  it.each(VARIANTS)('renders 14px ring for %s', (variant) => {
    render(<StatusGlyph variant={variant} />);
    const el = screen.getByTestId(`status-glyph-${variant}`);
    expect(el).toHaveAttribute('data-variant', variant);
    expect(el.style.width).toBe('14px');
    expect(el.style.height).toBe('14px');
    expect(el.style.borderRadius).toBe('50%');
  });

  it('done variant renders a check mark child', () => {
    render(<StatusGlyph variant="done" />);
    const el = screen.getByTestId('status-glyph-done');
    expect(el.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('canceled variant renders × glyph', () => {
    render(<StatusGlyph variant="canceled" />);
    const el = screen.getByTestId('status-glyph-canceled');
    expect(el.textContent).toContain('×');
  });

  it('exposes aria-label when provided', () => {
    render(<StatusGlyph variant="progress" ariaLabel="진행 중" />);
    const el = screen.getByTestId('status-glyph-progress');
    expect(el).toHaveAttribute('role', 'img');
    expect(el).toHaveAttribute('aria-label', '진행 중');
  });
});
