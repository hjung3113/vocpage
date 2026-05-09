/**
 * MSW handlers for admin trash endpoints — Wave 3 Phase C (W3-5).
 * Mirrors backend/src/routes/admin-trash.ts + PATCH /api/vocs/:id/restore shape.
 */
import { http, HttpResponse } from 'msw';
import {
  TRASH_FIXTURES,
  TRASH_RESTORE_LOG_FIXTURES,
  makeRestoreResponse,
} from '../../../../../shared/fixtures/admin-trash.fixtures';

let store = [...TRASH_FIXTURES];

export const adminTrashHandlers = [
  // GET /api/admin/vocs/trash — list soft-deleted VOCs
  http.get('/api/admin/vocs/trash', () => {
    return HttpResponse.json({
      rows: store,
      page: 1,
      per_page: 20,
      total: store.length,
    });
  }),

  // PATCH /api/vocs/:id/restore — restore a single VOC
  http.patch('/api/vocs/:id/restore', ({ params }) => {
    const id = params.id as string;
    const item = store.find((r) => r.id === id);
    if (!item) {
      return HttpResponse.json(
        { code: 'NOT_FOUND', message: '존재하지 않는 VOC입니다.', details: null },
        { status: 404 },
      );
    }
    // Remove from trash store (simulate restore)
    store = store.filter((r) => r.id !== id);
    return HttpResponse.json(makeRestoreResponse(id));
  }),

  // GET /api/admin/vocs/:id/restore-log
  http.get('/api/admin/vocs/:id/restore-log', ({ params }) => {
    const id = params.id as string;
    const log = TRASH_RESTORE_LOG_FIXTURES.filter((e) => e.voc_id === id);
    return HttpResponse.json(log);
  }),
];
