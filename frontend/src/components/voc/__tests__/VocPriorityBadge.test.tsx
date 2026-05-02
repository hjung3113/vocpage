import { render, screen } from '@testing-library/react';
import { VocPriorityBadge } from '../VocPriorityBadge';
import type { VocPriority } from '../../../../../shared/contracts/voc';

describe('VocPriorityBadge', () => {
  type Case = [VocPriority, string, string, number];
  const cases: Case[] = [
    ['urgent', 'Urgent', 'flame', 700],
    ['high', 'High', 'chevron-up', 600],
    ['medium', 'Medium', 'minus', 400],
    ['low', 'Low', 'chevron-down', 400],
  ];

  it.each(cases)(
    'renders priority=%s with label %s, icon %s, fontWeight %s',
    (priority, label, iconClass, fontWeight) => {
      render(<VocPriorityBadge priority={priority} />);

      const el = screen.getByTestId(`priority-badge-${priority}`);
      expect(el).toBeInTheDocument();
      expect(el).toHaveTextContent(label);
      expect(el).toHaveAttribute('aria-label', `Priority ${label}`);

      // font-weight via inline style
      expect(el.style.fontWeight).toBe(String(fontWeight));

      // icon: lucide renders an svg; check aria-hidden child exists
      const icon = el.querySelector('[aria-hidden="true"]');
      expect(icon).not.toBeNull();

      // icon class contains the lucide icon name
      expect(icon?.getAttribute('class') ?? '').toContain(iconClass);
    },
  );

  it('no hex color in className (lint hard rule)', () => {
    render(<VocPriorityBadge priority="urgent" />);
    const el = screen.getByTestId('priority-badge-urgent');
    expect(el.className).not.toMatch(/#[0-9a-f]/i);
  });
});
