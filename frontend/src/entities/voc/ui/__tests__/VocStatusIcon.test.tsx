import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VocStatusIcon } from '../VocStatusIcon';

describe('VocStatusIcon — prototype `.s-icon` 14px circle', () => {
  it('renders 14×14 circle for received (todo)', () => {
    render(<VocStatusIcon status="접수" />);
    const el = screen.getByTestId('status-icon-접수');
    expect(el.style.width).toBe('14px');
    expect(el.style.height).toBe('14px');
    expect(el.style.borderRadius).toBe('50%');
    expect(el.style.border).toContain('1.5px');
  });

  it('done renders solid fill + checkmark', () => {
    render(<VocStatusIcon status="완료" />);
    const el = screen.getByTestId('status-icon-완료');
    expect(el.textContent).toBe('✓');
    expect(el.style.background).toBe('var(--chart-emerald)');
  });

  it('drop renders solid fill + ×', () => {
    render(<VocStatusIcon status="드랍" />);
    const el = screen.getByTestId('status-icon-드랍');
    expect(el.textContent).toBe('×');
  });

  it('reviewing uses conic-gradient', () => {
    render(<VocStatusIcon status="검토중" />);
    const el = screen.getByTestId('status-icon-검토중');
    expect(el.style.background).toContain('conic-gradient');
  });

  it('has aria-label for accessibility', () => {
    render(<VocStatusIcon status="처리중" />);
    expect(screen.getByLabelText('상태 처리중')).toBeInTheDocument();
  });
});
