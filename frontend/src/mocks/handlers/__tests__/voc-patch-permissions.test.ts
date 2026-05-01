/**
 * MSW handler regression — PR #121 codex re-review Finding 2.
 *
 * Backend `inferActions` (services/voc.ts) classifies any patch containing
 * `assignee_id` as `reassign`, which is manager/admin-only. The MSW PATCH
 * handler must mirror that policy or dev/demo flows (VITE_USE_MSW=true) will
 * silently diverge from the real BE.
 *
 * Stays in jsdom (default) so MSW's `getAbsoluteUrl` resolves bare `/api/...`
 * paths against `location.href` — node env returns paths unresolved and the
 * URL match fails.
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { vocHandlers, __resetVocMocks } from '../voc';
import { VOC_FIXTURES, FIXTURE_USERS } from '../../../../../shared/fixtures/voc.fixtures';

const server = setupServer(...vocHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...vocHandlers);
  __resetVocMocks();
});
afterAll(() => server.close());

const ownVoc = VOC_FIXTURES.find(
  (r) => r.deleted_at === null && r.assignee_id === FIXTURE_USERS.devSelf,
)!;

async function patch(
  id: string,
  role: 'admin' | 'manager' | 'dev' | 'user',
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${window.location.origin}/api/vocs/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-mock-role': role },
    body: JSON.stringify(body),
  });
}

describe('MSW PATCH /api/vocs/:id — reassign 권한 동기화 (BE inferActions 미러)', () => {
  it('Dev (own VOC) PATCH { assignee_id } → 403 reassign', async () => {
    const res = await patch(ownVoc.id, 'dev', { assignee_id: null });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error?.details?.action).toBe('reassign');
    expect(body.error?.code).toBe('FORBIDDEN');
  });

  it('Dev (own VOC) PATCH { assignee_id, status } → 403 reassign (multi-field 우회 차단)', async () => {
    const res = await patch(ownVoc.id, 'dev', { assignee_id: null, status: '처리중' });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error?.details?.action).toBe('reassign');
  });

  it('Manager PATCH { assignee_id } → 200', async () => {
    const res = await patch(ownVoc.id, 'manager', { assignee_id: FIXTURE_USERS.devOther });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.assignee_id).toBe(FIXTURE_USERS.devOther);
  });

  it('Dev (own VOC) PATCH { status } 만 → 200 (own-VOC 분기 유지)', async () => {
    const res = await patch(ownVoc.id, 'dev', { status: '처리중' });
    expect(res.status).toBe(200);
  });
});
