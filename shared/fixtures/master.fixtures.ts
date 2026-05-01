/**
 * @module shared/fixtures/master.fixtures
 *
 * Deterministic master-data fixtures (assignees / tags / voc_types) used by
 *  - FE MSW handlers (`frontend/src/mocks/handlers/masters.ts`)
 *  - downstream component fixtures (Wave C compositions)
 *
 * Parity 규칙:
 *  - assignees IDs reuse `FIXTURE_USERS` so voc.fixtures.ts assignee_id 매칭
 *  - tag IDs reuse `FIXTURE_TAGS` (bug/feature) +확장 8~12개
 *  - voc_type fixtures의 첫 항목 id == voc.fixtures.ts 의 TYPE 상수
 */
import {
  AssigneeListItem,
  type AssigneeListItem as AssigneeListItemT,
  TagListItem,
  type TagListItem as TagListItemT,
  VocTypeListItem,
  type VocTypeListItem as VocTypeListItemT,
} from '../contracts/master';
import { FIXTURE_USERS } from '../contracts/voc/users';
import { FIXTURE_TAGS } from './voc.fixtures';

export const ASSIGNEE_FIXTURES: ReadonlyArray<AssigneeListItemT> = [
  AssigneeListItem.parse({
    id: FIXTURE_USERS.admin,
    ad_username: 'admin01',
    display_name: '관리자',
  }),
  AssigneeListItem.parse({
    id: FIXTURE_USERS.manager,
    ad_username: 'manager01',
    display_name: '김관리',
  }),
  AssigneeListItem.parse({
    id: FIXTURE_USERS.devSelf,
    ad_username: 'dev01',
    display_name: '박개발',
  }),
  AssigneeListItem.parse({
    id: FIXTURE_USERS.devOther,
    ad_username: 'dev02',
    display_name: '이개발',
  }),
];

export const TAG_FIXTURES: ReadonlyArray<TagListItemT> = [
  TagListItem.parse({ id: FIXTURE_TAGS.bug, name: '버그', slug: 'bug', kind: 'category' }),
  TagListItem.parse({
    id: FIXTURE_TAGS.feature,
    name: '기능',
    slug: 'feature',
    kind: 'category',
  }),
  TagListItem.parse({
    id: 'eeeeeeee-0000-4000-8000-000000000003',
    name: '문의',
    slug: 'inquiry',
    kind: 'category',
  }),
  TagListItem.parse({
    id: 'eeeeeeee-0000-4000-8000-000000000004',
    name: '개선',
    slug: 'improvement',
    kind: 'category',
  }),
  TagListItem.parse({
    id: 'eeeeeeee-0000-4000-8000-000000000005',
    name: '긴급',
    slug: 'urgent',
    kind: 'priority',
  }),
  TagListItem.parse({
    id: 'eeeeeeee-0000-4000-8000-000000000006',
    name: '데이터',
    slug: 'data',
    kind: 'topic',
  }),
  TagListItem.parse({
    id: 'eeeeeeee-0000-4000-8000-000000000007',
    name: '리포트',
    slug: 'report',
    kind: 'topic',
  }),
  TagListItem.parse({
    id: 'eeeeeeee-0000-4000-8000-000000000008',
    name: '포털',
    slug: 'portal',
    kind: 'topic',
  }),
];

/**
 * voc.fixtures.ts 의 TYPE 상수와 첫 항목 ID 일치 — VOC 50개가 모두 이
 * voc_type_id 를 참조하므로 master 응답에 반드시 포함되어야 함.
 */
const TYPE_PRIMARY = '55555555-5555-4555-8555-555555555555';

export const VOC_TYPE_FIXTURES: ReadonlyArray<VocTypeListItemT> = [
  VocTypeListItem.parse({
    id: TYPE_PRIMARY,
    name: '기능 요청',
    slug: 'feature',
    color: null,
    sort_order: 1,
    is_archived: false,
  }),
  VocTypeListItem.parse({
    id: '55555555-5555-4555-8555-555555555556',
    name: '버그 리포트',
    slug: 'bug',
    color: null,
    sort_order: 2,
    is_archived: false,
  }),
  VocTypeListItem.parse({
    id: '55555555-5555-4555-8555-555555555557',
    name: '문의',
    slug: 'inquiry',
    color: null,
    sort_order: 3,
    is_archived: false,
  }),
  VocTypeListItem.parse({
    id: '55555555-5555-4555-8555-555555555558',
    name: '불만',
    slug: 'complaint',
    color: null,
    sort_order: 4,
    is_archived: false,
  }),
  VocTypeListItem.parse({
    id: '55555555-5555-4555-8555-555555555559',
    name: '개선 제안',
    slug: 'improvement',
    color: null,
    sort_order: 5,
    is_archived: false,
  }),
];
