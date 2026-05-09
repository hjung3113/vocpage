import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavItemCountBadge } from '../NavItemCountBadge';

describe('NavItemCountBadge', () => {
  it('renders nothing when count is 0 and not urgent', () => {
    const { container } = render(<NavItemCountBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders count', () => {
    render(<NavItemCountBadge count={3} testId="x" />);
    expect(screen.getByTestId('x-count')).toHaveTextContent('3');
  });

  it('caps display at 99+', () => {
    render(<NavItemCountBadge count={150} testId="x" />);
    expect(screen.getByTestId('x-count')).toHaveTextContent('99+');
  });

  it('renders Urgent dot when urgent=true even at count=0', () => {
    render(<NavItemCountBadge count={0} urgent testId="x" />);
    expect(screen.getByTestId('x-urgent')).toHaveTextContent('!');
    expect(screen.queryByTestId('x-count')).toBeNull();
  });

  it('renders both Urgent and count', () => {
    render(<NavItemCountBadge count={4} urgent testId="x" />);
    expect(screen.getByTestId('x-urgent')).toBeInTheDocument();
    expect(screen.getByTestId('x-count')).toHaveTextContent('4');
  });

  it('exposes aria-label for screen readers', () => {
    render(<NavItemCountBadge count={2} urgent />);
    expect(screen.getByLabelText('2 미읽음')).toBeInTheDocument();
    expect(screen.getByLabelText('긴급')).toBeInTheDocument();
  });
});
