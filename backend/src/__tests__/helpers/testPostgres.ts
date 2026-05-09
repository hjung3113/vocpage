/**
 * FU-024 — testcontainers Postgres helper.
 *
 * Boots a real Postgres container (pgvector image), applies every migration
 * in `backend/migrations/`, and returns a connected `pg.Pool`. Used by the
 * SQL-integration tests that pg-mem cannot serve due to ILIKE ESCAPE / RETURNING
 * correlated-subquery limitations.
 *
 * Cost: container boot ~5-10s per test file. Use only for tests that genuinely
 * exercise Postgres-specific SQL — keep schema-only / DDL-shape tests on pg-mem.
 *
 * Spec: requirements.md §13.2 (integration test mandate).
 */
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

export interface TestPg {
  pool: Pool;
  container: StartedPostgreSqlContainer;
  stop: () => Promise<void>;
}

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../migrations');

/**
 * Extract the Up section from a migration. Files use the convention
 * `-- Up Migration` / `-- Down Migration` markers; if no Up marker is
 * present (early migrations 002-006), treat the entire file as Up.
 */
function extractUpSection(raw: string): string {
  const upMatch = raw.match(/-- Up Migration([\s\S]*?)(?=-- Down Migration|$)/i);
  if (upMatch) return upMatch[1];
  // No marker — file is all Up. But still strip any explicit Down section
  // that lacks the leading "-- Up" header.
  const downIdx = raw.search(/-- Down Migration/i);
  return downIdx >= 0 ? raw.slice(0, downIdx) : raw;
}

function readMigrations(): { file: string; sql: string }[] {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  return files.map((file) => ({
    file,
    sql: extractUpSection(readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')),
  }));
}

export async function startTestPg(): Promise<TestPg> {
  const container = await new PostgreSqlContainer('pgvector/pgvector:pg16')
    .withDatabase('vocpage_test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const pool = new Pool({
    host: container.getHost(),
    port: container.getMappedPort(5432),
    user: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
  });

  const migrations = readMigrations();
  for (const { file, sql } of migrations) {
    try {
      await pool.query(sql);
    } catch (err) {
      throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
    }
  }

  return {
    pool,
    container,
    async stop() {
      await pool.end();
      await container.stop();
    },
  };
}
