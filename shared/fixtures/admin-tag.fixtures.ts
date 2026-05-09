/**
 * @module shared/fixtures/admin-tag.fixtures
 *
 * Tag Master fixtures for:
 *  - FE MSW handlers (frontend/src/mocks/handlers/admin-tags.ts)
 *  - BE Jest tests (mock service injection)
 *
 * Design: stable UUIDs, covers general + menu kinds, is_external variants,
 * used vs unused tags (for DELETE 409 testing), tag_rules with suspended_until.
 *
 * Every row passes TagMasterItem.parse() and TagMasterListResponse.parse().
 */
import {
  TagMasterItem,
  type TagMasterItem as TagMasterItemT,
  TagMasterListResponse,
  type TagMasterListResponse as TagMasterListResponseT,
} from '../contracts/admin/tag';

// ─── Stable IDs ───────────────────────────────────────────────────────────────

export const TAG_IDS = {
  general_bug: 'f1000001-f100-4100-8100-f10000000001',
  general_ux: 'f1000002-f100-4100-8100-f10000000002',
  general_feature: 'f1000003-f100-4100-8100-f10000000003',
  general_external: 'f1000004-f100-4100-8100-f10000000004', // is_external = true
  general_unused: 'f1000005-f100-4100-8100-f10000000005', // usage_count = 0, rule_ref_count = 0
  menu_home: 'f2000001-f200-4200-8200-f20000000001',
  menu_settings: 'f2000002-f200-4200-8200-f20000000002',
} as const;

export const TAG_RULE_IDS = {
  rule_bug: 'e1000001-e100-4100-8100-e10000000001',
  rule_ux: 'e1000002-e100-4100-8100-e10000000002',
  rule_suspended: 'e1000003-e100-4100-8100-e10000000003', // suspended_until set
} as const;

// ─── Tag Master items ─────────────────────────────────────────────────────────

const raw: TagMasterItemT[] = [
  {
    id: TAG_IDS.general_bug,
    name: '버그',
    slug: 'bug',
    kind: 'general',
    is_external: false,
    usage_count: 12,
    rule_ref_count: 1,
    created_at: '2026-01-10T00:00:00.000Z',
  },
  {
    id: TAG_IDS.general_ux,
    name: 'UX 개선',
    slug: 'ux-improvement',
    kind: 'general',
    is_external: false,
    usage_count: 8,
    rule_ref_count: 1,
    created_at: '2026-01-11T00:00:00.000Z',
  },
  {
    id: TAG_IDS.general_feature,
    name: '기능 요청',
    slug: 'feature-request',
    kind: 'general',
    is_external: false,
    usage_count: 5,
    rule_ref_count: 0,
    created_at: '2026-01-12T00:00:00.000Z',
  },
  {
    id: TAG_IDS.general_external,
    name: '외부 연동',
    slug: 'external-integration',
    kind: 'general',
    is_external: true,
    usage_count: 3,
    rule_ref_count: 0,
    created_at: '2026-01-13T00:00:00.000Z',
  },
  {
    id: TAG_IDS.general_unused,
    name: '미사용 태그',
    slug: 'unused-tag',
    kind: 'general',
    is_external: false,
    usage_count: 0,
    rule_ref_count: 0,
    created_at: '2026-01-14T00:00:00.000Z',
  },
  {
    id: TAG_IDS.menu_home,
    name: '홈 메뉴',
    slug: 'home-menu',
    kind: 'menu',
    is_external: false,
    usage_count: 4,
    rule_ref_count: 1,
    created_at: '2026-02-01T00:00:00.000Z',
  },
  {
    id: TAG_IDS.menu_settings,
    name: '설정 메뉴',
    slug: 'settings-menu',
    kind: 'menu',
    is_external: false,
    usage_count: 2,
    rule_ref_count: 0,
    created_at: '2026-02-02T00:00:00.000Z',
  },
];

// Validate all rows at module load (catches contract drift early)
export const ADMIN_TAG_FIXTURES: TagMasterItemT[] = raw.map((r) => TagMasterItem.parse(r));

export const ADMIN_TAG_LIST_RESPONSE: TagMasterListResponseT = TagMasterListResponse.parse({
  rows: ADMIN_TAG_FIXTURES,
  page: 1,
  per_page: 20,
  total: ADMIN_TAG_FIXTURES.length,
});

// ─── Tag Rules (for suspend endpoint testing) ─────────────────────────────────

export interface TagRuleFixture {
  id: string;
  tag_id: string;
  pattern: string;
  suspended_until: string | null;
  created_at: string;
}

export const ADMIN_TAG_RULE_FIXTURES: TagRuleFixture[] = [
  {
    id: TAG_RULE_IDS.rule_bug,
    tag_id: TAG_IDS.general_bug,
    pattern: 'crash',
    suspended_until: null,
    created_at: '2026-01-10T00:00:00.000Z',
  },
  {
    id: TAG_RULE_IDS.rule_ux,
    tag_id: TAG_IDS.general_ux,
    pattern: '불편',
    suspended_until: null,
    created_at: '2026-01-11T00:00:00.000Z',
  },
  {
    id: TAG_RULE_IDS.rule_suspended,
    tag_id: TAG_IDS.general_feature,
    pattern: '추가해',
    suspended_until: '2026-06-01T00:00:00.000Z',
    created_at: '2026-01-12T00:00:00.000Z',
  },
];
