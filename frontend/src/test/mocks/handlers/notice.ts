/**
 * MSW handlers for /api/notices.
 * Mirrors backend Wave 4 routes (read-only happy path; mutations not exercised
 * by FE MSW yet — added when FE Wave 4 lands).
 */
import { http, HttpResponse } from 'msw';
import {
  NoticeListResponse,
  NoticePopupResponse,
} from '../../../../../shared/contracts/notice';
import { NOTICE_FIXTURES } from '../../../../../shared/fixtures/notice.fixtures';

export const noticeHandlers = [
  http.get('/api/notices', ({ request }) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') ?? 'user';
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
    let rows = NOTICE_FIXTURES.slice();
    if (!includeDeleted) rows = rows.filter((r) => r.deleted_at === null);
    if (mode !== 'admin') rows = rows.filter((r) => r.is_visible);
    const body = NoticeListResponse.parse({
      rows,
      page: 1,
      per_page: 20,
      total: rows.length,
    });
    return HttpResponse.json(body);
  }),
  http.get('/api/notices/popup', () => {
    const rows = NOTICE_FIXTURES.filter(
      (r) => r.deleted_at === null && r.is_visible && r.is_popup,
    );
    const body = NoticePopupResponse.parse({ rows });
    return HttpResponse.json(body);
  }),
];
