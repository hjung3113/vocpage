/**
 * dashboard-phase-c-avg-days.test.ts — P0 regression guard (codex:rescue).
 *
 * Verifies that `processingSpeedAll` emits SQL with a KST calendar-day
 * difference for avg_days, not raw INTERVAL seconds.
 *
 * The canonical cross-day scenario:
 *   created_at        = 2026-01-01 23:00 KST  (2026-01-01 14:00 UTC)
 *   status_changed_at = 2026-01-03 01:00 KST  (2026-01-02 16:00 UTC)
 *
 *   Raw INTERVAL seconds → elapsed ≈ 26 h → avg_days ≈ 1.083  ← WRONG
 *   KST calendar date diff → 2026-01-03 - 2026-01-01 = 2       ← CORRECT
 *
 * Pool is mocked via `../db` so no real Postgres connection is required.
 */

const mockQuery = jest.fn();

jest.mock('../db', () => ({
  getPool: () => ({ query: mockQuery }),
  setPool: jest.fn(),
  resetPool: jest.fn(),
  pool: { query: mockQuery },
}));

import { processingSpeedAll } from '../repository/dashboard-phase-c.repo';

describe('processingSpeedAll — KST calendar-day avg_days (P0)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('emits KST timezone cast in SQL — not raw EPOCH/INTERVAL arithmetic', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ avg_days: '2', completed_count: 1, sla_pass: 1, sla_eligible: 1, missing_due_date: 0 }],
    });

    await processingSpeedAll({}, null, null);

    const [calledSql] = mockQuery.mock.calls[0] as [string, ...unknown[]];

    // Must use KST timezone cast for calendar-day arithmetic.
    expect(calledSql).toContain("AT TIME ZONE 'Asia/Seoul'");
    // Must NOT use the old raw-seconds formula.
    expect(calledSql).not.toContain('EXTRACT(EPOCH FROM');
  });

  it('maps DB result 2 → avg_days=2 (cross-midnight KST scenario; was ~1.083 with raw interval)', async () => {
    // Postgres returns integer 2 (KST date diff: 2026-01-03 - 2026-01-01).
    mockQuery.mockResolvedValueOnce({
      rows: [{ avg_days: '2', completed_count: 1, sla_pass: 1, sla_eligible: 1, missing_due_date: 0 }],
    });

    const result = await processingSpeedAll({}, null, null);

    expect(result.avg_days).toBe(2);
    expect(result.completed_count).toBe(1);
  });

  it('SLA filter SQL casts status_changed_at to KST date before comparing to due_date', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{}] });

    await processingSpeedAll({}, null, null);

    const [calledSql] = mockQuery.mock.calls[0] as [string, ...unknown[]];

    // Must cast to KST date, not use raw ::date (session-TZ).
    expect(calledSql).toMatch(
      /status_changed_at\s+AT TIME ZONE\s+'Asia\/Seoul'\s*\)::date\s*<=\s*due_date/,
    );
    // Old pattern must be absent.
    expect(calledSql).not.toMatch(/status_changed_at::date\s*<=\s*due_date/);
  });
});
