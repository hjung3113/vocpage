import type { Pool } from 'pg';

// R7-9: TTL cache for tag_rules — avoids a DB round-trip on every VOC save/edit
interface RulesCacheEntry {
  rules: Array<{ id: string; pattern: string; tag_id: string }>;
  expiresAt: number;
}

const RULES_TTL_MS = 5 * 60 * 1000; // 5 min
let rulesCache: RulesCacheEntry | null = null;

async function getTagRules(
  pool: Pool,
): Promise<Array<{ id: string; pattern: string; tag_id: string }>> {
  if (rulesCache && Date.now() < rulesCache.expiresAt) {
    return rulesCache.rules;
  }
  const res = await pool.query(
    `SELECT id, pattern, tag_id FROM tag_rules WHERE is_active = true ORDER BY sort_order ASC, created_at ASC`,
  );
  rulesCache = {
    rules: res.rows as Array<{ id: string; pattern: string; tag_id: string }>,
    expiresAt: Date.now() + RULES_TTL_MS,
  };
  return rulesCache.rules;
}

/** Invalidate the in-memory rules cache (call after tag_rules mutations). */
export function invalidateTagRulesCache(): void {
  rulesCache = null;
}

export async function applyTagRules(
  vocId: string,
  title: string,
  body: string,
  pool: Pool,
): Promise<void> {
  const rules = await getTagRules(pool); // R7-9: cached
  const text = `${title} ${body}`;
  const matchedTagIds = new Set<string>();

  for (const rule of rules) {
    try {
      const re = new RegExp(rule.pattern, 'i');
      if (re.test(text)) {
        matchedTagIds.add(rule.tag_id);
      }
    } catch {
      // invalid regex — skip silently
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // R7-8: batch INSERT via VALUES list instead of per-tag loop
    if (matchedTagIds.size > 0) {
      const tagIdArray = [...matchedTagIds];
      const placeholders = tagIdArray.map((_, i) => `($1, $${i + 2}, 'rule')`).join(', ');
      await client.query(
        `INSERT INTO voc_tags (voc_id, tag_id, source) VALUES ${placeholders}
         ON CONFLICT (voc_id, tag_id) DO NOTHING`,
        [vocId, ...tagIdArray],
      );
    }

    // Remove stale rule-sourced tags that no longer match
    const existing = await client.query(
      `SELECT tag_id FROM voc_tags WHERE voc_id = $1 AND source = 'rule'`,
      [vocId],
    );
    const toDelete = (existing.rows as { tag_id: string }[])
      .map((r) => r.tag_id)
      .filter((id) => !matchedTagIds.has(id));

    if (toDelete.length > 0) {
      const delPlaceholders = toDelete.map((_, i) => `$${i + 2}`).join(', ');
      await client.query(
        `DELETE FROM voc_tags WHERE voc_id = $1 AND tag_id IN (${delPlaceholders}) AND source = 'rule'`,
        [vocId, ...toDelete],
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
