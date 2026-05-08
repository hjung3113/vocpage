import { computeInitialDueDate } from '../services/voc';

/**
 * FU M-1 — `computeInitialDueDate` accepts an injectable `now` so tests do not
 * depend on wall-clock time. Spec: feature-voc.md §8.4.1 ("created_at + 30일").
 */
describe('computeInitialDueDate', () => {
  it('default — uses real Date.now and returns ISO YYYY-MM-DD shape', () => {
    expect(computeInitialDueDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns now + 30 UTC days when injected', () => {
    const now = new Date('2026-01-15T00:00:00.000Z');
    expect(computeInitialDueDate(now)).toBe('2026-02-14');
  });

  it('handles month rollover correctly', () => {
    expect(computeInitialDueDate(new Date('2026-12-15T12:34:56.000Z'))).toBe('2027-01-14');
  });

  it('handles leap-year February correctly', () => {
    // 2024-02-01 + 30 days = 2024-03-02 (Feb has 29 days)
    expect(computeInitialDueDate(new Date('2024-02-01T00:00:00.000Z'))).toBe('2024-03-02');
  });

  it('does not mutate the supplied Date', () => {
    const now = new Date('2026-05-09T00:00:00.000Z');
    const before = now.toISOString();
    computeInitialDueDate(now);
    expect(now.toISOString()).toBe(before);
  });
});
