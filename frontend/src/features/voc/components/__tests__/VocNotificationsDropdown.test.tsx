import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VocNotificationsDropdown } from '../VocNotificationsDropdown';

const items = [
  { id: 'n1', label: '새 VOC 등록됨', href: '/voc/1', createdAt: '2026-05-01T10:00:00Z' },
  { id: 'n2', label: '댓글이 달렸습니다', createdAt: '2026-05-02T10:00:00Z' },
];

describe('VocNotificationsDropdown', () => {
  it('renders NotificationBell trigger button with aria-label "알림"', () => {
    render(
      <VocNotificationsDropdown
        items={items}
        unreadCount={2}
        onMarkAllRead={vi.fn()}
        onItemClick={vi.fn()}
      />,
    );
    const btn = screen.getByRole('button', { name: /알림/ });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', '알림');
  });

  it('shows empty message when items is empty', async () => {
    const user = userEvent.setup();
    render(
      <VocNotificationsDropdown
        items={[]}
        unreadCount={0}
        onMarkAllRead={vi.fn()}
        onItemClick={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /알림/ }));
    expect(await screen.findByText('알림이 없습니다')).toBeInTheDocument();
  });

  it('calls onItemClick with item id when item is clicked', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();
    render(
      <VocNotificationsDropdown
        items={items}
        unreadCount={2}
        onMarkAllRead={vi.fn()}
        onItemClick={onItemClick}
      />,
    );
    await user.click(screen.getByRole('button', { name: /알림/ }));
    await user.click(await screen.findByRole('menuitem', { name: /새 VOC 등록됨/ }));
    expect(onItemClick).toHaveBeenCalledWith('n1');
  });

  it('calls onMarkAllRead when "모두 읽음" is clicked', async () => {
    const user = userEvent.setup();
    const onMarkAllRead = vi.fn();
    render(
      <VocNotificationsDropdown
        items={items}
        unreadCount={2}
        onMarkAllRead={onMarkAllRead}
        onItemClick={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /알림/ }));
    await user.click(await screen.findByRole('menuitem', { name: /모두 읽음/ }));
    expect(onMarkAllRead).toHaveBeenCalled();
  });
});
