import { render, screen } from '@testing-library/react';
import { SolidChip } from '../SolidChip';

const VARIANTS = ['received', 'reviewing', 'processing', 'done', 'drop'] as const;

describe('SolidChip', () => {
  it.each(VARIANTS)('renders solid-chip-%s with correct testid and label', (variant) => {
    render(<SolidChip variant={variant} label={variant} />);
    const el = screen.getByTestId(`solid-chip-${variant}`);
    expect(el).toBeInTheDocument();
    expect(el.textContent).toContain(variant);
  });

  it.each(VARIANTS)('inline style background contains var(--status-%s-bg)', (variant) => {
    render(<SolidChip variant={variant} label={variant} />);
    const el = screen.getByTestId(`solid-chip-${variant}`);
    const style = el.getAttribute('style') ?? '';
    expect(style).toContain(`var(--status-${variant}-bg)`);
  });

  it.each(VARIANTS)('has aria-hidden dot child', (variant) => {
    render(<SolidChip variant={variant} label={variant} />);
    const el = screen.getByTestId(`solid-chip-${variant}`);
    const dot = el.querySelector('[aria-hidden="true"]');
    expect(dot).not.toBeNull();
  });

  it('extraTestId overrides default testid', () => {
    render(
      <SolidChip
        variant="received"
        label="접수"
        extraTestId="status-badge-접수"
        ariaLabelOverride="상태 접수"
      />,
    );
    expect(screen.getByTestId('status-badge-접수')).toBeInTheDocument();
    expect(screen.queryByTestId('solid-chip-received')).toBeNull();
  });

  it('ariaLabelOverride sets aria-label', () => {
    render(<SolidChip variant="done" label="완료" ariaLabelOverride="상태 완료" />);
    const el = screen.getByTestId('solid-chip-done');
    expect(el).toHaveAttribute('aria-label', '상태 완료');
  });

  it.each(VARIANTS)('structural: span, no role, no hex/oklch in inline style (%s)', (variant) => {
    render(<SolidChip variant={variant} label={variant} />);
    const el = screen.getByTestId(`solid-chip-${variant}`);
    expect(el.tagName).toBe('SPAN');
    expect(el).not.toHaveAttribute('role');
    const style = el.getAttribute('style') ?? '';
    expect(style).not.toMatch(/#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/);
    expect(style).not.toMatch(/oklch\(/i);
    expect(el).toHaveAttribute('style');
    expect(style).toContain(`var(--status-${variant}`);
  });
});
