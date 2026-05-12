/**
 * Service-level SQL regression test (CR-01).
 *
 * Runs TAG_RULE_SELECT_BASE against pg-mem booted with the real users + tag_rules
 * schema (mig 002 + 004 + 014 + 024). Catches column-name drift between service
 * SQL and migrations — the kind of bug jest.mock-based route tests bypass.
 */
import { newDb, DataType, IMemoryDb } from 'pg-mem';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { TAG_RULE_SELECT_BASE } from '../tag-master';

const MIG_DIR = path.resolve(__dirname, '../../../../migrations');

function stripUnsupported(sql: string): string {
  return sql
    .split('\n')
    .filter((l) => !/CREATE EXTENSION/i.test(l))
    .join('\n')
    .replace(/,?\s*embedding\s+vector\(\d+\)[^\n,]*/gi, '')
    .replace(/uuid_generate_v4\(\)/g, 'gen_random_uuid()');
}

function readUp(file: string): string {
  const raw = fs.readFileSync(path.join(MIG_DIR, file), 'utf-8');
  const m = raw.match(/-- Up Migration([\s\S]*?)(?=-- Down Migration|$)/i);
  return stripUnsupported(m ? m[1] : raw);
}

async function bootDb(): Promise<IMemoryDb> {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => crypto.randomUUID(),
    impure: true,
  });
  // pg-mem can't run mig 002 (PL/pgSQL triggers, plpgsql language). Create a
  // users stub whose column shape mirrors mig 002's `users` table — this is
  // the surface TAG_RULE_SELECT_BASE actually joins against. If a column
  // referenced by the SELECT does not exist here, the test fails.
  db.public.query(`CREATE TABLE vocs (id uuid PRIMARY KEY);`);
  db.public.query(`
    CREATE TABLE users (
      id uuid PRIMARY KEY,
      ad_username text NOT NULL,
      display_name text NOT NULL,
      email text,
      role text NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  for (const f of ['004_tags.sql', '014_tag_master_ops.sql', '024_tag_rules_created_by.sql']) {
    const sql = readUp(f);
    if (sql.trim()) db.public.query(sql);
  }
  return db;
}

describe('TAG_RULE_SELECT_BASE — CR-01 column regression guard', () => {
  it('runs cleanly against the real users + tag_rules schema', async () => {
    const db = await bootDb();
    // Seed minimal data so the JOIN actually resolves.
    const userId = crypto.randomUUID();
    const tagId = crypto.randomUUID();
    db.public.query(
      `INSERT INTO users (id, ad_username, display_name, email, role)
       VALUES ('${userId}', 'tester', '테스터', 'tester@x.local', 'admin')`,
    );
    db.public.query(
      `INSERT INTO tags (id, name, slug, kind)
       VALUES ('${tagId}', '버그', 'bug', 'general')`,
    );
    db.public.query(
      `INSERT INTO tag_rules
         (id, tag_id, name, kind, keywords, match_mode, created_by, created_at)
       VALUES (gen_random_uuid(), '${tagId}', 'r1', 'general',
               ARRAY['error'], 'keyword', '${userId}', now())`,
    );

    // Should not throw. If a column referenced in TAG_RULE_SELECT_BASE does not
    // exist in the live schema, pg-mem raises a parse/resolve error here.
    const rs = db.public.query(`${TAG_RULE_SELECT_BASE} WHERE tr.tag_id = '${tagId}'`);
    expect(rs.rows).toHaveLength(1);
    const row = rs.rows[0] as Record<string, unknown>;
    expect(row.created_by_name).toBe('테스터');
    expect(row.keywords).toEqual(['error']);
  });
});
