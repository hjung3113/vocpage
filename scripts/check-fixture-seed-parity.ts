#!/usr/bin/env tsx
/**
 * check-fixture-seed-parity.ts
 *
 * Verifies that every NOT NULL column declared by the `vocs` migration is
 * populated in `shared/fixtures/voc.fixtures` (sampled from VOC_FIXTURES[0]).
 * Columns that are nullable, have a DEFAULT, or are populated by triggers
 * (e.g. `sequence_no`, `issue_code`) are allowed to be missing from the
 * fixture — they simply do not break the parity contract.
 *
 * Exit 0 = OK or SKIPPED; Exit 1 = mismatch.
 *
 * Wave 1 history: an earlier regex-based version produced false positives
 * because the fixture module contains many non-row keys (RowSpec interface,
 * SYS / FIXTURE_USERS constants, voc_history rows, …). Importing the
 * compiled fixture and inspecting Object.keys is robust by construction.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_PATH = path.join(ROOT, 'shared', 'fixtures', 'voc.fixtures.ts');
const MIGRATION_PATH = path.join(ROOT, 'backend', 'migrations', '003_vocs.sql');

interface DbCol {
  name: string;
  notNull: boolean;
  hasDefault: boolean;
}

function parseDbColumns(sql: string): DbCol[] {
  const match = sql.match(/CREATE TABLE vocs\s*\(([\s\S]*?)\);/);
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

async function main(): Promise<void> {
  if (!fs.existsSync(FIXTURE_PATH) || !fs.existsSync(MIGRATION_PATH)) {
    const missing = [
      !fs.existsSync(FIXTURE_PATH) ? 'shared/fixtures/voc.fixtures.ts' : null,
      !fs.existsSync(MIGRATION_PATH) ? 'backend/migrations/003_vocs.sql' : null,
    ]
      .filter(Boolean)
      .join(', ');
    console.log(`[parity] SKIPPED -- files not yet present: ${missing}`);
    process.exit(0);
  }

  const dbCols = parseDbColumns(fs.readFileSync(MIGRATION_PATH, 'utf8'));
  if (dbCols.length === 0) {
    console.error('[parity] ERROR -- could not parse CREATE TABLE vocs from migration');
    process.exit(1);
  }

  const fixtureModule = await import(FIXTURE_PATH);
  const sample = fixtureModule.VOC_FIXTURES?.[0];
  if (!sample || typeof sample !== 'object') {
    console.error('[parity] ERROR -- VOC_FIXTURES[0] is not an object');
    process.exit(1);
  }

  const fixtureKeys = new Set(Object.keys(sample));
  const errors: string[] = [];

  // Every NOT NULL DB column without a DEFAULT must appear in the fixture.
  // Triggers (sequence_no, issue_code) populate values; explicitly excluded
  // because the fixture may pre-set them but the BE insert path does not
  // require it.
  const TRIGGER_POPULATED = new Set(['sequence_no', 'issue_code']);
  for (const col of dbCols) {
    if (TRIGGER_POPULATED.has(col.name)) continue;
    if (col.notNull && !col.hasDefault && !fixtureKeys.has(col.name)) {
      errors.push(`  required column missing in fixture: ${col.name}`);
    }
  }

  // Every fixture key must correspond to an actual DB column.
  const dbColNames = new Set(dbCols.map((c) => c.name));
  for (const key of fixtureKeys) {
    if (!dbColNames.has(key)) {
      errors.push(`  fixture key not in vocs schema: ${key}`);
    }
  }

  if (errors.length > 0) {
    console.error('[parity] MISMATCH -- VOC_FIXTURES[0] vs vocs migration:');
    for (const e of errors) console.error(e);
    process.exit(1);
  }

  console.log(
    `[parity] OK -- ${fixtureKeys.size} fixture keys reconciled against ${dbCols.length} columns`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[parity] ERROR --', err);
  process.exit(1);
});
