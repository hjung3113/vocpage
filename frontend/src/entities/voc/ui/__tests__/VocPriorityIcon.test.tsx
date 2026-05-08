import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VocPriorityIcon } from '../VocPriorityIcon';

describe('VocPriorityIcon — prototype `.p-icon` 3-bar 14px', () => {
  it('renders 14×14 container with 3 bars', () => {
    render(<VocPriorityIcon priority="high" />);
    const el = screen.getByTestId('priority-icon-high');
    expect(el.style.width).toBe('14px');
    expect(el.style.height).toBe('14px');
    expect(el.children.length).toBe(3);
  });

  it('urgent fills all bars with status-red', () => {
    const { container } = render(<VocPriorityIcon priority="urgent" />);
    const bars = container.querySelectorAll('span > span');
    bars.forEach((b) => expect((b as HTMLElement).style.background).toBe('var(--status-red)'));
  });

  it('high fills all bars with status-orange', () => {
    const { container } = render(<VocPriorityIcon priority="high" />);
    const bars = container.querySelectorAll('span > span');
    bars.forEach((b) => expect((b as HTMLElement).style.background).toBe('var(--status-orange)'));
  });

  it('medium fills 2 bars with text-secondary, 3rd off', () => {
    const { container } = render(<VocPriorityIcon priority="medium" />);
    const bars = container.querySelectorAll('span > span');
    expect((bars[0] as HTMLElement).style.background).toBe('var(--text-secondary)');
    expect((bars[1] as HTMLElement).style.background).toBe('var(--text-secondary)');
    expect((bars[2] as HTMLElement).style.background).toBe('var(--text-quaternary)');
  });

  it('low fills 1 bar', () => {
    const { container } = render(<VocPriorityIcon priority="low" />);
    const bars = container.querySelectorAll('span > span');
    expect((bars[0] as HTMLElement).style.background).toBe('var(--text-secondary)');
    expect((bars[1] as HTMLElement).style.background).toBe('var(--text-quaternary)');
  });

  it('has aria-label for accessibility', () => {
    render(<VocPriorityIcon priority="urgent" />);
    expect(screen.getByLabelText('우선순위 urgent')).toBeInTheDocument();
  });
});
