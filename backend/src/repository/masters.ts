/**
 * Masters repository — read-only DB access for filter dropdown master data:
 * users (assignees), tags, voc_types. PR-α (Wave 1.5).
 */
import { getPool } from '../db';
import type {
  AssigneeListItem,
  MenuListItem,
  SystemListItem,
  TagListItem,
  VocTypeListItem,
} from '../../../shared/contracts/master';

export async function listAssignees(): Promise<AssigneeListItem[]> {
  const pool = getPool();
  const r = await pool.query(
    `SELECT id, ad_username, display_name
       FROM users
      WHERE is_active = true
      ORDER BY display_name`,
  );
  return r.rows as AssigneeListItem[];
}

export async function listTags(): Promise<TagListItem[]> {
  const pool = getPool();
  const r = await pool.query(`SELECT id, name, slug, kind FROM tags ORDER BY name`);
  return r.rows as TagListItem[];
}

export async function listVocTypes(): Promise<VocTypeListItem[]> {
  const pool = getPool();
  const r = await pool.query(
    `SELECT id, name, slug, color, sort_order, is_archived
       FROM voc_types
      WHERE is_archived = false
      ORDER BY sort_order, name`,
  );
  return r.rows as VocTypeListItem[];
}

// VOC 등록 모달의 cascade 응답. archived 시스템·메뉴는 제외하고 반환한다.
// (`shared/contracts/master/io.ts:50` + feature-voc.md §8.8/§9.11.6)
export async function listSystems(): Promise<SystemListItem[]> {
  const pool = getPool();
  const r = await pool.query(
    `SELECT s.id, s.name, s.slug, s.is_archived,
            COALESCE(
              (SELECT json_agg(json_build_object(
                 'id', m.id,
                 'system_id', m.system_id,
                 'name', m.name,
                 'slug', m.slug,
                 'is_archived', m.is_archived
               ) ORDER BY m.name)
                 FROM menus m
                WHERE m.system_id = s.id
                  AND m.is_archived = false),
              '[]'::json
            ) AS menus
       FROM systems s
      WHERE s.is_archived = false
      ORDER BY s.name`,
  );
  return r.rows as SystemListItem[];
}

// Admin 단독 endpoint. `system_id` 필터 + `includeArchived=true` 시 archived
// row 포함. (`shared/contracts/master/io.ts:50`)
export async function listMenus(opts: {
  systemId?: string;
  includeArchived?: boolean;
}): Promise<MenuListItem[]> {
  const pool = getPool();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.systemId) {
    params.push(opts.systemId);
    where.push(`system_id = $${params.length}`);
  }
  if (!opts.includeArchived) {
    where.push(`is_archived = false`);
  }
  const sql = `SELECT id, system_id, name, slug, is_archived
                 FROM menus
                ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                ORDER BY name`;
  const r = await pool.query(sql, params);
  return r.rows as MenuListItem[];
}
