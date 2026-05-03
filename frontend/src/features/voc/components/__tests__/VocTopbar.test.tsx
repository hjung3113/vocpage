import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VocTopbar } from '../VocTopbar';

const defaultNotifications = {
  unreadCount: 0,
  items: [],
};

describe('VocTopbar', () => {
  it('renders heading "전체 VOC" with count badge', () => {
    render(
      <VocTopbar
        totalCount={42}
        query=""
        onQueryChange={() => {}}
        notifications={defaultNotifications}
        onCreate={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { name: /전체 VOC/ })).toBeInTheDocument();
    expect(screen.getByText(/^42개$/)).toBeInTheDocument();
  });

  it('renders searchbox and calls onQueryChange on input', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(
      <VocTopbar
        totalCount={0}
        query=""
        onQueryChange={onQueryChange}
        notifications={defaultNotifications}
        onCreate={() => {}}
      />,
    );
    const input = screen.getByRole('searchbox', { name: /검색/ });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', '제목, 본문 검색...');
    await user.type(input, 'hello');
    expect(onQueryChange).toHaveBeenCalled();
  });

  it('renders notification trigger button', () => {
    render(
      <VocTopbar
        totalCount={0}
        query=""
        onQueryChange={() => {}}
        notifications={{ unreadCount: 3, items: [] }}
        onCreate={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: /알림/ })).toBeInTheDocument();
  });

  it('calls onCreate when "새 VOC 등록" button clicked', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(
      <VocTopbar
        totalCount={0}
        query=""
        onQueryChange={() => {}}
        notifications={defaultNotifications}
        onCreate={onCreate}
      />,
    );
    await user.click(screen.getByRole('button', { name: /새 VOC 등록/ }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
