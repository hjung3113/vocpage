#!/usr/bin/env tsx
/**
 * check-fixture-seed-parity.ts
 * Verifies that shared/fixtures/voc.fixtures.ts and the vocs migration
 * declare the same column names + required constraints.
 * Exit 0 = OK or SKIPPED; Exit 1 = mismatch found.
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

const FIXTURE_PATH = path.join(ROOT, 'shared', 'fixtures', 'voc.fixtures.ts');
// Migration 003_vocs.sql is the canonical source for the vocs table DDL
const MIGRATION_PATH = path.join(ROOT, 'backend', 'migrations', '003_vocs.sql');

// ---- helpers ---------------------------------------------------------------

function parseDbColumns(sql: string): Map<string, boolean> {
  // Extract CREATE TABLE vocs ( ... )
  const match = sql.match(/CREATE TABLE vocs\s*\(([\s\S]*?)\);/);
  if (!match) return new Map();

  const body = match[1];
  const cols = new Map<string, boolean>(); // name -> isNotNull

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('--') || line.startsWith('CHECK')) continue;

    // Match lines like:  col_name  type  [NOT NULL] ...
    const colMatch = line.match(/^(\w+)\s+\S+/);
    if (!colMatch) continue;

    const name = colMatch[1];
    // Skip constraint keywords
    if (['PRIMARY', 'UNIQUE', 'FOREIGN', 'CHECK', 'CONSTRAINT'].includes(name.toUpperCase()))
      continue;

    const notNull =
      /NOT NULL/i.test(line) ||
      // columns with DEFAULT are effectively required from fixture perspective too,
      // but we only flag explicit NOT NULL for the constraint check
      false;

    cols.set(name, notNull);
  }
  return cols;
}

function parseFixtureColumns(src: string): Map<string, boolean> {
  // Look for object literal keys in the voc fixture array elements.
  // Pattern: exported const/array with object literals { key: value, ... }
  // We use a simple regex to collect all object keys inside the fixture.
  const cols = new Map<string, boolean>(); // name -> hasValue (non-undefined)

  // Find all object literal keys followed by `: ` (not inside comments)
  const keyPattern = /^\s{2,}(\w+)\s*:/gm;
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = keyPattern.exec(src)) !== null) {
    const key = m[1];
    // Check whether this line has an explicit undefined value
    const lineStart = src.lastIndexOf('\n', m.index) + 1;
    const lineEnd = src.indexOf('\n', m.index);
    const line = src.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    const hasValue = !/:\s*undefined\b/.test(line);
    // Only set false if not already true
    if (!cols.has(key)) {
      cols.set(key, hasValue);
    }
  }
  return cols;
}

// ---- main ------------------------------------------------------------------

function main(): void {
  const fixtureExists = fs.existsSync(FIXTURE_PATH);
  const migrationExists = fs.existsSync(MIGRATION_PATH);

  if (!fixtureExists || !migrationExists) {
    const missing = [
      !fixtureExists ? 'shared/fixtures/voc.fixtures.ts' : null,
      !migrationExists ? 'backend/migrations/003_vocs.sql' : null,
    ]
      .filter(Boolean)
      .join(', ');
    console.log(`[parity] SKIPPED -- files not yet present (Wave 1+): ${missing}`);
    process.exit(0);
  }

  const migrationSql = fs.readFileSync(MIGRATION_PATH, 'utf8');
  const fixtureSrc = fs.readFileSync(FIXTURE_PATH, 'utf8');

  const dbCols = parseDbColumns(migrationSql);
  const fixtureCols = parseFixtureColumns(fixtureSrc);

  if (dbCols.size === 0) {
    console.error('[parity] ERROR -- could not parse CREATE TABLE vocs from migration');
    process.exit(1);
  }

  const errors: string[] = [];

  // Columns in DB not in fixture
  for (const [col] of dbCols) {
    if (!fixtureCols.has(col)) {
      errors.push(`  missing-in-fixture: ${col}`);
    }
  }

  // Columns in fixture not in DB
  for (const [col] of fixtureCols) {
    if (!dbCols.has(col)) {
      errors.push(`  missing-in-seed/migration: ${col}`);
    }
  }

  // NOT NULL columns must have a value in fixture
  for (const [col, notNull] of dbCols) {
    if (notNull && fixtureCols.has(col) && fixtureCols.get(col) === false) {
      errors.push(`  NOT NULL column has undefined in fixture: ${col}`);
    }
  }

  if (errors.length > 0) {
    console.error('[parity] MISMATCH -- fixture and migration are out of sync:');
    for (const e of errors) console.error(e);
    process.exit(1);
  }

  console.log('[parity] OK');
  process.exit(0);
}

main();
