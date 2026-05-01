/**
 * @module shared/fixtures/notification.fixtures
 *
 * Deterministic notification fixtures used by MSW (`/api/notifications`).
 * 10 entries spanning all 4 types with mixed read/unread for unreadCount
 * derivation. UUIDs are stable so downstream component tests can assert
 * specific items.
 *
 * Note: 라벨에 `#` 문자를 쓰지 않는다 — 프로젝트 ESLint 규칙
 * (`.eslintrc.base.js` no-restricted-syntax) 가 hex color 패턴
 * `#[0-9a-fA-F]{3,8}` 을 차단한다. VOC 식별자는 `No. NNNN` 표기.
 */
import {
  NotificationItem,
  type NotificationItem as NotificationItemT,
} from '../contracts/notification';

const baseDate = (offsetMinutes: number) =>
  new Date(Date.UTC(2026, 4, 1, 9, 0, 0) - offsetMinutes * 60_000).toISOString();

export const NOTIFICATION_FIXTURES: ReadonlyArray<NotificationItemT> = [
  NotificationItem.parse({
    id: 'ffffffff-0000-4000-8000-000000000001',
    type: 'mention',
    label: '@박개발 — VOC No. 0001 코멘트에서 언급되었습니다.',
    href: '/voc/aaaaaaaa-0000-4000-8000-000000000001',
    createdAt: baseDate(5),
    read: false,
  }),
  NotificationItem.parse({
    id: 'ffffffff-0000-4000-8000-000000000002',
    type: 'assigned',
    label: 'VOC No. 0002 담당자로 지정되었습니다.',
    href: '/voc/aaaaaaaa-0000-4000-8000-000000000002',
    createdAt: baseDate(15),
    read: false,
  }),
  NotificationItem.parse({
    id: 'ffffffff-0000-4000-8000-000000000003',
    type: 'status_change',
    label: 'VOC No. 0003 상태가 검토중 → 처리중 으로 변경되었습니다.',
    href: '/voc/aaaaaaaa-0000-4000-8000-000000000003',
    createdAt: baseDate(30),
    read: false,
  }),
  NotificationItem.parse({
    id: 'ffffffff-0000-4000-8000-000000000004',
    type: 'comment',
    label: 'VOC No. 0001 에 새 코멘트가 등록되었습니다.',
    href: '/voc/aaaaaaaa-0000-4000-8000-000000000001',
    createdAt: baseDate(60),
    read: false,
  }),
  NotificationItem.parse({
    id: 'ffffffff-0000-4000-8000-000000000005',
    type: 'mention',
    label: '@김관리 — VOC No. 0005 에서 언급되었습니다.',
    href: '/voc/aaaaaaaa-0000-4000-8000-000000000005',
    createdAt: baseDate(120),
    read: true,
  }),
  NotificationItem.parse({
    id: 'ffffffff-0000-4000-8000-000000000006',
    type: 'status_change',
    label: 'VOC No. 0007 상태가 처리중 → 완료 로 변경되었습니다.',
    href: '/voc/aaaaaaaa-0000-4000-8000-000000000007',
    createdAt: baseDate(180),
    read: true,
  }),
  NotificationItem.parse({
    id: 'ffffffff-0000-4000-8000-000000000007',
    type: 'comment',
    label: 'VOC No. 0010 에 코멘트가 추가되었습니다.',
    href: '/voc/aaaaaaaa-0000-4000-8000-000000000010',
    createdAt: baseDate(240),
    read: true,
  }),
  NotificationItem.parse({
    id: 'ffffffff-0000-4000-8000-000000000008',
    type: 'assigned',
    label: 'VOC No. 0012 담당자로 지정되었습니다.',
    href: '/voc/aaaaaaaa-0000-4000-8000-000000000012',
    createdAt: baseDate(360),
    read: true,
  }),
  NotificationItem.parse({
    id: 'ffffffff-0000-4000-8000-000000000009',
    type: 'mention',
    label: '@박개발 — VOC No. 0015 에서 언급되었습니다.',
    href: '/voc/aaaaaaaa-0000-4000-8000-000000000015',
    createdAt: baseDate(720),
    read: true,
  }),
  NotificationItem.parse({
    id: 'ffffffff-0000-4000-8000-000000000010',
    type: 'status_change',
    label: 'VOC No. 0020 상태가 접수 → 검토중 으로 변경되었습니다.',
    href: '/voc/aaaaaaaa-0000-4000-8000-000000000020',
    createdAt: baseDate(1440),
    read: true,
  }),
];

export const NOTIFICATION_UNREAD_COUNT = NOTIFICATION_FIXTURES.filter((n) => !n.read).length;
