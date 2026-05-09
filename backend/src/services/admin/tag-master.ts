/**
 * Tag Master service (W3-4)
 *
 * Business logic layer for admin tag operations.
 * Spec: requirements.md §15.3 + feature-voc.md §9.4.6 + ADR 0004 Option D.
 *
 * Permission enforcement is done at the route layer (requireRole).
 * This service handles DB-level constraints and business rules:
 *  - Duplicate name+kind → throws CONFLICT
 *  - Delete used tag → throws CONFLICT
 *  - Merge: target not found → throws NOT_FOUND
 *  - Merge: source === target → throws BAD_REQUEST
 *  - Merge is atomic (transaction): voc_tags rewired + tag_rules rewired + source hard-deleted
 */
import { getPool } from '../../db';
import type { TagMasterListQuery } from '../../../../shared/contracts/admin/tag';
import { escapeLikePattern } from '../../repository/voc';

export async function listTags(query: TagMasterListQuery) {
  const pool = getPool();
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (query.kind) {
    conditions.push(`t.kind = $${i++}`);
    values.push(query.kind);
  }
  if (query.q) {
    conditions.push(`t.name ILIKE $${i++} ESCAPE '\\'`);
    values.push(`%${escapeLikePattern(query.q)}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (query.page - 1) * query.per_page;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM tags t
    ${where}
  `;
  const rowsSql = `
    SELECT
      t.id,
      t.name,
      t.slug,
      t.kind,
      t.is_external,
      COUNT(vt.tag_id)::int AS usage_count,
      COUNT(tr.id)::int      AS rule_ref_count,
      t.created_at
    FROM tags t
    LEFT JOIN voc_tags vt ON vt.tag_id = t.id
    LEFT JOIN tag_rules tr ON tr.tag_id = t.id
    ${where}
    GROUP BY t.id
    ORDER BY t.name ASC
    LIMIT $${i++} OFFSET $${i++}
  `;

  const countValues = [...values];
  const rowValues = [...values, query.per_page, offset];

  const [countResult, rowsResult] = await Promise.all([
    pool.query(countSql, countValues),
    pool.query(rowsSql, rowValues),
  ]);

  return {
    rows: rowsResult.rows,
    page: query.page,
    per_page: query.per_page,
    total: Number(countResult.rows[0]?.total ?? 0),
  };
}

export async function createTag(input: { name: string; kind: string }) {
  const pool = getPool();
  const slug = input.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-가-힣]/g, '')
    .slice(0, 100);

  try {
    const result = await pool.query(
      `INSERT INTO tags (name, slug, kind)
       VALUES ($1, $2, $3)
       RETURNING id, name, slug, kind, is_external,
                 0 AS usage_count, 0 AS rule_ref_count, created_at`,
      [input.name, slug, input.kind],
    );
    return result.rows[0];
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      throw { code: 'CONFLICT', message: '동일한 이름과 종류의 태그가 이미 존재합니다.' };
    }
    throw err;
  }
}

export async function renameTag(id: string, name: string) {
  const pool = getPool();
  try {
    const result = await pool.query(
      `UPDATE tags SET name = $1 WHERE id = $2
       RETURNING id, name, slug, kind, is_external, created_at`,
      [name, id],
    );
    if (result.rowCount === 0) {
      throw { code: 'NOT_FOUND', message: '태그를 찾을 수 없습니다.' };
    }
    return result.rows[0];
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      throw { code: 'CONFLICT', message: '동일한 이름과 종류의 태그가 이미 존재합니다.' };
    }
    throw err;
  }
}

/**
 * Atomic merge: re-points voc_tags + tag_rules to targetId, hard-deletes source.
 * Resolution α: no `merged_into_id` tombstone column (PR #251).
 */
export async function mergeTags(sourceId: string, targetId: string) {
  if (sourceId === targetId) {
    throw { code: 'BAD_REQUEST', message: 'source와 target 태그가 동일합니다.' };
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify target exists
    const targetCheck = await client.query('SELECT id FROM tags WHERE id = $1', [targetId]);
    if (targetCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      throw { code: 'NOT_FOUND', message: '대상 태그를 찾을 수 없습니다.' };
    }

    // Verify source exists
    const sourceCheck = await client.query('SELECT id FROM tags WHERE id = $1', [sourceId]);
    if (sourceCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      throw { code: 'NOT_FOUND', message: '원본 태그를 찾을 수 없습니다.' };
    }

    // Rewire voc_tags: move source → target (skip if already has target to avoid dup)
    await client.query(
      `UPDATE voc_tags SET tag_id = $1
       WHERE tag_id = $2
         AND voc_id NOT IN (SELECT voc_id FROM voc_tags WHERE tag_id = $1)`,
      [targetId, sourceId],
    );

    // Remove any remaining voc_tags for source (duplicates)
    await client.query('DELETE FROM voc_tags WHERE tag_id = $1', [sourceId]);

    // Rewire tag_rules → target
    await client.query('UPDATE tag_rules SET tag_id = $1 WHERE tag_id = $2', [targetId, sourceId]);

    // Count merged rows
    const merged = await client.query(
      'SELECT COUNT(*)::int AS cnt FROM voc_tags WHERE tag_id = $1',
      [targetId],
    );

    // Hard-delete source tag
    await client.query('DELETE FROM tags WHERE id = $1', [sourceId]);

    await client.query('COMMIT');
    return { mergedCount: Number(merged.rows[0]?.cnt ?? 0) };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function toggleExternal(id: string, isExternal: boolean) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE tags SET is_external = $1 WHERE id = $2
     RETURNING id, name, slug, kind, is_external, created_at`,
    [isExternal, id],
  );
  if (result.rowCount === 0) {
    throw { code: 'NOT_FOUND', message: '태그를 찾을 수 없습니다.' };
  }
  return result.rows[0];
}

export async function deleteTag(id: string) {
  const pool = getPool();

  // Check usage
  const usageResult = await pool.query(
    'SELECT COUNT(*)::int AS cnt FROM voc_tags WHERE tag_id = $1',
    [id],
  );
  const usageCount = Number(usageResult.rows[0]?.cnt ?? 0);

  const ruleResult = await pool.query(
    'SELECT COUNT(*)::int AS cnt FROM tag_rules WHERE tag_id = $1',
    [id],
  );
  const ruleCount = Number(ruleResult.rows[0]?.cnt ?? 0);

  if (usageCount > 0 || ruleCount > 0) {
    throw {
      code: 'CONFLICT',
      message: `태그가 사용 중입니다. (VOC: ${usageCount}, 규칙: ${ruleCount})`,
    };
  }

  const result = await pool.query('DELETE FROM tags WHERE id = $1 RETURNING id', [id]);
  if (result.rowCount === 0) {
    throw { code: 'NOT_FOUND', message: '태그를 찾을 수 없습니다.' };
  }
  return { deleted: true };
}

export async function suspendTagRule(id: string, suspendedUntil: string | null) {
  const pool = getPool();
  const result = await pool.query(
    `UPDATE tag_rules SET suspended_until = $1 WHERE id = $2
     RETURNING id, suspended_until`,
    [suspendedUntil, id],
  );
  if (result.rowCount === 0) {
    throw { code: 'NOT_FOUND', message: '태그 규칙을 찾을 수 없습니다.' };
  }
  return result.rows[0];
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  );
}
