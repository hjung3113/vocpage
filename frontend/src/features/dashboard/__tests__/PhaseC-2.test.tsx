/**
 * Phase C widget smoke tests (part 2) — AssigneeStatsWidget + AgingVocsWidget.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

// ── AssigneeStatsWidget ───────────────────────────────────────────────────────
import * as assigneeHook from '../model/useAssigneeStats';
import { AssigneeStatsWidget } from '../widgets/AssigneeStatsWidget';

vi.mock('../model/useAssigneeStats', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../model/useAssigneeStats')>()),
  useAssigneeStats: vi.fn(),
}));
const mockAssignee = vi.mocked(assigneeHook).useAssigneeStats;

const DEMO_ASSIGNEE = {
  headers: ['접수', '완료'],
  max_value: 5,
  rows: [
    { id: 'u1', name: '김철수', is_unassigned: false, values: [3, 2], total: 5 },
    { id: null, name: '미배정', is_unassigned: true, values: [1, 0], total: 1 },
  ],
};

describe('AssigneeStatsWidget', () => {
  it('shows loading', () => {
    mockAssignee.mockReturnValue({ isLoading: true, isError: false, data: undefined, refetch: vi.fn(), xAxis: 'status', setXAxis: vi.fn() } as never);
    wrap(<AssigneeStatsWidget />);
    expect(screen.getByTestId('assignee-loading')).toBeInTheDocument();
  });
  it('renders grid with 미배정 row', () => {
    mockAssignee.mockReturnValue({ isLoading: false, isError: false, data: DEMO_ASSIGNEE, refetch: vi.fn(), xAxis: 'status', setXAxis: vi.fn() } as never);
    wrap(<AssigneeStatsWidget />);
    expect(screen.getByText('김철수')).toBeInTheDocument();
    expect(screen.getByText('미배정')).toBeInTheDocument();
  });
  it('renders empty state', () => {
    mockAssignee.mockReturnValue({ isLoading: false, isError: false, data: { ...DEMO_ASSIGNEE, rows: [] }, refetch: vi.fn(), xAxis: 'status', setXAxis: vi.fn() } as never);
    wrap(<AssigneeStatsWidget />);
    expect(screen.getByText('데이터 없음')).toBeInTheDocument();
  });
});

// ── AgingVocsWidget ───────────────────────────────────────────────────────────
import * as agingHook from '../model/useAgingVocs';
import { AgingVocsWidget } from '../widgets/AgingVocsWidget';

vi.mock('../model/useAgingVocs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../model/useAgingVocs')>()),
  useAgingVocs: vi.fn(),
}));
const mockAging = vi.mocked(agingHook).useAgingVocs;

const DEMO_AGING = {
  dim: 'all' as const,
  items: [
    { voc_id: 'id1', issue_code: 'VOC-001', title: '결제 오류', priority: 'urgent' as const, elapsed_days: 42, system_name: '결제', menu_name: null },
  ],
};

describe('AgingVocsWidget', () => {
  it('shows loading', () => {
    mockAging.mockReturnValue({ isLoading: true, isError: false, data: undefined, refetch: vi.fn() } as never);
    wrap(<AgingVocsWidget />);
    expect(screen.getByTestId('aging-loading')).toBeInTheDocument();
  });
  it('renders table on success', () => {
    mockAging.mockReturnValue({ isLoading: false, isError: false, data: DEMO_AGING, refetch: vi.fn() } as never);
    wrap(<AgingVocsWidget />);
    expect(screen.getByText('VOC-001')).toBeInTheDocument();
  });
  it('renders empty state', () => {
    mockAging.mockReturnValue({ isLoading: false, isError: false, data: { ...DEMO_AGING, items: [] }, refetch: vi.fn() } as never);
    wrap(<AgingVocsWidget />);
    expect(screen.getByText('장기 미처리 VOC 없음')).toBeInTheDocument();
  });
});
