import { render, screen } from '@testing-library/react';
import { Tag } from 'lucide-react';
import { TextMark } from '../TextMark';

describe('TextMark', () => {
  it('renders span with data-testid text-mark-${variant}', () => {
    render(
      <TextMark
        variant="bug"
        iconMode="icon-only"
        icon={Tag}
        label="버그"
        color="var(--status-red)"
        weight={600}
      />,
    );
    expect(screen.getByTestId('text-mark-bug')).toBeInTheDocument();
  });

  it('icon-only: outer span has aria-label=label, no visible text node', () => {
    render(
      <TextMark
        variant="bug"
        iconMode="icon-only"
        icon={Tag}
        label="버그"
        color="var(--status-red)"
        weight={600}
      />,
    );
    const el = screen.getByTestId('text-mark-bug');
    expect(el).toHaveAttribute('aria-label', '버그');
    // textContent is empty or only whitespace (no visible label text)
    expect(el.textContent?.trim()).toBe('');
  });

  it('icon+text: visible label text and aria-hidden icon', () => {
    render(
      <TextMark
        variant="feat"
        iconMode="icon+text"
        icon={Tag}
        label="기능"
        color="var(--accent)"
        weight={500}
      />,
    );
    const el = screen.getByTestId('text-mark-feat');
    expect(el.textContent).toContain('기능');
    expect(el.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(el).not.toHaveAttribute('aria-label');
  });

  it('inline style contains color and fontWeight', () => {
    render(
      <TextMark
        variant="check"
        iconMode="icon-only"
        icon={Tag}
        label="확인"
        color="var(--text-tertiary)"
        weight={400}
      />,
    );
    const el = screen.getByTestId('text-mark-check');
    expect(el.getAttribute('style')).toContain('var(--text-tertiary)');
    expect(el.getAttribute('style')).toContain('400');
  });

  it('no inline background set', () => {
    render(
      <TextMark
        variant="x"
        iconMode="icon-only"
        icon={Tag}
        label="x"
        color="var(--accent)"
        weight={500}
      />,
    );
    const el = screen.getByTestId('text-mark-x');
    const style = el.getAttribute('style') ?? '';
    expect(style).not.toMatch(/background/i);
  });

  it('extraTestId overrides default testid when provided', () => {
    render(
      <TextMark
        variant="bug"
        iconMode="icon-only"
        icon={Tag}
        label="버그"
        color="var(--status-red)"
        weight={600}
        extraTestId="voc-type-badge-bug"
      />,
    );
    expect(screen.getByTestId('voc-type-badge-bug')).toBeInTheDocument();
  });

  it('structural: span tag, no role, no hex/oklch in inline style', () => {
    render(
      <TextMark
        variant="bug"
        iconMode="icon-only"
        icon={Tag}
        label="버그"
        color="var(--status-red)"
        weight={600}
      />,
    );
    const el = screen.getByTestId('text-mark-bug');
    expect(el.tagName).toBe('SPAN');
    expect(el).not.toHaveAttribute('role');
    const style = el.getAttribute('style') ?? '';
    expect(style).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(style).not.toMatch(/oklch\(/i);
  });

  it('ariaLabelOverride overrides aria-label when provided', () => {
    render(
      <TextMark
        variant="bug"
        iconMode="icon-only"
        icon={Tag}
        label="버그"
        color="var(--status-red)"
        weight={600}
        ariaLabelOverride="유형 버그"
      />,
    );
    const el = screen.getByTestId('text-mark-bug');
    expect(el).toHaveAttribute('aria-label', '유형 버그');
  });
});
