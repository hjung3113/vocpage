/**
 * @module shared/fixtures/admin-tag-rule.fixtures
 *
 * `tag_rules` row fixtures for fixture↔seed parity (`scripts/check-fixture-seed-parity.ts`)
 * and downstream MSW / BE Jest tests.
 *
 * Schema baseline: migrations 004 + 014 (pre-mig-024).
 *   - id              uuid PK
 *   - tag_id          uuid REFERENCES tags(id)
 *   - kind            text NOT NULL DEFAULT 'general'  CHECK (kind IN ('general'))
 *   - pattern         text NOT NULL                    -- legacy column; mig 024 (Plan 02) drops this
 *   - is_active       boolean NOT NULL DEFAULT true
 *   - suspended_until timestamptz NULL                 -- mig 014
 *   - created_at      timestamptz NOT NULL DEFAULT now()
 *   - sort_order      int NOT NULL DEFAULT 0           -- 004 schema; has DEFAULT so parity tolerates absence
 *   - name            text NOT NULL                    -- 004 schema
 *
 * Plan 02 will:
 *   - drop `pattern`, `name`
 *   - add `keywords text[] NOT NULL DEFAULT '{}'`, `match_mode text NOT NULL DEFAULT 'keyword'`,
 *     `created_by uuid NULL REFERENCES users(id)`
 * and re-shape this fixture file accordingly.
 *
 * Wave 0 fixture is intentionally minimal — Plan 03 re-types this against the
 * new zod TagRule schema; the type shape exported here is local-only.
 */
import { TAG_IDS, TAG_RULE_IDS } from './admin-tag.fixtures';

export interface AdminTagRuleFixtureRow {
  id: string;
  tag_id: string;
  kind: 'general';
  name: string;
  pattern: string;
  is_active: boolean;
  suspended_until: string | null;
  sort_order: number;
  created_at: string;
}

export const ADMIN_TAG_RULE_FIXTURES: AdminTagRuleFixtureRow[] = [
  {
    id: TAG_RULE_IDS.rule_bug,
    tag_id: TAG_IDS.general_bug,
    kind: 'general',
    name: 'bug-keywords',
    pattern: '{"keywords":["bug","fix"]}',
    is_active: true,
    suspended_until: null,
    sort_order: 0,
    created_at: '2026-01-10T00:00:00.000Z',
  },
  {
    id: TAG_RULE_IDS.rule_ux,
    tag_id: TAG_IDS.general_ux,
    kind: 'general',
    name: 'ux-keywords',
    pattern: '{"keywords":["불편","UX"]}',
    is_active: true,
    suspended_until: null,
    sort_order: 1,
    created_at: '2026-01-11T00:00:00.000Z',
  },
  {
    id: TAG_RULE_IDS.rule_suspended,
    tag_id: TAG_IDS.general_feature,
    kind: 'general',
    name: 'feature-keywords',
    pattern: '{"keywords":["추가해","기능"]}',
    is_active: true,
    suspended_until: '2026-06-01T00:00:00.000Z',
    sort_order: 2,
    created_at: '2026-01-12T00:00:00.000Z',
  },
];
