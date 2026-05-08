import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SidebarUserSwitcher } from '../SidebarUserSwitcher';

const setRole = vi.fn();
vi.mock('@entities/user/model/useRole', () => ({
  useRole: () => ({
    role: 'manager',
    isUser: false,
    isDev: false,
    isManager: true,
    isAdmin: false,
    setRole,
  }),
}));

describe('SidebarUserSwitcher', () => {
  it('현재 역할 라벨 + 클릭 시 popover 4개 옵션', async () => {
    const user = userEvent.setup();
    render(<SidebarUserSwitcher />);
    expect(screen.getByTestId('sidebar-user-switcher')).toHaveTextContent('Manager');
    await user.click(screen.getByTestId('sidebar-user-switcher'));
    expect(screen.getByTestId('sidebar-user-switcher-option-admin')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-user-switcher-option-manager')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-user-switcher-option-dev')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-user-switcher-option-user')).toBeInTheDocument();
  });

  it('옵션 클릭 시 setRole 호출', async () => {
    const user = userEvent.setup();
    render(<SidebarUserSwitcher />);
    await user.click(screen.getByTestId('sidebar-user-switcher'));
    await user.click(screen.getByTestId('sidebar-user-switcher-option-dev'));
    expect(setRole).toHaveBeenCalledWith('dev');
  });
});
