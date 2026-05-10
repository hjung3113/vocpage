import { render, screen } from '@testing-library/react';
import { VocTagPill } from '../VocTagPill';

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
});
