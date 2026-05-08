/**
 * @module shared/fixtures/notice.fixtures
 *
 * Deterministic notice fixtures used by FE MSW handlers + (future) BE seed.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.3.
 */
import { Notice, type Notice as NoticeT } from '../contracts/notice';
import { FIXTURE_USERS } from '../contracts/voc/users';

const ISO = '2026-04-01T00:00:00.000Z';

export const NOTICE_FIXTURES: ReadonlyArray<NoticeT> = [
  Notice.parse({
    id: '11111111-aaaa-4aaa-8aaa-000000000001',
    title: '서비스 점검 안내',
    body: '<p>2026-04-15 02:00 ~ 04:00 점검 예정입니다.</p>',
    level: 'urgent',
    is_popup: true,
    is_visible: true,
    visible_from: null,
    visible_to: null,
    author_id: FIXTURE_USERS.admin,
    deleted_at: null,
    created_at: ISO,
    updated_at: ISO,
  }),
  Notice.parse({
    id: '11111111-aaaa-4aaa-8aaa-000000000002',
    title: '신규 기능 안내',
    body: '<p>VOC 다중 첨부 파일 업로드가 추가되었습니다.</p>',
    level: 'important',
    is_popup: false,
    is_visible: true,
    visible_from: null,
    visible_to: null,
    author_id: FIXTURE_USERS.manager,
    deleted_at: null,
    created_at: ISO,
    updated_at: ISO,
  }),
  Notice.parse({
    id: '11111111-aaaa-4aaa-8aaa-000000000003',
    title: '운영 정책 변경',
    body: '<p>처리중 상태의 SLA가 5일에서 3일로 단축됩니다.</p>',
    level: 'normal',
    is_popup: false,
    is_visible: true,
    visible_from: null,
    visible_to: null,
    author_id: FIXTURE_USERS.admin,
    deleted_at: null,
    created_at: ISO,
    updated_at: ISO,
  }),
];
