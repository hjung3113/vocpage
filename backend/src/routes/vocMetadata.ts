import { pool } from '../db';

export type VocRow = Record<string, unknown> & { id: string };

let hasParentIdColumnCache: boolean | null = null;

export async function hasParentIdColumn(): Promise<boolean> {
  if (hasParentIdColumnCache !== null) return hasParentIdColumnCache;

  try {
    await pool.query('SELECT parent_id FROM vocs LIMIT 0');
    hasParentIdColumnCache = true;
  } catch (err) {
    if ((err as { code?: string }).code === '42703') {
      hasParentIdColumnCache = false;
    } else {
      throw err;
    }
  }

  return hasParentIdColumnCache;
}

export async function attachListMetadata(rows: VocRow[]): Promise<VocRow[]> {
  if (rows.length === 0) return rows;

  const ids = rows.map((row) => row.id);
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const canUseParentId = await hasParentIdColumn();

  const [countResult, tagResult] = await Promise.all([
    canUseParentId
      ? pool.query(
          `SELECT parent_id, COUNT(*)::int AS count
           FROM vocs
           WHERE parent_id IN (${placeholders}) AND deleted_at IS NULL
           GROUP BY parent_id`,
          ids,
        )
      : Promise.resolve({ rows: [] }),
    pool.query(
      `SELECT vtg.voc_id, t.id, t.name
       FROM voc_tags vtg
       JOIN tags t ON vtg.tag_id = t.id
       WHERE vtg.voc_id IN (${placeholders})`,
      ids,
    ),
  ]);

  const counts = new Map<string, number>();
  countResult.rows.forEach((row: { parent_id: string; count: number }) => {
    counts.set(row.parent_id, row.count);
  });

  const tags = new Map<string, Array<{ id: string; name: string }>>();
  tagResult.rows.forEach((row: { voc_id: string; id: string; name: string }) => {
    const vocTags = tags.get(row.voc_id) ?? [];
    vocTags.push({ id: row.id, name: row.name });
    tags.set(row.voc_id, vocTags);
  });

  return rows.map((row) => ({
    ...row,
    subtask_count: counts.get(row.id) ?? 0,
    tags: tags.get(row.id) ?? [],
  }));
}
