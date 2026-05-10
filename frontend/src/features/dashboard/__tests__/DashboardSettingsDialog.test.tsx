/**
 * DashboardSettingsDialog.test.tsx — Wave 2 Phase E TDD
 *
 * Sheet-based settings panel for personal dashboard preferences.
 * Covers: prefill from useDashboardSettings, Save patches via mutation,
 * Reset reverts in-flight edits, 'custom' date range renders disabled,
 * widget_visibility toggles flip and persist.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { DashboardSettings } from '@contracts/dashboard';
import { defaultLayouts } from '../defaultLayouts';

const mockMutate = vi.fn();

vi.mock('../model/useDashboardSettings', () => ({
  useDashboardSettings: vi.fn(),
}));

vi.mock('../model/useUpdateDashboardSettings', () => ({
  useUpdateDashboardSettings: vi.fn(),
}));

vi.mock('@features/auth', () => ({
  useAuth: vi.fn(),
}));

import { useDashboardSettings } from '../model/useDashboardSettings';
import { useUpdateDashboardSettings } from '../model/useUpdateDashboardSettings';
import { useAuth } from '@features/auth';
import { DashboardSettingsDialog } from '../ui/DashboardSettingsDialog';

const mockUseDashboardSettings = vi.mocked(useDashboardSettings);
const mockUseUpdateDashboardSettings = vi.mocked(useUpdateDashboardSettings);
const mockUseAuth = vi.mocked(useAuth);

function setUserRole(role: 'admin' | 'manager' | 'dev' | 'user') {
  mockUseAuth.mockReturnValue({
    user: { id: 'u1', name: 'mock', role },
  } as unknown as ReturnType<typeof useAuth>);
}

const baseSettings: DashboardSettings = {
  user_id: 'user-1',
  widget_order: [],
  widget_visibility: { 'kpi-volume': true, heatmap: true, 'aging-top10': false },
  widget_sizes: defaultLayouts,
  locked_fields: [],
  default_date_range: '3m',
  custom_start_date: null,
  custom_end_date: null,
  heatmap_default_x_axis: 'status',
  globaltabs_order: null,
  updated_at: '2026-01-01T00:00:00+09:00',
};

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function renderDialog() {
  return render(<DashboardSettingsDialog />, { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  setUserRole('user');
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

describe('DashboardSettingsDialog', () => {
  it('renders trigger button and opens panel', async () => {
    const user = userEvent.setup();
    renderDialog();
    const trigger = screen.getByRole('button', { name: '설정' });
    await user.click(trigger);
    expect(await screen.findByRole('dialog', { name: /대시보드 설정/ })).toBeInTheDocument();
  });

  it('prefills date range and heatmap x-axis from settings', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');

    const dateGroup = within(dialog).getByRole('radiogroup', { name: /기본 날짜 범위/ });
    expect(within(dateGroup).getByRole('radio', { name: '3개월' })).toBeChecked();

    const xAxisGroup = within(dialog).getByRole('radiogroup', { name: /히트맵 기본 X축/ });
    expect(within(xAxisGroup).getByRole('radio', { name: '상태' })).toBeChecked();
  });

  it('Save patches widget_visibility, default_date_range, heatmap_default_x_axis', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');

    // Toggle heatmap visibility off
    const heatmapToggle = within(dialog).getByRole('switch', { name: /드릴다운 히트맵/ });
    await user.click(heatmapToggle);

    // Change date range to 1m
    await user.click(within(dialog).getByRole('radio', { name: '1개월' }));

    // Change heatmap x-axis to 우선순위
    await user.click(within(dialog).getByRole('radio', { name: '우선순위' }));

    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const [patch] = mockMutate.mock.calls[0];
    expect(patch.default_date_range).toBe('1m');
    expect(patch.heatmap_default_x_axis).toBe('priority');
    expect(patch.widget_visibility.heatmap).toBe(false);
    expect(patch.widget_visibility['kpi-volume']).toBe(true);
  });

  it('Reset reverts in-flight edits to last-saved settings', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('radio', { name: '1개월' }));
    expect(within(dialog).getByRole('radio', { name: '1개월' })).toBeChecked();

    await user.click(within(dialog).getByRole('button', { name: '되돌리기' }));
    expect(within(dialog).getByRole('radio', { name: '3개월' })).toBeChecked();
    expect(within(dialog).getByRole('radio', { name: '1개월' })).not.toBeChecked();
  });

  it("ADR 0006: 'custom' radio enabled (Phase E disabled-radio 제거); dates 부재 시 저장 차단", async () => {
    mockUseDashboardSettings.mockReturnValue({
      data: { ...baseSettings, default_date_range: 'custom', custom_start_date: null, custom_end_date: null },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useDashboardSettings>);

    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');

    const customRadio = within(dialog).getByRole('radio', { name: /사용자 지정/ });
    expect(customRadio).toBeChecked();
    expect(customRadio).not.toBeDisabled();
    // dates 미입력 시 저장 버튼 disabled.
    expect(within(dialog).getByRole('button', { name: '저장' })).toBeDisabled();
  });

  it('Save and Reset are disabled-state aware when mutation is pending', async () => {
    mockUseUpdateDashboardSettings.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    } as unknown as ReturnType<typeof useUpdateDashboardSettings>);

    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('button', { name: '저장 중…' })).toBeDisabled();
    // Reset stays interactable so user can revert without waiting.
    expect(within(dialog).getByRole('button', { name: '되돌리기' })).not.toBeDisabled();
  });

  it("ADR 0006 §5: 'custom' → 다른 enum 변경 시 dates 자동 NULL clear (저장 시 patch 에 null 포함)", async () => {
    mockUseDashboardSettings.mockReturnValue({
      data: {
        ...baseSettings,
        default_date_range: 'custom',
        custom_start_date: '2026-01-01',
        custom_end_date: '2026-03-31',
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useDashboardSettings>);

    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('radio', { name: '1개월' }));
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const [patch] = mockMutate.mock.calls[0];
    expect(patch.default_date_range).toBe('1m');
    expect(patch.custom_start_date).toBeNull();
    expect(patch.custom_end_date).toBeNull();
  });

  it("ADR 0006: 'custom' radio always rendered (Phase E disabled-radio fallback 제거)", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('radio', { name: /사용자 지정/ })).toBeInTheDocument();
  });

});
