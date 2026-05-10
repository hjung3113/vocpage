import { render, screen } from '@testing-library/react';
import { VocPriorityBadge } from '../VocPriorityBadge';
import type { VocPriority } from '@contracts/voc';

describe('VocPriorityBadge', () => {
  type Case = [VocPriority, string, string, number];
  // [priority, label, bars-variant, fontWeight]
  const cases: Case[] = [
    ['urgent', 'Urgent', 'urgent', 700],
    ['high', 'High', 'high', 400],
    ['medium', 'Medium', 'med', 400],
    ['low', 'Low', 'low', 400],
  ];

  it.each(cases)(
    'renders priority=%s with label %s, bars %s, fontWeight %s',
    (priority, label, barsVariant, fontWeight) => {
      render(<VocPriorityBadge priority={priority} />);

      const el = screen.getByTestId(`priority-badge-${priority}`);
      expect(el).toBeInTheDocument();
      expect(el).toHaveTextContent(label);
      expect(el).toHaveAttribute('aria-label', `Priority ${label}`);

      // font-weight via inline style
      expect(el.style.fontWeight).toBe(String(fontWeight));

      // PriorityBars glyph child rendered with matching variant
      const bars = el.querySelector(`[data-testid="priority-bars-${barsVariant}"]`);
      expect(bars).not.toBeNull();
      expect(bars?.getAttribute('data-variant')).toBe(barsVariant);

      // exactly 3 bar children inside the glyph
      const segments = bars?.querySelectorAll('i[aria-hidden="true"]');
      expect(segments?.length).toBe(3);
    },
  );

  it('iconOnly mode renders glyph without label text', () => {
    render(<VocPriorityBadge priority="urgent" iconOnly />);
    const el = screen.getByTestId('priority-badge-urgent');
    expect(el.textContent ?? '').not.toContain('Urgent');
    expect(el.querySelector('[data-testid="priority-bars-urgent"]')).not.toBeNull();
  });

  it('no hex color literal in markup (lint hard rule)', () => {
    render(<VocPriorityBadge priority="urgent" />);
    const el = screen.getByTestId('priority-badge-urgent');
    expect(el.outerHTML).not.toMatch(/#[0-9a-f]{3,8}/i);
  });
});
