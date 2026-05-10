#!/usr/bin/env tsx
/**
 * check-fixture-seed-parity.ts
 *
 * Verifies that every NOT NULL column declared by a tracked migration is
 * populated in the matching fixture row. Columns that are nullable, have a
 * DEFAULT, or are populated by triggers (e.g. `sequence_no`, `issue_code`)
 * are allowed to be missing — they simply do not break the parity contract.
 *
 * Generalized (Wave 0, 2026-05-10):
 *   - Multi-table TARGETS triple — adds `tag_rules` alongside `vocs`.
 *   - Schema reconstruction now merges base CREATE TABLE columns with
 *     subsequent ALTER TABLE ADD COLUMN / DROP COLUMN clauses across the
 *     migrations array, in apply order.
 *
 * Exit 0 = OK or SKIPPED; Exit 1 = mismatch in any target.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

interface Target {
  table: string;
  /** Migration files in apply order: base CREATE first, then each ALTER. */
  migrations: string[];
  /** Fixture module path (relative to repo root). */
  fixture: string;
  /** Named export on the fixture module that holds the row array. */
  sampleKey: string;
  /** Columns populated by triggers (excluded from parity even if NOT NULL). */
  triggerCols?: Set<string>;
}

const TARGETS: Target[] = [
  {
    table: 'vocs',
    migrations: ['backend/migrations/003_vocs.sql'],
    fixture: 'shared/fixtures/voc.fixtures.ts',
    sampleKey: 'VOC_FIXTURES',
    triggerCols: new Set(['sequence_no', 'issue_code']),
  },
  {
    table: 'tag_rules',
    // NOTE: Plan 02 (mig 024) will append 'backend/migrations/024_tag_rules_created_by.sql' here.
    migrations: [
      'backend/migrations/004_tags.sql',
      'backend/migrations/014_tag_master_ops.sql',
    ],
    fixture: 'shared/fixtures/admin-tag-rule.fixtures.ts',
    sampleKey: 'ADMIN_TAG_RULE_FIXTURES',
  },
];

interface DbCol {
  name: string;
  notNull: boolean;
  hasDefault: boolean;
}

/**
 * Parse the column list from a CREATE TABLE <table> ( ... ); statement.
 * Returns [] if the statement is not present.
 */
function parseCreateTable(sql: string, table: string): DbCol[] {
  const re = new RegExp(`CREATE TABLE\\s+${table}\\s*\\(([\\s\\S]*?)\\);`, 'i');
  const match = sql.match(re);
  if (!match) return [];

  const cols: DbCol[] = [];
  for (const rawLine of match[1].split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('--')) continue;

    const colMatch = line.match(/^(\w+)\s+\S+/);
    if (!colMatch) continue;

    const name = colMatch[1];
    if (['PRIMARY', 'UNIQUE', 'FOREIGN', 'CHECK', 'CONSTRAINT'].includes(name.toUpperCase()))
      continue;

    cols.push({
      name,
      notNull: /NOT NULL/i.test(line),
      hasDefault: /\bDEFAULT\b/i.test(line),
    });
  }
  return cols;
}

/**
 * Extract ALTER TABLE <table> ADD COLUMN / DROP COLUMN statements that touch
 * the given table. Returns ordered list of mutations to apply.
 *
 * Supported (intentionally simple):
 *   ALTER TABLE <table> ADD COLUMN <name> <type ...>;
 *   ALTER TABLE <table> DROP COLUMN [IF EXISTS] <name>;
 *
 * Anything else (RENAME, ALTER COLUMN TYPE, constraints) is ignored — no
 * tracked migration uses those forms today.
 */
type AlterOp =
  | { kind: 'add'; col: DbCol }
  | { kind: 'drop'; name: string };

function parseAlters(sql: string, table: string): AlterOp[] {
  const ops: AlterOp[] = [];
  const tableEsc = table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // ADD COLUMN
  const addRe = new RegExp(
    `ALTER\\s+TABLE\\s+${tableEsc}\\s+ADD\\s+COLUMN\\s+(\\w+)\\s+([^;]+?);`,
    'gi',
  );
  for (const m of sql.matchAll(addRe)) {
    const name = m[1];
    const rest = m[2];
    ops.push({
      kind: 'add',
      col: {
        name,
        notNull: /NOT\s+NULL/i.test(rest),
        hasDefault: /\bDEFAULT\b/i.test(rest),
      },
    });
  }

  // DROP COLUMN
  const dropRe = new RegExp(
    `ALTER\\s+TABLE\\s+${tableEsc}\\s+DROP\\s+COLUMN(?:\\s+IF\\s+EXISTS)?\\s+(\\w+)\\s*;`,
    'gi',
  );
  for (const m of sql.matchAll(dropRe)) {
    ops.push({ kind: 'drop', name: m[1] });
  }

  return ops;
}

/**
 * Reconstruct the effective column set for `table` after applying all migrations
 * in order. Only the Up section of each migration file is considered.
 */
function reconstructColumns(migrationFiles: string[], table: string): DbCol[] {
  const cols = new Map<string, DbCol>();

  for (const relPath of migrationFiles) {
    const absPath = path.join(ROOT, relPath);
    const raw = fs.readFileSync(absPath, 'utf8');

    // Use Up Migration section if marker is present, else whole file.
    const upMatch = raw.match(/-- Up Migration([\s\S]*?)(?=-- Down Migration|$)/i);
    const upSql = upMatch ? upMatch[1] : raw;

    // Apply CREATE TABLE if this migration defines the base table.
    const created = parseCreateTable(upSql, table);
    for (const c of created) cols.set(c.name, c);

    // Apply ALTERs.
    for (const op of parseAlters(upSql, table)) {
      if (op.kind === 'add') cols.set(op.col.name, op.col);
      else cols.delete(op.name);
    }
  }

  return [...cols.values()];
}

async function checkTarget(t: Target): Promise<string[]> {
  const fixturePath = path.join(ROOT, t.fixture);
  const allMigrationsExist = t.migrations.every((m) => fs.existsSync(path.join(ROOT, m)));

  if (!fs.existsSync(fixturePath) || !allMigrationsExist) {
    const missing: string[] = [];
    if (!fs.existsSync(fixturePath)) missing.push(t.fixture);
    for (const m of t.migrations) {
      if (!fs.existsSync(path.join(ROOT, m))) missing.push(m);
    }
    console.log(`[parity:${t.table}] SKIPPED -- files not yet present: ${missing.join(', ')}`);
    return [];
  }

  const dbCols = reconstructColumns(t.migrations, t.table);
  if (dbCols.length === 0) {
    return [`[parity:${t.table}] could not parse CREATE TABLE ${t.table} from migrations`];
  }

  const fixtureModule = await import(fixturePath);
  const sample = fixtureModule[t.sampleKey]?.[0];
  if (!sample || typeof sample !== 'object') {
    return [`[parity:${t.table}] ${t.sampleKey}[0] is not an object on ${t.fixture}`];
  }

  const fixtureKeys = new Set(Object.keys(sample));
  const errors: string[] = [];
  const triggerCols = t.triggerCols ?? new Set<string>();

  // Every NOT NULL DB column without a DEFAULT must appear in the fixture.
  for (const col of dbCols) {
    if (triggerCols.has(col.name)) continue;
    if (col.notNull && !col.hasDefault && !fixtureKeys.has(col.name)) {
      errors.push(`  [${t.table}] required column missing in fixture: ${col.name}`);
    }
  }

  // Every fixture key must correspond to an actual DB column.
  const dbColNames = new Set(dbCols.map((c) => c.name));
  for (const key of fixtureKeys) {
    if (!dbColNames.has(key)) {
      errors.push(`  [${t.table}] fixture key not in ${t.table} schema: ${key}`);
    }
  }

  if (errors.length === 0) {
    console.log(
      `[parity:${t.table}] OK -- ${fixtureKeys.size} fixture keys reconciled against ${dbCols.length} columns`,
    );
  }

  return errors;
}

async function main(): Promise<void> {
  let allErrors: string[] = [];
  for (const t of TARGETS) {
    const errs = await checkTarget(t);
    allErrors = allErrors.concat(errs);
  }

  if (allErrors.length > 0) {
    console.error('[parity] MISMATCH:');
    for (const e of allErrors) console.error(e);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('[parity] ERROR --', err);
  process.exit(1);
});
