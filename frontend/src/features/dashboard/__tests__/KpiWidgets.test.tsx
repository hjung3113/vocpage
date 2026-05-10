/**
 * KpiVolumeWidget + KpiQualityWidget — Wave 2 Phase B TDD.
 * Covers loading, success, error, and accent border behavior.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { DashboardFilterProvider } from '../model/dashboardFilter';
import * as summaryHook from '../model/useDashboardSummary';
import { KpiVolumeWidget } from '../widgets/KpiVolumeWidget';
import { KpiQualityWidget } from '../widgets/KpiQualityWidget';
import { KpiCard } from '../widgets/KpiCard';

vi.mock('../model/useDashboardSummary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../model/useDashboardSummary')>()),
  useDashboardSummary: vi.fn(),
}));
const mockSummary = vi.mocked(summaryHook).useDashboardSummary;

const ZERO_DATA = {
  kpi_volume: {
    total_voc: { value: 12, delta: 50, delta_kind: 'percent' as const },
    unresolved: { value: 5, delta: -1, delta_kind: 'percent' as const },
    this_week_new: { value: 3, delta: null, delta_kind: 'percent' as const },
    this_week_completed: { value: 2, delta: 0, delta_kind: 'percent' as const },
  },
  kpi_quality: {
    avg_resolution_days: { value: 4.2, delta: -0.8, delta_kind: 'days' as const },
    resolution_rate: { value: 71.5, delta: 4.0, delta_kind: 'percentage_point' as const },
    urgent_high_unresolved: { value: 7, delta: 3, delta_kind: 'count' as const },
    overdue_14d: { value: 2, delta: 0, delta_kind: 'count' as const },
  },
};

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <DashboardFilterProvider initial={{ range: '1m' }}>{ui}</DashboardFilterProvider>
    </QueryClientProvider>,
  );
}

describe('KpiVolumeWidget', () => {
  it('renders 4 skeletons during loading', () => {
    mockSummary.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
      refetch: vi.fn(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    wrap(<KpiVolumeWidget />);
    expect(screen.getByTestId('kpi-volume-loading').children).toHaveLength(4);
  });

  it('renders 4 KPI cards on success', () => {
    mockSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: ZERO_DATA,
      refetch: vi.fn(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    wrap(<KpiVolumeWidget />);
    expect(screen.getByTestId('kpi-card-총 VOC')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-card-미해결')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-card-이번주 신규')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-card-이번주 완료')).toBeInTheDocument();
    // delta sign / formatting
    expect(screen.getByTestId('kpi-delta-총 VOC').textContent).toMatch(/\+50/);
    expect(screen.getByTestId('kpi-delta-미해결').textContent).toMatch(/−1/);
  });

  it('renders error state with retry that calls refetch', () => {
    const refetch = vi.fn();
    mockSummary.mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
      refetch,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    wrap(<KpiVolumeWidget />);
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(refetch).toHaveBeenCalled();
  });
});

describe('KpiQualityWidget', () => {
  it('shows urgent + overdue accent labels and applies inverted color to 평균 처리시간', () => {
    mockSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: ZERO_DATA,
      refetch: vi.fn(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    wrap(<KpiQualityWidget />);
    expect(screen.getByTestId('kpi-card-Urgent·High 미해결')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-card-14일+ 미처리')).toBeInTheDocument();
    // avg processing time decreased (-0.8 days) → with inverted=true, treated as positive (emerald).
    const avgDelta = screen.getByTestId('kpi-delta-평균 처리시간');
    expect(avgDelta.className).toMatch(/--chart-emerald/);
  });
});

describe('KpiCard formatting', () => {
  it('formats `count` deltas with thousand separator', () => {
    render(
      <KpiCard
        label="X"
        metric={{ value: 1234, delta: 1500, delta_kind: 'count' }}
      />,
    );
    expect(screen.getByTestId('kpi-card-X').textContent).toMatch(/1,234/);
    expect(screen.getByTestId('kpi-delta-X').textContent).toMatch(/1,500/);
  });

  it('null delta renders no delta text', () => {
    render(
      <KpiCard label="Y" metric={{ value: 0, delta: null, delta_kind: 'percent' }} />,
    );
    expect(screen.queryByTestId('kpi-delta-Y')).toBeNull();
  });

  it('urgent accent applies red border only when delta is increasing (spec §1)', () => {
    render(
      <KpiCard
        label="Z"
        metric={{ value: 5, delta: 2, delta_kind: 'count' }}
        accent="urgent"
      />,
    );
    expect(screen.getByTestId('kpi-card-Z').className).toMatch(/--chart-red/);
  });

  it('urgent accent does NOT apply when delta=0 even if value is high', () => {
    render(
      <KpiCard
        label="W"
        metric={{ value: 5, delta: 0, delta_kind: 'count' }}
        accent="urgent"
      />,
    );
    expect(screen.getByTestId('kpi-card-W').className).not.toMatch(/--chart-red/);
  });

  it('urgent accent does NOT apply when delta is negative', () => {
    render(
      <KpiCard
        label="V"
        metric={{ value: 5, delta: -1, delta_kind: 'count' }}
        accent="urgent"
      />,
    );
    expect(screen.getByTestId('kpi-card-V').className).not.toMatch(/--chart-red/);
  });
});
