import type { Pool } from 'pg';

export async function applyTagRules(
  vocId: string,
  title: string,
  body: string,
  pool: Pool,
): Promise<void> {
  const rulesRes = await pool.query(
    `SELECT id, pattern, tag_id FROM tag_rules WHERE is_active = true ORDER BY sort_order ASC, created_at ASC`,
  );
  const text = `${title} ${body}`;
  const matchedTagIds = new Set<string>();

  for (const rule of rulesRes.rows as { id: string; pattern: string; tag_id: string }[]) {
    try {
      const re = new RegExp(rule.pattern, 'i');
      if (re.test(text)) {
        matchedTagIds.add(rule.tag_id);
      }
    } catch {
      // invalid regex — skip silently
    }
  }

  for (const tagId of matchedTagIds) {
    await pool.query(
      `INSERT INTO voc_tags (voc_id, tag_id, source) VALUES ($1, $2, 'rule')
       ON CONFLICT (voc_id, tag_id) DO NOTHING`,
      [vocId, tagId],
    );
  }

  const existing = await pool.query(
    `SELECT tag_id FROM voc_tags WHERE voc_id = $1 AND source = 'rule'`,
    [vocId],
  );
  for (const row of existing.rows as { tag_id: string }[]) {
    if (!matchedTagIds.has(row.tag_id)) {
      await pool.query(
        `DELETE FROM voc_tags WHERE voc_id = $1 AND tag_id = $2 AND source = 'rule'`,
        [vocId, row.tag_id],
      );
    }
  }
}
