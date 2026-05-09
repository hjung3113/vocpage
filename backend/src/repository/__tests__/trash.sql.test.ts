/**
 * trash.sql.test.ts — column-name regression for restoreVoc SQL.
 *
 * admin-trash.test.ts mocks the repository so SQL bugs (column drift,
 * non-existent column references) silently pass. This file exercises the
 * real `restoreVoc` against a fake pool that records every query, then
 * asserts that each INSERT/SELECT references columns that actually exist
 * in migrations 003 (voc_history) / 004 (tag_rules) / 014 (suspended_until)
 * / 015 (voc_restore_log).
 *
 * Codex review on PR #263 caught two P0 bugs (voc_history column drift,
 * tag_rules.system_id absent). This test locks the fix.
 */
import * as trashRepo from '../trash';
import { setPool, resetPool } from '../../db';

interface RecordedQuery {
  text: string;
  values?: unknown[];
}

function makeFakeClient(): {
  client: { query: jest.Mock; release: jest.Mock };
  queries: RecordedQuery[];
} {
  const queries: RecordedQuery[] = [];
  const query = jest.fn(async (text: string, values?: unknown[]) => {
    queries.push({ text, values });
    if (/SELECT id, deleted_at, deleted_by FROM vocs WHERE id = \$1 FOR UPDATE/.test(text)) {
      return {
        rows: [
          {
            id: values?.[0],
            deleted_at: new Date('2026-05-01T00:00:00Z'),
            deleted_by: '00000000-0000-0000-0000-000000000001',
          },
        ],
      };
    }
    if (/INSERT INTO voc_restore_log/.test(text)) {
      return {
        rows: [
          {
            id: '00000000-0000-0000-0000-000000000099',
            voc_id: values?.[0],
            action: 'restore',
            actor_id: values?.[1],
            before_deleted_at: new Date('2026-05-01T00:00:00Z'),
            before_deleted_by: values?.[3] ?? null,
            created_at: new Date('2026-05-09T00:00:00Z'),
          },
        ],
      };
    }
    return { rows: [], rowCount: 0 };
  });
  return {
    client: { query, release: jest.fn() },
    queries,
  };
}

describe('restoreVoc — SQL column regression (Codex P0 lock)', () => {
  afterEach(() => resetPool());

  it('voc_history insert uses 003_vocs.sql columns (field/old_value/new_value/changed_by/changed_at)', async () => {
    const { client, queries } = makeFakeClient();
    setPool({ connect: async () => client } as never);

    await trashRepo.restoreVoc(
      '00000000-0000-0000-0000-0000000000aa',
      '00000000-0000-0000-0000-0000000000bb',
    );

    const historyInsert = queries.find((q) => /INSERT INTO voc_history/.test(q.text));
    expect(historyInsert).toBeDefined();
    // Locked column list — must match 003_vocs.sql exactly.
    expect(historyInsert!.text).toMatch(
      /\(\s*voc_id\s*,\s*field\s*,\s*old_value\s*,\s*new_value\s*,\s*changed_by\s*,\s*changed_at\s*\)/,
    );
    // Negative: drift columns from earlier (incorrect) implementation.
    expect(historyInsert!.text).not.toMatch(/event_type/);
    expect(historyInsert!.text).not.toMatch(/snapshot/);
    expect(historyInsert!.text).not.toMatch(/actor_id/);
  });

  it('tag_rules re-run does not reference non-existent system_id column', async () => {
    const { client, queries } = makeFakeClient();
    setPool({ connect: async () => client } as never);

    await trashRepo.restoreVoc(
      '00000000-0000-0000-0000-0000000000aa',
      '00000000-0000-0000-0000-0000000000bb',
    );

    const tagRulesInsert = queries.find(
      (q) => /INSERT INTO voc_tags/.test(q.text) && /tag_rules/.test(q.text),
    );
    expect(tagRulesInsert).toBeDefined();
    // 004_tags.sql defines tag_rules WITHOUT system_id. 014 added suspended_until.
    expect(tagRulesInsert!.text).not.toMatch(/tr\.system_id/);
    expect(tagRulesInsert!.text).toMatch(/ON CONFLICT \(voc_id, tag_id\) DO NOTHING/);
  });

  it('vocs UPDATE clears deleted_at + deleted_by (015 columns)', async () => {
    const { client, queries } = makeFakeClient();
    setPool({ connect: async () => client } as never);

    await trashRepo.restoreVoc(
      '00000000-0000-0000-0000-0000000000aa',
      '00000000-0000-0000-0000-0000000000bb',
    );

    const updateVoc = queries.find((q) => /UPDATE vocs SET deleted_at = NULL/.test(q.text));
    expect(updateVoc).toBeDefined();
    expect(updateVoc!.text).toMatch(/deleted_by\s*=\s*NULL/);
  });
});
