/**
 * Phase C widget smoke tests — Wave 2 Phase C TDD.
 * Each widget: renders loading skeleton, renders data, renders empty state.
 * GridTable tests are in GridTable.test.tsx.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { DashboardFilterProvider } from '../model/dashboardFilter';

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <DashboardFilterProvider initial={{ range: '1m' }}>{ui}</DashboardFilterProvider>
    </QueryClientProvider>,
  );
}

// ── DistributionWidget ────────────────────────────────────────────────────────
import * as distributionHook from '../model/useDistribution';
import { DistributionWidget } from '../widgets/DistributionWidget';

vi.mock('../model/useDistribution', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../model/useDistribution')>()),
  useDistribution: vi.fn(),
}));
const mockDistribution = vi.mocked(distributionHook).useDistribution;

const DEMO_DIST = { type: 'status' as const, dim: 'all' as const, total: 10, items: [
  { label: '접수', key: '접수', count: 5, percentage: 50 },
  { label: '완료', key: '완료', count: 5, percentage: 50 },
] };

describe('DistributionWidget', () => {
  it('shows loading skeleton', () => {
    mockDistribution.mockReturnValue({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() } as never);
    wrap(<DistributionWidget />);
    expect(screen.getByTestId('distribution-loading')).toBeInTheDocument();
  });
  it('renders data', () => {
    mockDistribution.mockReturnValue({ isLoading: false, isError: false, data: DEMO_DIST, refetch: vi.fn() } as never);
    wrap(<DistributionWidget />);
    expect(screen.getByTestId('widget-distribution')).toBeInTheDocument();
  });
  it('renders empty state', () => {
    mockDistribution.mockReturnValue({ isLoading: false, isError: false, data: { ...DEMO_DIST, items: [] }, refetch: vi.fn() } as never);
    wrap(<DistributionWidget />);
    expect(screen.getByText('데이터 없음')).toBeInTheDocument();
  });
});

// ── PriorityStatusMatrixWidget ────────────────────────────────────────────────
import * as matrixHook from '../model/usePriorityStatusMatrix';
import { PriorityStatusMatrixWidget } from '../widgets/PriorityStatusMatrixWidget';

vi.mock('../model/usePriorityStatusMatrix', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../model/usePriorityStatusMatrix')>()),
  usePriorityStatusMatrix: vi.fn(),
}));
const mockMatrix = vi.mocked(matrixHook).usePriorityStatusMatrix;

const DEMO_MATRIX = { columns: ['접수', '완료'] as Array<'접수' | '완료'>, max_value: 3,
  rows: [{ priority: 'urgent' as const, cells: { 접수: 2, 완료: 0 }, row_total: 2 }] };

describe('PriorityStatusMatrixWidget', () => {
  it('shows loading', () => {
    mockMatrix.mockReturnValue({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() } as never);
    wrap(<PriorityStatusMatrixWidget />);
    expect(screen.getByTestId('matrix-loading')).toBeInTheDocument();
  });
  it('renders grid on success', () => {
    mockMatrix.mockReturnValue({ isLoading: false, isError: false, data: DEMO_MATRIX, refetch: vi.fn() } as never);
    wrap(<PriorityStatusMatrixWidget />);
    expect(screen.getByText('긴급')).toBeInTheDocument();
  });
  it('renders empty state', () => {
    mockMatrix.mockReturnValue({ isLoading: false, isError: false, data: { ...DEMO_MATRIX, rows: [] }, refetch: vi.fn() } as never);
    wrap(<PriorityStatusMatrixWidget />);
    expect(screen.getByText('데이터 없음')).toBeInTheDocument();
  });
});

// ── HeatmapWidget ─────────────────────────────────────────────────────────────
import * as heatmapHook from '../model/useHeatmap';
import { HeatmapWidget } from '../widgets/HeatmapWidget';

vi.mock('../model/useHeatmap', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../model/useHeatmap')>()),
  useHeatmap: vi.fn(),
}));
const mockHeatmap = vi.mocked(heatmapHook).useHeatmap;

const DEMO_HEATMAP = { headers: ['접수', '완료'], totalRow: [5, 3, 8], max_value: 4,
  rows: [{ id: 'sys1', name: '결제', level: 'system' as const, values: [4, 2], total: 6 }] };

describe('HeatmapWidget', () => {
  it('shows loading', () => {
    mockHeatmap.mockReturnValue({ isLoading: true, isError: false, data: undefined, refetch: vi.fn(), xAxis: 'status', setXAxis: vi.fn() } as never);
    wrap(<HeatmapWidget />);
    expect(screen.getByTestId('heatmap-loading')).toBeInTheDocument();
  });
  it('renders grid on success', () => {
    mockHeatmap.mockReturnValue({ isLoading: false, isError: false, data: DEMO_HEATMAP, refetch: vi.fn(), xAxis: 'status', setXAxis: vi.fn() } as never);
    wrap(<HeatmapWidget />);
    expect(screen.getByText('결제')).toBeInTheDocument();
  });
  it('renders empty when no rows and no totalRow', () => {
    mockHeatmap.mockReturnValue({ isLoading: false, isError: false, data: { ...DEMO_HEATMAP, rows: [], totalRow: null }, refetch: vi.fn(), xAxis: 'status', setXAxis: vi.fn() } as never);
    wrap(<HeatmapWidget />);
    expect(screen.getByText('데이터 없음')).toBeInTheDocument();
  });
  it('xAxis toggle calls setXAxis', () => {
    const setXAxis = vi.fn();
    mockHeatmap.mockReturnValue({ isLoading: false, isError: false, data: DEMO_HEATMAP, refetch: vi.fn(), xAxis: 'status', setXAxis } as never);
    wrap(<HeatmapWidget />);
    fireEvent.click(screen.getByText('우선순위'));
    expect(setXAxis).toHaveBeenCalledWith('priority');
  });
});

// ── WeeklyTrendWidget ─────────────────────────────────────────────────────────
import * as trendHook from '../model/useWeeklyTrend';
import { WeeklyTrendWidget } from '../widgets/WeeklyTrendWidget';

vi.mock('../model/useWeeklyTrend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../model/useWeeklyTrend')>()),
  useWeeklyTrend: vi.fn(),
}));
const mockTrend = vi.mocked(trendHook).useWeeklyTrend;

const W12 = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);
const D12 = Array.from({ length: 12 }, (_, i) => i + 1);
const DEMO_TREND = { weeks: W12,
  weekStarts: Array.from({ length: 12 }, (_, i) => `2026-02-${(i + 2).toString().padStart(2, '0')}`),
  series: { new: D12, enteredInProgress: D12, done: D12 } };

describe('WeeklyTrendWidget', () => {
  it('shows loading', () => {
    mockTrend.mockReturnValue({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() } as never);
    wrap(<WeeklyTrendWidget />);
    expect(screen.getByTestId('trend-loading')).toBeInTheDocument();
  });
  it('renders chart on success', () => {
    mockTrend.mockReturnValue({ isLoading: false, isError: false, data: DEMO_TREND, refetch: vi.fn() } as never);
    wrap(<WeeklyTrendWidget />);
    expect(screen.getByTestId('widget-weekly-trend')).toBeInTheDocument();
  });
  it('renders empty state', () => {
    mockTrend.mockReturnValue({ isLoading: false, isError: false, data: { ...DEMO_TREND, weeks: [] }, refetch: vi.fn() } as never);
    wrap(<WeeklyTrendWidget />);
    expect(screen.getByText('데이터 없음')).toBeInTheDocument();
  });
});

// ── ProcessingSpeedWidget ─────────────────────────────────────────────────────
import * as speedHook from '../model/useProcessingSpeed';
import { ProcessingSpeedWidget } from '../widgets/ProcessingSpeedWidget';

vi.mock('../model/useProcessingSpeed', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../model/useProcessingSpeed')>()),
  useProcessingSpeed: vi.fn(),
}));
const mockSpeed = vi.mocked(speedHook).useProcessingSpeed;

const DEMO_SPEED = { dim: 'all' as const,
  rows: [{ id: null, name: '전체', avg_days: 4.2, sla_rate: 82.0, completed_count: 10, slaEligibleCount: 8, missingDueDateCount: 2 }] };

describe('ProcessingSpeedWidget', () => {
  it('shows loading', () => {
    mockSpeed.mockReturnValue({ isLoading: true, isError: false, data: undefined, refetch: vi.fn(), dim: 'all', setDim: vi.fn() } as never);
    wrap(<ProcessingSpeedWidget />);
    expect(screen.getByTestId('speed-loading')).toBeInTheDocument();
  });
  it('renders table on success', () => {
    mockSpeed.mockReturnValue({ isLoading: false, isError: false, data: DEMO_SPEED, refetch: vi.fn(), dim: 'all', setDim: vi.fn() } as never);
    wrap(<ProcessingSpeedWidget />);
    expect(screen.getByTestId('widget-processing-speed')).toBeInTheDocument();
    expect(screen.getAllByText('전체').length).toBeGreaterThan(0);
  });
  it('renders empty state', () => {
    mockSpeed.mockReturnValue({ isLoading: false, isError: false, data: { ...DEMO_SPEED, rows: [] }, refetch: vi.fn(), dim: 'all', setDim: vi.fn() } as never);
    wrap(<ProcessingSpeedWidget />);
    expect(screen.getByText('데이터 없음')).toBeInTheDocument();
  });
});

// AssigneeStatsWidget + AgingVocsWidget tests → PhaseC-2.test.tsx
