import { newDb, DataType } from 'pg-mem';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { Pool } from 'pg';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../migrations');

const MIGRATION_FILES = [
  '001_extensions.sql',
  '002_core_tables.sql',
  '003_vocs.sql',
  '004_tags.sql',
  '005_content.sql',
  '006_settings.sql',
];

function stripPgvector(sql: string): string {
  return (
    sql
      .split('\n')
      .filter((line) => {
        // Skip pgvector extension
        if (line.match(/CREATE EXTENSION.*vector/i)) return false;
        return true;
      })
      .join('\n')
      // Remove embedding vector column (with optional preceding comma)
      .replace(/,\s*\n?\s*embedding\s+vector\(\d+\)[^\n,]*/gi, '')
      .replace(/\s*embedding\s+vector\(\d+\)[^\n,]*,?\n?/gi, '')
  );
}

function stripUnsupported(sql: string): string {
  // pg-mem does not support uuid-ossp extension — replace uuid_generate_v4() with gen_random_uuid()
  let result = stripPgvector(sql);
  result = result
    // skip extension creation lines entirely
    .split('\n')
    .filter((line) => !line.match(/CREATE EXTENSION/i))
    .join('\n')
    // replace uuid_generate_v4() with gen_random_uuid()
    .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');

  // pg-mem does not support partial indexes (CREATE INDEX ... WHERE ...).
  result = result.replace(
    /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:\w+\s+)?ON\s+\w+\s*\([^)]+\)\s*WHERE[^;]+;/gi,
    '',
  );

  // pg-mem has a bug with NULL values in CHECK constraints on nullable columns:
  // it raises a constraint violation even when the value is NULL (non-standard behaviour).
  // Strip CHECK constraints for nullable optional columns in the vocs table.
  // pg-mem crashes on some multi-line CHECK constraints. Strip all CHECK constraints
  // inside CREATE TABLE blocks (they are enforced by real PostgreSQL in production).
  result = result.replace(/\s*CHECK\s*\(\s*\w+\s+IN\s*\([^)]+\)\s*\)/g, '');

  // pg-mem does not support PL/pgSQL language.
  // Strip ALL CREATE [OR REPLACE] FUNCTION blocks that end with LANGUAGE plpgsql.
  // These use dollar-quoting ($$...$$) which we match non-greedily.
  result = result.replace(
    /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+\w+\s*\([^)]*\)[\s\S]*?[$][$][\s\S]*?[$][$]\s*LANGUAGE\s+plpgsql\s*;/gi,
    '',
  );

  // Strip ALL CREATE TRIGGER statements (they depend on the plpgsql functions above)
  result = result.replace(
    /CREATE\s+TRIGGER\s+\w+[\s\S]*?EXECUTE\s+FUNCTION\s+\w+\s*\(\s*\)\s*;/gi,
    '',
  );

  return result;
}

// ── Fixture helpers ──────────────────────────────────────────────────────────

export interface TestFixtures {
  userId: string;
  managerId: string;
  adminId: string;
  systemId: string;
  menuId: string;
  vocTypeId: string;
}

/** Insert all FK prerequisite rows needed to create a VOC. Returns their IDs. */
export async function insertFixtures(pool: Pool): Promise<TestFixtures> {
  // Use the same UUIDs as MOCK_USERS so session auth maps correctly
  const adminId = '00000000-0000-0000-0000-000000000001';
  const managerId = '00000000-0000-0000-0000-000000000002';
  const userId = '00000000-0000-0000-0000-000000000003';

  await pool.query(
    `INSERT INTO users (id, ad_username, display_name, email, role) VALUES
      ($1, 'admin', 'Mock Admin', 'admin@company.com', 'admin'),
      ($2, 'manager', 'Mock Manager', 'manager@company.com', 'manager'),
      ($3, 'user', 'Mock User', 'user@company.com', 'user')`,
    [adminId, managerId, userId],
  );

  const sysResult = await pool.query(
    `INSERT INTO systems (name, slug) VALUES ('Test System', 'test-system') RETURNING id`,
  );
  const systemId = sysResult.rows[0].id as string;

  const menuResult = await pool.query(
    `INSERT INTO menus (system_id, name, slug) VALUES ($1, 'Test Menu', 'test-menu') RETURNING id`,
    [systemId],
  );
  const menuId = menuResult.rows[0].id as string;

  const typeResult = await pool.query(
    `INSERT INTO voc_types (name, slug) VALUES ('Bug', 'bug') RETURNING id`,
  );
  const vocTypeId = typeResult.rows[0].id as string;

  return { userId, managerId, adminId, systemId, menuId, vocTypeId };
}

export async function createTestDb() {
  const db = newDb({
    autoCreateForeignKeyIndices: true,
  });

  // Register gen_random_uuid() as built-in replacement
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => crypto.randomUUID(),
    impure: true,
  });

  for (const file of MIGRATION_FILES) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const sql = stripUnsupported(raw);
    // Skip if nothing executable remains after stripping (e.g. 001_extensions.sql → only comments)
    const executable = sql.replace(/--[^\n]*/g, '').trim();
    if (!executable) continue;

    try {
      await db.public.query(sql);
    } catch (err) {
      // Surface which migration failed for easier debugging
      throw new Error(`Migration failed in ${file}: ${(err as Error).message}`);
    }
  }

  const { Pool } = db.adapters.createPg();
  const pool = new Pool();
  return { db, pool };
}
