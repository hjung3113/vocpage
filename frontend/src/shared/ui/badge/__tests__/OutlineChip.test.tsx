import { render, screen } from '@testing-library/react';
import { Hash } from 'lucide-react';
import { OutlineChip } from '../OutlineChip';

describe('OutlineChip', () => {
  it('renders span with data-testid="outline-chip" and visible label', () => {
    render(<OutlineChip label="태그" />);
    const el = screen.getByTestId('outline-chip');
    expect(el).toBeInTheDocument();
    expect(el.textContent).toContain('태그');
  });

  it('icon="#" renders # text glyph, no svg', () => {
    render(<OutlineChip label="번호" icon="#" />);
    const el = screen.getByTestId('outline-chip');
    expect(el.innerHTML).toContain('#');
    expect(el.querySelector('svg')).toBeNull();
  });

  it('icon=Hash (lucide) renders svg with aria-hidden', () => {
    render(<OutlineChip label="해시" icon={Hash} />);
    const el = screen.getByTestId('outline-chip');
    const svg = el.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('no icon renders only label text', () => {
    render(<OutlineChip label="라벨만" />);
    const el = screen.getByTestId('outline-chip');
    expect(el.querySelector('svg')).toBeNull();
    expect(el.textContent).toBe('라벨만');
  });
});
