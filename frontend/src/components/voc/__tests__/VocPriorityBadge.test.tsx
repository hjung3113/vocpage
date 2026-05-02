import { render, screen } from '@testing-library/react';
import { VocPriorityBadge } from '../VocPriorityBadge';
import type { VocPriority } from '../../../../../shared/contracts/voc';

describe('VocPriorityBadge', () => {
  type Case = [VocPriority, string, string, string];
  const cases: Case[] = [
    ['urgent', '긴급', 'flame', 'font-bold'],
    ['high', '높음', 'chevron-up', 'font-semibold'],
    ['medium', '보통', 'minus', 'font-normal'],
    ['low', '낮음', 'chevron-down', 'font-normal'],
  ];

  it.each(cases)(
    'renders priority=%s with label %s, icon %s, weight class %s',
    (priority, label, iconClass, weightClass) => {
      render(<VocPriorityBadge priority={priority} />);

      const el = screen.getByTestId(`priority-badge-${priority}`);
      expect(el).toBeInTheDocument();
      expect(el).toHaveClass('priority-badge', `p-${priority}`);
      expect(el).toHaveTextContent(label);
      expect(el).toHaveAttribute('aria-label', `우선순위 ${label}`);

      // font-weight class on the element
      expect(el).toHaveClass(weightClass);

      // icon: lucide renders an svg; check aria-hidden child exists
      const icon = el.querySelector(`[aria-hidden="true"]`);
      expect(icon).not.toBeNull();

      // icon class contains the lucide icon name
      expect(icon?.getAttribute('class') ?? '').toContain(iconClass);
    },
  );

  it('does not leak inline style (lint hard rule)', () => {
    render(<VocPriorityBadge priority="urgent" />);
    const el = screen.getByTestId('priority-badge-urgent');
    expect(el.getAttribute('style')).toBeNull();
  });
});
