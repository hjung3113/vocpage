/**
 * migration 020 — FU-014: tags(name, kind) UNIQUE
 *
 * Spec: docs/specs/plans/followup-bucket.md FU-014.
 *
 * Pre-020 (004_tags.sql): only `slug UNIQUE`. Same `name` across different
 * `kind` is allowed by intent, but duplicate (name, kind) was only blocked
 * accidentally via slug derivation collisions.
 *
 * Post-020: explicit UNIQUE (name, kind). Same name across different kinds
 * remains allowed; duplicate (name, kind) is rejected at the DB layer.
 */
import { newDb, DataType, IMemoryDb } from 'pg-mem';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

// Stub matching the relevant subset of 004_tags.sql.
const TAGS_STUB = `
  CREATE TABLE tags (
    id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    kind text NOT NULL DEFAULT 'general' CHECK (kind IN ('general','menu'))
  );
`;

function readMigration(file: string): { up: string; down: string } {
  const raw = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
  const upMatch = raw.match(/-- Up Migration([\s\S]*?)(?=-- Down Migration|$)/i);
  const downMatch = raw.match(/-- Down Migration([\s\S]*)$/i);
  if (!upMatch || !downMatch) {
    throw new Error(`Migration ${file} missing Up/Down markers`);
  }
  return { up: upMatch[1].trim(), down: downMatch[1].trim() };
}

function bootDb(): IMemoryDb {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: DataType.uuid,
    implementation: () => crypto.randomUUID(),
    impure: true,
  });
  db.public.query(TAGS_STUB);
  return db;
}

describe('migration 020 — tags(name, kind) UNIQUE (FU-014)', () => {
  it('post-020: same name across different kinds is allowed', () => {
    const db = bootDb();
    const { up } = readMigration('020_tags_name_kind_unique.sql');
    db.public.query(up);

    db.public.query(
      `INSERT INTO tags (name, slug, kind) VALUES ('알림', 'notice-general', 'general');`,
    );
    db.public.query(`INSERT INTO tags (name, slug, kind) VALUES ('알림', 'notice-menu', 'menu');`);

    const rs = db.public.query(`SELECT COUNT(*)::int AS n FROM tags WHERE name = '알림';`);
    expect(rs.rows[0].n).toBe(2);
  });

  it('post-020: duplicate (name, kind) is rejected', () => {
    const db = bootDb();
    const { up } = readMigration('020_tags_name_kind_unique.sql');
    db.public.query(up);

    db.public.query(`INSERT INTO tags (name, slug, kind) VALUES ('버그', 'bug-1', 'general');`);
    expect(() =>
      db.public.query(`INSERT INTO tags (name, slug, kind) VALUES ('버그', 'bug-2', 'general');`),
    ).toThrow();
  });

  it('round-trip down: drops the (name, kind) unique constraint', () => {
    const db = bootDb();
    const { up, down } = readMigration('020_tags_name_kind_unique.sql');
    db.public.query(up);
    db.public.query(down);

    // Without the FU-014 constraint, duplicate (name, kind) is again allowed
    // (the only remaining collision check is on slug, which we vary here).
    db.public.query(`INSERT INTO tags (name, slug, kind) VALUES ('피드백', 'fb-1', 'general');`);
    expect(() =>
      db.public.query(`INSERT INTO tags (name, slug, kind) VALUES ('피드백', 'fb-2', 'general');`),
    ).not.toThrow();
  });
});
