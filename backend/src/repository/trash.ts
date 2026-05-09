/**
 * Trash repository — DB access for soft-deleted VOC operations.
 * Service layer imports from here; tests mock this module.
 *
 * Spec: requirements.md §15.4 + feature-voc.md §9.4.7 + ADR 0005.
 * Schema: backend/migrations/015_trash_audit.sql.
 */
import { getPool } from '../db';
import { HttpError } from '../middleware/httpError';
import type {
  TrashListQuery,
  TrashListResponse,
  VocRestoreLogEntry,
  VocRestoreResponse,
} from '../../../shared/contracts/admin/trash';

/**
 * List soft-deleted VOCs (deleted_at IS NOT NULL).
 * Supports filtering by system_id, menu_id, q (title/issue_code), deleted_from/to.
 */
export async function listTrashedVocs(
  params: TrashListQuery,
  _actorId: string,
): Promise<TrashListResponse> {
  const pool = getPool();
  const conditions: string[] = ['v.deleted_at IS NOT NULL'];
  const values: unknown[] = [];
  let i = 1;

  if (params.system_id) {
    conditions.push(`v.system_id = $${i++}`);
    values.push(params.system_id);
  }
  if (params.menu_id) {
    conditions.push(`v.menu_id = $${i++}`);
    values.push(params.menu_id);
  }
  if (params.q) {
    const escaped = params.q.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    conditions.push(
      `(v.title ILIKE $${i} ESCAPE '\\' OR v.issue_code ILIKE $${i} ESCAPE '\\')`,
    );
    values.push(`%${escaped}%`);
    i++;
  }
  if (params.deleted_from) {
    conditions.push(`v.deleted_at >= $${i++}`);
    values.push(params.deleted_from);
  }
  if (params.deleted_to) {
    conditions.push(`v.deleted_at <= $${i++}`);
    values.push(params.deleted_to);
  }

  const where = conditions.join(' AND ');
  const offset = (params.page - 1) * params.per_page;

  const { rows: countRows } = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM vocs v WHERE ${where}`,
    values,
  );
  const total = parseInt(countRows[0].total, 10);

  const { rows } = await pool.query(
    `SELECT v.id, v.issue_code, v.title, v.status, v.system_id, v.menu_id,
            v.deleted_by, v.deleted_at
     FROM vocs v
     WHERE ${where}
     ORDER BY v.deleted_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    [...values, params.per_page, offset],
  );

  return {
    rows: rows.map((r) => ({
      ...r,
      deleted_at: r.deleted_at instanceof Date ? r.deleted_at.toISOString() : r.deleted_at,
    })),
    page: params.page,
    per_page: params.per_page,
    total,
  };
}

/**
 * Restore a soft-deleted VOC in a single transaction (ADR 0005 §5 Audit):
 *  1. Lock + verify voc exists and is deleted (else throw 409 ALREADY_ACTIVE)
 *  2. Clear deleted_at + deleted_by
 *  3. Insert voc_history 'restore' event
 *  4. Insert voc_restore_log row
 *  5. Re-run tag_rules idempotently (INSERT … ON CONFLICT DO NOTHING)
 */
export async function restoreVoc(
  vocId: string,
  actorId: string,
): Promise<VocRestoreResponse> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch and lock
    const { rows: vocRows } = await client.query(
      `SELECT id, deleted_at, deleted_by FROM vocs WHERE id = $1 FOR UPDATE`,
      [vocId],
    );
    if (vocRows.length === 0) {
      throw new HttpError(404, 'NOT_FOUND', 'VOC를 찾을 수 없습니다.');
    }
    const voc = vocRows[0];
    if (!voc.deleted_at) {
      throw new HttpError(409, 'ALREADY_ACTIVE', '이미 복원된 VOC입니다.');
    }

    const beforeDeletedAt: string =
      voc.deleted_at instanceof Date ? voc.deleted_at.toISOString() : voc.deleted_at;
    const beforeDeletedBy: string | null = voc.deleted_by ?? null;
    const restoredAt = new Date();

    // 2. Clear soft-delete columns
    await client.query(
      `UPDATE vocs SET deleted_at = NULL, deleted_by = NULL, updated_at = $1 WHERE id = $2`,
      [restoredAt, vocId],
    );

    // 3. Insert voc_history restore event
    await client.query(
      `INSERT INTO voc_history (voc_id, actor_id, event_type, snapshot, created_at)
       VALUES ($1, $2, 'restore', '{}'::jsonb, $3)`,
      [vocId, actorId, restoredAt],
    );

    // 4. Insert voc_restore_log
    const { rows: logRows } = await client.query(
      `INSERT INTO voc_restore_log
         (voc_id, action, actor_id, before_deleted_at, before_deleted_by, created_at)
       VALUES ($1, 'restore', $2, $3, $4, $5)
       RETURNING id, voc_id, action, actor_id,
                 before_deleted_at, before_deleted_by, created_at`,
      [vocId, actorId, beforeDeletedAt, beforeDeletedBy, restoredAt],
    );
    const logRow = logRows[0];

    // 5. Re-run tag_rules idempotently — INSERT … ON CONFLICT DO NOTHING (§9.4.7)
    await client.query(
      `INSERT INTO voc_tags (voc_id, tag_id, source, created_at)
       SELECT $1, tr.tag_id, 'rule', now()
       FROM tag_rules tr
       WHERE tr.is_active = true
         AND (tr.system_id IS NULL
              OR tr.system_id = (SELECT system_id FROM vocs WHERE id = $1))
       ON CONFLICT (voc_id, tag_id) DO NOTHING`,
      [vocId],
    );

    await client.query('COMMIT');

    const audit: VocRestoreLogEntry = {
      id: logRow.id,
      voc_id: logRow.voc_id,
      action: logRow.action,
      actor_id: logRow.actor_id,
      before_deleted_at:
        logRow.before_deleted_at instanceof Date
          ? logRow.before_deleted_at.toISOString()
          : logRow.before_deleted_at,
      before_deleted_by: logRow.before_deleted_by ?? null,
      created_at:
        logRow.created_at instanceof Date
          ? logRow.created_at.toISOString()
          : logRow.created_at,
    };

    return {
      voc_id: vocId,
      restored_at: restoredAt.toISOString(),
      audit,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get restore log entries for a specific VOC (newest first).
 */
export async function getRestoreLog(vocId: string): Promise<VocRestoreLogEntry[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id, voc_id, action, actor_id, before_deleted_at, before_deleted_by, created_at
     FROM voc_restore_log
     WHERE voc_id = $1
     ORDER BY created_at DESC`,
    [vocId],
  );
  return rows.map((r) => ({
    ...r,
    before_deleted_at:
      r.before_deleted_at instanceof Date
        ? r.before_deleted_at.toISOString()
        : r.before_deleted_at,
    created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
}
