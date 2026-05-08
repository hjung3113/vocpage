/**
 * FAQ + FAQ Category repository.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.4.
 */
import { getPool } from '../db';
import type {
  Faq,
  FaqCategory,
  FaqCreate,
  FaqUpdate,
  FaqCategoryCreate,
  FaqCategoryUpdate,
} from '../../../shared/contracts/faq';

const FAQ_COLUMNS = `id, question, answer, category_id, is_visible, sort_order,
  author_id, deleted_at, created_at, updated_at`;
const CAT_COLUMNS = `id, name, slug, sort_order, is_archived`;

function toIso(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function faqRow(r: Record<string, unknown>): Faq {
  return {
    id: r.id as string,
    question: r.question as string,
    answer: r.answer as string,
    category_id: r.category_id as string,
    is_visible: Boolean(r.is_visible),
    sort_order: Number(r.sort_order ?? 0),
    author_id: r.author_id as string,
    deleted_at: toIso(r.deleted_at),
    created_at: toIso(r.created_at) as string,
    updated_at: toIso(r.updated_at) as string,
  };
}

function catRow(r: Record<string, unknown>): FaqCategory {
  return {
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    sort_order: Number(r.sort_order ?? 0),
    is_archived: Boolean(r.is_archived),
  };
}

// --- FAQ -----------------------------------------------------------------

export interface FaqListOpts {
  page: number;
  per_page: number;
  category_id?: string;
  q?: string;
  includeDeleted?: boolean;
  mode?: 'user' | 'admin';
}

export async function listFaqs(opts: FaqListOpts): Promise<{ rows: Faq[]; total: number }> {
  const pool = getPool();
  const conds: string[] = [];
  const args: unknown[] = [];
  if (!opts.includeDeleted) conds.push('deleted_at IS NULL');
  if (opts.mode !== 'admin') conds.push('is_visible = true');
  if (opts.category_id) {
    args.push(opts.category_id);
    conds.push(`category_id = $${args.length}`);
  }
  if (opts.q) {
    args.push(`%${opts.q}%`);
    const i = args.length;
    conds.push(`(question ILIKE $${i} OR answer ILIKE $${i})`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const limitArgs = [...args, opts.per_page, (opts.page - 1) * opts.per_page];
  const r = await pool.query(
    `SELECT ${FAQ_COLUMNS} FROM faqs ${where}
       ORDER BY sort_order ASC, created_at DESC
       LIMIT $${limitArgs.length - 1} OFFSET $${limitArgs.length}`,
    limitArgs,
  );
  const c = await pool.query(`SELECT count(*)::int AS n FROM faqs ${where}`, args);
  return { rows: r.rows.map(faqRow), total: c.rows[0]?.n ?? 0 };
}

export async function getFaqById(id: string): Promise<Faq | null> {
  const pool = getPool();
  const r = await pool.query(`SELECT ${FAQ_COLUMNS} FROM faqs WHERE id = $1`, [id]);
  return r.rows[0] ? faqRow(r.rows[0]) : null;
}

export async function createFaq(input: FaqCreate, authorId: string): Promise<Faq> {
  const pool = getPool();
  const r = await pool.query(
    `INSERT INTO faqs (question, answer, category_id, is_visible, sort_order, author_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${FAQ_COLUMNS}`,
    [
      input.question,
      input.answer,
      input.category_id,
      input.is_visible ?? true,
      input.sort_order ?? 0,
      authorId,
    ],
  );
  return faqRow(r.rows[0]);
}

export async function updateFaq(id: string, patch: FaqUpdate): Promise<Faq | null> {
  const pool = getPool();
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    args.push(v);
    sets.push(`${k} = $${args.length}`);
  }
  if (!sets.length) return getFaqById(id);
  args.push(id);
  const r = await pool.query(
    `UPDATE faqs SET ${sets.join(', ')} WHERE id = $${args.length} RETURNING ${FAQ_COLUMNS}`,
    args,
  );
  return r.rows[0] ? faqRow(r.rows[0]) : null;
}

export async function softDeleteFaq(id: string): Promise<boolean> {
  const pool = getPool();
  const r = await pool.query(
    `UPDATE faqs SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [id],
  );
  return r.rows.length > 0;
}

export async function restoreFaq(id: string): Promise<Faq | null> {
  const pool = getPool();
  const r = await pool.query(
    `UPDATE faqs SET deleted_at = NULL WHERE id = $1 RETURNING ${FAQ_COLUMNS}`,
    [id],
  );
  return r.rows[0] ? faqRow(r.rows[0]) : null;
}

// --- FAQ Category --------------------------------------------------------

export async function listCategories(): Promise<FaqCategory[]> {
  const pool = getPool();
  const r = await pool.query(
    `SELECT ${CAT_COLUMNS} FROM faq_categories ORDER BY sort_order ASC, name ASC`,
  );
  return r.rows.map(catRow);
}

export async function getCategoryById(id: string): Promise<FaqCategory | null> {
  const pool = getPool();
  const r = await pool.query(`SELECT ${CAT_COLUMNS} FROM faq_categories WHERE id = $1`, [id]);
  return r.rows[0] ? catRow(r.rows[0]) : null;
}

export async function createCategory(input: FaqCategoryCreate): Promise<FaqCategory> {
  const pool = getPool();
  const r = await pool.query(
    `INSERT INTO faq_categories (name, slug, sort_order, is_archived)
       VALUES ($1, $2, $3, $4)
       RETURNING ${CAT_COLUMNS}`,
    [input.name, input.slug, input.sort_order ?? 0, input.is_archived ?? false],
  );
  return catRow(r.rows[0]);
}

export async function updateCategory(
  id: string,
  patch: FaqCategoryUpdate,
): Promise<FaqCategory | null> {
  const pool = getPool();
  const sets: string[] = [];
  const args: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    args.push(v);
    sets.push(`${k} = $${args.length}`);
  }
  if (!sets.length) return getCategoryById(id);
  args.push(id);
  const r = await pool.query(
    `UPDATE faq_categories SET ${sets.join(', ')} WHERE id = $${args.length} RETURNING ${CAT_COLUMNS}`,
    args,
  );
  return r.rows[0] ? catRow(r.rows[0]) : null;
}

export async function deleteCategory(id: string): Promise<{ ok: boolean; reason?: 'has_items' }> {
  const pool = getPool();
  const c = await pool.query(
    `SELECT count(*)::int AS n FROM faqs WHERE category_id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if ((c.rows[0]?.n ?? 0) > 0) return { ok: false, reason: 'has_items' };
  const r = await pool.query(`DELETE FROM faq_categories WHERE id = $1 RETURNING id`, [id]);
  return { ok: r.rows.length > 0 };
}
