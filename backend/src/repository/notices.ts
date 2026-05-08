/**
 * Notices repository — DB access for notice CRUD + popup feed.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.3.
 */
import { getPool } from '../db';
import type { Notice, NoticeCreate, NoticeUpdate } from '../../../shared/contracts/notice';

const COLUMNS = `id, title, body, level, is_popup, is_visible,
  visible_from, visible_to, author_id, deleted_at, created_at, updated_at`;

function toIso(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function row(r: Record<string, unknown>): Notice {
  return {
    id: r.id as string,
    title: r.title as string,
    body: r.body as string,
    level: r.level as Notice['level'],
    is_popup: Boolean(r.is_popup),
    is_visible: Boolean(r.is_visible),
    visible_from: toIso(r.visible_from),
    visible_to: toIso(r.visible_to),
    author_id: r.author_id as string,
    deleted_at: toIso(r.deleted_at),
    created_at: toIso(r.created_at) as string,
    updated_at: toIso(r.updated_at) as string,
  };
}

export interface ListOpts {
  page: number;
  per_page: number;
  includeDeleted?: boolean;
  /** user mode = visible+within-period; admin mode = all */
  mode?: 'user' | 'admin';
}

export async function list(opts: ListOpts): Promise<{ rows: Notice[]; total: number }> {
  const pool = getPool();
  const conds: string[] = [];
  const args: unknown[] = [];
  if (!opts.includeDeleted) conds.push('deleted_at IS NULL');
  if (opts.mode !== 'admin') {
    conds.push('is_visible = true');
    conds.push('(visible_from IS NULL OR visible_from <= now())');
    conds.push('(visible_to IS NULL OR visible_to >= now())');
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  args.push(opts.per_page, (opts.page - 1) * opts.per_page);
  const r = await pool.query(
    `SELECT ${COLUMNS} FROM notices ${where}
       ORDER BY created_at DESC
       LIMIT $${args.length - 1} OFFSET $${args.length}`,
    args,
  );
  const c = await pool.query(`SELECT count(*)::int AS n FROM notices ${where}`, []);
  return { rows: r.rows.map(row), total: c.rows[0]?.n ?? 0 };
}

export async function popup(): Promise<Notice[]> {
  const pool = getPool();
  const r = await pool.query(
    `SELECT ${COLUMNS} FROM notices
      WHERE deleted_at IS NULL
        AND is_visible = true
        AND is_popup = true
        AND (visible_from IS NULL OR visible_from <= now())
        AND (visible_to IS NULL OR visible_to >= now())
      ORDER BY CASE level WHEN 'urgent' THEN 0 WHEN 'important' THEN 1 ELSE 2 END,
               created_at DESC`,
  );
  return r.rows.map(row);
}

export async function getById(id: string): Promise<Notice | null> {
  const pool = getPool();
  const r = await pool.query(`SELECT ${COLUMNS} FROM notices WHERE id = $1`, [id]);
  return r.rows[0] ? row(r.rows[0]) : null;
}

export async function create(input: NoticeCreate, authorId: string): Promise<Notice> {
  const pool = getPool();
  const r = await pool.query(
    `INSERT INTO notices (title, body, level, is_popup, is_visible, visible_from, visible_to, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${COLUMNS}`,
    [
      input.title,
      input.body,
      input.level ?? 'normal',
      input.is_popup ?? false,
      input.is_visible ?? true,
      input.visible_from ?? null,
      input.visible_to ?? null,
      authorId,
    ],
  );
  return row(r.rows[0]);
}

export async function update(id: string, patch: NoticeUpdate): Promise<Notice | null> {
  const pool = getPool();
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    args.push(v);
    sets.push(`${k} = $${args.length}`);
  }
  if (!sets.length) return getById(id);
  args.push(id);
  const r = await pool.query(
    `UPDATE notices SET ${sets.join(', ')} WHERE id = $${args.length} RETURNING ${COLUMNS}`,
    args,
  );
  return r.rows[0] ? row(r.rows[0]) : null;
}

export async function softDelete(id: string): Promise<boolean> {
  const pool = getPool();
  const r = await pool.query(
    `UPDATE notices SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [id],
  );
  return r.rows.length > 0;
}

export async function restore(id: string): Promise<Notice | null> {
  const pool = getPool();
  const r = await pool.query(
    `UPDATE notices SET deleted_at = NULL WHERE id = $1 RETURNING ${COLUMNS}`,
    [id],
  );
  return r.rows[0] ? row(r.rows[0]) : null;
}
