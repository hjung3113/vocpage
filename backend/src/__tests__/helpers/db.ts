import { newDb, DataType } from 'pg-mem';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

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
  return result;
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
