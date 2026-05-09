/**
 * MSW handlers — admin external masters (W3-6)
 * Spec: requirements.md §16.3, external-masters.md §0/§6
 */
import { http, HttpResponse } from 'msw';
import {
  MASTER_STATUS_LIVE,
  MASTER_REFRESH_OK,
} from '../../../../../shared/fixtures/admin-masters.fixtures';

export const adminMastersHandlers = [
  http.get('/api/admin/masters/status', () => {
    return HttpResponse.json(MASTER_STATUS_LIVE);
  }),

  http.post('/api/admin/masters/refresh', () => {
    return HttpResponse.json(MASTER_REFRESH_OK);
  }),
];
