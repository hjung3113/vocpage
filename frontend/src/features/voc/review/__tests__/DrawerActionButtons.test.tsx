import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TooltipProvider } from '@shared/ui/tooltip';
import { DrawerActionButtons } from '../ui/DrawerActionButtons';

function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

describe('DrawerActionButtons', () => {
  const defaultProps = {
    isFullscreen: false,
    onToggleFullscreen: vi.fn(),
    onCopyLink: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders 3 icon buttons when onDelete is not provided', () => {
    renderWithTooltip(<DrawerActionButtons {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(3);
  });

  it('renders 4 icon buttons when onDelete is provided', () => {
    renderWithTooltip(<DrawerActionButtons {...defaultProps} onDelete={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);
  });

  it('fullscreen button has correct aria-label', () => {
    renderWithTooltip(<DrawerActionButtons {...defaultProps} />);
    expect(screen.getByRole('button', { name: '큰 화면으로 보기' })).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithTooltip(<DrawerActionButtons {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onCopyLink when copy link button clicked', async () => {
    const user = userEvent.setup();
    const onCopyLink = vi.fn();
    renderWithTooltip(<DrawerActionButtons {...defaultProps} onCopyLink={onCopyLink} />);
    await user.click(screen.getByRole('button', { name: '링크 복사' }));
    expect(onCopyLink).toHaveBeenCalledTimes(1);
  });
});
