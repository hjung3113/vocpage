/**
 * MSW handlers for master data — assignees / tags / voc_types.
 *
 * Mirrors backend `/api/masters/*` shape (BE는 PR-α merged). Each response
 * passes the shared Zod schema before serialization so contract drift fails
 * fast in dev/test (`VITE_USE_MSW=true`).
 */
import { http, HttpResponse } from 'msw';
import {
  AssigneeListResponse,
  TagListResponse,
  VocTypeListResponse,
} from '../../../../shared/contracts/master';
import {
  ASSIGNEE_FIXTURES,
  TAG_FIXTURES,
  VOC_TYPE_FIXTURES,
} from '../../../../shared/fixtures/master.fixtures';

export const mastersHandlers = [
  http.get('/api/masters/assignees', () => {
    const body = AssigneeListResponse.parse({ rows: [...ASSIGNEE_FIXTURES] });
    return HttpResponse.json(body);
  }),
  http.get('/api/masters/tags', () => {
    const body = TagListResponse.parse({ rows: [...TAG_FIXTURES] });
    return HttpResponse.json(body);
  }),
  http.get('/api/masters/voc-types', () => {
    const body = VocTypeListResponse.parse({ rows: [...VOC_TYPE_FIXTURES] });
    return HttpResponse.json(body);
  }),
];
