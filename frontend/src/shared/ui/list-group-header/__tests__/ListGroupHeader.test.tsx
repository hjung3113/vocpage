import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ListGroupHeader } from '../ListGroupHeader';

describe('ListGroupHeader — uidesign.md §16.6', () => {
  it('renders children as label content', () => {
    render(
      <ListGroupHeader collapsed={false} onToggle={() => {}}>
        <span>Group A</span>
      </ListGroupHeader>,
    );
    expect(screen.getByText('Group A')).toBeInTheDocument();
  });

  it('renders count when provided and omits when undefined', () => {
    const { rerender } = render(
      <ListGroupHeader collapsed={false} onToggle={() => {}} count={7}>
        <span>L</span>
      </ListGroupHeader>,
    );
    expect(screen.getByTestId('list-group-header-count')).toHaveTextContent('7');
    rerender(
      <ListGroupHeader collapsed={false} onToggle={() => {}}>
        <span>L</span>
      </ListGroupHeader>,
    );
    expect(screen.queryByTestId('list-group-header-count')).toBeNull();
  });

  it('reflects collapsed state via data-collapsed and aria-expanded', () => {
    const { rerender } = render(
      <ListGroupHeader collapsed={false} onToggle={() => {}}>
        <span>L</span>
      </ListGroupHeader>,
    );
    const btn = screen.getByTestId('list-group-header');
    expect(btn).toHaveAttribute('data-collapsed', 'false');
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    rerender(
      <ListGroupHeader collapsed={true} onToggle={() => {}}>
        <span>L</span>
      </ListGroupHeader>,
    );
    expect(screen.getByTestId('list-group-header')).toHaveAttribute('data-collapsed', 'true');
    expect(screen.getByTestId('list-group-header')).toHaveAttribute('aria-expanded', 'false');
  });

  it('clicking the header invokes onToggle', () => {
    const onToggle = vi.fn();
    render(
      <ListGroupHeader collapsed={false} onToggle={onToggle}>
        <span>L</span>
      </ListGroupHeader>,
    );
    fireEvent.click(screen.getByTestId('list-group-header'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('keyboard Enter and Space trigger onToggle', () => {
    const onToggle = vi.fn();
    render(
      <ListGroupHeader collapsed={true} onToggle={onToggle}>
        <span>L</span>
      </ListGroupHeader>,
    );
    const btn = screen.getByTestId('list-group-header');
    fireEvent.keyDown(btn, { key: 'Enter' });
    fireEvent.keyDown(btn, { key: ' ' });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('honors custom testId and ariaLabel', () => {
    render(
      <ListGroupHeader
        collapsed={false}
        onToggle={() => {}}
        testId="custom-tid"
        ariaLabel="custom label"
      >
        <span>L</span>
      </ListGroupHeader>,
    );
    const btn = screen.getByTestId('custom-tid');
    expect(btn).toHaveAttribute('aria-label', 'custom label');
  });
});
