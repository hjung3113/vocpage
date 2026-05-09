/**
 * migration 019 — FU-013: vocs.parent_id ON DELETE SET NULL
 *
 * Spec: docs/specs/plans/followup-bucket.md FU-013, ADR 0005 §6 case 6.
 *
 * Pre-019 (003_vocs.sql:46): parent_id REFERENCES vocs(id) — no ON DELETE clause
 * → default NO ACTION → hard-deleting a parent with sub-tasks raised FK violation.
 *
 * Post-019: parent hard-delete clears child.parent_id (children become root rows).
 *
 * Test approach: pg-mem stub of vocs(id, parent_id) with the pre-019 self-FK,
 * apply migration 019 up, exercise DELETE semantics, then apply down and verify
 * the original NO ACTION behavior is restored.
 */
import { newDb, DataType, IMemoryDb } from 'pg-mem';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

// Stub matching the relevant subset of 003_vocs.sql for this test:
// PK + self-FK on parent_id with no ON DELETE clause (default NO ACTION).
const VOCS_STUB = `
  CREATE TABLE vocs (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id uuid,
    CONSTRAINT vocs_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES vocs(id)
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
  db.public.query(VOCS_STUB);
  return db;
}

describe('migration 019 — vocs.parent_id ON DELETE SET NULL (FU-013)', () => {
  it('post-019: hard-deleting parent NULLs child.parent_id', () => {
    const db = bootDb();
    const { up } = readMigration('019_voc_parent_set_null.sql');
    db.public.query(up);

    const parentId = '00000000-0000-0000-0000-0000000000aa';
    const childId = '00000000-0000-0000-0000-0000000000bb';
    db.public.query(`INSERT INTO vocs (id, parent_id) VALUES ('${parentId}', NULL);`);
    db.public.query(`INSERT INTO vocs (id, parent_id) VALUES ('${childId}', '${parentId}');`);

    db.public.query(`DELETE FROM vocs WHERE id = '${parentId}';`);

    const rs = db.public.query(`SELECT id, parent_id FROM vocs WHERE id = '${childId}';`);
    expect(rs.rows).toHaveLength(1);
    expect(rs.rows[0].parent_id).toBeNull();
  });

  it('round-trip down: restores pre-019 NO ACTION (parent delete blocked)', () => {
    const db = bootDb();
    const { up, down } = readMigration('019_voc_parent_set_null.sql');
    db.public.query(up);
    db.public.query(down);

    const parentId = '00000000-0000-0000-0000-0000000000cc';
    const childId = '00000000-0000-0000-0000-0000000000dd';
    db.public.query(`INSERT INTO vocs (id, parent_id) VALUES ('${parentId}', NULL);`);
    db.public.query(`INSERT INTO vocs (id, parent_id) VALUES ('${childId}', '${parentId}');`);

    expect(() => db.public.query(`DELETE FROM vocs WHERE id = '${parentId}';`)).toThrow();
  });

  it('orphan child (parent already gone) does not block subsequent inserts', () => {
    // Sanity check that SET NULL semantics do not cascade-delete the child.
    const db = bootDb();
    const { up } = readMigration('019_voc_parent_set_null.sql');
    db.public.query(up);

    const parentId = '00000000-0000-0000-0000-0000000000ee';
    const childId = '00000000-0000-0000-0000-0000000000ff';
    db.public.query(`INSERT INTO vocs (id, parent_id) VALUES ('${parentId}', NULL);`);
    db.public.query(`INSERT INTO vocs (id, parent_id) VALUES ('${childId}', '${parentId}');`);
    db.public.query(`DELETE FROM vocs WHERE id = '${parentId}';`);

    const rs = db.public.query(`SELECT COUNT(*)::int AS n FROM vocs;`);
    expect(rs.rows[0].n).toBe(1);
  });
});
