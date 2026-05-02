/**
 * VOC repository — DB access boundary. Service layer imports from here so tests
 * can `jest.mock('../repository/voc')` for module-level mocking (Wave 1 §U3=A).
 *
 * Production wiring: this module talks to `getPool()` (pg). Wave 1 keeps the
 * surface minimal — list / get / update / notes (list+create) / history.
 */
import { getPool } from '../db';
import type {
  Voc,
  InternalNote,
  VocHistoryEntry,
  VocPriority,
} from '../../../shared/contracts/voc';

/**
 * Escape ILIKE meta-characters in a free-text query so user input cannot
 * smuggle wildcards (`%`, `_`) or escape the escape character itself.
 * Pair with `ILIKE ... ESCAPE '\\'` in the SQL — see `listVocs` below.
 * Exposed for unit tests (PR #121 review Finding 3).
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export interface ListVocsParams {
  status?: string[];
  system_id?: string;
  voc_type_ids?: string[];
  assignees?: string[];
  priorities?: VocPriority[];
  tag_ids?: string[];
  q?: string;
  sort_by: 'created_at' | 'updated_at' | 'priority' | 'status' | 'due_date' | 'issue_code';
  sort_dir: 'asc' | 'desc';
  page: number;
  per_page: number;
  includeDeleted?: boolean;
}

export type ListVocsRow = Voc & { tags: string[] };

export interface ListVocsResult {
  rows: ListVocsRow[];
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
  if (params.voc_type_ids?.length) {
    conditions.push(`voc_type_id = ANY($${i++})`);
    values.push(params.voc_type_ids);
  }
  if (params.assignees?.length) {
    conditions.push(`assignee_id = ANY($${i++})`);
    values.push(params.assignees);
  }
  if (params.priorities?.length) {
    conditions.push(`priority = ANY($${i++})`);
    values.push(params.priorities);
  }
  if (params.tag_ids?.length) {
    conditions.push(
      `EXISTS (SELECT 1 FROM voc_tags vt WHERE vt.voc_id = vocs.id AND vt.tag_id = ANY($${i++}))`,
    );
    values.push(params.tag_ids);
  }
  if (params.q) {
    const esc = escapeLikePattern(params.q);
    conditions.push(`(title ILIKE $${i} ESCAPE '\\' OR issue_code ILIKE $${i} ESCAPE '\\')`);
    values.push(`%${esc}%`);
    i += 1;
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.per_page;
  // sort_by/sort_dir are zod-enum validated upstream; safe to interpolate.
  const rows = (
    await pool.query(
      `SELECT vocs.*, COALESCE(
         (SELECT array_agg(t.name ORDER BY t.name)
            FROM voc_tags vt
            JOIN tags t ON t.id = vt.tag_id
           WHERE vt.voc_id = vocs.id),
         ARRAY[]::text[]
       ) AS tags
       FROM vocs ${where} ORDER BY ${params.sort_by} ${params.sort_dir} LIMIT $${i++} OFFSET $${i++}`,
      [...values, params.per_page, offset],
    )
  ).rows as ListVocsRow[];
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

export interface CreateVocInput {
  title: string;
  body?: string;
  status?: string;
  priority?: VocPriority;
  voc_type_id: string;
  system_id: string;
  menu_id: string;
  assignee_id?: string | null;
  parent_id?: string | null;
  source?: string;
}

/**
 * INSERT a new VOC. `sequence_no` / `issue_code` are filled by the
 * `trg_voc_sequence_no` BEFORE-INSERT trigger (003_vocs.sql) — we omit them.
 * `body` is NOT NULL in DDL, so default to '' when caller omits.
 */
export async function createVoc(input: CreateVocInput, authorId: string): Promise<Voc> {
  const pool = getPool();
  const r = await pool.query(
    `INSERT INTO vocs (
       title, body, status, priority, voc_type_id, system_id, menu_id,
       assignee_id, parent_id, source, author_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      input.title,
      input.body ?? '',
      input.status ?? '접수',
      input.priority ?? 'medium',
      input.voc_type_id,
      input.system_id,
      input.menu_id,
      input.assignee_id ?? null,
      input.parent_id ?? null,
      input.source ?? 'manual',
      authorId,
    ],
  );
  return r.rows[0] as Voc;
}

export async function listHistory(vocId: string): Promise<VocHistoryEntry[]> {
  const pool = getPool();
  const r = await pool.query(
    'SELECT * FROM voc_history WHERE voc_id = $1 ORDER BY changed_at DESC',
    [vocId],
  );
  return r.rows as VocHistoryEntry[];
}
