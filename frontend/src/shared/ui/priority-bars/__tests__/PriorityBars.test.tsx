import { render, screen } from '@testing-library/react';
import { PriorityBars, type PriorityBarsVariant } from '../PriorityBars';

const VARIANTS: PriorityBarsVariant[] = ['urgent', 'high', 'med', 'low'];

describe('PriorityBars — uidesign.md §16.4', () => {
  it.each(VARIANTS)('renders 14px container for %s', (variant) => {
    render(<PriorityBars variant={variant} />);
    const el = screen.getByTestId(`priority-bars-${variant}`);
    expect(el).toHaveAttribute('data-variant', variant);
    expect(el.style.width).toBe('14px');
    expect(el.style.height).toBe('14px');
  });

  it.each(VARIANTS)('renders exactly 3 bar children for %s', (variant) => {
    render(<PriorityBars variant={variant} />);
    const el = screen.getByTestId(`priority-bars-${variant}`);
    const bars = el.querySelectorAll('i[aria-hidden="true"]');
    expect(bars.length).toBe(3);
  });

  it('exposes aria-label as role=img when provided', () => {
    render(<PriorityBars variant="urgent" ariaLabel="Priority Urgent" />);
    const el = screen.getByTestId('priority-bars-urgent');
    expect(el).toHaveAttribute('role', 'img');
    expect(el).toHaveAttribute('aria-label', 'Priority Urgent');
  });

  it('uses var() colors only — no hex literal in markup', () => {
    render(<PriorityBars variant="med" />);
    const el = screen.getByTestId('priority-bars-med');
    expect(el.outerHTML).not.toMatch(/#[0-9a-f]{3,8}/i);
  });
});
