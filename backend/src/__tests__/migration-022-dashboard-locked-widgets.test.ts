/**
 * migration 022 — Wave 2 W2-2: dashboard_settings.locked_widgets JSONB.
 *
 * Spec: docs/specs/requires/dashboard.md §커스터마이즈 v2 §잠금 머지 규칙.
 * Plan: docs/specs/plans/wave-2-dashboard.md §3 W2-D3, §6.2 W2-2.
 *
 * Test boundaries:
 *  - up 적용 → locked_widgets 컬럼 존재 / DEFAULT '[]' / 위젯 ID 문자열 배열 삽입 정상
 *  - down 적용 → 컬럼 제거 (해당 컬럼 SELECT 시 throw)
 *
 * pg-mem 한계: jsonb DEFAULT '[]'::jsonb 는 round-trip 시 빈 배열 반환.
 */
import { newDb, DataType, IMemoryDb } from 'pg-mem';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

const DASHBOARD_SETTINGS_STUB = `
  CREATE TABLE dashboard_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    widget_order jsonb NOT NULL DEFAULT '[]'::jsonb,
    widget_visibility jsonb NOT NULL DEFAULT '{}'::jsonb,
    widget_sizes jsonb NOT NULL DEFAULT '{}'::jsonb,
    locked_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
    default_date_range varchar(8) NOT NULL DEFAULT '1m',
    heatmap_default_x_axis varchar(16) NOT NULL DEFAULT 'status',
    globaltabs_order jsonb,
    updated_at timestamptz NOT NULL DEFAULT NOW()
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
  db.public.query(DASHBOARD_SETTINGS_STUB);
  return db;
}

describe('migration 022 — dashboard_settings.locked_widgets (Wave 2 W2-2)', () => {
  it('post-022: locked_widgets column exists with DEFAULT []', () => {
    const db = bootDb();
    const { up } = readMigration('022_dashboard_locked_widgets.sql');
    db.public.query(up);

    db.public.query(`INSERT INTO dashboard_settings (user_id) VALUES (NULL);`);
    const rs = db.public.query(`SELECT locked_widgets FROM dashboard_settings;`);
    expect(rs.rows[0].locked_widgets).toEqual([]);
  });

  it('post-022: accepts widget ID string array', () => {
    const db = bootDb();
    const { up } = readMigration('022_dashboard_locked_widgets.sql');
    db.public.query(up);

    db.public.query(
      `INSERT INTO dashboard_settings (locked_widgets) VALUES ('["kpi","heatmap"]'::jsonb);`,
    );
    const rs = db.public.query(`SELECT locked_widgets FROM dashboard_settings;`);
    expect(rs.rows[0].locked_widgets).toEqual(['kpi', 'heatmap']);
  });

  it('round-trip down: drops the locked_widgets column', () => {
    const db = bootDb();
    const { up, down } = readMigration('022_dashboard_locked_widgets.sql');
    db.public.query(up);
    db.public.query(down);

    expect(() => db.public.query(`SELECT locked_widgets FROM dashboard_settings;`)).toThrow();
  });
});
