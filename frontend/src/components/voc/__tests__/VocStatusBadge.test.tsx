import { render, screen } from '@testing-library/react';
import { VocStatusBadge } from '../VocStatusBadge';
import type { VocStatus } from '../../../../../shared/contracts/voc';

describe('VocStatusBadge', () => {
  const cases: Array<[VocStatus, string]> = [
    ['접수', 'received'],
    ['검토중', 'reviewing'],
    ['처리중', 'processing'],
    ['완료', 'done'],
    ['드랍', 'drop'],
  ];

  it.each(cases)(
    'renders %s with class s-%s, Korean label text, status-dot child, and aria-label',
    (status, slug) => {
      render(<VocStatusBadge status={status} />);
      const el = screen.getByTestId(`status-badge-${status}`);
      expect(el).toBeInTheDocument();
      expect(el).toHaveClass('status-badge', `s-${slug}`);
      expect(el).toHaveTextContent(status);
      expect(el.querySelector('.status-dot')).not.toBeNull();
      expect(el).toHaveAttribute('aria-label', `상태 ${status}`);
    },
  );

  it('does not leak inline color/background style (lint hard rule)', () => {
    render(<VocStatusBadge status="접수" />);
    const el = screen.getByTestId('status-badge-접수');
    expect(el.getAttribute('style')).toBeNull();
  });
});
