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

import { useDashboardSettings } from '../model/useDashboardSettings';
import { useUpdateDashboardSettings } from '../model/useUpdateDashboardSettings';
import { DashboardSettingsDialog } from '../ui/DashboardSettingsDialog';

const mockUseDashboardSettings = vi.mocked(useDashboardSettings);
const mockUseUpdateDashboardSettings = vi.mocked(useUpdateDashboardSettings);

const baseSettings: DashboardSettings = {
  user_id: 'user-1',
  widget_order: [],
  widget_visibility: { 'kpi-volume': true, heatmap: true, 'aging-top10': false },
  widget_sizes: defaultLayouts,
  locked_fields: [],
  default_date_range: '3m',
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

  it('renders custom date range as disabled radio when current value is custom', async () => {
    mockUseDashboardSettings.mockReturnValue({
      data: { ...baseSettings, default_date_range: 'custom' },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useDashboardSettings>);

    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');

    const customRadio = within(dialog).getByRole('radio', { name: /사용자 지정/ });
    expect(customRadio).toBeChecked();
    expect(customRadio).toBeDisabled();
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

  it('hides custom radio after user picks a non-custom option in draft', async () => {
    // Server still has 'custom' but draft can move away from it; the disabled
    // radio should disappear once the user has chosen a real preset.
    mockUseDashboardSettings.mockReturnValue({
      data: { ...baseSettings, default_date_range: 'custom' },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useDashboardSettings>);

    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByRole('radio', { name: /사용자 지정/ })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('radio', { name: '1개월' }));
    expect(within(dialog).queryByRole('radio', { name: /사용자 지정/ })).not.toBeInTheDocument();
  });

  it('does not render custom date range option when current value is not custom', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole('button', { name: '설정' }));
    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).queryByRole('radio', { name: /사용자 지정/ })).not.toBeInTheDocument();
  });
});
