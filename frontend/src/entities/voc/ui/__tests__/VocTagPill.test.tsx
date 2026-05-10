import { render, screen } from '@testing-library/react';
import { VocTagPill, hashTagColor } from '../VocTagPill';

const PALETTE = [
  'var(--chart-blue)',
  'var(--chart-sky)',
  'var(--chart-teal)',
  'var(--chart-indigo)',
];

function dotBackground(container: HTMLElement): string {
  const dot = container.querySelector('.lc-dot') as HTMLElement | null;
  return dot?.style.background ?? '';
}

describe('VocTagPill', () => {
  it('renders with given name', () => {
    render(<VocTagPill name="UX" />);
    expect(screen.getByText('UX')).toBeInTheDocument();
  });

  it('has stable data-testid="voc-tag-pill" with name in data-tag-name', () => {
    render(<VocTagPill name="UX bug" />);
    const pill = screen.getByTestId('voc-tag-pill');
    expect(pill).toHaveAttribute('data-tag-name', 'UX bug');
  });

  it('delegates to OutlineChip in dot-pill variant (no # glyph)', () => {
    render(<VocTagPill name="UX" />);
    const chip = screen.getByTestId('outline-chip');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveAttribute('data-variant', 'dot-pill');
    // No '#' prefix anymore — the dot replaces the hash glyph.
    expect(chip.textContent).toBe('UX');
  });

  it('renders a dot child element (aria-hidden) preceding the label', () => {
    render(<VocTagPill name="UX" />);
    const chip = screen.getByTestId('outline-chip');
    const dot = chip.querySelector('.lc-dot');
    expect(dot).not.toBeNull();
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes accessible label "태그 {name}" on the wrapping pill', () => {
    render(<VocTagPill name="UX" />);
    expect(screen.getByTestId('voc-tag-pill')).toHaveAttribute('aria-label', '태그 UX');
  });

  describe('hashTagColor (deterministic palette)', () => {
    it('returns one of the cool-tone palette tokens for a non-empty name', () => {
      const color = hashTagColor('UX');
      expect(PALETTE).toContain(color);
    });

    it('is deterministic — same name always maps to the same color', () => {
      const a = hashTagColor('performance');
      const b = hashTagColor('performance');
      expect(a).toBe(b);
    });

    it('renders the dot with the hashed color (deterministic across renders)', () => {
      const { unmount } = render(<VocTagPill name="performance" />);
      const first = dotBackground(screen.getByTestId('outline-chip'));
      unmount();
      render(<VocTagPill name="performance" />);
      const second = dotBackground(screen.getByTestId('outline-chip'));
      expect(first).toBe(second);
      expect(PALETTE).toContain(first);
    });

    it('falls back to var(--text-quaternary) for empty name', () => {
      expect(hashTagColor('')).toBe('var(--text-quaternary)');
    });

    it('distributes across multiple palette colors for varied names', () => {
      const names = ['UX', 'performance', 'bug', 'feature', 'design', 'api', 'auth', 'mobile'];
      const colors = new Set(names.map(hashTagColor));
      // Expect at least 2 distinct palette entries — guards against a
      // degenerate hash that collapses everything to one bucket.
      expect(colors.size).toBeGreaterThanOrEqual(2);
      colors.forEach((c) => expect(PALETTE).toContain(c));
    });
  });
});
