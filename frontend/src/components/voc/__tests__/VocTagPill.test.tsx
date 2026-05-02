import { render, screen } from '@testing-library/react';
import { VocTagPill } from '../VocTagPill';

describe('VocTagPill', () => {
  it('renders with given name', () => {
    render(<VocTagPill name="UX" />);
    expect(screen.getByText('UX')).toBeInTheDocument();
  });

  it('renders # glyph (aria-hidden) preceding the label', () => {
    render(<VocTagPill name="UX" />);
    const hash = screen.getByText('#');
    expect(hash).toHaveAttribute('aria-hidden', 'true');
  });

  it('has data-testid="voc-tag-pill-{name}"', () => {
    render(<VocTagPill name="UX" />);
    expect(screen.getByTestId('voc-tag-pill-UX')).toBeInTheDocument();
  });

  it('has aria-label "태그 {name}"', () => {
    render(<VocTagPill name="UX" />);
    expect(screen.getByTestId('voc-tag-pill-UX')).toHaveAttribute('aria-label', '태그 UX');
  });

  it('internally renders an OutlineChip (data-testid="outline-chip" in DOM)', () => {
    render(<VocTagPill name="UX" />);
    expect(screen.getByTestId('outline-chip')).toBeInTheDocument();
  });
});
