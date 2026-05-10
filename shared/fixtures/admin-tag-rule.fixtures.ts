/**
 * @module shared/fixtures/admin-tag-rule.fixtures
 *
 * `tag_rules` row fixtures for fixture↔seed parity (`scripts/check-fixture-seed-parity.ts`)
 * and downstream MSW / BE Jest tests.
 *
 * Schema baseline: migrations 004 + 014 + 024 (post-mig-024, Plan 01-02).
 *   - id              uuid PK                           (mig 004)
 *   - name            text NOT NULL                     (mig 004)
 *   - tag_id          uuid REFERENCES tags(id)           (mig 004)
 *   - kind            text NOT NULL DEFAULT 'general'    (mig 004; CHECK kind IN ('general'))
 *   - is_active       boolean NOT NULL DEFAULT true      (mig 004; remains)
 *   - sort_order      int NOT NULL DEFAULT 0             (mig 004; has DEFAULT — parity tolerates absence)
 *   - created_at      timestamptz NOT NULL DEFAULT now() (mig 004)
 *   - suspended_until timestamptz NULL                   (mig 014)
 *   - keywords        text[] NOT NULL DEFAULT '{}'       (mig 024 — D-05 chip array)
 *   - match_mode      text NOT NULL DEFAULT 'keyword'    (mig 024 — D-06 select slot)
 *   - created_by      uuid NULL REFERENCES users(id)     (mig 024 — D-12; NULL preserved)
 *
 * `pattern` column was removed by mig 024 (Plan 01-02).
 */
import { TAG_IDS, TAG_RULE_IDS } from './admin-tag.fixtures';

export interface AdminTagRuleFixtureRow {
  id: string;
  tag_id: string;
  kind: 'general';
  name: string;
  keywords: string[];
  match_mode: 'keyword';
  is_active: boolean;
  suspended_until: string | null;
  created_by: string | null;
  created_at: string;
}

export const ADMIN_TAG_RULE_FIXTURES: AdminTagRuleFixtureRow[] = [
  {
    id: TAG_RULE_IDS.rule_bug,
    tag_id: TAG_IDS.general_bug,
    kind: 'general',
    name: 'bug-keywords',
    keywords: ['bug', 'fix'],
    match_mode: 'keyword',
    is_active: true,
    suspended_until: null,
    created_by: null,
    created_at: '2026-01-10T00:00:00.000Z',
  },
  {
    id: TAG_RULE_IDS.rule_ux,
    tag_id: TAG_IDS.general_ux,
    kind: 'general',
    name: 'ux-keywords',
    keywords: ['불편', 'UX'],
    match_mode: 'keyword',
    is_active: true,
    suspended_until: null,
    created_by: null,
    created_at: '2026-01-11T00:00:00.000Z',
  },
  {
    id: TAG_RULE_IDS.rule_suspended,
    tag_id: TAG_IDS.general_feature,
    kind: 'general',
    name: 'feature-keywords',
    keywords: ['추가해', '기능'],
    match_mode: 'keyword',
    is_active: true,
    suspended_until: '2026-06-01T00:00:00.000Z',
    created_by: null,
    created_at: '2026-01-12T00:00:00.000Z',
  },
];
