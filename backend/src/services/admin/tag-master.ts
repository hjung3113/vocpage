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
import type {
  TagMasterListQuery,
  TagRuleCreateT,
  TagRulePatchT,
  TagRuleListQueryT,
  TagRuleT,
} from '../../../../shared/contracts/admin/tag';
import { TagRule } from '../../../../shared/contracts/admin/tag';
import type { AuthUser } from '../../auth/types';
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
  // FU-023: include `kind` in slug so (name, kind) pairs distinct under
  // FU-014 row UNIQUE also yield distinct slugs (e.g. '공통-general' vs
  // '공통-menu'). Slug shape: <sanitized-name>-<kind>, capped to 100.
  const namePart = input.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-가-힣]/g, '');
  const slug = `${namePart}-${input.kind}`.slice(0, 100);

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
       RETURNING id, name, slug, kind, is_external,
                 (SELECT COUNT(*)::int FROM voc_tags WHERE tag_id = tags.id) AS usage_count,
                 (SELECT COUNT(*)::int FROM tag_rules WHERE tag_id = tags.id) AS rule_ref_count,
                 created_at`,
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
     RETURNING id, name, slug, kind, is_external,
               (SELECT COUNT(*)::int FROM voc_tags WHERE tag_id = tags.id) AS usage_count,
               (SELECT COUNT(*)::int FROM tag_rules WHERE tag_id = tags.id) AS rule_ref_count,
               created_at`,
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

/* -------------------------------------------------------------------------
 * Tag Rules — Phase 01 (D-08 nested resource, D-12 created_by, T-01-08 IDOR scope)
 * Routes: /api/admin/tags/:tagId/rules*
 * ------------------------------------------------------------------------- */

const TAG_RULE_SELECT_BASE = `
  SELECT
    tr.id,
    tr.tag_id,
    tr.kind,
    tr.keywords,
    tr.match_mode,
    tr.suspended_until,
    tr.created_by,
    u.name AS created_by_name,
    tr.created_at
  FROM tag_rules tr
  LEFT JOIN users u ON u.id = tr.created_by
`;

function rowToTagRule(row: Record<string, unknown>): TagRuleT {
  return TagRule.parse({
    id: row.id,
    tag_id: row.tag_id,
    kind: row.kind,
    keywords: row.keywords,
    match_mode: row.match_mode,
    suspended_until:
      row.suspended_until instanceof Date ? row.suspended_until.toISOString() : row.suspended_until,
    created_by: row.created_by,
    created_by_name: row.created_by_name,
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  });
}

/** GET /api/admin/tags/:tagId/rules — admin/manager/dev */
export async function listTagRules(tagId: string, query: TagRuleListQueryT) {
  const pool = getPool();
  const conditions: string[] = ['tr.tag_id = $1'];
  const values: unknown[] = [tagId];
  let i = 2;

  if (query.q) {
    // Match if any keyword ILIKEs q OR the parent tag name does.
    conditions.push(
      `(EXISTS (SELECT 1 FROM unnest(tr.keywords) k WHERE k ILIKE $${i} ESCAPE '\\')
        OR (SELECT t.name FROM tags t WHERE t.id = tr.tag_id) ILIKE $${i} ESCAPE '\\')`,
    );
    values.push(`%${escapeLikePattern(query.q)}%`);
    i += 1;
  }

  const where = `WHERE ${conditions.join(' AND ')}`;
  const offset = (query.page - 1) * query.per_page;

  const countSql = `SELECT COUNT(*)::int AS total FROM tag_rules tr ${where}`;
  const rowsSql = `
    ${TAG_RULE_SELECT_BASE}
    ${where}
    ORDER BY tr.created_at DESC
    LIMIT $${i++} OFFSET $${i++}
  `;
  const rowValues = [...values, query.per_page, offset];

  const [countResult, rowsResult] = await Promise.all([
    pool.query(countSql, values),
    pool.query(rowsSql, rowValues),
  ]);

  return {
    rows: rowsResult.rows.map(rowToTagRule),
    page: query.page,
    per_page: query.per_page,
    total: Number(countResult.rows[0]?.total ?? 0),
  };
}

/** POST /api/admin/tags/:tagId/rules — manager+. created_by ALWAYS from req.user.id (T-01-09). */
export async function createTagRule(
  tagId: string,
  input: TagRuleCreateT,
  user: AuthUser,
): Promise<TagRuleT> {
  const pool = getPool();
  // Dedupe keywords case-insensitively (matches FE chip dedupe per T-01-11 mitigation).
  const seen = new Set<string>();
  const dedupedKeywords = input.keywords.filter((kw) => {
    const lower = kw.toLowerCase();
    if (seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });

  try {
    const insertResult = await pool.query(
      `INSERT INTO tag_rules (tag_id, kind, keywords, match_mode, created_by)
       VALUES ($1, 'general', $2, $3, $4)
       RETURNING id`,
      [tagId, dedupedKeywords, input.match_mode, user.id],
    );
    const id = insertResult.rows[0]?.id as string;
    const result = await pool.query(
      `${TAG_RULE_SELECT_BASE} WHERE tr.id = $1`,
      [id],
    );
    if (result.rowCount === 0) {
      throw { code: 'NOT_FOUND', message: '생성된 규칙을 찾을 수 없습니다.' };
    }
    return rowToTagRule(result.rows[0]);
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      throw { code: 'CONFLICT', message: '동일한 키워드 규칙이 이미 존재합니다.' };
    }
    if (isForeignKeyViolation(err)) {
      throw { code: 'NOT_FOUND', message: '태그를 찾을 수 없습니다.' };
    }
    throw err;
  }
}

/** PATCH /api/admin/tags/:tagId/rules/:ruleId — manager+. T-01-08 IDOR: enforce tag_id scope. */
export async function updateTagRule(
  tagId: string,
  ruleId: string,
  input: TagRulePatchT,
): Promise<TagRuleT> {
  const pool = getPool();
  // IDOR scope check: rule must belong to the path tagId.
  const scope = await pool.query(
    'SELECT id FROM tag_rules WHERE id = $1 AND tag_id = $2',
    [ruleId, tagId],
  );
  if (scope.rowCount === 0) {
    throw { code: 'NOT_FOUND', message: '태그 규칙을 찾을 수 없습니다.' };
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.keywords !== undefined) {
    const seen = new Set<string>();
    const deduped = input.keywords.filter((kw) => {
      const lower = kw.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
    sets.push(`keywords = $${i++}`);
    values.push(deduped);
  }
  if (input.match_mode !== undefined) {
    sets.push(`match_mode = $${i++}`);
    values.push(input.match_mode);
  }

  if (sets.length === 0) {
    // Nothing to update — return current row.
    const current = await pool.query(`${TAG_RULE_SELECT_BASE} WHERE tr.id = $1`, [ruleId]);
    return rowToTagRule(current.rows[0]);
  }

  values.push(ruleId);
  await pool.query(
    `UPDATE tag_rules SET ${sets.join(', ')} WHERE id = $${i}`,
    values,
  );
  const result = await pool.query(`${TAG_RULE_SELECT_BASE} WHERE tr.id = $1`, [ruleId]);
  return rowToTagRule(result.rows[0]);
}

/** DELETE /api/admin/tags/:tagId/rules/:ruleId — admin only. T-01-08 IDOR: enforce tag_id scope. */
export async function deleteTagRule(tagId: string, ruleId: string): Promise<void> {
  const pool = getPool();
  const result = await pool.query(
    'DELETE FROM tag_rules WHERE id = $1 AND tag_id = $2 RETURNING id',
    [ruleId, tagId],
  );
  if (result.rowCount === 0) {
    throw { code: 'NOT_FOUND', message: '태그 규칙을 찾을 수 없습니다.' };
  }
}

/**
 * PATCH /api/admin/tags/:tagId/rules/:ruleId/suspend — admin only. T-01-08 IDOR scope.
 *
 * Overloaded: legacy 2-arg form (used by the soon-to-be-deleted /admin/tag-rules/:id/suspend
 * route) is preserved temporarily so this Plan 01-04 Task 1 can ship a typecheck-clean commit;
 * Task 2 deletes the legacy route and the 2-arg call site, leaving only the (tagId, ruleId, ...)
 * form. The 2-arg path SKIPS the IDOR scope check by design — only the legacy callsite uses it.
 */
export async function suspendTagRule(
  tagIdOrRuleId: string,
  suspendedUntilOrRuleId: string | null,
  suspendedUntil?: string | null,
): Promise<TagRuleT> {
  const pool = getPool();
  let ruleId: string;
  let suspended: string | null;
  let scopeTagId: string | null;

  if (suspendedUntil === undefined) {
    // Legacy 2-arg form: (id, suspendedUntil) — callsite is the soon-deleted route.
    ruleId = tagIdOrRuleId;
    suspended = suspendedUntilOrRuleId;
    scopeTagId = null;
  } else {
    // Nested 3-arg form: (tagId, ruleId, suspendedUntil)
    scopeTagId = tagIdOrRuleId;
    ruleId = suspendedUntilOrRuleId as string;
    suspended = suspendedUntil;
  }

  if (scopeTagId !== null) {
    const scope = await pool.query(
      'SELECT id FROM tag_rules WHERE id = $1 AND tag_id = $2',
      [ruleId, scopeTagId],
    );
    if (scope.rowCount === 0) {
      throw { code: 'NOT_FOUND', message: '태그 규칙을 찾을 수 없습니다.' };
    }
  }

  const updated = await pool.query(
    'UPDATE tag_rules SET suspended_until = $1 WHERE id = $2 RETURNING id',
    [suspended, ruleId],
  );
  if (updated.rowCount === 0) {
    throw { code: 'NOT_FOUND', message: '태그 규칙을 찾을 수 없습니다.' };
  }
  const result = await pool.query(`${TAG_RULE_SELECT_BASE} WHERE tr.id = $1`, [ruleId]);
  return rowToTagRule(result.rows[0]);
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  );
}

function isForeignKeyViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23503'
  );
}
