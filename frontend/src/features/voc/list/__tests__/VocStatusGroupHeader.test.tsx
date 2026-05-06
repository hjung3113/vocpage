import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VocStatusGroupHeader } from '../ui/VocStatusGroupHeader';

describe('VocStatusGroupHeader', () => {
  it('renders status label and count', () => {
    render(<VocStatusGroupHeader status="접수" count={12} collapsed={false} onToggle={() => {}} />);
    expect(screen.getByTestId('voc-status-group-header-접수')).toBeInTheDocument();
    expect(screen.getByTestId('voc-status-group-count')).toHaveTextContent('12');
    expect(screen.getByText('접수')).toBeInTheDocument();
  });

  it('renders ChevronDown when expanded and ChevronRight when collapsed', () => {
    const { rerender, container } = render(
      <VocStatusGroupHeader status="접수" count={3} collapsed={false} onToggle={() => {}} />,
    );
    expect(screen.getByTestId('voc-status-group-header-접수').getAttribute('data-collapsed')).toBe(
      'false',
    );
    // svg present
    expect(container.querySelector('svg')).not.toBeNull();
    rerender(<VocStatusGroupHeader status="접수" count={3} collapsed={true} onToggle={() => {}} />);
    expect(screen.getByTestId('voc-status-group-header-접수').getAttribute('data-collapsed')).toBe(
      'true',
    );
  });

  it('aria-expanded mirrors collapsed state', () => {
    const { rerender } = render(
      <VocStatusGroupHeader status="처리중" count={5} collapsed={false} onToggle={() => {}} />,
    );
    expect(screen.getByTestId('voc-status-group-header-처리중')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    rerender(
      <VocStatusGroupHeader status="처리중" count={5} collapsed={true} onToggle={() => {}} />,
    );
    expect(screen.getByTestId('voc-status-group-header-처리중')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('clicking the header invokes onToggle', () => {
    const onToggle = vi.fn();
    render(<VocStatusGroupHeader status="완료" count={1} collapsed={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId('voc-status-group-header-완료'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('keyboard Enter/Space invokes onToggle', () => {
    const onToggle = vi.fn();
    render(<VocStatusGroupHeader status="드랍" count={2} collapsed={true} onToggle={onToggle} />);
    const header = screen.getByTestId('voc-status-group-header-드랍');
    fireEvent.keyDown(header, { key: 'Enter' });
    fireEvent.keyDown(header, { key: ' ' });
    expect(onToggle).toHaveBeenCalledTimes(2);
  });
});
