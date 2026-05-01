/**
 * VOC repository — DB access boundary. Service layer imports from here so tests
 * can `jest.mock('../repository/voc')` for module-level mocking (Wave 1 §U3=A).
 *
 * Production wiring: this module talks to `getPool()` (pg). Wave 1 keeps the
 * surface minimal — list / get / update / notes (list+create) / history.
 */
import { getPool } from '../db';
import type { Voc, InternalNote, VocHistoryEntry } from '../../../shared/contracts/voc';

export interface ListVocsParams {
  status?: string[];
  system_id?: string;
  voc_type_id?: string[];
  assignee_id?: string;
  q?: string;
  sort: 'created_at' | 'updated_at' | 'priority' | 'status' | 'due_date' | 'issue_code';
  order: 'asc' | 'desc';
  page: number;
  limit: number;
  includeDeleted?: boolean;
}

export interface ListVocsResult {
  rows: Voc[];
  total: number;
}

export async function listVocs(params: ListVocsParams): Promise<ListVocsResult> {
  const pool = getPool();
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (!params.includeDeleted) conditions.push('deleted_at IS NULL');
  if (params.status?.length) {
    conditions.push(`status = ANY($${i++})`);
    values.push(params.status);
  }
  if (params.system_id) {
    conditions.push(`system_id = $${i++}`);
    values.push(params.system_id);
  }
  if (params.voc_type_id?.length) {
    conditions.push(`voc_type_id = ANY($${i++})`);
    values.push(params.voc_type_id);
  }
  if (params.assignee_id) {
    conditions.push(`assignee_id = $${i++}`);
    values.push(params.assignee_id);
  }
  if (params.q) {
    conditions.push(`(title ILIKE $${i} OR issue_code ILIKE $${i})`);
    values.push(`%${params.q}%`);
    i += 1;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.limit;
  const rows = (
    await pool.query(
      `SELECT * FROM vocs ${where} ORDER BY ${params.sort} ${params.order} LIMIT $${i++} OFFSET $${i++}`,
      [...values, params.limit, offset],
    )
  ).rows as Voc[];
  const totalRow = await pool.query(`SELECT count(*)::int AS n FROM vocs ${where}`, values);
  return { rows, total: totalRow.rows[0]?.n ?? 0 };
}

export async function getVocById(
  id: string,
  opts: { includeDeleted?: boolean } = {},
): Promise<Voc | null> {
  const pool = getPool();
  const r = await pool.query('SELECT * FROM vocs WHERE id = $1', [id]);
  const row = r.rows[0] as Voc | undefined;
  if (!row) return null;
  if (!opts.includeDeleted && row.deleted_at !== null) return null;
  return row;
}

export async function updateVoc(id: string, patch: Partial<Voc>): Promise<Voc | null> {
  const pool = getPool();
  const keys = Object.keys(patch);
  if (!keys.length) return getVocById(id);
  const setClause = keys.map((k, idx) => `${k} = $${idx + 2}`).join(', ');
  const values = keys.map((k) => (patch as Record<string, unknown>)[k]);
  const r = await pool.query(
    `UPDATE vocs SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, ...values],
  );
  return (r.rows[0] as Voc | undefined) ?? null;
}

export async function listNotes(vocId: string): Promise<InternalNote[]> {
  const pool = getPool();
  const r = await pool.query(
    'SELECT * FROM voc_internal_notes WHERE voc_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC',
    [vocId],
  );
  return r.rows as InternalNote[];
}

export async function createNote(
  vocId: string,
  authorId: string,
  body: string,
): Promise<InternalNote> {
  const pool = getPool();
  const r = await pool.query(
    `INSERT INTO voc_internal_notes (voc_id, author_id, body) VALUES ($1, $2, $3) RETURNING *`,
    [vocId, authorId, body],
  );
  return r.rows[0] as InternalNote;
}

export async function listHistory(vocId: string): Promise<VocHistoryEntry[]> {
  const pool = getPool();
  const r = await pool.query(
    'SELECT * FROM voc_history WHERE voc_id = $1 ORDER BY changed_at DESC',
    [vocId],
  );
  return r.rows as VocHistoryEntry[];
}
