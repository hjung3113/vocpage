import { render, screen } from '@testing-library/react';
import { VocStatusBadge } from '../VocStatusBadge';
import type { VocStatus } from '../../../../../shared/contracts/voc';

describe('VocStatusBadge', () => {
  const cases: VocStatus[] = ['접수', '검토중', '처리중', '완료', '드랍'];

  it.each(cases)(
    'renders %s with correct testid, Korean label text, dot child, and aria-label',
    (status) => {
      render(<VocStatusBadge status={status} />);
      const el = screen.getByTestId(`status-badge-${status}`);
      expect(el).toBeInTheDocument();
      expect(el).toHaveTextContent(status);
      expect(el.querySelector('[aria-hidden="true"]')).not.toBeNull();
      expect(el).toHaveAttribute('aria-label', `상태 ${status}`);
    },
  );

  it('no hex color in className (lint hard rule)', () => {
    render(<VocStatusBadge status="접수" />);
    const el = screen.getByTestId('status-badge-접수');
    expect(el.className).not.toMatch(/#[0-9a-f]/i);
  });
});
