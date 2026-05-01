/**
 * Masters repository — read-only DB access for filter dropdown master data:
 * users (assignees), tags, voc_types. PR-α (Wave 1.5).
 */
import { getPool } from '../db';
import type {
  AssigneeListItem,
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
