import { render, screen } from '@testing-library/react';
import { VocTagPill } from '../VocTagPill';

describe('VocTagPill', () => {
  it('renders with given name', () => {
    render(<VocTagPill name="UX" />);
    expect(screen.getByText('UX')).toBeInTheDocument();
  });

  it('renders # glyph (aria-hidden) preceding the label in document order', () => {
    render(<VocTagPill name="UX" />);
    const hash = screen.getByText('#');
    expect(hash).toHaveAttribute('aria-hidden', 'true');
    const pill = screen.getByTestId('voc-tag-pill');
    expect(pill).toHaveTextContent(/^#UX$/);
  });

  it('has stable data-testid="voc-tag-pill" with name in data-tag-name', () => {
    render(<VocTagPill name="UX bug" />);
    const pill = screen.getByTestId('voc-tag-pill');
    expect(pill).toHaveAttribute('data-tag-name', 'UX bug');
  });

  it('delegates to TextMark primitive (not OutlineChip)', () => {
    render(<VocTagPill name="UX" />);
    expect(screen.getByTestId('text-mark-tag')).toBeInTheDocument();
    expect(screen.queryByTestId('outline-chip')).not.toBeInTheDocument();
  });

  it('TextMark child has aria-label "태그 {name}" (override)', () => {
    render(<VocTagPill name="UX" />);
    expect(screen.getByTestId('text-mark-tag')).toHaveAttribute('aria-label', '태그 UX');
  });
});
