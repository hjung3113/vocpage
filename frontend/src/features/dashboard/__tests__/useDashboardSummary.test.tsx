/**
 * useDashboardSummary — Wave 2 Phase B TDD.
 * Verifies the hook reads filter from context, calls /api/dashboard/summary,
 * and that filter changes invalidate the cache (queryKey dependency).
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import React from 'react';
import { DashboardFilterProvider, useDashboardFilter } from '../model/dashboardFilter';
import { useDashboardSummary } from '../model/useDashboardSummary';

const ZERO_METRIC = { value: 0, delta: null, delta_kind: 'percent' as const };
const ZERO_SUMMARY = {
  kpi_volume: {
    total_voc: ZERO_METRIC,
    unresolved: ZERO_METRIC,
    this_week_new: ZERO_METRIC,
    this_week_completed: ZERO_METRIC,
  },
  kpi_quality: {
    avg_resolution_days: { value: 0, delta: null, delta_kind: 'days' as const },
    resolution_rate: { value: 0, delta: null, delta_kind: 'percentage_point' as const },
    urgent_high_unresolved: { value: 0, delta: null, delta_kind: 'count' as const },
    overdue_14d: { value: 0, delta: null, delta_kind: 'count' as const },
  },
};

let lastUrl = '';
const server = setupServer(
  http.get('/api/dashboard/summary', ({ request }) => {
    lastUrl = request.url;
    return HttpResponse.json(ZERO_SUMMARY);
  }),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  lastUrl = '';
});
afterAll(() => server.close());

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <DashboardFilterProvider initial={{ range: '1m' }}>{children}</DashboardFilterProvider>
    </QueryClientProvider>
  );
}

describe('useDashboardSummary', () => {
  it('queries /api/dashboard/summary with the active filter as query string', async () => {
    const wrapper = makeWrapper();
    const { result } = renderHook(() => useDashboardSummary(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(lastUrl).toContain('range=1m');
    expect(result.current.data?.kpi_volume.total_voc.value).toBe(0);
  });

  it('filter change triggers a new request (cache key includes filter)', async () => {
    const Harness = () => {
      const { patch } = useDashboardFilter();
      const summary = useDashboardSummary();
      return { summary, patch };
    };
    const wrapper = makeWrapper();
    const { result } = renderHook(() => Harness(), { wrapper });
    await waitFor(() => expect(result.current.summary.isSuccess).toBe(true));
    expect(lastUrl).toContain('range=1m');
    expect(lastUrl).not.toContain('range=3m');

    await act(async () => {
      result.current.patch({ range: '3m' });
    });
    await waitFor(() => expect(lastUrl).toContain('range=3m'));
  });

  it('forwards systemId / menuId / assigneeId verbatim', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>
        <DashboardFilterProvider
          initial={{
            systemId: '11111111-1111-4111-8111-111111111111',
            menuId: '22222222-2222-4222-8222-222222222222',
            assigneeId: '33333333-3333-4333-8333-333333333333',
            range: '3m',
          }}
        >
          {children}
        </DashboardFilterProvider>
      </QueryClientProvider>
    );
    const { result } = renderHook(() => useDashboardSummary(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(lastUrl).toContain('systemId=11111111-1111-4111-8111-111111111111');
    expect(lastUrl).toContain('menuId=22222222-2222-4222-8222-222222222222');
    expect(lastUrl).toContain('assigneeId=33333333-3333-4333-8333-333333333333');
    expect(lastUrl).toContain('range=3m');
  });
});

describe('useDashboardFilter — error', () => {
  it('throws when used outside provider', () => {
    const qc = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    // suppress expected error console
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useDashboardFilter(), { wrapper })).toThrow(
      /DashboardFilterProvider/,
    );
    spy.mockRestore();
  });
});
