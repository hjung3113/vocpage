/**
 * useDashboardDraft.test.tsx — Wave 2 Phase D TDD
 * Tests for the draft state machine hook.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { DashboardSettings } from '@contracts/dashboard';
import { defaultLayouts } from '../defaultLayouts';

// --- Mocks ---
const mockMutate = vi.fn();

vi.mock('../model/useDashboardSettings', () => ({
  useDashboardSettings: vi.fn(),
}));

vi.mock('../model/useUpdateDashboardSettings', () => ({
  useUpdateDashboardSettings: vi.fn(),
}));

import { useDashboardSettings } from '../model/useDashboardSettings';
import { useUpdateDashboardSettings } from '../model/useUpdateDashboardSettings';

const mockUseDashboardSettings = vi.mocked(useDashboardSettings);
const mockUseUpdateDashboardSettings = vi.mocked(useUpdateDashboardSettings);

const baseSettings: DashboardSettings = {
  user_id: 'user-1',
  widget_order: [],
  widget_visibility: {},
  widget_sizes: defaultLayouts,
  locked_fields: [],
  default_date_range: '3m',
  custom_start_date: null,
  custom_end_date: null,
  heatmap_default_x_axis: 'status',
  globaltabs_order: null,
  updated_at: '2026-01-01T00:00:00+09:00',
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseUpdateDashboardSettings.mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateDashboardSettings>);
});

describe('useDashboardDraft', () => {
  it('loads and returns admin-merged layouts', async () => {
    mockUseDashboardSettings.mockReturnValue({
      data: baseSettings,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useDashboardSettings>);

    const { useDashboardDraft } = await import('../model/useDashboardDraft');
    const { result } = renderHook(() => useDashboardDraft(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.layouts).toBeDefined();
    });

    // layouts should have lg breakpoint with 8 widgets
    expect(result.current.layouts.lg).toHaveLength(8);
  });

  it('marks isDirty true after setIsEditing(true) + onLayoutChange', async () => {
    mockUseDashboardSettings.mockReturnValue({
      data: baseSettings,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useDashboardSettings>);

    const { useDashboardDraft } = await import('../model/useDashboardDraft');
    const { result } = renderHook(() => useDashboardDraft(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.layouts).toBeDefined());

    act(() => {
      result.current.setIsEditing(true);
    });

    expect(result.current.isEditing).toBe(true);

    const newLgLayout = result.current.layouts.lg!.map((item) =>
      item.i === 'kpi-volume' ? { ...item, x: 6 } : item,
    );
    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.onLayoutChange(newLgLayout as any, { ...result.current.layouts, lg: newLgLayout });
    });

    expect(result.current.isDirty).toBe(true);
  });

  it('calls PUT with widget_sizes on save, then isDirty becomes false', async () => {
    mockUseDashboardSettings.mockReturnValue({
      data: baseSettings,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useDashboardSettings>);

    mockMutate.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });

    const { useDashboardDraft } = await import('../model/useDashboardDraft');
    const { result } = renderHook(() => useDashboardDraft(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.layouts).toBeDefined());

    act(() => result.current.setIsEditing(true));
    const newLgLayout = result.current.layouts.lg!.map((item) =>
      item.i === 'kpi-volume' ? { ...item, x: 6 } : item,
    );
    act(() =>
      result.current.onLayoutChange(newLgLayout, { ...result.current.layouts, lg: newLgLayout }),
    );

    expect(result.current.isDirty).toBe(true);

    await act(async () => {
      result.current.save();
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({ widget_sizes: expect.any(Object) }),
      expect.any(Object),
    );
    expect(result.current.isDirty).toBe(false);
  });

  it('P1-4: success handler does not stomp newer local edits made during save (race guard)', async () => {
    mockUseDashboardSettings.mockReturnValue({
      data: baseSettings,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useDashboardSettings>);

    // Capture onSuccess so we can fire it manually AFTER the user makes another edit
    let capturedOnSuccess: (() => void) | undefined;
    mockMutate.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      capturedOnSuccess = opts?.onSuccess;
      // Do NOT call onSuccess immediately — simulates in-flight save
    });

    const { useDashboardDraft } = await import('../model/useDashboardDraft');
    const { result } = renderHook(() => useDashboardDraft(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.layouts).toBeDefined());

    // 1. User edits layout and saves
    act(() => result.current.setIsEditing(true));
    const editA = result.current.layouts.lg!.map((item) =>
      item.i === 'kpi-volume' ? { ...item, x: 2 } : item,
    );
    act(() =>
      result.current.onLayoutChange(editA, { ...result.current.layouts, lg: editA }),
    );
    act(() => { result.current.save(); });

    // 2. While save is in-flight, user makes ANOTHER edit (race condition)
    const editB = result.current.layouts.lg!.map((item) =>
      item.i === 'kpi-volume' ? { ...item, x: 9 } : item,
    );
    act(() =>
      result.current.onLayoutChange(editB, { ...result.current.layouts, lg: editB }),
    );

    // 3. Now the original save completes — should NOT revert to editA layouts
    act(() => { capturedOnSuccess?.(); });

    // isDirty should remain true since editB wasn't saved
    expect(result.current.isDirty).toBe(true);

    // The layout should reflect editB (x=9), NOT the stale editA (x=2)
    const kpiItem = result.current.layouts.lg!.find((i) => i.i === 'kpi-volume');
    expect(kpiItem?.x).toBe(9);
  });

  it('reverts to lastSaved layout on discard', async () => {
    mockUseDashboardSettings.mockReturnValue({
      data: baseSettings,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useDashboardSettings>);

    const { useDashboardDraft } = await import('../model/useDashboardDraft');
    const { result } = renderHook(() => useDashboardDraft(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.layouts).toBeDefined());

    const originalX = result.current.layouts.lg![0]!.x;

    act(() => result.current.setIsEditing(true));
    const newLgLayout = result.current.layouts.lg!.map((item) =>
      item.i === 'kpi-volume' ? { ...item, x: 99 } : item,
    );
    act(() =>
      result.current.onLayoutChange(newLgLayout, { ...result.current.layouts, lg: newLgLayout }),
    );

    expect(result.current.isDirty).toBe(true);

    act(() => result.current.discard());

    expect(result.current.isDirty).toBe(false);
    expect(result.current.layouts.lg![0]!.x).toBe(originalX);
  });
});
