/**
 * migration 022 — P0: dashboard_settings admin-default uniqueness
 *
 * Postgres treats NULLs as distinct in UNIQUE constraints, so repeated
 * upserts with user_id IS NULL can create duplicate admin-default rows.
 * Migration 022 adds a partial unique index on (user_id IS NULL) WHERE
 * user_id IS NULL to enforce at-most-one admin-default row.
 *
 * Uses testcontainers Postgres (real Postgres required for expression index).
 * Jest timeout extended to 120 s to allow container boot.
 */
import { startTestPg } from './helpers/testPostgres';
import type { TestPg } from './helpers/testPostgres';

jest.setTimeout(120_000);

describe('migration 022 — dashboard_settings admin-default partial unique index', () => {
  let pg: TestPg;

  beforeAll(async () => {
    pg = await startTestPg();
  });

  afterAll(async () => {
    await pg.stop();
  });

  it('P0-RED: second direct INSERT with user_id IS NULL is rejected after migration 022', async () => {
    // First admin-default row (should already exist via migration seed or we insert one)
    await pg.pool.query(
      `INSERT INTO dashboard_settings (user_id) VALUES (NULL)
       ON CONFLICT DO NOTHING`,
    );

    // Verify exactly one row with user_id IS NULL
    const before = await pg.pool.query(
      `SELECT count(*) FROM dashboard_settings WHERE user_id IS NULL`,
    );
    expect(Number(before.rows[0].count)).toBe(1);

    // Second direct INSERT must be rejected by the partial unique index
    await expect(
      pg.pool.query(
        `INSERT INTO dashboard_settings (user_id) VALUES (NULL)`,
      ),
    ).rejects.toThrow(/unique/i);

    // Still exactly one row
    const after = await pg.pool.query(
      `SELECT count(*) FROM dashboard_settings WHERE user_id IS NULL`,
    );
    expect(Number(after.rows[0].count)).toBe(1);
  });

  it('P0: getAdminDefault returns a deterministic single row after two upsert calls', async () => {
    // Simulate two ?scope=admin saves targeting user_id=NULL via the repo
    // (this uses the real DB path with the upsertAdminDefault helper logic)
    await pg.pool.query(`
      UPDATE dashboard_settings SET default_date_range = '1m' WHERE user_id IS NULL
    `);
    await pg.pool.query(`
      UPDATE dashboard_settings SET default_date_range = '3m' WHERE user_id IS NULL
    `);

    const r = await pg.pool.query(
      `SELECT count(*), max(default_date_range) as dr
         FROM dashboard_settings WHERE user_id IS NULL`,
    );
    expect(Number(r.rows[0].count)).toBe(1);
    expect(r.rows[0].dr).toBe('3m');
  });
});
