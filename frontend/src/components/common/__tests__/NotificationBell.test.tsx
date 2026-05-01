import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NotificationBell } from '../NotificationBell';

const items = [
  {
    id: 'n1',
    type: 'assigned' as const,
    label: '새 VOC',
    href: '/voc/1',
    createdAt: '2026-05-01T10:00:00Z',
    read: false,
  },
  {
    id: 'n2',
    type: 'comment' as const,
    label: '댓글 달림',
    createdAt: '2026-05-01T11:00:00Z',
    read: false,
  },
];

describe('NotificationBell', () => {
  it('renders trigger button with aria-label "알림"', () => {
    render(<NotificationBell unreadCount={0} items={[]} />);
    const btn = screen.getByRole('button', { name: /알림/ });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-label', '알림');
  });

  it('shows unread badge when unreadCount > 0', () => {
    render(<NotificationBell unreadCount={3} items={items} />);
    expect(screen.getByLabelText(/읽지 않은 알림/)).toBeVisible();
  });

  it('opens menu with items on click', async () => {
    const user = userEvent.setup();
    render(<NotificationBell unreadCount={2} items={items} />);
    await user.click(screen.getByRole('button', { name: /알림/ }));
    const menu = await screen.findByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getByText('새 VOC')).toBeInTheDocument();
    expect(screen.getByText('댓글 달림')).toBeInTheDocument();
  });

  it('calls onMarkAllRead when "모두 읽음" clicked', async () => {
    const user = userEvent.setup();
    const onMarkAllRead = vi.fn();
    render(<NotificationBell unreadCount={2} items={items} onMarkAllRead={onMarkAllRead} />);
    await user.click(screen.getByRole('button', { name: /알림/ }));
    await user.click(await screen.findByRole('menuitem', { name: /모두 읽음/ }));
    expect(onMarkAllRead).toHaveBeenCalled();
  });

  it('shows empty message when no items and no unread', async () => {
    const user = userEvent.setup();
    render(<NotificationBell unreadCount={0} items={[]} />);
    await user.click(screen.getByRole('button', { name: /알림/ }));
    expect(await screen.findByText('알림이 없습니다')).toBeInTheDocument();
  });
});
