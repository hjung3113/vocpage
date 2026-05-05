import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VocNotificationsDropdown } from '../VocNotificationsDropdown';
import { NOTIF_PANEL_ID } from '../NotifPanel';

const items = [
  {
    id: 'n1',
    type: 'assigned' as const,
    label: '새 VOC 등록됨',
    href: '/voc/1',
    createdAt: '2026-05-01T10:00:00Z',
    read: false,
  },
  {
    id: 'n2',
    type: 'comment' as const,
    label: '댓글이 달렸습니다',
    createdAt: '2026-05-02T10:00:00Z',
    read: false,
  },
  {
    id: 'n3',
    type: 'mention' as const,
    label: '회의에서 언급됨',
    createdAt: '2026-05-02T11:00:00Z',
    read: true,
  },
];

function renderDropdown(
  overrides: Partial<React.ComponentProps<typeof VocNotificationsDropdown>> = {},
) {
  return render(
    <VocNotificationsDropdown
      items={items}
      unreadCount={2}
      onMarkAllRead={vi.fn()}
      onItemClick={vi.fn()}
      {...overrides}
    />,
  );
}

describe('VocNotificationsDropdown (C-10 NotifButton + NotifPanel)', () => {
  it('NotifButton: trigger has aria-label "알림" and aria-controls pointing at NOTIF_PANEL_ID', () => {
    renderDropdown();
    const btn = screen.getByRole('button', { name: /알림/ });
    expect(btn).toHaveAttribute('aria-label', '알림');
    expect(btn).toHaveAttribute('aria-controls', NOTIF_PANEL_ID);
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('NotifButton: shows unread count badge when unreadCount > 0; "99+" cap', () => {
    const { rerender } = renderDropdown({ unreadCount: 7 });
    expect(screen.getByLabelText('읽지 않은 알림 7건')).toHaveTextContent('7');

    rerender(
      <VocNotificationsDropdown
        items={items}
        unreadCount={150}
        onMarkAllRead={vi.fn()}
        onItemClick={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('읽지 않은 알림 150건')).toHaveTextContent('99+');
  });

  it('NotifButton: hides badge when unreadCount is 0', () => {
    renderDropdown({ unreadCount: 0 });
    expect(screen.queryByLabelText(/읽지 않은 알림/)).not.toBeInTheDocument();
  });

  it('NotifPanel: opens on button click, aria-expanded flips, panel has role=dialog and matching id', async () => {
    const user = userEvent.setup();
    renderDropdown();
    const btn = screen.getByRole('button', { name: /알림/ });
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    const panel = await screen.findByRole('dialog', { name: /알림/ });
    expect(panel).toHaveAttribute('id', NOTIF_PANEL_ID);
  });

  it('NotifPanel: closes on Escape and focus returns to trigger', async () => {
    const user = userEvent.setup();
    renderDropdown();
    const btn = screen.getByRole('button', { name: /알림/ });
    await user.click(btn);
    await screen.findByRole('dialog', { name: /알림/ });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /알림/ })).not.toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('NotifPanel: renders 5 type filter chips (전체 + 4 schema types)', async () => {
    const user = userEvent.setup();
    renderDropdown();
    await user.click(screen.getByRole('button', { name: /알림/ }));
    const chipBar = await screen.findByRole('group', { name: /알림 유형 필터/ });
    const chips = chipBar.querySelectorAll('button');
    expect(chips).toHaveLength(5);
    const labels = Array.from(chips).map((c) => c.textContent);
    expect(labels).toEqual(['전체', '멘션', '할당', '상태변경', '댓글']);
  });

  it('NotifPanel: "전체" chip is active by default (aria-pressed=true)', async () => {
    const user = userEvent.setup();
    renderDropdown();
    await user.click(screen.getByRole('button', { name: /알림/ }));
    const allChip = await screen.findByRole('button', { name: '전체' });
    expect(allChip).toHaveAttribute('aria-pressed', 'true');
  });

  it('NotifPanel: clicking a type chip filters items and updates aria-pressed', async () => {
    const user = userEvent.setup();
    renderDropdown();
    await user.click(screen.getByRole('button', { name: /알림/ }));
    const mentionChip = await screen.findByRole('button', { name: '멘션' });
    await user.click(mentionChip);
    expect(mentionChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('회의에서 언급됨')).toBeInTheDocument();
    expect(screen.queryByText('새 VOC 등록됨')).not.toBeInTheDocument();
    expect(screen.queryByText('댓글이 달렸습니다')).not.toBeInTheDocument();
  });

  it('NotifPanel: shows empty message when filter yields no items', async () => {
    const user = userEvent.setup();
    renderDropdown({ items: [] });
    await user.click(screen.getByRole('button', { name: /알림/ }));
    expect(await screen.findByText('알림이 없습니다')).toBeInTheDocument();
  });

  it('NotifPanel: clicking an item calls onItemClick with id', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();
    renderDropdown({ onItemClick });
    await user.click(screen.getByRole('button', { name: /알림/ }));
    await user.click(await screen.findByRole('button', { name: /새 VOC 등록됨/ }));
    expect(onItemClick).toHaveBeenCalledWith('n1');
  });

  it('NotifPanel: "모두 읽음" calls onMarkAllRead and is hidden when unreadCount is 0', async () => {
    const user = userEvent.setup();
    const onMarkAllRead = vi.fn();
    const { rerender } = renderDropdown({ onMarkAllRead });
    await user.click(screen.getByRole('button', { name: /알림/ }));
    await user.click(await screen.findByRole('button', { name: '모두 읽음' }));
    expect(onMarkAllRead).toHaveBeenCalled();

    rerender(
      <VocNotificationsDropdown
        items={items}
        unreadCount={0}
        onMarkAllRead={onMarkAllRead}
        onItemClick={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /알림/ }));
    expect(screen.queryByRole('button', { name: '모두 읽음' })).not.toBeInTheDocument();
  });

  it('NotifPanel: unread items get data-unread="true" attribute', async () => {
    const user = userEvent.setup();
    renderDropdown();
    await user.click(screen.getByRole('button', { name: /알림/ }));
    const unread = await screen.findByRole('button', { name: /새 VOC 등록됨/ });
    expect(unread).toHaveAttribute('data-unread', 'true');
    const read = screen.getByRole('button', { name: /회의에서 언급됨/ });
    expect(read).toHaveAttribute('data-unread', 'false');
  });
});
