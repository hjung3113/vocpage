/**
 * Phase C adversarial review fixes — P0-2 click-through + P1-1 copy + P1-2 breadcrumb.
 * Covers: DistributionWidget, PriorityStatusMatrixWidget, HeatmapWidget.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { DashboardFilterProvider } from '../model/dashboardFilter';
import type { DashboardFilter } from '@contracts/dashboard';

// ── Mocks (must be hoisted before imports of widget) ─────────────────────────
import * as distributionHook from '../model/useDistribution';
import * as matrixHook from '../model/usePriorityStatusMatrix';
import * as heatmapHook from '../model/useHeatmap';

vi.mock('../model/useDistribution', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../model/useDistribution')>()),
  useDistribution: vi.fn(),
}));
vi.mock('../model/usePriorityStatusMatrix', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../model/usePriorityStatusMatrix')>()),
  usePriorityStatusMatrix: vi.fn(),
}));
vi.mock('../model/useHeatmap', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../model/useHeatmap')>()),
  useHeatmap: vi.fn(),
}));

const mockDistribution = vi.mocked(distributionHook).useDistribution;
const mockMatrix = vi.mocked(matrixHook).usePriorityStatusMatrix;
const mockHeatmap = vi.mocked(heatmapHook).useHeatmap;

import { DistributionWidget } from '../widgets/DistributionWidget';
import { PriorityStatusMatrixWidget } from '../widgets/PriorityStatusMatrixWidget';
import { HeatmapWidget } from '../widgets/HeatmapWidget';

const DEMO_DIST = { type: 'status' as const, dim: 'all' as const, total: 10, items: [
  { label: '접수', key: '접수', count: 5, percentage: 50 },
] };
const DEMO_MATRIX = { columns: ['접수', '완료'] as Array<'접수' | '완료'>, max_value: 3,
  rows: [{ priority: 'urgent' as const, cells: { 접수: 2, 완료: 0 }, row_total: 2 }] };
const DEMO_HEATMAP = { headers: ['접수', '완료'], totalRow: [5, 3, 8], max_value: 4,
  rows: [{ id: 'sys1', name: '결제', level: 'system' as const, values: [4, 2], total: 6 }] };

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <DashboardFilterProvider initial={{ range: '1m' }}>{ui}</DashboardFilterProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function wrapWithFilter(ui: React.ReactNode, initial: DashboardFilter) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <DashboardFilterProvider initial={initial}>{ui}</DashboardFilterProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

// ── DistributionWidget click-through (P0-2) ───────────────────────────────────
describe('DistributionWidget click-through', () => {
  it('empty-copy stays 데이터 없음', () => {
    mockDistribution.mockReturnValue({ isLoading: false, isError: false, data: { ...DEMO_DIST, items: [] }, refetch: vi.fn() } as never);
    wrap(<DistributionWidget />);
    expect(screen.getByText('데이터 없음')).toBeInTheDocument();
  });
  it('renders chart with data', () => {
    mockDistribution.mockReturnValue({ isLoading: false, isError: false, data: DEMO_DIST, refetch: vi.fn() } as never);
    wrap(<DistributionWidget />);
    expect(screen.getByTestId('widget-distribution')).toBeInTheDocument();
  });
});

// ── PriorityStatusMatrixWidget click-through (P0-2) ───────────────────────────
describe('PriorityStatusMatrixWidget click-through', () => {
  it('renders grid with data', () => {
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

// ── HeatmapWidget empty copy (P1-1) ──────────────────────────────────────────
describe('HeatmapWidget empty copy', () => {
  it('shows 해당 기간 데이터 없음', () => {
    mockHeatmap.mockReturnValue({ isLoading: false, isError: false, data: { ...DEMO_HEATMAP, rows: [], totalRow: null }, refetch: vi.fn(), xAxis: 'status', setXAxis: vi.fn() } as never);
    wrap(<HeatmapWidget />);
    expect(screen.getByText('해당 기간 데이터 없음')).toBeInTheDocument();
  });
});

// ── HeatmapWidget breadcrumb (P1-2) ──────────────────────────────────────────
describe('HeatmapWidget breadcrumb', () => {
  it('전체 tier: shows root breadcrumb only (no systemId)', () => {
    mockHeatmap.mockReturnValue({ isLoading: false, isError: false, data: DEMO_HEATMAP, refetch: vi.fn(), xAxis: 'status', setXAxis: vi.fn() } as never);
    wrap(<HeatmapWidget />);
    expect(screen.getByTestId('heatmap-breadcrumb-root')).toBeInTheDocument();
    expect(screen.queryByTestId('heatmap-breadcrumb-system')).toBeNull();
  });
  it('시스템 tier: shows 전체 (clickable) › system segment', () => {
    mockHeatmap.mockReturnValue({ isLoading: false, isError: false, data: DEMO_HEATMAP, refetch: vi.fn(), xAxis: 'status', setXAxis: vi.fn() } as never);
    wrapWithFilter(<HeatmapWidget />, { range: '1m', systemId: 'sys-uuid' } as never);
    expect(screen.getByTestId('heatmap-breadcrumb-all')).toBeInTheDocument();
    expect(screen.getByTestId('heatmap-breadcrumb-system')).toBeInTheDocument();
    expect(screen.queryByTestId('heatmap-breadcrumb-root')).toBeNull();
  });
  it('메뉴 tier: shows 전체 › system (clickable) › menu segment', () => {
    mockHeatmap.mockReturnValue({ isLoading: false, isError: false, data: DEMO_HEATMAP, refetch: vi.fn(), xAxis: 'status', setXAxis: vi.fn() } as never);
    wrapWithFilter(<HeatmapWidget />, { range: '1m', systemId: 'sys-uuid', menuId: 'menu-uuid' } as never);
    expect(screen.getByTestId('heatmap-breadcrumb-all')).toBeInTheDocument();
    expect(screen.getByTestId('heatmap-breadcrumb-system')).toBeInTheDocument();
    expect(screen.getByTestId('heatmap-breadcrumb-menu')).toBeInTheDocument();
  });
});
