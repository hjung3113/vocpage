/**
 * DashboardSettingsDialog.admin.test.tsx — Wave 2 Phase E
 * Admin-scope behaviors: 저장 대상 toggle (Item 1) + GlobalTabs editor (Item 2).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { DashboardSettings } from '@contracts/dashboard';
import { defaultLayouts } from '../defaultLayouts';

const mockMutate = vi.fn();

vi.mock('../model/useDashboardSettings', () => ({ useDashboardSettings: vi.fn() }));
vi.mock('../model/useUpdateDashboardSettings', () => ({ useUpdateDashboardSettings: vi.fn() }));
vi.mock('@features/auth', () => ({ useAuth: vi.fn() }));

import { useDashboardSettings } from '../model/useDashboardSettings';
import { useUpdateDashboardSettings } from '../model/useUpdateDashboardSettings';
import { useAuth } from '@features/auth';
import { DashboardSettingsDialog } from '../ui/DashboardSettingsDialog';

const mockUseDashboardSettings = vi.mocked(useDashboardSettings);
const mockUseUpdateDashboardSettings = vi.mocked(useUpdateDashboardSettings);
const mockUseAuth = vi.mocked(useAuth);

const baseSettings: DashboardSettings = {
  user_id: 'u1',
  widget_order: [],
  widget_visibility: {},
  widget_sizes: defaultLayouts,
  locked_fields: [],
  default_date_range: '3m',
  heatmap_default_x_axis: 'status',
  globaltabs_order: null,
  updated_at: '2026-01-01T00:00:00+09:00',
};

function setUserRole(role: 'admin' | 'user') {
  mockUseAuth.mockReturnValue({
    user: { id: 'u1', name: 'mock', role },
  } as unknown as ReturnType<typeof useAuth>);
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.clearAllMocks();
  setUserRole('admin');
  mockUseUpdateDashboardSettings.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateDashboardSettings>);
  mockUseDashboardSettings.mockReturnValue({
    data: baseSettings,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useDashboardSettings>);
});

describe('DashboardSettingsDialog (admin scope)', () => {
  it('non-admin does NOT see 저장 대상 toggle', async () => {
    setUserRole('user');
    const user = userEvent.setup();
    render(<DashboardSettingsDialog />, { wrapper });
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('radiogroup', { name: '저장 대상' })).not.toBeInTheDocument();
  });

  it('admin sees toggle and switching scope re-keys the hooks', async () => {
    const user = userEvent.setup();
    render(<DashboardSettingsDialog />, { wrapper });
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');

    const scopeGroup = within(dialog).getByRole('radiogroup', { name: '저장 대상' });
    expect(within(scopeGroup).getByRole('radio', { name: '내 설정' })).toBeChecked();

    await user.click(within(scopeGroup).getByRole('radio', { name: '기본값 (Admin)' }));
    expect(within(scopeGroup).getByRole('radio', { name: '기본값 (Admin)' })).toBeChecked();

    expect(mockUseDashboardSettings).toHaveBeenLastCalledWith('admin');
    expect(mockUseUpdateDashboardSettings).toHaveBeenLastCalledWith('admin');
  });

  it('GlobalTabs editor visible only when scope=admin', async () => {
    const user = userEvent.setup();
    render(<DashboardSettingsDialog />, { wrapper });
    await user.click(screen.getByRole('button', { name: '설정' }));
    let dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByText('GlobalTabs 순서 / 표시 (Admin)')).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('radio', { name: '기본값 (Admin)' }));
    dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('GlobalTabs 순서 / 표시 (Admin)')).toBeInTheDocument();
  });

  it('admin can add a systemId row and Save sends globaltabs_order', async () => {
    mockUseDashboardSettings.mockReturnValue({
      data: { ...baseSettings, user_id: null, globaltabs_order: null },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useDashboardSettings>);

    const user = userEvent.setup();
    render(<DashboardSettingsDialog />, { wrapper });
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('radio', { name: '기본값 (Admin)' }));

    const idInput = await within(dialog).findByPlaceholderText('새 systemId');
    await user.type(idInput, 'channel-a');
    await user.click(within(dialog).getByRole('button', { name: 'systemId 추가' }));

    expect(within(dialog).getByTestId('globaltabs-row-channel-a')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '저장' }));
    const [patch] = mockMutate.mock.calls[0];
    expect(patch.globaltabs_order).toEqual([{ systemId: 'channel-a', visible: true }]);
  });
});
