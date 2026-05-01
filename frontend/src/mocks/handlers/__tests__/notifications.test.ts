/**
 * MSW notifications handler smoke tests — Zod parse + mark-all-read mutation.
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { notificationsHandlers, __resetNotificationMocks } from '../notifications';
import {
  NotificationListResponse,
  MarkAllReadResponse,
} from '../../../../../shared/contracts/notification';

const server = setupServer(...notificationsHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...notificationsHandlers);
  __resetNotificationMocks();
});
afterAll(() => server.close());

describe('MSW /api/notifications — Zod parse round-trip', () => {
  it('list: 응답이 NotificationListResponse 스키마를 통과하고 unreadCount 가 양의 정수', async () => {
    const res = await fetch(`${window.location.origin}/api/notifications`);
    expect(res.status).toBe(200);
    const body = await res.json();
    const parsed = NotificationListResponse.parse(body);
    expect(parsed.items.length).toBeGreaterThan(0);
    expect(parsed.unreadCount).toBe(parsed.items.filter((n) => !n.read).length);
    expect(parsed.unreadCount).toBeGreaterThan(0);
  });

  it('mark-all-read: 응답 스키마 통과 + 후속 list unreadCount=0', async () => {
    const post = await fetch(`${window.location.origin}/api/notifications/mark-all-read`, {
      method: 'POST',
    });
    expect(post.status).toBe(200);
    const postBody = await post.json();
    MarkAllReadResponse.parse(postBody);

    const next = await fetch(`${window.location.origin}/api/notifications`);
    const nextBody = NotificationListResponse.parse(await next.json());
    expect(nextBody.unreadCount).toBe(0);
    expect(nextBody.items.every((n) => n.read)).toBe(true);
  });
});
