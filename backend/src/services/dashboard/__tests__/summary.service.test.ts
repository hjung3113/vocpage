/**
 * summary.service — Wave 2 Phase B TDD.
 *
 * Validates the orchestration layer: range presets resolve to KST midnight
 * windows, default_date_range fallback, custom validation, filter pass-through,
 * empty-result tolerance, and the prior-period delta arithmetic.
 *
 * The metrics repo is mocked module-wide so SQL is exercised separately.
 */
jest.mock('../../../repository/dashboard-metrics.repo', () => ({
  countCreatedAndCompleted: jest.fn(),
  snapshotUnresolved: jest.fn(),
  snapshotUrgentHighUnresolved: jest.fn(),
  snapshotOverdue14d: jest.fn(),
  avgResolutionDaysInWindow: jest.fn(),
}));
jest.mock('../../../repository/dashboard.repo', () => ({
  getByUserId: jest.fn(),
  getAdminDefault: jest.fn(),
  upsert: jest.fn(),
}));

import * as repo from '../../../repository/dashboard-metrics.repo';
import * as settingsRepo from '../../../repository/dashboard.repo';
import {
  resolveFilter,
  computeSummary,
  getSummary,
  kstMidnight,
  kstStartOfDay,
  kstStartOfWeek,
} from '../summary.service';

const repoM = repo as jest.Mocked<typeof repo>;
const settingsM = settingsRepo as jest.Mocked<typeof settingsRepo>;

const USER_ID = '00000000-0000-4000-8000-000000000099';

// 2026-05-10 (Sun) 03:00:00 KST → 2026-05-09T18:00:00Z
const NOW = new Date('2026-05-09T18:00:00Z');

beforeEach(() => {
  jest.clearAllMocks();
  repoM.countCreatedAndCompleted.mockResolvedValue({ total: 0, completed: 0, unresolved: 0 });
  repoM.snapshotUnresolved.mockResolvedValue(0);
  repoM.snapshotUrgentHighUnresolved.mockResolvedValue(0);
  repoM.snapshotOverdue14d.mockResolvedValue(0);
  repoM.avgResolutionDaysInWindow.mockResolvedValue({ avg_days: null, completed_count: 0 });
  settingsM.getByUserId.mockResolvedValue(null);
  settingsM.getAdminDefault.mockResolvedValue(null);
});

describe('KST helpers', () => {
  it('kstMidnight: 2026-05-10 → exact KST 00:00 instant', () => {
    expect(kstMidnight('2026-05-10').toISOString()).toBe('2026-05-09T15:00:00.000Z');
  });

  it('kstStartOfDay: NOW (Sun 03:00 KST) → KST midnight Sun', () => {
    expect(kstStartOfDay(NOW).toISOString()).toBe('2026-05-09T15:00:00.000Z');
  });

  it('kstStartOfWeek: NOW (Sun) → previous Mon 00:00 KST', () => {
    expect(kstStartOfWeek(NOW).toISOString()).toBe('2026-05-03T15:00:00.000Z');
  });
});

describe('resolveFilter — range branches', () => {
  it('range=1m → [today-30d, today+1d) KST', async () => {
    const r = await resolveFilter({ filter: { range: '1m' }, userId: USER_ID, now: NOW });
    expect(r.current?.start.toISOString()).toBe('2026-04-09T15:00:00.000Z');
    expect(r.current?.end.toISOString()).toBe('2026-05-10T15:00:00.000Z');
    expect(r.prior?.start.toISOString()).toBe('2026-04-02T15:00:00.000Z');
  });

  it('range=3m → 90-day window', async () => {
    const r = await resolveFilter({ filter: { range: '3m' }, userId: USER_ID, now: NOW });
    expect(r.current?.start.toISOString()).toBe('2026-02-08T15:00:00.000Z');
  });

  it('range=1y → 365-day window', async () => {
    const r = await resolveFilter({ filter: { range: '1y' }, userId: USER_ID, now: NOW });
    expect(r.current?.start.toISOString()).toBe('2025-05-09T15:00:00.000Z');
  });

  it('range=all → current=null and prior=null', async () => {
    const r = await resolveFilter({ filter: { range: 'all' }, userId: USER_ID, now: NOW });
    expect(r.current).toBeNull();
    expect(r.prior).toBeNull();
  });

  it('range=custom with both dates → uses inclusive end-day', async () => {
    const r = await resolveFilter({
      filter: { range: 'custom', startDate: '2026-04-01', endDate: '2026-04-15' },
      userId: USER_ID,
      now: NOW,
    });
    expect(r.current?.start.toISOString()).toBe('2026-03-31T15:00:00.000Z');
    expect(r.current?.end.toISOString()).toBe('2026-04-15T15:00:00.000Z');
  });

  it('range=custom missing endDate → 400 BAD_REQUEST', async () => {
    await expect(
      resolveFilter({
        filter: { range: 'custom', startDate: '2026-04-01' },
        userId: USER_ID,
        now: NOW,
      }),
    ).rejects.toMatchObject({ status: 400, code: 'BAD_REQUEST' });
  });

  it('range=custom with end<start → 400', async () => {
    await expect(
      resolveFilter({
        filter: { range: 'custom', startDate: '2026-05-02', endDate: '2026-05-01' },
        userId: USER_ID,
        now: NOW,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('resolveFilter — default_date_range fallback', () => {
  it('no range, user setting present → uses user.default_date_range', async () => {
    settingsM.getByUserId.mockResolvedValue({
      user_id: USER_ID,
      widget_order: [],
      widget_visibility: {},
      widget_sizes: {},
      locked_fields: [],
      default_date_range: '1y',
      heatmap_default_x_axis: 'status',
      globaltabs_order: null,
      updated_at: NOW.toISOString(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const r = await resolveFilter({ filter: {}, userId: USER_ID, now: NOW });
    expect(r.range).toBe('1y');
  });

  it('no range, no user row, admin default present → uses admin.default_date_range', async () => {
    settingsM.getByUserId.mockResolvedValue(null);
    settingsM.getAdminDefault.mockResolvedValue({
      user_id: null,
      widget_order: [],
      widget_visibility: {},
      widget_sizes: {},
      locked_fields: [],
      default_date_range: '3m',
      heatmap_default_x_axis: 'status',
      globaltabs_order: null,
      updated_at: NOW.toISOString(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const r = await resolveFilter({ filter: {}, userId: USER_ID, now: NOW });
    expect(r.range).toBe('3m');
  });

  it('no range, nothing configured → spec default 1m', async () => {
    const r = await resolveFilter({ filter: {}, userId: USER_ID, now: NOW });
    expect(r.range).toBe('1m');
  });
});

describe('resolveFilter — scope passthrough', () => {
  it('forwards system/menu/assignee filters verbatim', async () => {
    const r = await resolveFilter({
      filter: {
        range: '1m',
        systemId: '11111111-1111-4111-8111-111111111111',
        menuId: '22222222-2222-4222-8222-222222222222',
        assigneeId: '33333333-3333-4333-8333-333333333333',
      },
      userId: USER_ID,
      now: NOW,
    });
    expect(r.scope).toEqual({
      systemId: '11111111-1111-4111-8111-111111111111',
      menuId: '22222222-2222-4222-8222-222222222222',
      assigneeId: '33333333-3333-4333-8333-333333333333',
    });
  });
});

describe('computeSummary — empty + delta arithmetic', () => {
  it('all repos return zero → 8 metrics shape with zero values', async () => {
    const r = await resolveFilter({ filter: { range: '1m' }, userId: USER_ID, now: NOW });
    const out = await computeSummary(r);
    expect(Object.keys(out.kpi_volume)).toEqual([
      'total_voc',
      'unresolved',
      'this_week_new',
      'this_week_completed',
    ]);
    expect(Object.keys(out.kpi_quality)).toEqual([
      'avg_resolution_days',
      'resolution_rate',
      'urgent_high_unresolved',
      'overdue_14d',
    ]);
    expect(out.kpi_volume.total_voc.value).toBe(0);
  });

  it('total_voc delta is percent change vs prior window', async () => {
    repoM.countCreatedAndCompleted
      .mockResolvedValueOnce({ total: 50, completed: 0, unresolved: 0 }) // current period
      .mockResolvedValueOnce({ total: 25, completed: 0, unresolved: 0 }) // prior period
      .mockResolvedValueOnce({ total: 0, completed: 0, unresolved: 0 })  // weekCurrent
      .mockResolvedValueOnce({ total: 0, completed: 0, unresolved: 0 }); // weekPrior
    const r = await resolveFilter({ filter: { range: '1m' }, userId: USER_ID, now: NOW });
    const out = await computeSummary(r);
    expect(out.kpi_volume.total_voc.value).toBe(50);
    expect(out.kpi_volume.total_voc.delta).toBe(100); // (50-25)/25 * 100
    expect(out.kpi_volume.total_voc.delta_kind).toBe('percent');
  });

  it('range=all → period deltas null (no comparable prior window)', async () => {
    const r = await resolveFilter({ filter: { range: 'all' }, userId: USER_ID, now: NOW });
    const out = await computeSummary(r);
    expect(out.kpi_volume.total_voc.delta).toBeNull();
    expect(out.kpi_quality.resolution_rate.delta).toBeNull();
    // snapshot KPIs still compute (always reference prior 7-day snapshot).
    // Percent KPIs with prior=0 return null (divide-by-zero); count KPIs return 0.
    expect(out.kpi_volume.unresolved.delta).toBeNull();
    expect(out.kpi_quality.urgent_high_unresolved.delta).toBe(0);
  });

  it('urgent_high_unresolved delta is count diff', async () => {
    repoM.snapshotUrgentHighUnresolved
      .mockResolvedValueOnce(7)  // now
      .mockResolvedValueOnce(4); // prior
    const r = await resolveFilter({ filter: { range: '1m' }, userId: USER_ID, now: NOW });
    const out = await computeSummary(r);
    expect(out.kpi_quality.urgent_high_unresolved.value).toBe(7);
    expect(out.kpi_quality.urgent_high_unresolved.delta).toBe(3);
    expect(out.kpi_quality.urgent_high_unresolved.delta_kind).toBe('count');
  });

  it('avg_resolution_days delta_kind=days', async () => {
    repoM.avgResolutionDaysInWindow
      .mockResolvedValueOnce({ avg_days: 5.5, completed_count: 12 })
      .mockResolvedValueOnce({ avg_days: 7.0, completed_count: 8 });
    const r = await resolveFilter({ filter: { range: '1m' }, userId: USER_ID, now: NOW });
    const out = await computeSummary(r);
    expect(out.kpi_quality.avg_resolution_days.value).toBe(5.5);
    expect(out.kpi_quality.avg_resolution_days.delta).toBeCloseTo(-1.5);
    expect(out.kpi_quality.avg_resolution_days.delta_kind).toBe('days');
  });
});

describe('computeSummary — P1 fixes (codex review)', () => {
  it('snapshot KPIs query at exact `now`, not KST midnight', async () => {
    await getSummary({ filter: { range: '1m' }, userId: USER_ID, now: NOW });
    // First snapshotUnresolved call (current) must be `now`, second (prior) `now-7d`.
    expect(repoM.snapshotUnresolved).toHaveBeenCalled();
    const calls = repoM.snapshotUnresolved.mock.calls;
    expect((calls[0]?.[1] as Date).toISOString()).toBe(NOW.toISOString());
    expect((calls[1]?.[1] as Date).toISOString()).toBe(
      new Date(NOW.getTime() - 7 * 86400_000).toISOString(),
    );
  });

  it('snapshot urgent_high + overdue use `now` (not midnight)', async () => {
    await getSummary({ filter: { range: '1m' }, userId: USER_ID, now: NOW });
    expect((repoM.snapshotUrgentHighUnresolved.mock.calls[0]?.[1] as Date).toISOString()).toBe(
      NOW.toISOString(),
    );
    expect((repoM.snapshotOverdue14d.mock.calls[0]?.[1] as Date).toISOString()).toBe(
      NOW.toISOString(),
    );
  });

  it('resolution_rate denominator uses period-end snapshot, not now', async () => {
    repoM.countCreatedAndCompleted
      .mockResolvedValueOnce({ total: 100, completed: 60, unresolved: 0 }) // current period
      .mockResolvedValueOnce({ total: 80, completed: 40, unresolved: 0 })  // prior period
      .mockResolvedValueOnce({ total: 0, completed: 0, unresolved: 0 })    // weekCurrent
      .mockResolvedValueOnce({ total: 0, completed: 0, unresolved: 0 });   // weekPrior
    repoM.snapshotUnresolved
      .mockResolvedValueOnce(10) // unresolvedNow
      .mockResolvedValueOnce(15) // unresolvedPrior (7d ago)
      .mockResolvedValueOnce(20) // current.end (resolution-rate denom)
      .mockResolvedValueOnce(25); // prior.end (resolution-rate denom)
    const out = await getSummary({ filter: { range: '1m' }, userId: USER_ID, now: NOW });
    // Current rate uses 60/(60+20) = 75%. Prior rate uses 40/(40+25) = 61.538…%.
    expect(out.kpi_quality.resolution_rate.value).toBeCloseTo(75);
    expect(out.kpi_quality.resolution_rate.delta_kind).toBe('percentage_point');
    expect(out.kpi_quality.resolution_rate.delta).toBeCloseTo(75 - 40 / 65 * 100);
  });
});

describe('getSummary — end-to-end', () => {
  it('resolves + computes without throwing on a fresh dataset', async () => {
    const out = await getSummary({ filter: { range: '1m' }, userId: USER_ID, now: NOW });
    expect(out).toBeDefined();
    expect(out.kpi_volume).toBeDefined();
    expect(out.kpi_quality).toBeDefined();
  });
});
