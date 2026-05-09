/**
 * Comments repository — raw SQL against `comments` table (migration 005).
 *
 * See feature-voc.md §8.13 for schema and behavioural decisions.
 * Table: id, voc_id, author_id, body, created_at, updated_at.
 * Trigger trg_comments_updated_at auto-updates updated_at on PATCH.
 */
import { pool } from '../db';
import type { Comment } from '../../../shared/contracts/comment';

/**
 * List comments for a VOC ordered by created_at ASC, hard cap 200 rows.
 * Internal notes (voc_internal_notes) are a different table — never mixed in.
 */
export async function listByVocId(voc_id: string): Promise<Comment[]> {
  const r = await pool.query<Comment>(
    `SELECT id, voc_id, author_id, body,
            created_at::text, updated_at::text
       FROM comments
      WHERE voc_id = $1
      ORDER BY created_at ASC
      LIMIT 200`,
    [voc_id],
  );
  return r.rows;
}

/** Returns null when not found. */
export async function getById(id: string): Promise<Comment | null> {
  const r = await pool.query<Comment>(
    `SELECT id, voc_id, author_id, body,
            created_at::text, updated_at::text
       FROM comments
      WHERE id = $1`,
    [id],
  );
  return r.rows[0] ?? null;
}

export async function insert(input: {
  voc_id: string;
  author_id: string;
  body: string;
}): Promise<Comment> {
  const r = await pool.query<Comment>(
    `INSERT INTO comments (voc_id, author_id, body)
          VALUES ($1, $2, $3)
          RETURNING id, voc_id, author_id, body,
                    created_at::text, updated_at::text`,
    [input.voc_id, input.author_id, input.body],
  );
  return r.rows[0]!;
}

/** Returns null when not found (caller throws 404). */
export async function update(id: string, body: string): Promise<Comment | null> {
  const r = await pool.query<Comment>(
    `UPDATE comments SET body = $2, updated_at = now()
      WHERE id = $1
      RETURNING id, voc_id, author_id, body,
                created_at::text, updated_at::text`,
    [id, body],
  );
  return r.rows[0] ?? null;
}

/** Returns true when a row was deleted, false when not found. */
export async function deleteById(id: string): Promise<boolean> {
  const r = await pool.query(`DELETE FROM comments WHERE id = $1`, [id]);
  return (r.rowCount ?? 0) > 0;
}
